"use client";

import {
  useState,
  type CSSProperties,
  type ReactNode,
  type MouseEvent,
} from "react";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { appTheme as t } from "./theme";

export { Avatar };

// ─────────────────────────────────────────────────────────────────────────────
// IconButton — circular tappable control
// ─────────────────────────────────────────────────────────────────────────────
export function IconButton({
  children,
  onClick,
  label,
  size = 34,
  variant = "default",
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  size?: number;
  variant?: "default" | "plain";
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        background: variant === "plain" ? "transparent" : "rgba(118,118,128,0.24)",
        color: t.blue,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 17,
        transform: pressed ? "scale(0.88)" : "scale(1)",
        transition: `transform 0.12s ${t.ease.spring}`,
        WebkitTapHighlightColor: "transparent",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppBtn — iOS-style full-width button
// ─────────────────────────────────────────────────────────────────────────────
export function AppBtn({
  children,
  onClick,
  variant = "primary",
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "text" | "tinted";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);

  const variants: Record<string, CSSProperties> = {
    primary: { background: t.blue, color: "#fff" },
    tinted: { background: t.blueMuted, color: t.blue },
    ghost: {
      background: "rgba(118,118,128,0.18)",
      color: t.text,
    },
    danger: {
      background: t.dangerMuted,
      color: t.red,
    },
    text: { background: "transparent", color: t.blue },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: "100%",
        padding: "15px 22px",
        borderRadius: t.radius.lg,
        fontSize: 17,
        fontWeight: 600,
        fontFamily: t.fontText,
        letterSpacing: "-0.2px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: `transform 0.12s ${t.ease.spring}, opacity 0.15s ease`,
        WebkitTapHighlightColor: "transparent",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel — iOS grouped table section header
// ─────────────────────────────────────────────────────────────────────────────
export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 400,
        color: t.textSecondary,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        marginBottom: 8,
        paddingLeft: 2,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card — iOS inset grouped card
// ─────────────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  onClick,
}: {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      onMouseDown={onClick ? () => setPressed(true) : undefined}
      onMouseUp={onClick ? () => setPressed(false) : undefined}
      onMouseLeave={onClick ? () => setPressed(false) : undefined}
      onTouchStart={onClick ? () => setPressed(true) : undefined}
      onTouchEnd={onClick ? () => setPressed(false) : undefined}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "0px",
        borderRadius: t.radius.lg,
        background: t.card,
        border: "none",
        overflow: "hidden",
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : undefined,
        opacity: pressed ? 0.7 : 1,
        transition: `opacity 0.1s ease`,
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ListRow — iOS-style table row with optional leading icon and chevron
// ─────────────────────────────────────────────────────────────────────────────
export function ListRow({
  icon,
  iconBg,
  title,
  subtitle,
  right,
  chevron = false,
  destructive = false,
  onClick,
  noBorder,
  style,
}: {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  noBorder?: boolean;
  style?: CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      onMouseDown={onClick ? () => setPressed(true) : undefined}
      onMouseUp={onClick ? () => setPressed(false) : undefined}
      onMouseLeave={onClick ? () => setPressed(false) : undefined}
      onTouchStart={onClick ? () => setPressed(true) : undefined}
      onTouchEnd={onClick ? () => setPressed(false) : undefined}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: pressed ? "rgba(255,255,255,0.05)" : "transparent",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        position: "relative",
        transition: "background 0.1s ease",
        WebkitTapHighlightColor: "transparent",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: iconBg ?? "rgba(118,118,128,0.24)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 400,
            color: destructive ? t.red : t.text,
            letterSpacing: "-0.2px",
            lineHeight: "1.3",
            fontFamily: t.fontText,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 13,
              color: t.textSecondary,
              marginTop: 1,
              lineHeight: "1.35",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {right && (
        <div style={{ flexShrink: 0, color: t.textSecondary, fontSize: 17 }}>
          {right}
        </div>
      )}

      {chevron && (
        <ChevronRight size={16} color={t.textTertiary} style={{ flexShrink: 0, marginRight: -4 }} />
      )}

      {!noBorder && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: icon ? 58 : 16,
            right: 0,
            height: 0.5,
            background: t.separator,
          }}
        />
      )}
    </Tag>
  );
}

function ChevronRight({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ToggleRow — iOS UISwitch row
// ─────────────────────────────────────────────────────────────────────────────
export function ToggleRow({
  title,
  desc,
  on,
  onChange,
  noBorder,
}: {
  title: string;
  desc?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  noBorder?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        position: "relative",
        minHeight: 44,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 400,
            color: t.text,
            letterSpacing: "-0.2px",
            lineHeight: "1.3",
            fontFamily: t.fontText,
          }}
        >
          {title}
        </div>
        {desc && (
          <div
            style={{ fontSize: 13, color: t.textSecondary, marginTop: 1, lineHeight: "1.35" }}
          >
            {desc}
          </div>
        )}
      </div>

      {/* iOS-style UISwitch */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        style={{
          width: 51,
          height: 31,
          borderRadius: 16,
          border: "none",
          padding: 2,
          background: on ? t.accent : "rgba(118,118,128,0.32)",
          cursor: "pointer",
          transition: "background 0.22s ease",
          flexShrink: 0,
          position: "relative",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            width: 27,
            height: 27,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,0,0,0.04)",
            transform: on ? "translateX(20px)" : "translateX(0px)",
            transition: `transform 0.22s ${t.ease.smooth}`,
          }}
        />
      </button>

      {!noBorder && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 0,
            height: 0.5,
            background: t.separator,
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreenHeader — iOS large title / nav bar header
// ─────────────────────────────────────────────────────────────────────────────
export function ScreenHeader({
  title,
  onBack,
  right,
  large = false,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: large ? 8 : 16,
        paddingTop: 4,
      }}
    >
      {/* Nav bar row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 44,
          gap: 8,
          marginBottom: large ? 12 : 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            border: "none",
            background: "transparent",
            color: t.blue,
            fontSize: 17,
            fontFamily: t.fontText,
            cursor: "pointer",
            padding: "0 4px 0 0",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg
            width={11}
            height={19}
            viewBox="0 0 11 19"
            fill="none"
            aria-hidden
          >
            <path
              d="M9.5 1.5L1.5 9.5L9.5 17.5"
              stroke={t.blue}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 17, color: t.blue }}>Back</span>
        </button>

        {!large && (
          <h1
            style={{
              flex: 1,
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: t.text,
              fontFamily: t.fontText,
              letterSpacing: "-0.2px",
              textAlign: "center",
            }}
          >
            {title}
          </h1>
        )}

        <div style={{ minWidth: 60, display: "flex", justifyContent: "flex-end" }}>
          {right ?? null}
        </div>
      </div>

      {/* Large title */}
      {large && (
        <h1
          style={{
            margin: "0 0 0 2px",
            fontSize: 34,
            fontWeight: 700,
            color: t.text,
            fontFamily: t.fontDisplay,
            letterSpacing: "-1px",
            lineHeight: 1.06,
          }}
        >
          {title}
        </h1>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineHeader — top-of-screen large title (for tab pages, not overlays)
// ─────────────────────────────────────────────────────────────────────────────
export function InlineHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 20,
        paddingTop: 4,
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: t.textTertiary,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 700,
            color: t.text,
            fontFamily: t.fontDisplay,
            letterSpacing: "-1px",
            lineHeight: 1.06,
          }}
        >
          {title}
        </h1>
      </div>
      {right && <div style={{ paddingBottom: 4 }}>{right}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GroupedSection — inset grouped table section
// ─────────────────────────────────────────────────────────────────────────────
export function GroupedSection({
  header,
  footer,
  children,
  style,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      {header && (
        <div
          style={{
            fontSize: 13,
            color: t.textSecondary,
            letterSpacing: "0.01em",
            marginBottom: 8,
            paddingLeft: 16,
          }}
        >
          {header}
        </div>
      )}
      <div
        style={{
          borderRadius: t.radius.lg,
          background: t.card,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      {footer && (
        <div
          style={{
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 1.4,
            marginTop: 8,
            paddingLeft: 16,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pill badge
// ─────────────────────────────────────────────────────────────────────────────
export function Badge({
  children,
  color = "green",
}: {
  children: ReactNode;
  color?: "green" | "blue" | "orange" | "red";
}) {
  const map = {
    green: { bg: t.accentMuted, fg: t.accent },
    blue: { bg: t.blueMuted, fg: t.blue },
    orange: { bg: "rgba(255,159,10,0.15)", fg: t.orange },
    red: { bg: t.dangerMuted, fg: t.red },
  };
  const { bg, fg } = map[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 13,
        fontWeight: 600,
        color: fg,
        background: bg,
        padding: "4px 10px",
        borderRadius: 980,
        flexShrink: 0,
        fontFamily: t.fontText,
      }}
    >
      {children}
    </span>
  );
}