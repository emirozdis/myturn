"use client";

import { motion } from "framer-motion";
import { Activity, Sparkles, ChevronRight } from "lucide-react";
import { ACCENT } from "../theme";
import { glassStyle } from "../shared/glass-style";

const MILESTONES = [
  { hour: "9:00 AM", task: "Sunrise Vlog - Izmir Coast", status: "captured" as const },
  { hour: "12:00 PM", task: "Lunch Review - Cafe Marina", status: "captured" as const },
  { hour: "3:00 PM", task: "Afternoon Walk & Sunset Hunt", status: "active" as const },
  { hour: "6:00 PM", task: "Evening Workspace Setup", status: "pending" as const },
  { hour: "9:00 PM", task: "Weekly Wrap-up Q&A", status: "pending" as const },
];

export function TimelinePage() {
  return (
    <motion.div
      key="timeline-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col justify-between min-h-0"
    >
      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="flex-1 rounded-2xl p-3 flex flex-col justify-between min-h-0"
      >
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Activity size={15} className="text-[#e07c30]" />
            <span>Today&apos;s Milestones</span>
          </h3>
          <p className="text-white/40 text-[10px] mt-0.5 mb-2">Track of hourly content captures</p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col justify-around py-1">
          {MILESTONES.map((item, idx) => {
            const isCaptured = item.status === "captured";
            const isActive = item.status === "active";
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center border"
                    style={{
                      background: isCaptured
                        ? "rgba(224,124,48,0.15)"
                        : isActive
                          ? "rgba(14,165,233,0.15)"
                          : "transparent",
                      borderColor: isCaptured
                        ? ACCENT
                        : isActive
                          ? "#0ea5e9"
                          : "rgba(255,255,255,0.15)",
                    }}
                  >
                    {isCaptured ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#e07c30]" />
                    ) : isActive ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </span>
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    )}
                  </div>
                  <div className="leading-tight">
                    <p className="text-white text-[11px] font-semibold">{item.hour}</p>
                    <p className="text-white/50 text-[9px]">{item.task}</p>
                  </div>
                </div>
                <span
                  className="text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    color: isCaptured ? "#e8a55a" : isActive ? "#0ea5e9" : "rgba(255,255,255,0.3)",
                    borderColor: isCaptured
                      ? "rgba(224,124,48,0.2)"
                      : isActive
                        ? "rgba(14,165,233,0.2)"
                        : "rgba(255,255,255,0.08)",
                    background: isCaptured
                      ? "rgba(224,124,48,0.05)"
                      : isActive
                        ? "rgba(14,165,233,0.05)"
                        : "rgba(255,255,255,0.02)",
                  }}
                >
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-[#e07c30]/10 border border-[#e07c30]/15 rounded-xl p-2.5 flex items-center justify-between flex-shrink-0 mt-1">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-[#e07c30]" />
            <span className="text-white text-[10px] font-medium">
              Capture next hour milestone to continue streak!
            </span>
          </div>
          <ChevronRight size={14} className="text-[#e07c30]" />
        </div>
      </div>
    </motion.div>
  );
}
