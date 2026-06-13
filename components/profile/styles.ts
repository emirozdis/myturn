import { ACCENT } from "@/lib/theme";

export const profileStyles = {
  row: {
    display: "flex" as const, alignItems: "center" as const, gap: 14,
    padding: "14px 16px", background: "none", border: "none",
    cursor: "pointer", textAlign: "left" as const, width: "100%",
  },
  iconCircle: (accent = false) => ({
    width: 36, height: 36, borderRadius: "50%",
    background: accent ? `${ACCENT}22` : "rgba(255,255,255,0.07)",
    border: `1px solid ${accent ? ACCENT + "44" : "rgba(255,255,255,0.10)"}`,
    display: "flex", alignItems: "center" as const, justifyContent: "center" as const, flexShrink: 0,
  }),
  label: { color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 },
  sub: { color: "rgba(255,255,255,0.40)", fontSize: 11, margin: "1px 0 0" },
  card: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" as const },
  input: {
    width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, color: "#fff", fontSize: 14, padding: "11px 14px", outline: "none",
    boxSizing: "border-box" as const,
  },
  section: { padding: "0 16px", marginBottom: 16 },
};

export type ProfilePanel = "editProfile" | "accountDetails" | "privacy" | "notifications" | "logoutConfirm" | "advanced" | null;
export type ActivityTab = "vlogs" | "rank";