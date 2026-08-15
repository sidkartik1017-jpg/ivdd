"use client";

import { useState } from "react";
import { LogoMark, Wordmark } from "./Logo";
import { signIn } from "../lib/api";

export function SignIn({ onGoHome, onGoSignup, onSignedIn }: { onGoHome: () => void; onGoSignup: () => void; onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const err: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Enter a valid email address.";
    if (!password) err.password = "Password is required.";
    if (Object.keys(err).length) return setErrors(err);
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await signIn(email, password);
      onSignedIn();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Sign in failed. Please try again.");
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
            Welcome back
          </h1>
          <p style={{ fontSize: 15, color: "#66717C", margin: "0 0 28px" }}>
            Sign in to assess your dog&apos;s IVDD risk.
          </p>

          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#3E4A57", marginBottom: 7 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "13px 15px",
              border: "1.5px solid #E3DACC",
              borderRadius: 12,
              fontSize: 15,
              background: "#FCFAF6",
              marginBottom: 5,
            }}
          />
          {errors.email && <div style={{ fontSize: 13, color: "#D2564B", marginBottom: 8 }}>{errors.email}</div>}

          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#3E4A57", margin: "16px 0 7px" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "13px 46px 13px 15px",
                border: "1.5px solid #E3DACC",
                borderRadius: 12,
                fontSize: 15,
                background: "#FCFAF6",
              }}
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
          {serverError && (
            <div
              style={{
                marginTop: 12,
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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#54606C" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: "var(--sg-accent)", cursor: "pointer" }}
              />{" "}
              Remember me
            </label>
            <a href="#" style={{ fontSize: 14, fontWeight: 600, color: "var(--sg-accent)", textDecoration: "none" }}>
              Forgot password?
            </a>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="sg-nav-btn"
            style={{
              width: "100%",
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p style={{ textAlign: "center", fontSize: 14.5, color: "#66717C", margin: "22px 0 0" }}>
            Don&apos;t have an account?{" "}
            <span onClick={onGoSignup} style={{ fontWeight: 600, color: "var(--sg-accent)", textDecoration: "none", cursor: "pointer" }}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
