"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Clapperboard, Loader2 } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";
import { getOrCreateTodayAssignment } from "@/actions/vlog";
import { getStreaksData } from "@/actions/streaks";

import { AchievementOverlay, AchievementConfig } from "@/components/achievements/achievement-overlay";
import { ACHIEVEMENT_MOCKS } from "@/components/achievements/achievement-data";

export default function StreaksPage() {
  const [assignment, setAssignment] = useState<any>(null);
  const [streaks, setStreaks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeAchievement, setActiveAchievement] = useState<AchievementConfig | null>(null);

  const loadStreaks = async (targetGroupId?: any) => {
    let activeGroupId = typeof targetGroupId === "string" ? targetGroupId : null;
    if (!activeGroupId && typeof window !== "undefined") {
      activeGroupId = localStorage.getItem("active_group_id");
    }
    if (!activeGroupId) return;

    setLoading(true);
    const assignmentRes = await getOrCreateTodayAssignment(activeGroupId);
    const statsRes = await getStreaksData(activeGroupId);
    setLoading(false);

    if (assignmentRes.success && assignmentRes.assignment) {
      setAssignment(assignmentRes.assignment);
    }
    if (statsRes.success) {
      setStreaks(statsRes);
    }
  };

  useEffect(() => {
    loadStreaks();

    const handleGroupChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        loadStreaks(customEvent.detail);
      }
    };

    window.addEventListener("group-changed", handleGroupChange);
    return () => window.removeEventListener("group-changed", handleGroupChange);
  }, []);

  if (loading || !streaks) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-white/50">
        <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
        <span className="text-[12px] font-medium tracking-wide">Calculating active streaks...</span>
      </div>
    );
  }

  const { currentStreak, bestStreak, totalVlogs, friendsStreaks, calendarDays } = streaks;

  return (
    <>
      <motion.div
        key="streaks-tab"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex-1 h-full overflow-y-auto px-4 pt-6 pb-6 scrollbar-hide flex flex-col gap-4 relative z-0"
        style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
        ::-webkit-scrollbar { display: none; }
      `,
          }}
        />

        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight">Streaks</h2>
            <p className="text-white/60 text-[12px] mt-0.5">Keep the streak alive 🔥</p>
          </div>
          <div
            style={glassStyle(0.05, 10, 0.1)}
            className="px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <Flame size={12} className="text-[#e07c30] fill-[#e07c30]" />
            <span className="text-[#e07c30] text-[10px] font-bold">{currentStreak} day streak</span>
          </div>
        </div>

        <div
          style={glassStyle(0.04, 20, 0.08)}
          className="rounded-[24px] p-5 flex items-center justify-between"
        >
          <div className="flex flex-col items-center gap-2.5 flex-1">
            <div className="relative w-[76px] h-[76px]">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="38"
                  cy="38"
                  r="34"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle
                  cx="38"
                  cy="38"
                  r="34"
                  fill="none"
                  stroke="#e07c30"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="213.6"
                  strokeDashoffset="128"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <Flame size={16} className="text-white fill-[#e07c30] mb-0.5" />
                <span className="text-white text-2xl font-bold leading-none tracking-tighter">
                  {currentStreak}
                </span>
                <span className="text-white/50 text-[10px] font-medium mt-0.5">days</span>
              </div>
            </div>
            <span className="text-[#e07c30] text-[11px] font-bold">Current Streak</span>
          </div>

          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="flex flex-col items-center flex-1">
            <span className="text-white/60 text-[11px] font-medium mb-1.5">Best Streak</span>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-3xl font-bold leading-none tracking-tighter">
                {bestStreak}
              </span>
              <span className="text-white/60 text-[11px] font-medium">days</span>
            </div>
          </div>

          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="flex flex-col items-center flex-1">
            <span className="text-white/60 text-[11px] font-medium mb-1.5">Total Vlogs</span>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-3xl font-bold leading-none tracking-tighter">
                {totalVlogs}
              </span>
              <span className="text-white/60 text-[11px] font-medium">vlogs</span>
            </div>
            <Clapperboard size={14} className="text-white/30 mt-2.5" />
          </div>
        </div>

        <div
          style={glassStyle(0.04, 20, 0.08)}
          className="rounded-[20px] p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="text-2xl drop-shadow-md">🚀</span>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-white text-[12px] font-bold tracking-wide">You&apos;re on fire!</h3>
              <p className="text-white/50 text-[10px] leading-snug max-w-[170px]">
                Record today to keep your daily streak alive.
              </p>
            </div>
          </div>
        </div>

        <div style={glassStyle(0.04, 20, 0.08)} className="rounded-[24px] p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white text-[14px] font-bold tracking-wide">Explore Achievements</span>
          </div>
          
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {ACHIEVEMENT_MOCKS.map((mock) => (
              <button
                key={mock.id}
                onClick={() => setActiveAchievement(mock)}
                className="flex-shrink-0 py-2.5 px-3 rounded-[14px] bg-white/5 border border-white/10 text-white/80 text-[11px] font-semibold hover:bg-white/10 transition-colors text-center whitespace-nowrap"
              >
                {mock.id.replace(/-/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div
          style={glassStyle(0.04, 20, 0.08)}
          className="rounded-[24px] p-5 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-white text-[14px] font-bold tracking-wide">Activity Calendar</span>
          </div>

          <div className="grid grid-cols-7 gap-y-3.5 gap-x-1 text-center">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <span key={day} className="text-white/40 text-[9px] font-medium tracking-wider mb-2">
                {day
              }
              </span>
            ))}

            {calendarDays.map((item: any, i: number) => (
              <div key={i} className="flex justify-center relative">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
                ${
                  item.type === "vlogged"
                    ? "bg-gradient-to-br from-[#ff9a44] to-[#e07c30] text-white shadow-[0_2px_10px_rgba(224,124,48,0.3)]"
                    : item.type === "missed"
                      ? "border border-white/5 bg-white/[0.03] text-white/50"
                      : "text-white/20"
                }
              `}
                >
                  {item.d}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={glassStyle(0.04, 20, 0.08)}
          className="rounded-[24px] p-5 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-white text-[14px] font-bold tracking-wide">Friends Streaks</span>
          </div>

          <div className="flex justify-between items-end mt-2">
            {friendsStreaks.map((friend: any) => (
              <div key={friend.name} className="flex flex-col items-center gap-2 relative">
                <div
                  className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[9px] font-bold text-white z-10 shadow-lg"
                  style={
                    friend.isMe ? { background: "#e07c30", borderColor: "#ffb880" } : {}
                  }
                >
                  {friend.rank}
                </div>

                <div
                  className={`p-[2.5px] rounded-full ${friend.isMe ? "bg-gradient-to-br from-[#ff9a44] to-[#e07c30]" : "bg-white/10"}`}
                >
                  <Avatar src={friend.img} size={46} />
                </div>

                <div className="flex flex-col items-center text-center gap-0.5">
                  <span className="text-white text-[11px] font-bold tracking-tight">{friend.name}</span>
                  <span
                    className={`text-[10px] font-medium ${friend.isMe ? "text-[#e07c30]" : "text-white/60"}`}
                  >
                    {friend.streak} days
                  </span>
                  {friend.isMe ? (
                    <div className="mt-1 px-2.5 py-[2px] rounded-full bg-white/10 border border-white/5 text-[9px] text-white/70 font-medium">
                      You
                    </div>
                  ) : (
                    <Flame size={11} className="text-[#e07c30] fill-[#e07c30] mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeAchievement && (
          <AchievementOverlay
            config={activeAchievement}
            onClose={() => setActiveAchievement(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}