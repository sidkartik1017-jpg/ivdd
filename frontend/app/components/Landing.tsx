"use client";

import { LogoMark, Wordmark } from "./Logo";

const STEPS = [
  {
    n: "1",
    title: "Enter your dog's details",
    body: "Breed, age, body condition and the signs you're seeing — takes about a minute.",
    tint: "var(--sg-accent-tint)",
    ink: "var(--sg-accent-dk)",
  },
  {
    n: "2",
    title: "Get an instant risk assessment",
    body: "A clear Low / Moderate / High result with a probability and a recommended next step.",
    tint: "#E3F1EE",
    ink: "#1F7A72",
  },
  {
    n: "3",
    title: "Chat with our AI assistant",
    body: "Ask follow-up questions about IVDD, breeds and grades — any time, right on the page.",
    tint: "#F3EAF9",
    ink: "#7A4FA8",
  },
];

const FEATURES = [
  {
    title: "Breed-aware modelling",
    body: "Weighs chondrodystrophic breeds like Dachshunds and Corgis that carry the highest IVDD risk.",
  },
  {
    title: "Neurological grading",
    body: "A clinically-grounded 1–5 scale from mild pain to loss of deep pain sensation.",
  },
  {
    title: "Instant, plain results",
    body: "No jargon — just a clear risk level, probability, and what to do next.",
  },
];

