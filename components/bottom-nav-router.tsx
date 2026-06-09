"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clapperboard, Users, Camera, Trophy, User } from "lucide-react";
import { ACCENT } from "@/lib/theme";

export type UiTab = "today" | "social" | "record" | "streaks" | "profile";

const TABS: { id: UiTab; icon: ReactNode; label: string; special?: boolean; href: string }[] = [
  { id: "today", icon: <Clapperboard size={18} />, label: "Today", href: "/today" },
  { id: "streaks", icon: <Trophy size={18} />, label: "Streaks", href: "/streaks" },
  { id: "record", icon: <Camera size={19} />, label: "Record", special: true, href: "/record" },
  { id: "social", icon: <Users size={18} />, label: "Social", href: "/social" },
  { id: "profile", icon: <User size={18} />, label: "Profile", href: "/profile" },
];

export function BottomNavRouter() {
  const pathname = usePathname();
  const activeTab = pathname.split("/").pop() || "today";

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
          <Link
            key={tab.id}
            href={tab.href}
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
          </Link>
        ) : (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
          >
            <motion.div
              animate={{ color: activeTab === tab.id ? ACCENT : "rgba(255,255,255,0.6)" }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6 flex items-center justify-center"
            >
              {tab.icon}
            </motion.div>
            <span
              className="text-[9px] font-bold tracking-tight transition-colors duration-200"
              style={{ color: activeTab === tab.id ? ACCENT : "rgba(255,255,255,0.5)" }}
            >
              {tab.label}
            </span>
          </Link>
        )
      )}
    </div>
  );
}