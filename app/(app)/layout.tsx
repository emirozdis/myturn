"use client";

import { useState, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NEUTRAL_PAGE_BG } from "../../lib/theme";
import { MOCK_GROUPS } from "../../components/shared/mock-data";
import { AppHeader } from "@/components/app-header";
import { GroupSwipePager } from "@/components/group-swipe-pager";
import { BottomNavRouter } from "@/components/bottom-nav-router";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTab = pathname.split("/").pop() || "today";

  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const handleGroupIndexChange = useCallback((index: number) => {
    setActiveGroupIndex(index);
  }, []);

  const showMainChrome = activeTab !== "streaks";
  const isTodayTab = activeTab === "today";
  const isProfileTab = activeTab === "profile";
  const isStreaksTab = activeTab === "streaks";
  const showGroupHeader = MOCK_GROUPS.length > 1 && (isStreaksTab || isTodayTab);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-0 sm:p-4 overflow-hidden select-none">
      <div
        className="relative w-full sm:w-[393px] h-[100dvh] sm:h-[812px] sm:rounded-[48px] sm:p-[8px] flex flex-col justify-between transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #4f4f52 0%, #161618 25%, #000000 100%)",
          boxShadow:
            "inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.8), 0 30px 60px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        <div className="relative w-full h-full sm:rounded-[40px] rounded-none overflow-hidden flex flex-col bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${NEUTRAL_PAGE_BG.light}, ${NEUTRAL_PAGE_BG.dark})`,
              }}
            />
          </div>

          <div className="relative z-10 flex-1 flex flex-col h-full justify-between overflow-hidden">
            {showGroupHeader && (
              <AppHeader
                groups={MOCK_GROUPS}
                activeIndex={activeGroupIndex}
                onSelectIndex={handleGroupIndexChange}
              />
            )}

            <GroupSwipePager
              groups={MOCK_GROUPS}
              activeIndex={activeGroupIndex}
              onIndexChange={handleGroupIndexChange}
              disabled={!isStreaksTab && !isTodayTab}
            >
              {() => (
                <div
                  className={`flex-1 min-h-0 flex flex-col ${
                    showMainChrome ? "px-4 py-4 justify-center" : ""
                  }`}
                >
                  {children}
                </div>
              )}
            </GroupSwipePager>

            <BottomNavRouter />
          </div>
        </div>
      </div>
    </div>
  );
}
