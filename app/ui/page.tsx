"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { NEUTRAL_PAGE_BG } from "./theme";
import { MOCK_GROUPS } from "./shared/mock-data";
import { AppHeader } from "./components/app-header";
import { GroupSwipePager } from "./components/group-swipe-pager";
import { TimelineTracker } from "./components/timeline-tracker";
import { BottomNav, type UiTab } from "./components/bottom-nav";
import { TodayPage } from "./pages/today-page";
import { SocialPage } from "./pages/social-page";
import { RecordPage } from "./pages/record-page";
import { StreaksPage } from "./pages/streaks-page";
import { ProfilePage } from "./pages/profile-page";

export default function VlogDayApp() {
  const [activeTab, setActiveTab] = useState<UiTab>("streaks");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [currentHourIndex, setCurrentHourIndex] = useState(2);

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraFilter, setCameraFilter] = useState("Raw");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraZoom, setCameraZoom] = useState("1x");
  const [flashActive, setFlashActive] = useState(false);

  const videoSrc = "/image1.jpg";

  useEffect(() => {
    if (isPlaying) {
      videoIntervalRef.current = setInterval(() => {
        setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 300);
    } else if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
    }
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isPlaying]);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const showMainChrome = activeTab !== "streaks";
  const isTodayTab = activeTab === "today";
  const isProfileTab = activeTab === "profile";
  const isStreaksTab = activeTab === "streaks";
  const showTopTimeline = showMainChrome && !isTodayTab && !isProfileTab && activeTab !== "social";
  const showGroupHeader = MOCK_GROUPS.length > 1 && (isStreaksTab || isTodayTab);

  const handleGroupIndexChange = useCallback((index: number) => {
    setActiveGroupIndex(index);
  }, []);

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
              {(group) => (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {showTopTimeline && (
                    <TimelineTracker
                      currentHourIndex={currentHourIndex}
                      onHourChange={setCurrentHourIndex}
                    />
                  )}

                  <div
                    className={`flex-1 min-h-0 flex flex-col ${showMainChrome ? "px-4 py-4 justify-center" : ""}`}
                  >
                    <AnimatePresence mode="wait">
                      {activeTab === "today" && (
                        <TodayPage
                          videoSrc={videoSrc}
                          isPlaying={isPlaying}
                          onTogglePlay={() => setIsPlaying((p) => !p)}
                          videoProgress={videoProgress}
                          liked={liked}
                          likeCount={likeCount}
                          onLike={handleLike}
                          currentHourIndex={currentHourIndex}
                          onHourChange={setCurrentHourIndex}
                        />
                      )}
                      {activeTab === "social" && <SocialPage />}
                      {activeTab === "record" && (
                        <RecordPage
                          cameraFilter={cameraFilter}
                          onCameraFilterChange={setCameraFilter}
                          isRecording={isRecording}
                          onToggleRecording={() => setIsRecording((r) => !r)}
                          cameraZoom={cameraZoom}
                          onCameraZoomChange={setCameraZoom}
                          flashActive={flashActive}
                          onToggleFlash={() => setFlashActive((f) => !f)}
                        />
                      )}
                      {activeTab === "streaks" && <StreaksPage group={group} />}
                      {activeTab === "profile" && <ProfilePage />}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </GroupSwipePager>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
}