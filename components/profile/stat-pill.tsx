import { ACCENT } from "@/lib/theme";

export function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, padding: "14px 6px" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${ACCENT}44`, background: `${ACCENT}18`, display: "flex", alignItems: "center" as const, justifyContent: "center" as const }}>
        <Icon size={18} color={ACCENT} />
      </div>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 20, lineHeight: 1 }}>{value}</span>
      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
