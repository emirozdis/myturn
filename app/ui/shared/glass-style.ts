import type { CSSProperties } from "react";

export function glassStyle(
  alpha = 0.07,
  blur = 20,
  borderAlpha = 0.12
): CSSProperties {
  return {
    background: `linear-gradient(135deg, rgba(255,255,255,${alpha + 0.03}) 0%, rgba(255,255,255,${alpha}) 100%)`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    borderTop: `1px solid rgba(255,255,255,${borderAlpha * 3})`,
    borderLeft: `1px solid rgba(255,255,255,${borderAlpha * 2})`,
    borderRight: `1px solid rgba(255,255,255,${borderAlpha * 0.4})`,
    borderBottom: `1px solid rgba(255,255,255,${borderAlpha * 0.2})`,
    boxShadow: `inset 0 1px 2px rgba(255,255,255,${borderAlpha * 2}), inset 0 -1px 2px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.2)`,
  };
}
