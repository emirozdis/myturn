/**
 * iOS-native dark theme tokens
 * Mirrors Apple's UIKit dark semantic colors
 */
export const appTheme = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  /** Primary bg: systemBackground in dark = #000000 */
  bg: "#000000",
  /** Secondary bg: secondarySystemBackground = #1C1C1E */
  bg2: "#1C1C1E",
  /** Tertiary bg: tertiarySystemBackground = #2C2C2E */
  bg3: "#2C2C2E",
  /** Grouped bg (table/list): #000000 in dark */
  bgGrouped: "#000000",
  /** Grouped secondary (inset card): #1C1C1E */
  bgGrouped2: "#1C1C1E",
  /** Nav bar / tab bar fill with vibrancy */
  navBar: "rgba(28,28,30,0.92)",

  // ── Cards / Fills ─────────────────────────────────────────────────────────
  card: "rgba(28,28,30,1)",
  cardBorder: "rgba(255,255,255,0.08)",
  /** iOS-style separator */
  separator: "rgba(255,255,255,0.12)",
  separatorOpaque: "#38383A",

  // ── Labels ────────────────────────────────────────────────────────────────
  text: "#FFFFFF",
  textSecondary: "rgba(235,235,245,0.6)",   // secondaryLabel
  textTertiary: "rgba(235,235,245,0.3)",    // tertiaryLabel
  textQuaternary: "rgba(235,235,245,0.18)", // quaternaryLabel
  textMuted: "rgba(235,235,245,0.6)",
  textDim: "rgba(235,235,245,0.3)",
  label: "rgba(235,235,245,0.3)",

  // ── System Colors ─────────────────────────────────────────────────────────
  accent: "#30D158",       // systemGreen
  accentMuted: "rgba(48,209,88,0.15)",
  blue: "#0A84FF",         // systemBlue
  blueMuted: "rgba(10,132,255,0.15)",
  red: "#FF453A",          // systemRed
  orange: "#FF9F0A",       // systemOrange
  warning: "rgba(255,159,10,0.85)",
  danger: "rgba(255,69,58,0.9)",
  dangerMuted: "rgba(255,69,58,0.15)",

  // ── Typography ────────────────────────────────────────────────────────────
  fontDisplay: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
  fontText: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
  fontRounded: "'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif",

  // ── Radii (iOS uses these exact values) ───────────────────────────────────
  radius: {
    sm: 10,   // small controls
    md: 13,   // list rows, small cards
    lg: 16,   // cards, modals
    xl: 20,   // large modals
    pill: 980,
  },

  // ── Easing ────────────────────────────────────────────────────────────────
  ease: {
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    standard: "cubic-bezier(0.4, 0, 0.6, 1)",
  },

  // ── Shadows ───────────────────────────────────────────────────────────────
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.4)",
    md: "0 4px 16px rgba(0,0,0,0.5)",
    lg: "0 8px 32px rgba(0,0,0,0.6)",
  },
} as const;