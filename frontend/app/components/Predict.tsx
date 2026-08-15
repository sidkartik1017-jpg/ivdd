"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";
import { FieldLabel } from "./FieldLabel";
import {
  ALL_BREEDS,
  BLANK_FORM,
  DISC_LEVELS,
  FormState,
  HIGH_RISK_BREEDS,
  HistoryEntry,
  NEURO_LABELS,
  RiskResult,
  SYMPTOMS,
  tintFor,
} from "../lib/risk";
import { predict as predictApi, getHistory, getUser, signOut } from "../lib/api";

// Turn an ISO timestamp from the backend into a short relative label.
function formatTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

const BLANK_PX = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

function badge(color: string, tint: string, extra = "") {
  return {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".03em",
    textTransform: "uppercase" as const,
    padding: "4px 10px",
    borderRadius: 100,
    color,
    background: tint,
    ...(extra ? { fontSize: 12, padding: "5px 13px" } : {}),
  };
}

export function Predict({ onGoHome }: { onGoHome: () => void }) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [mri, setMri] = useState<{ name: string; dataUrl: string } | null>(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const user = typeof window !== "undefined" ? getUser() : null;

  // Load this user's saved assessments from the backend on mount.
  useEffect(() => {
    getHistory()
      .then(({ history }) => setHistory(history))
      .catch(() => {
        /* not signed in / backend down — leave history empty */
      });
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function pickMri() {
    document.getElementById("sg-mri-input")?.click();
  }
  function clearMri() {
    setMri(null);
    const el = document.getElementById("sg-mri-input") as HTMLInputElement | null;
    if (el) el.value = "";
  }
  function onMriPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMri({ name: file.name, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  function toggleSymptom(id: string) {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(id) ? f.symptoms.filter((x) => x !== id) : [...f.symptoms, id],
    }));
  }

  async function submit() {
    if (!form.name.trim()) return setFormError("Please enter your dog’s name.");
    if (!form.breed.trim()) return setFormError("Please select a breed.");
    if (!form.ageMonths) return setFormError("Please enter your dog’s age.");
    setFormError("");
    setLoading(true);
    setResult(null);
    const snapshotMri = mri;
    try {
      const { result: r, entry } = await predictApi(form, !!snapshotMri);
      // Attach the local MRI thumbnail (the image itself is never uploaded).
      const withThumb: HistoryEntry = {
        ...entry,
        mriThumb: snapshotMri ? snapshotMri.dataUrl : null,
      };
      setResult(r);
      setActiveHistoryId(withThumb.id);
      setHistory((h) => [withThumb, ...h]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadHistory(h: HistoryEntry) {
    if (h.snapshot) {
      setForm(h.snapshot);
      setMri(null);
      setResult(h.result ?? null);
      setActiveHistoryId(h.id);
      setFormError("");
    } else {
      const r: RiskResult = {
        prob: h.prob,
        level: h.level,
        color: h.color,
        tint: tintFor(h.level),
        headline:
          h.level === "Low"
            ? "Signs point to a low IVDD risk"
            : h.level === "Moderate"
            ? "A moderate risk — worth a closer look"
            : "High risk — seek veterinary care",
        interpretation: "Loaded from a previous assessment for " + h.name + ".",
        nextStep:
          h.level === "High"
            ? "Consult your vet within 24 hours."
            : h.level === "Moderate"
            ? "Consult your vet within 24–48 hours."
            : "Monitor at home.",
      };
      setResult(r);
      setActiveHistoryId(h.id);
      setForm((f) => ({ ...f, name: h.name, breed: h.breed }));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newPrediction() {
    setForm(BLANK_FORM);
    setMri(null);
    setResult(null);
    setActiveHistoryId(null);
    setFormError("");
    const el = document.getElementById("sg-mri-input") as HTMLInputElement | null;
    if (el) el.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const breedHighRisk = HIGH_RISK_BREEDS.includes(form.breed);
  const neuroLabel = NEURO_LABELS[form.neuro] || "";
  const circ = 2 * Math.PI * 56;
  const offset = result ? circ * (1 - result.prob / 100) : circ;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--sg-bg)", animation: "sgFade .4s ease both" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--sg-header)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(38,48,59,.07)",
        }}
      >
        <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onGoHome}>
            <LogoMark size={36} iconSize={18} />
            <span style={{ fontSize: 19, fontWeight: 700, color: "#26303B" }}>SpineGuard</span>
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              className="sg-icon-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                border: "1px solid rgba(38,48,59,.1)",
                background: "#fff",
                borderRadius: 100,
                padding: "5px 6px 5px 14px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#3E4A57" }}>{user?.name || "Account"}</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(150deg,#2FA8A0,var(--sg-accent))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {(user?.name || "AC").slice(0, 2).toUpperCase()}
              </span>
            </button>
            {avatarOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 52,
                  background: "#fff",
                  border: "1px solid rgba(38,48,59,.1)",
                  borderRadius: 14,
                  boxShadow: "0 16px 34px rgba(31,40,51,.16)",
                  padding: 6,
                  minWidth: 180,
                  animation: "sgPop .16s ease both",
                }}
              >
                <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(38,48,59,.07)", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#26303B" }}>{user?.name || "Account"}</div>
                  <div style={{ fontSize: 12.5, color: "#8A949E" }}>{user?.email || ""}</div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    onGoHome();
                  }}
                  className="sg-signout"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "9px 12px",
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#D2564B",
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "288px 1fr", gap: 0, maxWidth: 1280, width: "100%", margin: "0 auto" }}>
        <aside
          style={{
            borderRight: "1px solid rgba(38,48,59,.07)",
            padding: "22px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxHeight: "calc(100vh - 65px)",
            overflowY: "auto",
            position: "sticky",
            top: 65,
          }}
        >
          <button
            onClick={newPrediction}
            className="sg-upload-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "1.5px dashed #B9C4D0",
              background: "#fff",
              color: "var(--sg-accent)",
              fontSize: 14.5,
              fontWeight: 600,
              padding: 12,
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="var(--sg-accent)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>{" "}
            New prediction
          </button>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "#8A949E", textTransform: "uppercase", padding: "2px 4px" }}>
            History
          </div>
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => loadHistory(h)}
              className="sg-history-btn"
              style={{
                textAlign: "left",
                cursor: "pointer",
                width: "100%",
                borderRadius: 14,
                padding: "13px 14px",
                border: `1.5px solid ${activeHistoryId === h.id ? "var(--sg-accent)" : "rgba(38,48,59,.08)"}`,
                background: activeHistoryId === h.id ? "#F4F8FE" : "#fff",
                transition: "border-color .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                {h.mriThumb && (
                  <img
                    src={h.mriThumb}
                    alt=""
                    style={{ width: 26, height: 26, objectFit: "cover", borderRadius: 6, flex: "none", background: "#000" }}
                  />
                )}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#26303B",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.name}
                </span>
                <span style={badge(h.color, tintFor(h.level))}>{h.level}</span>
              </div>
              <div style={{ fontSize: 13, color: "#66717C", marginBottom: 3 }}>{h.breed}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: h.color }}>{h.prob}% risk</span>
                <span style={{ fontSize: 12, color: "#9AA4AD" }}>{formatTime(h.time)}</span>
              </div>
            </button>
          ))}
        </aside>

        <main style={{ padding: "32px 40px 90px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--sg-head)", fontWeight: 500, fontSize: 34, margin: "0 0 6px", color: "#1F2833" }}>
            Assess IVDD risk
          </h1>
          <p style={{ fontSize: 15.5, color: "#66717C", margin: "0 0 28px" }}>
            Fill in your dog&apos;s details and current signs for an instant estimate.
          </p>

          {result && (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(38,48,59,.08)",
                borderRadius: 22,
                padding: 30,
                marginBottom: 26,
                boxShadow: "0 10px 30px rgba(31,40,51,.07)",
                animation: "sgPop .35s ease both",
              }}
            >
              <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", width: 132, height: 132, flex: "none" }}>
                  <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="66" cy="66" r="56" fill="none" stroke="#EFE7DA" strokeWidth="13" />
                    <circle
                      cx="66"
                      cy="66"
                      r="56"
                      fill="none"
                      stroke={result.color}
                      strokeWidth="13"
                      strokeLinecap="round"
                      strokeDasharray={circ.toFixed(1)}
                      strokeDashoffset={offset.toFixed(1)}
                      style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--sg-head)", fontSize: 34, fontWeight: 600, color: "#1F2833" }}>{result.prob}%</span>
                    <span style={{ fontSize: 11.5, color: "#8A949E", fontWeight: 500 }}>probability</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 230 }}>
                  <span style={badge(result.color, result.tint, "small")}>{result.level} risk</span>
                  <h2 style={{ fontFamily: "var(--sg-head)", fontWeight: 500, fontSize: 25, margin: "12px 0 8px", color: "#1F2833" }}>
                    {result.headline}
                  </h2>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5C6772", margin: "0 0 14px" }}>{result.interpretation}</p>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: result.tint, borderRadius: 12, padding: "12px 14px" }}>
                    <div
                      style={{
                        flex: "none",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: result.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: result.color, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Recommended next step
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "#26303B", marginTop: 2 }}>{result.nextStep}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 18, fontSize: 12.5, color: "#9AA4AD", lineHeight: 1.5, borderTop: "1px solid rgba(38,48,59,.07)", paddingTop: 14 }}>
                Informational estimate only — not a veterinary diagnosis. When in doubt, call your vet.
              </div>
            </div>
          )}

          <div style={{ background: "#fff", border: "1px solid rgba(38,48,59,.08)", borderRadius: 22, padding: "30px 30px 34px", boxShadow: "0 4px 18px rgba(31,40,51,.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Dog&apos;s name</FieldLabel>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pretzel" style={fieldInput} />
              </div>
              <div>
                <FieldLabel info="A unique identifier for this dog's record, used to track and reference this assessment. Not used in the risk calculation itself.">
                  Dog ID
                </FieldLabel>
                <input value={form.dogId} onChange={(e) => set("dogId", e.target.value)} placeholder="e.g. SG-00231" style={fieldInput} />
              </div>
              <div>
                <FieldLabel info="The spinal disc segment being evaluated, e.g. T12-T13 or L1-L2. IVDD most often affects the thoracolumbar junction in chondrodystrophic breeds.">
                  Disc level
                </FieldLabel>
                <select value={form.discLevel} onChange={(e) => set("discLevel", e.target.value)} style={{ ...fieldInput, cursor: "pointer" }}>
                  <option value="">Select…</option>
                  {DISC_LEVELS.map((lvl) => (
                    <option key={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel info="Chondrodystrophic breeds (Dachshunds, Corgis, French Bulldogs, etc.) carry a much higher genetic risk of disc degeneration.">
                  Breed
                </FieldLabel>
                <input
                  list="sg-breeds"
                  value={form.breed}
                  onChange={(e) => set("breed", e.target.value)}
                  placeholder="Search breed…"
                  style={fieldInput}
                />
                <datalist id="sg-breeds">
                  {ALL_BREEDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                {breedHighRisk && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      marginTop: 9,
                      background: "#F7E2DF",
                      border: "1px solid rgba(210,86,75,.25)",
                      color: "#B23A30",
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "6px 11px",
                      borderRadius: 100,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D2564B" }} />
                    High-risk chondrodystrophic breed
                  </div>
                )}
              </div>
              <div>
                <FieldLabel info="Your dog's age in months. IVDD risk typically rises in early-to-middle adulthood and again in older dogs.">
                  Age (months)
                </FieldLabel>
                <input type="number" value={form.ageMonths} onChange={(e) => set("ageMonths", e.target.value)} placeholder="0" style={fieldInput} />
              </div>
              <div>
                <FieldLabel info="Your dog's current body weight. Excess weight increases mechanical load on the spine and discs.">
                  Weight (kg)
                </FieldLabel>
                <input type="number" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="0" style={fieldInput} />
              </div>
              <div>
                <FieldLabel info="Biological sex and reproductive status. Included because hormonal status can modestly influence disc and connective tissue health.">
                  Sex
                </FieldLabel>
                <select value={form.sex} onChange={(e) => set("sex", e.target.value)} style={{ ...fieldInput, cursor: "pointer" }}>
                  <option value="">Select…</option>
                  <option>Male</option>
                  <option>Male (neutered)</option>
                  <option>Female</option>
                  <option>Female (spayed)</option>
                </select>
              </div>
              <div>
                <FieldLabel>Body condition</FieldLabel>
                <select value={form.bcs} onChange={(e) => set("bcs", e.target.value)} style={{ ...fieldInput, cursor: "pointer" }}>
                  <option value="">Select…</option>
                  <option>Underweight</option>
                  <option>Ideal</option>
                  <option>Overweight</option>
                </select>
              </div>
              <div>
                <FieldLabel>Symptom onset</FieldLabel>
                <select value={form.onset} onChange={(e) => set("onset", e.target.value)} style={{ ...fieldInput, cursor: "pointer" }}>
                  <option value="">Select…</option>
                  <option>Acute</option>
                  <option>Gradual</option>
                </select>
              </div>
              <div>
                <FieldLabel>Affected region</FieldLabel>
                <select value={form.region} onChange={(e) => set("region", e.target.value)} style={{ ...fieldInput, cursor: "pointer" }}>
                  <option value="">Select…</option>
                  <option>Cervical (neck)</option>
                  <option>Thoracolumbar (mid-back)</option>
                  <option>Lumbosacral (lower back)</option>
                  <option>Unsure</option>
                </select>
              </div>
              <div>
                <FieldLabel>Duration (days)</FieldLabel>
                <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="0" style={fieldInput} />
              </div>
            </div>

            <div style={{ marginTop: 26 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".04em", color: "#8A949E", textTransform: "uppercase", marginBottom: 14 }}>
                Clinical, imaging &amp; genetic biomarkers <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional — improves accuracy)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>
                <div>
                  <FieldLabel info="Ratio of intervertebral disc height to the adjacent vertebral body length, measured from imaging. Lower values indicate disc collapse or degeneration.">
                    Disc height index
                  </FieldLabel>
                  <input type="number" step="0.01" value={form.discHeightIndex} onChange={(e) => set("discHeightIndex", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="MRI T2-weighted signal intensity grade for the disc (a Pfirrmann-style scale). Lower signal reflects disc dehydration and nucleus degeneration.">
                    T2 signal score
                  </FieldLabel>
                  <input type="number" step="0.1" value={form.t2SignalScore} onChange={(e) => set("t2SignalScore", e.target.value)} placeholder="0" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="A radiomics measure of how heterogeneous the disc tissue looks on imaging. Higher entropy often corresponds to more disorganized, degenerated tissue.">
                    Texture entropy
                  </FieldLabel>
                  <input type="number" step="0.01" value={form.textureEntropy} onChange={(e) => set("textureEntropy", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="Model-estimated probability (0–1) that the disc is bulging or protruding, derived from imaging analysis.">
                    Bulge probability
                  </FieldLabel>
                  <input type="number" step="0.01" min="0" max="1" value={form.bulgeProb} onChange={(e) => set("bulgeProb", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="A proxy score for vertebral endplate changes — sclerosis, irregularity, or Schmorl's-node-like defects seen adjacent to the disc.">
                    Endplate proxy
                  </FieldLabel>
                  <input type="number" step="0.01" value={form.endplateProxy} onChange={(e) => set("endplateProxy", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="A composite risk score derived purely from imaging findings (disc height, T2 signal, bulge probability, endplate changes).">
                    Imaging risk score
                  </FieldLabel>
                  <input type="number" step="0.01" value={form.imagingRiskScore} onChange={(e) => set("imagingRiskScore", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="A composite score summarizing genetic risk factors (breed markers, family history) independent of imaging or symptoms.">
                    Genetic risk score
                  </FieldLabel>
                  <input type="number" step="0.01" value={form.geneticRiskScore} onChange={(e) => set("geneticRiskScore", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="A composite score for biomechanical risk factors — body length-to-leg ratio, spinal loading, and posture-related stress on the discs.">
                    Mechanism risk score
                  </FieldLabel>
                  <input type="number" step="0.01" value={form.mechanismRiskScore} onChange={(e) => set("mechanismRiskScore", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
                <div>
                  <FieldLabel info="Number of copies (0, 1, or 2) of the FGF4 retrogene insertion on chromosome CFA12 associated with chondrodystrophy — the strongest known genetic driver of IVDD.">
                    CDDY FGF4 (CFA12) copies
                  </FieldLabel>
                  <select
                    value={form.cddyFgf4Cfa12Copies}
                    onChange={(e) => set("cddyFgf4Cfa12Copies", e.target.value)}
                    style={{ ...fieldInput, cursor: "pointer" }}
                  >
                    <option value="">Select…</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
                <div>
                  <FieldLabel info="The baseline IVDD probability (0–1) expected for this breed alone, before factoring in this individual dog's signs and biomarkers.">
                    Breed genetic prior
                  </FieldLabel>
                  <input type="number" step="0.01" min="0" max="1" value={form.breedGeneticPrior} onChange={(e) => set("breedGeneticPrior", e.target.value)} placeholder="0.00" style={fieldInput} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <label style={{ ...fieldLabel, display: "block" }}>
                MRI scan <span style={{ color: "#9AA4AD", fontWeight: 500 }}>(optional — improves accuracy)</span>
              </label>
              <input id="sg-mri-input" type="file" accept="image/*" onChange={onMriPick} style={{ display: "none" }} />
              {mri ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14, border: "1.5px solid #E3DACC", borderRadius: 14, padding: "12px 14px", background: "#FCFAF6" }}>
                  <img src={mri.dataUrl} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 9, flex: "none", background: "#000" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#26303B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mri.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#2FA36B", fontWeight: 600, marginTop: 2 }}>Attached to this assessment</div>
                  </div>
                  <button onClick={clearMri} style={{ flex: "none", border: "none", background: "transparent", cursor: "pointer", color: "#9AA4AD", fontSize: 13, fontWeight: 600, padding: 8 }}>
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={pickMri}
                  className="sg-upload-btn"
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    border: "1.5px dashed #B9C4D0",
                    borderRadius: 14,
                    padding: "26px 16px",
                    background: "#FCFAF6",
                    cursor: "pointer",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#8A949E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#8A949E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#3E4A57" }}>Click to upload an MRI image</span>
                  <span style={{ fontSize: 12.5, color: "#9AA4AD" }}>PNG or JPG, sagittal or transverse view</span>
                </button>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <label style={{ fontSize: 13.5, fontWeight: 600, color: "#3E4A57" }}>Neurological grade</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sg-accent)", background: "var(--sg-accent-tint)", padding: "4px 12px", borderRadius: 100 }}>
                  Grade {form.neuro} · {neuroLabel}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={form.neuro}
                onChange={(e) => set("neuro", Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--sg-accent)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: "#9AA4AD" }}>
                <span>1 · Pain only</span>
                <span>5 · No deep pain</span>
              </div>
            </div>

            <div style={{ marginTop: 26 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#3E4A57", marginBottom: 12 }}>
                Current symptoms <span style={{ color: "#9AA4AD", fontWeight: 500 }}>(select all that apply)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SYMPTOMS.map((chip) => {
                  const active = form.symptoms.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      onClick={() => toggleSymptom(chip.id)}
                      style={{
                        cursor: "pointer",
                        fontSize: 13.5,
                        fontWeight: 600,
                        padding: "9px 15px",
                        borderRadius: 100,
                        transition: "all .14s",
                        border: `1.5px solid ${active ? "var(--sg-accent)" : "#E3DACC"}`,
                        background: active ? "var(--sg-accent)" : "#FCFAF6",
                        color: active ? "#fff" : "#54606C",
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {formError && (
              <div style={{ marginTop: 20, background: "#F7E2DF", border: "1px solid rgba(210,86,75,.25)", color: "#B23A30", fontSize: 14, fontWeight: 500, padding: "12px 15px", borderRadius: 12 }}>
                {formError}
              </div>
            )}

            <button
              onClick={submit}
              style={{
                marginTop: 26,
                width: "100%",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                background: loading ? "#6E9BE0" : "var(--sg-accent)",
                color: "#fff",
                fontSize: 16.5,
                fontWeight: 600,
                padding: 16,
                borderRadius: 14,
                boxShadow: "0 8px 20px rgba(47,107,214,.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {loading && (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: "2.5px solid rgba(255,255,255,.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "sgSpin .7s linear infinite",
                  }}
                />
              )}
              {loading ? "Analysing…" : "Predict risk"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12.5, color: "#9AA4AD", margin: "14px 0 0" }}>
              For informational purposes only — not a substitute for professional veterinary diagnosis.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 13.5,
  fontWeight: 600,
  color: "#3E4A57",
  marginBottom: 7,
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #E3DACC",
  borderRadius: 11,
  fontSize: 15,
  background: "#FCFAF6",
};
