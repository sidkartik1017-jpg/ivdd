"use client";

export function InfoIcon({ text }: { text: string }) {
  return (
    <span className="sg-info-wrap" tabIndex={0}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
        <circle cx="12" cy="12" r="10" fill="#DCE3EA" />
        <rect x="11" y="10.3" width="2" height="6.7" rx="1" fill="#6B7684" />
        <rect x="11" y="6.3" width="2" height="2.2" rx="1" fill="#6B7684" />
      </svg>
      <span className="sg-info-tip">{text}</span>
    </span>
  );
}

export function FieldLabel({
  children,
  info,
  style,
}: {
  children: React.ReactNode;
  info?: string;
  style?: React.CSSProperties;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13.5,
        fontWeight: 600,
        color: "#3E4A57",
        marginBottom: 7,
        ...style,
      }}
    >
      {children}
      {info && <InfoIcon text={info} />}
    </label>
  );
}
