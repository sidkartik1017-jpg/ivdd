"""IVDD risk prediction.

Primary path: load the trained scikit-learn model (see train_model.py) from a
pickle file and call `predict_proba`. The model predicts a `risk_tier`
(High / Medium / Low) from 10 raw biomarker + demographic features.

If the pickle is missing, unreadable, or its feature count does not line up with
the vector we build, we transparently fall back to a deterministic clinical
heuristic (ported from the frontend `risk.ts`) so the API always responds.

FEATURE_ORDER MUST stay in sync with train_model.py.
"""
import logging
import pickle

import numpy as np

log = logging.getLogger("predictor")

HIGH_RISK_BREEDS = {
    "Dachshund", "French Bulldog", "Beagle", "Shih Tzu", "Pekingese", "Corgi",
    "Pembroke Welsh Corgi", "Basset Hound", "Cocker Spaniel", "Bichon Frise",
    "Poodle (Miniature)", "Lhasa Apso",
}

HEAVY_SYMPTOMS = {"dragging", "knuckling", "incontinence", "wobbly"}

# The 10 features the model was trained on, in order (see train_model.py).
FEATURE_ORDER = [
    "disc_height_index",
    "t2_signal_score",
    "texture_entropy",
    "bulge_prob",
    "endplate_proxy",
    "CDDY_FGF4_CFA12_copies",
    "breed_genetic_prior",
    "age_months",
    "weight_kg",
    "sex_M",
]

# Median of each feature over the training set (disc_scored.csv, n=700).
# Used to fill fields the user left blank: a 0.0 fill sits far outside every
# feature's observed range, which drops every such case into the same forest
# leaf and pins the gauge to one constant value.
FEATURE_MEDIANS = {
    "disc_height_index": 0.5454,
    "t2_signal_score": 0.4009,
    "texture_entropy": 1.9599,
    "bulge_prob": 0.7998,
    "endplate_proxy": 1.4746,
    "CDDY_FGF4_CFA12_copies": 1.0,
    "breed_genetic_prior": 0.7,
    "age_months": 67.5,
    "weight_kg": 11.75,
    "sex_M": 0.0,
}

# The measured inputs that actually carry signal. None of the clinical answers
# (breed, symptoms, neuro grade, onset...) are model features, so when these are
# blank the model has nothing to go on and only the heuristic can differentiate.
BIOMARKER_FEATURES = [
    "disc_height_index",
    "t2_signal_score",
    "texture_entropy",
    "bulge_prob",
    "endplate_proxy",
    "CDDY_FGF4_CFA12_copies",
    "breed_genetic_prior",
]

# Ordinal risk "centre" of each tier on the dataset's 0..1 overall_risk scale
# (from the per-tier means), used to turn class probabilities into a single
# gauge percentage for the UI.
TIER_CENTERS = {"low": 0.31, "medium": 0.50, "moderate": 0.50, "high": 0.81}

# Presentation copy keyed by the frontend's Low / Moderate / High levels.
LEVEL_STYLE = {
    "Low": {
        "color": "#2FA36B", "tint": "#E4F3EA",
        "headline": "Signs point to a low IVDD risk",
        "interpretation": (
            "Based on what you've entered, your dog's current signs are consistent "
            "with a low likelihood of IVDD. Keep monitoring and avoid high-impact "
            "activity."
        ),
        "nextStep": "Monitor at home; book a routine check-up if signs change.",
    },
    "Moderate": {
        "color": "#C98A16", "tint": "#FBEFD6",
        "headline": "A moderate risk — worth a closer look",
        "interpretation": (
            "Several factors suggest an elevated chance of IVDD. Restrict jumping "
            "and stairs, and have a veterinarian evaluate your dog soon."
        ),
        "nextStep": "Consult your vet within 24–48 hours; strict rest meanwhile.",
    },
    "High": {
        "color": "#D2564B", "tint": "#F7E2DF",
        "headline": "High risk — seek veterinary care",
        "interpretation": (
            "The combination of breed, neurological signs and symptoms indicates a "
            "high likelihood of IVDD. Prompt assessment improves outcomes "
            "significantly."
        ),
        "nextStep": "Consult your vet within 24 hours — sooner if signs worsen.",
    },
}


def _f(value, default=0.0):
    """Best-effort float parse for form fields that arrive as strings."""
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _present(value) -> bool:
    """True when the form actually carried a usable number for this field."""
    if value is None or value == "":
        return False
    try:
        float(value)
    except (TypeError, ValueError):
        return False
    return True


def _class_to_level(cls) -> str | None:
    k = str(cls).lower()
    if "high" in k:
        return "High"
    if "med" in k or "mod" in k:
        return "Moderate"
    if "low" in k:
        return "Low"
    return None


