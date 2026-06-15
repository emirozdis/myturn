"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Layers, Search, Settings, Camera } from "lucide-react";

export type UiTab = "today" | "social" | "record" | "streaks" | "profile";

// Arranged as a single continuous row to match the reference image
const TABS = [
  { id: "today", icon: Home, label: "Home", href: "/today" },
  { id: "streaks", icon: Layers, label: "Feed", href: "/streaks" },
  { id: "record", icon: Camera, href: "/record" },
  { id: "social", icon: Search, label: "Search", href: "/social" },
  { id: "profile", icon: Settings, label: "Settings", href: "/profile" },
];

export function BottomNavRouter({
  optimisticTab,
  onNavigate,
}: {
  optimisticTab?: string | null;
  onNavigate?: (id: string, href: string) => void;
}) {
  const pathname = usePathname();
  const currentPathTab = pathname.split("/").pop() || "today";
  const activeTab = optimisticTab || currentPathTab;

  return (
    <div className="w-full px-4 pb-6 pt-4 flex justify-center relative z-50 pointer-events-none">
      {/* Faded Blur Background masking the scrollable content below - Optimized with compositing layers */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 100%)",
          willChange: "backdrop-filter, transform",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      <div
        className="w-full max-w-[340px] h-[64px] bg-white/[0.06] backdrop-blur-2xl rounded-full flex items-center justify-between px-2 relative pointer-events-auto"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: `
            inset 0 1px 1px rgba(255,255,255,0.3), 
            inset 0 -1px 1px rgba(255,255,255,0.1), 
            0 10px 40px rgba(0,0,0,0.3)
          `,
          willChange: "backdrop-filter, transform",
          transform: "translate3d(0, 0, 0)",
        }}
      >
        {/* Subtle inner top glow for the liquid glass depth effect */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <a
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.(tab.id, tab.href);
              }}
              className="relative flex-1 flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all duration-300 focus:outline-none active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabLiquidHighlight"
                  layout="position"
                  style={{ willChange: "transform" }}
                  className="absolute inset-0 bg-white/[0.12] border border-white/[0.08] rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 19, // Fluid settling bounce resembling liquid
                    mass: 0.6,   // Natural shifting drag/momentum
                  }}
                />
              )}
              
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`relative z-10 transition-colors duration-300 ${isActive ? "text-white" : "text-white/50"}`}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}