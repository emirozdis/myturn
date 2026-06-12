"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { getVibeBadgeStyle } from "@/lib/vibe";

export function RankContent({ user, calendarDays }: { user: any; vlogsCount: number; calendarDays: any[] }) {
  const xp = user.xp || 0;
  let nextRankGoal = 100;
  let prevRankGoal = 0;
  if (xp > 100 && xp <= 400) {
    prevRankGoal = 100;
    nextRankGoal = 400;
  } else if (xp > 400 && xp <= 1000) {
    prevRankGoal = 400;
    nextRankGoal = 1000;
  } else if (xp > 1000 && xp <= 2500) {
    prevRankGoal = 1000;
    nextRankGoal = 2500;
  } else if (xp > 2500) {
    prevRankGoal = 2500;
    nextRankGoal = 5000;
  }

  const range = nextRankGoal - prevRankGoal;
  const currentProgress = xp - prevRankGoal;
  const progressPercent = Math.min(100, Math.max(0, (currentProgress / range) * 100));
  const vibeStyle = getVibeBadgeStyle(user.archetype);

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "16px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: vibeStyle.background, border: vibeStyle.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={22} color={vibeStyle.color} />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Current Level</p>
              <p style={{ color: vibeStyle.color, fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1 }}>{user.archetype}</p>
            </div>
          </div>
          <div style={{ textAlign: "right", marginLeft: "auto" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Dynamic XP</p>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1 }}>{user.xp}</p>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }}>Progress to next tier</span>
            <span style={{ color: vibeStyle.color, fontSize: 11, fontWeight: 700 }}>{user.xp} / {nextRankGoal} XP</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ height: "100%", background: `linear-gradient(90deg, ${vibeStyle.color}, #ff9a44)`, borderRadius: 4 }}
            />
          </div>
        </div>
      </div>

      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Vlogging History</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px 4px", textAlign: "center" as const }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>{d}</span>
          ))}
          {calendarDays.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center" as const, justifyContent: "center" as const,
                fontSize: 11, fontWeight: 700,
                background: item.type === "vlogged" ? ACCENT : "transparent",
                border: item.type === "missed" ? "1px solid rgba(255,255,255,0.12)" : "none",
                color: item.type === "vlogged" ? "#000" : "rgba(255,255,255,0.60)",
              }}>
                {item.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
