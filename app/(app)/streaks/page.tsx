"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getOrCreateTodayAssignment, getUnlockedAchievements } from "@/actions/vlog";
import { getStreaksData } from "@/actions/streaks";
import { AchievementOverlay, AchievementConfig } from "@/components/achievements/achievement-overlay";
import { CompilationReadyModal } from "@/components/compilation-ready-modal";
import { RefreshingBadge } from "@/components/shared/refreshing-badge";
import { StreaksSkeleton } from "@/components/streaks/streaks-skeleton";
import { StreaksHeader } from "@/components/streaks/streaks-header";
import { LeaderboardCarousel } from "@/components/streaks/leaderboard-carousel";
import { MemoryCalendar } from "@/components/streaks/memory-calendar";
import { getCachedStreaks } from "@/components/streaks/utils";

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
        streaks: statsRes.success ? statsRes : null,
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
    return <StreaksSkeleton />;
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
        className="flex-1 h-full overflow-y-auto px-4 scrollbar-hide flex flex-col gap-6 relative z-0"
        style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {refreshing && <RefreshingBadge className="absolute top-4 right-4 z-20" />}
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

        <StreaksHeader currentStreak={currentStreak} />
        <LeaderboardCarousel friendsStreaks={friendsStreaks} />
        <MemoryCalendar
          calendarDays={calendarDays}
          startOffset={startOffset}
          onDayClick={handleDayClick}
        />
      </motion.div>

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
