"use client";

import { motion } from "framer-motion";
import { Clapperboard, Users, Bell, UserCircle, ChevronRight, LogOut, Sliders } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { StatPill } from "./stat-pill";
import { VlogsGrid } from "./vlogs-grid";
import { RankContent } from "./rank-content";
import { profileStyles as s, ActivityTab, ProfilePanel } from "./styles";

type ProfileContentProps = {
  user: any;
  totalVlogs: number;
  friendsCount: number;
  groupsCount: number;
  clips: any[];
  calendarDays: any[];
  activityTab: ActivityTab;
  onActivityTabChange: (tab: ActivityTab) => void;
  onPanelOpen: (panel: ProfilePanel) => void;
  onPlayClip: (clip: any) => void;
};

export function ProfileContent({
  user,
  totalVlogs,
  friendsCount,
  groupsCount,
  clips,
  calendarDays,
  activityTab,
  onActivityTabChange,
  onPanelOpen,
  onPlayClip,
}: ProfileContentProps) {
  const activityTabs = [
    { key: "vlogs" as const, label: "Vlogs" },
    { key: "rank" as const, label: "Rank" },
  ];

  const settingsRows = [
    { icon: UserCircle, label: "Edit Profile", sub: "Update your information", panel: "editProfile" as const },
    { icon: Bell, label: "Push Notifications", sub: "Configure daily alerts", panel: "notifications" as const },
    { icon: Sliders, label: "Advanced Settings", sub: "ABR controls & storage resets", panel: "advanced" as const },
  ];

  return (
    <>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, display: "flex", alignItems: "stretch" }}>
          {[
            { icon: Clapperboard, value: totalVlogs, label: "Total Vlogs" },
            { icon: Users, value: friendsCount, label: "Friends" },
            { icon: Users, value: groupsCount, label: "Groups" },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ flex: 1, display: "flex", flexDirection: "row" as const, alignItems: "stretch" }}>
              <StatPill icon={stat.icon} value={stat.value} label={stat.label} />
              {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "14px 0" }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden" }}>
          {settingsRows.map((row, i) => {
            const Icon = row.icon;
            return (
              <button key={row.label} type="button" onClick={() => onPanelOpen(row.panel)}
                style={{ ...s.row, borderBottom: i < settingsRows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" } as any}>
                <div style={s.iconCircle() as any}>
                  <Icon size={16} color="rgba(255,255,255,0.70)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.label as any}>{row.label}</p>
                  <p style={s.sub as any}>{row.sub}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <ChevronRight size={15} color="rgba(255,255,255,0.30)" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Activity</span>
        </div>
        <div style={{ display: "flex", ...glassStyle(0.04, 20, 0.08), borderRadius: 12, padding: 3, gap: 2, marginBottom: 14 }}>
          {activityTabs.map(t => (
            <button key={t.key} type="button" onClick={() => onActivityTabChange(t.key)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.18s", background: activityTab === t.key ? ACCENT : "transparent", color: activityTab === t.key ? "#000" : "rgba(255,255,255,0.55)" }}>
              {t.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activityTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            {activityTab === "vlogs" && <VlogsGrid clips={clips} onPlayClip={onPlayClip} />}
            {activityTab === "rank" && <RankContent user={user} vlogsCount={totalVlogs} calendarDays={calendarDays} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ padding: "16px 16px 16px" }}>
        <button type="button" onClick={() => onPanelOpen("logoutConfirm")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", ...glassStyle(0.04, 20, 0.08), borderRadius: 16, cursor: "pointer", textAlign: "left" as const } as any}>
          <LogOut size={18} color={ACCENT} />
          <div style={{ flex: 1 }}>
            <p style={{ color: ACCENT, fontWeight: 700, fontSize: 14, margin: 0 }}>Log Out</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "1px 0 0" }}>See you again!</p>
          </div>
          <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
        </button>
      </div>
    </>
  );
}