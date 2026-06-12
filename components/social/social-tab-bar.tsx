"use client";

import { motion } from "framer-motion";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { SOCIAL_TABS } from "./constants";

type SocialTabBarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function SocialTabBar({ activeTab, onTabChange }: SocialTabBarProps) {
  const activeIndex = SOCIAL_TABS.indexOf(activeTab as typeof SOCIAL_TABS[number]);

  return (
    <div
      className="flex items-center justify-between p-1.5 rounded-full mb-8 relative z-10 shadow-lg"
      style={glassStyle(0.02, 20, 0.05)}
    >
      <motion.div
        className="absolute top-1.5 bottom-1.5 rounded-full z-0 pointer-events-none"
        animate={{
          left: `calc(${activeIndex} * (100% / ${SOCIAL_TABS.length}) + 6px)`,
          width: `calc(100% / ${SOCIAL_TABS.length} - 12px)`,
        }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        style={{
          background: ACCENT,
          boxShadow: "0 2px 8px rgba(224,124,48,0.3), inset 0 1px 1px rgba(255,255,255,0.4)",
        }}
      />
      {SOCIAL_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className="flex-1 relative text-center py-2 text-[12px] font-bold rounded-full transition-colors duration-300 z-10 focus:outline-none"
          style={{
            color: activeTab === tab ? "#111" : "rgba(255,255,255,0.5)",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
