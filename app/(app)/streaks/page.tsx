"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";
import { getOrCreateTodayAssignment, getUnlockedAchievements } from "@/actions/vlog";
import { getStreaksData } from "@/actions/streaks";
import { getVibeBadgeStyle } from "@/lib/vibe";

import { AchievementOverlay, AchievementConfig } from "@/components/achievements/achievement-overlay";
import { CompilationReadyModal } from "@/components/compilation-ready-modal";

const getCachedStreaks = () => {
  if (typeof window !== "undefined") {
    try {
      const groupId = localStorage.getItem("active_group_id");
      if (!groupId) return null;
      const cached = localStorage.getItem(`cached_streaks_${groupId}`);
      if (cached) return JSON.parse(cached);
    } catch { }
  }
  return null;
};

export default function StreaksPage() {
  const cachedData = getCachedStreaks();
  const [, setAssignment] = useState<any>(cachedData?.assignment || null);
  const [streaks, setStreaks] = useState<any>(cachedData?.streaks || null);

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeAchievement, setActiveAchievement] = useState<AchievementConfig | null>(null);
  const [, setUnlockedIds] = useState<string[]>([]);

  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [startOffset, setStartOffset] = useState(0);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    setStartOffset(offset);
  }, []);

  const loadStreaks = async (targetGroupId?: any) => {
    let activeGroupId = typeof targetGroupId === "string" ? targetGroupId : null;
    if (!activeGroupId && typeof window !== "undefined") {
      activeGroupId = localStorage.getItem("active_group_id");
    }
    if (!activeGroupId) return;

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setRefreshing(true);
    const assignmentRes = await getOrCreateTodayAssignment(activeGroupId);
    const statsRes = await getStreaksData(activeGroupId);
    const achievementsRes = await getUnlockedAchievements();
    setRefreshing(false);
    setInitialLoad(false);

    if (assignmentRes.success && assignmentRes.assignment) {
      setAssignment(assignmentRes.assignment);
    }
    if (statsRes.success) {
      setStreaks(statsRes);
    }
    if (achievementsRes.success && achievementsRes.unlocked) {
      setUnlockedIds(achievementsRes.unlocked.map((u: any) => u.achievementId));
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(`cached_streaks_${activeGroupId}`, JSON.stringify({
        assignment: assignmentRes.success ? assignmentRes.assignment : null,
        streaks: statsRes.success ? statsRes : null
      }));
    }

    isFetchingRef.current = false;
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

  const handleDayClick = (day: any) => {
    if (day.type === "vlogged") {
      setSelectedDay(day);
    }
  };

  if (initialLoad && !streaks) {
    return (
      <div className="flex-1 flex flex-col gap-3 px-4 pt-6 animate-pulse">
        <div className="h-8 w-32 rounded-xl bg-white/[0.05]" />
        <div className="h-[120px] rounded-[24px] bg-white/[0.04]" />
        <div className="h-[80px] rounded-[24px] bg-white/[0.03]" />
        <div className="flex-1 rounded-[24px] bg-white/[0.03]" />
      </div>
    );
  }

  const { currentStreak, friendsStreaks, calendarDays } = streaks;

  return (
    <>
      <motion.div
        key="streaks-tab"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex-1 h-full overflow-y-auto px-4 pt-6 pb-6 scrollbar-hide flex flex-col gap-6 relative z-0"
        style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {refreshing && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e07c30] animate-pulse" />
            <span className="text-white/50 text-[9px] font-semibold tracking-wide">updating</span>
          </div>
        )}
        <style
          dangerouslySetInnerHTML={{
            __html: `::-webkit-scrollbar { display: none; }`,
          }}
        />

        {/* Top Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight">Archives & Streaks</h2>
            <p className="text-white/60 text-[12px] mt-0.5">Relive the memories 🔥</p>
          </div>
          <div
            style={glassStyle(0.05, 10, 0.1)}
            className="px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <Flame size={12} className="text-[#e07c30] fill-[#e07c30]" />
            <span className="text-[#e07c30] text-[10px] font-bold">{currentStreak} day streak</span>
          </div>
        </div>

        {/* Leaderboard Horizontal Carousel */}
        <div className="flex flex-col gap-3">
          <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest pl-1">Leaderboard</span>
          <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
            {friendsStreaks.map((friend: any) => (
              <div key={friend.name} className="flex flex-col items-center gap-2 relative flex-shrink-0 w-[64px]">
                <div
                  className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[9px] font-bold text-white z-10 shadow-lg"
                  style={
                    friend.isMe ? { background: "#e07c30", borderColor: "#ffb880", color: "#000" } : {}
                  }
                >
                  {friend.rank}
                </div>

                <div
                  className={`p-[2.5px] rounded-full ${friend.isMe ? "bg-gradient-to-br from-[#ff9a44] to-[#e07c30]" : "bg-white/10"}`}
                >
                  <Avatar src={friend.img} size={46} />
                </div>

                <div className="flex flex-col items-center text-center gap-0.5 w-full">
                  <span className="text-white text-[11px] font-bold tracking-tight truncate w-full">{friend.name}</span>
                  
                  <span 
                    style={{
                      ...getVibeBadgeStyle(friend.archetype),
                      fontSize: "8px",
                      fontWeight: 800,
                      padding: "1.5px 6px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginTop: "2.5px",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%"
                    }}
                  >
                    {friend.archetype}
                  </span>

                  <span
                    className={`text-[10px] font-bold mt-1 ${friend.isMe ? "text-[#e07c30]" : "text-white/60"}`}
                  >
                    {friend.streak} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Memory Calendar */}
        <div
          style={glassStyle(0.04, 20, 0.08)}
          className="rounded-[24px] p-5 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-white text-[14px] font-bold tracking-wide">Memory Calendar</span>
            <span className="text-white/40 text-[10px]">Tap a highlighted day</span>
          </div>

          <div className="grid grid-cols-7 gap-y-3.5 gap-x-1 text-center">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <span key={day} className="text-white/40 text-[9px] font-medium tracking-wider mb-2">
                {day}
              </span>
            ))}
            
            {Array.from({ length: startOffset }).map((_, i) => (
               <div key={`empty-${i}`} />
            ))}

            {calendarDays.map((item: any, i: number) => {
              const isVlogged = item.type === "vlogged";

              return (
                <div key={i} className="flex justify-center relative">
                  <button
                    onClick={() => handleDayClick(item)}
                    disabled={!isVlogged}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold transition-all overflow-hidden
                    ${isVlogged
                        ? "ring-1 ring-[#e07c30]/50 hover:scale-105"
                        : item.type === "missed"
                          ? "border border-white/5 bg-white/[0.03] text-white/50 cursor-not-allowed"
                          : "text-white/20 cursor-not-allowed"
                      }
                    `}
                  >
                    {isVlogged && item.assignment?.user ? (
                      <>
                        <div className="absolute inset-0 z-0 flex items-center justify-center">
                          <Avatar src={item.assignment.user.image} name={item.assignment.user.name} size={36} />
                        </div>
                        <div className="absolute inset-0 bg-black/40 z-10 hover:bg-black/20 transition-colors" />
                        <span className="relative z-20 text-white font-extrabold text-[11px] sm:text-[12px] drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.9)]">
                          {item.d}
                        </span>
                      </>
                    ) : (
                      <span>{item.d}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Manual Trigger Compilation Ready Modal */}
      <AnimatePresence>
        {selectedDay && selectedDay.type === "vlogged" && (
           <CompilationReadyModal 
             assignment={selectedDay.assignment}
             onClose={() => setSelectedDay(null)}
             isArchive={true}
           />
        )}
      </AnimatePresence>

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