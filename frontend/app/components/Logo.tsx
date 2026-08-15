export function LogoMark({ size = 40, iconSize = 21 }: { size?: number; iconSize?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: "linear-gradient(150deg,var(--sg-accent-lt),var(--sg-accent-dk))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(47,107,214,.28)",
        flex: "none",
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M12 3v18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="6" r="1.7" fill="#fff" />
        <circle cx="12" cy="12" r="1.7" fill="#fff" />
        <circle cx="12" cy="18" r="1.7" fill="#fff" />
        <path d="M8.5 6h7M8 12h8M8.5 18h7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      </svg>
    </div>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: "-.02em", color: "#26303B" }}>
      SpineGuard
    </span>
  );
}
