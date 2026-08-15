"use client";

import { useState } from "react";
import { LogoMark, Wordmark } from "./Logo";
import { signUp } from "../lib/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  border: "1.5px solid #E3DACC",
  borderRadius: 12,
  fontSize: 15,
  background: "#FCFAF6",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "#3E4A57",
  margin: "16px 0 7px",
};

export function SignUp({ onGoHome, onGoSignin, onSignedUp }: { onGoHome: () => void; onGoSignin: () => void; onSignedUp: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const err: typeof errors = {};
    if (!name.trim()) err.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Enter a valid email address.";
    if (password.length < 6) err.password = "Password must be at least 6 characters.";
    if (confirm !== password) err.confirm = "Passwords do not match.";
    if (Object.keys(err).length) return setErrors(err);
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await signUp(name.trim(), email, password);
      onSignedUp();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "radial-gradient(1200px 600px at 50% -10%,#E3F1EE 0%,var(--sg-bg) 55%)",
        animation: "sgFade .4s ease both",
      }}
    >
      <div style={{ width: "100%", maxWidth: 430 }}>
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, marginBottom: 30, cursor: "pointer" }}
          onClick={onGoHome}
        >
          <LogoMark size={42} />
          <Wordmark />
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(38,48,59,.07)",
            borderRadius: 24,
            padding: "38px 36px",
            boxShadow: "0 24px 50px -24px rgba(31,40,51,.28)",
          }}
        >
          <h1 style={{ fontFamily: "var(--sg-head)", fontWeight: 500, fontSize: 32, margin: "0 0 6px", color: "#1F2833" }}>
            Create your account
          </h1>
          <p style={{ fontSize: 15, color: "#66717C", margin: "0 0 20px" }}>
            Start assessing your dog&apos;s IVDD risk in minutes.
          </p>

          <label style={{ ...labelStyle, marginTop: 0 }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Rivera" style={inputStyle} />
          {errors.name && <div style={{ fontSize: 13, color: "#D2564B", marginTop: 6 }}>{errors.name}</div>}

          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
          {errors.email && <div style={{ fontSize: 13, color: "#D2564B", marginTop: 6 }}>{errors.email}</div>}

          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{ ...inputStyle, padding: "13px 46px 13px 15px" }}
            />
            <button
              onClick={() => setShowPw((v) => !v)}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 8,
                color: "#8A949E",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <div style={{ fontSize: 13, color: "#D2564B", marginTop: 6 }}>{errors.password}</div>}

          <label style={labelStyle}>Confirm password</label>
          <input
            type={showPw ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            style={inputStyle}
          />
          {errors.confirm && <div style={{ fontSize: 13, color: "#D2564B", marginTop: 6 }}>{errors.confirm}</div>}

          {serverError && (
            <div
              style={{
                marginTop: 14,
                background: "#F7E2DF",
                border: "1px solid rgba(210,86,75,.25)",
                color: "#B23A30",
                fontSize: 13.5,
                fontWeight: 500,
                padding: "10px 13px",
                borderRadius: 10,
              }}
            >
              {serverError}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="sg-nav-btn"
            style={{
              width: "100%",
              marginTop: 24,
              border: "none",
              cursor: loading ? "wait" : "pointer",
              background: loading ? "#6E9BE0" : "var(--sg-accent)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              padding: 15,
              borderRadius: 13,
              boxShadow: "0 8px 18px rgba(47,107,214,.28)",
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
          <p style={{ textAlign: "center", fontSize: 14.5, color: "#66717C", margin: "22px 0 0" }}>
            Already have an account?{" "}
            <span onClick={onGoSignin} style={{ fontWeight: 600, color: "var(--sg-accent)", textDecoration: "none", cursor: "pointer" }}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
