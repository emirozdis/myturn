"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Users, Camera, Trophy, User } from "lucide-react";
import { ACCENT } from "@/lib/theme";

export type UiTab = "today" | "social" | "record" | "streaks" | "profile";

const TABS: { id: UiTab; icon: ReactNode; label: string; special?: boolean }[] = [
  { id: "today", icon: <Clapperboard size={18} />, label: "Today" },
  { id: "streaks", icon: <Trophy size={18} />, label: "Archive" },
  { id: "record", icon: <Camera size={19} />, label: "Record", special: true },
  { id: "social", icon: <Users size={18} />, label: "Social" },
  { id: "profile", icon: <User size={18} />, label: "Profile" },
];

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: UiTab;
  onTabChange: (tab: UiTab) => void;
}) {
  return (
    <div
      className="h-[calc(74px+env(safe-area-inset-bottom,0px))] bg-black/95 backdrop-blur-3xl flex items-center justify-around px-2 flex-shrink-0 z-20 overflow-visible relative"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.05)",
      }}
    >
      {TABS.map((tab) =>
        tab.special ? (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 cursor-pointer relative -top-3.5 focus:outline-none"
          >
            <div
              className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-white border-2 border-white/15 shadow-xl transition-all duration-300"
              style={{
                background: activeTab === tab.id ? "#fff" : ACCENT,
                color: activeTab === tab.id ? "#000" : "#fff",
                transform: activeTab === tab.id ? "scale(1.08)" : "scale(1)",
              }}
            >
              {tab.icon}
            </div>
            <span className="text-white/50 text-[9px] font-bold tracking-tight">Record</span>
          </button>
        ) : (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 cursor-pointer py-1.5 px-2.5 focus:outline-none transition-colors duration-200"
            style={{
              color: activeTab === tab.id ? ACCENT : "rgba(255,255,255,0.4)",
            }}
          >
            <div className="relative">
              {tab.icon}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: ACCENT }}
                />
              )}
            </div>
            <span
              className="text-[9px] transition-all font-semibold"
              style={{
                color: activeTab === tab.id ? ACCENT : "rgba(255,255,255,0.40)",
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      )}
    </div>
  );
}