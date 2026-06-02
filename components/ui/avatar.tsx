"use client";

export function Avatar({
  initials,
  size = 40,
  ring,
}: {
  initials: string;
  size?: number;
  ring?: boolean;
}) {
  const label = initials.slice(0, 2).toUpperCase();
  const fontSize = size < 36 ? 11 : size < 50 ? 13 : 16;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "rgba(255,255,255,0.12)",
        border: ring ? "2px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 600,
        color: "rgba(255,255,255,0.9)",
        letterSpacing: "-0.5px",
        flexShrink: 0,
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}
      aria-hidden
    >
      {label}
    </div>
  );
}