class Predictor:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
        self.mode = "heuristic"  # or "model"
        self.load_error = None
        self._load()

    def _load(self):
        try:
            with open(self.model_path, "rb") as fh:
                self.model = pickle.load(fh)
            if not hasattr(self.model, "predict_proba"):
                raise ValueError("Loaded object has no predict_proba()")
            self.mode = "model"
            log.info("Loaded model %s (n_features_in_=%s, classes=%s)",
                     type(self.model).__name__,
                     getattr(self.model, "n_features_in_", "?"),
                     list(getattr(self.model, "classes_", [])))
        except Exception as exc:  # noqa: BLE001 - any failure -> heuristic
            self.model = None
            self.mode = "heuristic"
            self.load_error = str(exc)
            log.warning("Could not load model at %s (%s). Using heuristic scorer.",
                        self.model_path, exc)

    # -- feature construction (must match FEATURE_ORDER) ----------------------
    def _build_features(self, form: dict) -> tuple[list, float]:
        """Build the model vector, filling blanks with the training median, and
        report the fraction of BIOMARKER_FEATURES the caller actually supplied."""
        sex_raw = str(form.get("sex") or "")
        raw = {
            "disc_height_index": form.get("discHeightIndex"),
            "t2_signal_score": form.get("t2SignalScore"),
            "texture_entropy": form.get("textureEntropy"),
            "bulge_prob": form.get("bulgeProb"),
            "endplate_proxy": form.get("endplateProxy"),
            "CDDY_FGF4_CFA12_copies": form.get("cddyFgf4Cfa12Copies"),
            "breed_genetic_prior": form.get("breedGeneticPrior"),
            "age_months": form.get("ageMonths"),
            "weight_kg": form.get("weightKg"),
        }
        vec = []
        for name in FEATURE_ORDER:
            if name == "sex_M":
                vec.append(1.0 if sex_raw[:4].lower() == "male" else 0.0)
            else:
                vec.append(_f(raw[name], FEATURE_MEDIANS[name]))
        supplied = sum(1 for name in BIOMARKER_FEATURES if _present(raw[name]))
        return vec, supplied / len(BIOMARKER_FEATURES)

    # -- public API -----------------------------------------------------------
    def predict(self, form: dict, has_mri: bool = False) -> dict:
        """Blend the trained model with the clinical heuristic in proportion to
        how many biomarkers were entered. With none of them filled in the model
        sees an identical vector every time, so the heuristic — which does read
        breed, symptoms and neuro grade — carries the result on its own."""
        heuristic_prob = self._heuristic_pct(form, has_mri)
        if self.model is not None:
            try:
                model_prob, coverage = self._predict_model(form)
            except Exception as exc:  # noqa: BLE001
                log.warning("Model inference failed (%s); using heuristic.", exc)
            else:
                if coverage > 0:
                    prob = int(round(
                        coverage * model_prob + (1 - coverage) * heuristic_prob
                    ))
                    source = "model" if coverage >= 1 else "blend"
                    return self._result(self._level_from_prob(prob), prob, source)
        return self._result(
            self._level_from_prob(heuristic_prob), heuristic_prob, "heuristic"
        )

    def _predict_model(self, form: dict) -> tuple[int, float]:
        vec_list, coverage = self._build_features(form)
        vec = np.array([vec_list], dtype=float)
        n_expected = getattr(self.model, "n_features_in_", vec.shape[1])
        if vec.shape[1] != n_expected:
            raise ValueError(
                f"feature count mismatch: built {vec.shape[1]}, "
                f"model expects {n_expected}"
            )
        proba = self.model.predict_proba(vec)[0]
        return self._gauge_pct(proba, list(self.model.classes_)), coverage

    @staticmethod
    def _gauge_pct(proba, classes) -> int:
        """Turn class probabilities into a single 0-100 risk number using the
        dataset's per-tier risk centres (falls back to evenly spaced weights)."""
        weights = [TIER_CENTERS.get(str(c).lower()) for c in classes]
        if any(w is None for w in weights):
            ranks = {c: i for i, c in enumerate(sorted(classes, key=str))}
            span = max(len(classes) - 1, 1)
            weights = [ranks[c] / span for c in classes]
        return int(round(float(np.dot(proba, weights)) * 100))

    # -- heuristic fallback (mirrors frontend computeRisk) --------------------
    def _heuristic_pct(self, form: dict, has_mri: bool) -> int:
        return int(max(4, min(97, round(self._heuristic_prob(form, has_mri)))))

    def _heuristic_prob(self, f: dict, has_mri: bool) -> float:
        score = 8.0
        if f.get("breed") in HIGH_RISK_BREEDS:
            score += 30
        age = _f(f.get("ageMonths")) / 12.0
        if 3 <= age <= 7:
            score += 10
        elif age > 7:
            score += 6
        if f.get("bcs") == "Overweight":
            score += 12
        if f.get("onset") == "Acute":
            score += 12
        region = f.get("region") or ""
        if region.startswith("Cervical"):
            score += 6
        if region.startswith("Thoraco"):
            score += 10
        score += (_f(f.get("neuro"), 3) - 1) * 11
        for sym in (f.get("symptoms") or []):
            score += 8 if sym in HEAVY_SYMPTOMS else 4
        dur = _f(f.get("duration"))
        if 0 < dur <= 2 and f.get("onset") == "Acute":
            score += 5
        if has_mri:
            score += 4
        return score

    @staticmethod
    def _level_from_prob(prob: float) -> str:
        if prob < 34:
            return "Low"
        if prob < 67:
            return "Moderate"
        return "High"

    @staticmethod
    def _result(level: str, prob: int, source: str) -> dict:
        style = LEVEL_STYLE[level]
        return {
            "prob": int(prob),
            "level": level,
            "source": source,  # "model" or "heuristic"
            **style,
        }