export function Landing({ onGoHome, onGoSignin }: { onGoHome: () => void; onGoSignin: () => void }) {
  return (
    <div style={{ animation: "sgFade .5s ease both" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--sg-header)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(38,48,59,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "18px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }} onClick={onGoHome}>
            <LogoMark />
            <Wordmark />
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 34 }}>
            <a href="#" style={{ fontSize: 15, fontWeight: 500, color: "#3E4A57", textDecoration: "none" }}>
              Home
            </a>
            <a href="#how" style={{ fontSize: 15, fontWeight: 500, color: "#3E4A57", textDecoration: "none" }}>
              How it works
            </a>
            <a href="#about" style={{ fontSize: 15, fontWeight: 500, color: "#3E4A57", textDecoration: "none" }}>
              About
            </a>
            <button
              onClick={onGoSignin}
              className="sg-nav-btn"
              style={{
                border: "none",
                cursor: "pointer",
                background: "var(--sg-accent)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                padding: "11px 22px",
                borderRadius: 11,
                boxShadow: "0 4px 12px rgba(47,107,214,.26)",
              }}
            >
              Sign in
            </button>
          </nav>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "70px 28px 40px",
          display: "grid",
          gridTemplateColumns: "1.05fr .95fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--sg-accent-tint)",
              border: "1px solid rgba(47,107,214,.16)",
              color: "var(--sg-accent-dk)",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: 100,
              marginBottom: 24,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2FA36B" }} /> Built for
            dachshunds, corgis &amp; every long-backed friend
          </div>
          <h1
            style={{
              fontFamily: "var(--sg-head)",
              fontWeight: 500,
              fontSize: 60,
              lineHeight: 1.03,
              letterSpacing: "-.02em",
              margin: "0 0 22px",
              color: "#1F2833",
            }}
          >
            Early IVDD risk detection for your dog
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: "#54606C", maxWidth: 490, margin: "0 0 34px" }}>
            SpineGuard reads your dog&apos;s clinical signs and estimates their risk of Intervertebral Disc
            Disease in seconds — so you know whether to watch, rest, or head to the vet.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={onGoSignin}
              className="sg-nav-btn"
              style={{
                border: "none",
                cursor: "pointer",
                background: "var(--sg-accent)",
                color: "#fff",
                fontSize: 17,
                fontWeight: 600,
                padding: "16px 30px",
                borderRadius: 13,
                boxShadow: "0 8px 20px rgba(47,107,214,.3)",
              }}
            >
              Get started — it&apos;s free
            </button>
            <a
              href="#how"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--sg-accent)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              See how it works
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="var(--sg-accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 40 }}>
            <div>
              <div style={{ fontFamily: "var(--sg-head)", fontSize: 28, fontWeight: 600, color: "#1F2833" }}>30s</div>
              <div style={{ fontSize: 13.5, color: "#78838E" }}>to a result</div>
            </div>
            <div style={{ width: 1, background: "rgba(38,48,59,.1)" }} />
            <div>
              <div style={{ fontFamily: "var(--sg-head)", fontSize: 28, fontWeight: 600, color: "#1F2833" }}>40+</div>
              <div style={{ fontSize: 13.5, color: "#78838E" }}>breeds modelled</div>
            </div>
            <div style={{ width: 1, background: "rgba(38,48,59,.1)" }} />
            <div>
              <div style={{ fontFamily: "var(--sg-head)", fontSize: 28, fontWeight: 600, color: "#1F2833" }}>5</div>
              <div style={{ fontSize: 13.5, color: "#78838E" }}>grade scale</div>
            </div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              background: "linear-gradient(160deg,var(--sg-accent-tint) 0%,#E3F1EE 100%)",
              borderRadius: 32,
              padding: "44px 40px 0",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 30px 60px -30px rgba(36,90,184,.4)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 22,
                right: 26,
                background: "#fff",
                borderRadius: 14,
                padding: "11px 15px",
                boxShadow: "0 8px 22px rgba(31,40,51,.12)",
                animation: "sgFloat 5s ease-in-out infinite",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "#78838E", letterSpacing: ".04em" }}>
                RISK LEVEL
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2FA36B" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1F2833" }}>Low · 12%</span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <svg viewBox="0 0 480 300" width="100%" style={{ display: "block", marginTop: 6 }}>
                <ellipse cx="250" cy="232" rx="200" ry="15" fill="#3A2410" opacity=".1" />
                <path
                  d="M376 104 C396 78 424 56 446 60 C458 64 456 78 444 81 C428 84 410 100 394 126 C388 134 377 130 375 118 C374 112 373 108 376 104 Z"
                  fill="#B0531F"
                />
                <path
                  d="M128 160 C126 182 126 200 130 214 C132 223 143 223 145 214 C148 200 147 180 146 160 Z"
                  fill="#B0531F"
                />
                <path
                  d="M156 164 C154 184 154 200 158 213 C160 222 171 222 173 213 C175 200 174 182 173 164 Z"
                  fill="#B0531F"
                />
                <path
                  d="M334 164 C332 184 332 202 336 215 C338 224 349 224 351 215 C354 201 353 182 352 164 Z"
                  fill="#B0531F"
                />
                <path
                  d="M362 160 C360 180 360 202 364 216 C366 225 377 225 379 216 C382 200 381 180 380 160 Z"
                  fill="#B0531F"
                />
                <path
                  d="M24 106 C50 92 88 82 112 76 C122 60 148 54 164 62 C178 70 192 74 212 78 C272 84 340 88 372 96 C390 102 398 118 396 140 C394 158 388 170 376 174 C300 170 200 170 140 166 C118 162 104 150 96 136 C84 124 66 116 44 116 C34 116 26 112 24 106 Z"
                  fill="#B0531F"
                />
                <path
                  d="M158 64 C184 66 194 96 188 132 C184 158 162 160 154 144 C146 120 148 86 158 64 Z"
                  fill="#9C4419"
                />
                <path
                  d="M28 96 C16 98 12 112 20 118 C28 123 40 119 41 109 C42 100 37 95 28 96 Z"
                  fill="#22140D"
                />
                <ellipse cx="132" cy="78" rx="6" ry="7" fill="#22140D" />
                <circle cx="70" cy="102" r="2.4" fill="#7C2A12" opacity=".8" />
                <circle cx="84" cy="97" r="2.4" fill="#7C2A12" opacity=".8" />
                <circle cx="80" cy="110" r="2.4" fill="#7C2A12" opacity=".8" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="how" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 28px 30px" }}>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 46px" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: ".08em",
              color: "var(--sg-accent)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            How it works
          </div>
          <h2 style={{ fontFamily: "var(--sg-head)", fontWeight: 500, fontSize: 42, lineHeight: 1.1, margin: 0, color: "#1F2833" }}>
            Three steps to peace of mind
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="sg-step-card"
              style={{
                background: "#fff",
                border: "1px solid rgba(38,48,59,.07)",
                borderRadius: 22,
                padding: "32px 30px",
                boxShadow: "0 4px 18px rgba(31,40,51,.05)",
                transition: "transform .15s, box-shadow .15s",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  background: step.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <span style={{ fontFamily: "var(--sg-head)", fontSize: 24, fontWeight: 600, color: step.ink }}>
                  {step.n}
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 9px", color: "#1F2833" }}>{step.title}</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "#5C6772", margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 28px" }}>
        <div
          style={{
            background: "linear-gradient(150deg,#1F3A6E,#26467F)",
            borderRadius: 30,
            padding: "52px 48px",
            color: "#fff",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 36 }}>
            {FEATURES.map((feat) => (
              <div key={feat.title}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: "rgba(255,255,255,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: "#7FD8CE" }} />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>{feat.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.72)", margin: 0 }}>
                  {feat.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 28px 40px" }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            background: "#FBEFD6",
            border: "1px solid rgba(201,138,22,.28)",
            borderRadius: 16,
            padding: "18px 22px",
          }}
        >
          <div
            style={{
              flex: "none",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#C98A16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            !
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#7A5A12" }}>
            This tool is for informational purposes only and is <strong>not a substitute for professional
            veterinary diagnosis</strong>. If your dog shows sudden weakness, paralysis, or loss of bladder
            control, seek emergency veterinary care immediately.
          </p>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(38,48,59,.08)", marginTop: 20 }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "34px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} iconSize={15} />
            <span style={{ fontWeight: 700, color: "#26303B" }}>SpineGuard</span>
          </div>
          <span style={{ fontSize: 13.5, color: "#8A949E" }}>© 2026 SpineGuard · Made with care for good dogs.</span>
        </div>
      </footer>
    </div>
  );
}
