"""Train the IVDD risk-tier model from disc_scored.csv.

Target
------
`risk_tier`  ∈ {Low, Medium, High}  (maps to the frontend's Low / Moderate / High)

Feature choice & leakage
------------------------
In the dataset, the tier is a deterministic binning of
    overall_risk = 0.45*genetic_risk_score + 0.15*mechanism_risk_score + 0.40*imaging_risk_score
so training on those composite scores (or overall_risk / disc_severity_latent /
the per-component risk_* transforms) would just memorise the formula — textbook
target leakage. We deliberately EXCLUDE them and train only on raw, independently
observable biomarkers that the frontend actually collects:

    imaging measurements : disc_height_index, t2_signal_score, texture_entropy,
                           bulge_prob, endplate_proxy
    genetic inputs       : CDDY_FGF4_CFA12_copies, breed_genetic_prior
    demographics         : age_months, weight_kg, sex (-> sex_M)

This keeps the model honest (it learns the relationships) and robust for the app.

Run:  python train_model.py [path/to/disc_scored.csv]
Saves the fitted model to ./ivdd_best_model.pkl (and ../ivdd_best_model.pkl).
FEATURE_ORDER here MUST stay in sync with predictor.py.
"""
import sys
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

BASE_DIR = Path(__file__).resolve().parent

# Order matters — predictor.py builds its vector in exactly this order.
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
TARGET = "risk_tier"


def load_xy(csv_path: Path):
    df = pd.read_csv(csv_path)
    df["sex_M"] = (df["sex"].astype(str).str.upper().str[0] == "M").astype(int)
    X = df[FEATURE_ORDER].astype(float)
    y = df[TARGET].astype(str)
    return X, y


def main():
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE_DIR / "disc_scored.csv"
    print(f"Loading {csv_path}")
    X, y = load_xy(csv_path)
    print(f"Samples: {len(X)}  Features: {len(FEATURE_ORDER)}")
    print("Class balance:", dict(y.value_counts()))

    X_tr, X_te, y_tr, y_te = train_test_split(
        X.values, y.values, test_size=0.2, random_state=42, stratify=y.values
    )

    clf = RandomForestClassifier(
        n_estimators=400,
        min_samples_leaf=2,
        max_features="sqrt",
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_tr, y_tr)

    # --- evaluation on held-out test set ---
    pred = clf.predict(X_te)
    print(f"\nHold-out accuracy: {accuracy_score(y_te, pred):.3f}")
    print("\nClassification report:")
    print(classification_report(y_te, pred, zero_division=0))
    print("Confusion matrix (rows=true, cols=pred), labels:", list(clf.classes_))
    print(confusion_matrix(y_te, pred, labels=clf.classes_))

    cv = cross_val_score(clf, X.values, y.values, cv=5, scoring="accuracy")
    print(f"\n5-fold CV accuracy: {cv.mean():.3f} +/- {cv.std():.3f}")

    print("\nFeature importances:")
    for name, imp in sorted(
        zip(FEATURE_ORDER, clf.feature_importances_), key=lambda t: -t[1]
    ):
        print(f"  {name:26s} {imp:.3f}")

    # --- refit on ALL data for the shipped model ---
    final = RandomForestClassifier(
        n_estimators=400,
        min_samples_leaf=2,
        max_features="sqrt",
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )
    final.fit(X.values, y.values)

    for out in (BASE_DIR / "ivdd_best_model.pkl", BASE_DIR.parent / "ivdd_best_model.pkl"):
        with open(out, "wb") as fh:  # "wb" = binary — never let it get text-mangled
            pickle.dump(final, fh)
        print(f"Saved model -> {out}")

    # --- verify it reloads cleanly ---
    with open(BASE_DIR / "ivdd_best_model.pkl", "rb") as fh:
        reloaded = pickle.load(fh)
    print("Reload check:", type(reloaded).__name__,
          "| n_features_in_ =", reloaded.n_features_in_,
          "| classes_ =", list(reloaded.classes_))


if __name__ == "__main__":
    main()
