"use client";

import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { ease } from "./utils";

export function FadeSlide({
  show,
  children,
  delay = 0,
  up = true,
}: {
  show: boolean;
  children: ReactNode;
  delay?: number;
  up?: boolean;
}) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(t);
    }
  }, [show, delay]);
  if (!mounted) return null;
  return (
    <div
      style={{
        transition: `opacity 0.55s ${ease.smooth} ${delay}ms, transform 0.55s ${ease.spring} ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${up ? 22 : -22}px)`,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  style = {},
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "text";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  const base = {
    width: "100%",
    padding: "17px 24px",
    borderRadius: 18,
    fontSize: 17,
    fontWeight: 600,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacing: "-0.2px",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: `transform 0.18s ${ease.spring}, opacity 0.18s ease`,
    transform: pressed ? "scale(0.96)" : "scale(1)",
    opacity: disabled ? 0.4 : 1,
    ...style,
  };
  const vars =
    variant === "primary"
      ? { background: "#fff", color: "#000" }
      : variant === "ghost"
        ? {
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.12)",
          }
        : { background: "transparent", color: "rgba(255,255,255,0.5)", border: "none" };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{ ...base, ...vars }}
    >
      {children}
    </button>
  );
}

export function Input({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "17px 20px",
        borderRadius: 16,
        fontSize: 17,
        fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
        background: "rgba(255,255,255,0.07)",
        border: focused ? "1.5px solid rgba(255,255,255,0.4)" : "1.5px solid rgba(255,255,255,0.1)",
        color: "#fff",
        outline: "none",
        transition: "border 0.2s ease",
        boxSizing: "border-box",
        letterSpacing: "-0.1px",
      }}
      autoComplete="off"
    />
  );
}

export function PermRow({
  icon,
  title,
  desc,
  granted,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  granted: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 20px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: granted ? "rgba(52,199,89,0.2)" : "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.3s ease",
          color: granted ? "#34c759" : "rgba(255,255,255,0.85)",
        }}
      >
        {granted ? <AppIcon icon={Check} size={22} color="#34c759" /> : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.2px", marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: granted ? "#34c759" : "rgba(255,255,255,0.12)",
          flexShrink: 0,
          transition: "background 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {granted && <AppIcon icon={Check} size={12} color="#fff" />}
      </div>
    </div>
  );
}

export function HowCard({
  num,
  icon,
  title,
  desc,
  delay,
}: {
  num: number;
  icon: ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <FadeSlide show delay={delay}>
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: "18px 0",
          borderBottom: num < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4, letterSpacing: "-0.2px" }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
    </FadeSlide>
  );
}

export function Noise() {
  return (
    <svg
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0.03,
        pointerEvents: "none",
        zIndex: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}
