// ./components/shared/photo-responses-overlay.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/shared/avatar";
import { X, Images, ChevronUp, ChevronDown } from "lucide-react";

const NUDGE_KEYFRAMES = `
@keyframes hud-invite {
  0%,
  60%,
  100% {
    transform: translateX(0) scale(1);
  }

  10% {
    transform: translateX(6px) scale(1.06);
  }

  20% {
    transform: translateX(3px) scale(1.03);
  }

  35% {
    transform: translateX(8px) scale(1.08);
  }

  50% {
    transform: translateX(0) scale(1);
  }
}

.hud-knock-anim {
  animation: hud-invite 5s infinite;
}
`;

export function PhotoResponsesOverlay({
  responses = [],
  videoProgress = 0,
}: {
  responses?: any[];
  videoProgress?: number;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Detached manual index state for vertical swapping
  const [manualIndex, setManualIndex] = useState(0);

  const [lastFirstId, setLastFirstId] = useState<string | null>(null);
  const [nudgeSeq, setNudgeSeq] = useState(0);
  const hasInitialNudged = useRef(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const responsesCount = responses?.length || 0;
  const currentFirstId = responses?.[0]?.id;

  // Reset index if the clip boundary changes entirely
  useEffect(() => {
    setManualIndex(0);
  }, [currentFirstId]);

  useEffect(() => {
    if (!hasLoadedPrefs) return;
    if (!isCollapsed) return;
    if (hasInitialNudged.current) return;

    hasInitialNudged.current = true;

    const timer = setTimeout(() => {
      setNudgeSeq((v) => v + 1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isCollapsed, hasLoadedPrefs]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsCollapsed(localStorage.getItem("photo_responses_collapsed") === "true");
      setHasLoadedPrefs(true);
    }
  }, []);

  const toggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("photo_responses_collapsed", String(collapsed));
    }
  };

  useEffect(() => {
    if (expandedIndex !== null && expandedIndex >= responsesCount) {
      setExpandedIndex(null);
    }
  }, [responsesCount, expandedIndex]);

  useEffect(() => {
    if (!hasLoadedPrefs) return;

    if (currentFirstId && currentFirstId !== lastFirstId) {
      setLastFirstId(currentFirstId);

      if (isCollapsed) {
        if (nudgeTimer.current) {
          clearTimeout(nudgeTimer.current);
        }

        nudgeTimer.current = setTimeout(() => {
          setNudgeSeq((v) => v + 1);
        }, 3000);
      }
    }

    return () => {
      if (nudgeTimer.current) {
        clearTimeout(nudgeTimer.current);
      }
    };
  }, [currentFirstId, lastFirstId, isCollapsed, hasLoadedPrefs]);

  if (!responses || responses.length === 0) return null;

  // Clamped manual index ensuring safety during optimistic array modifications
  const activeIndex = Math.max(0, Math.min(manualIndex, responses.length - 1));
  const activeResponse = responses[activeIndex];

  return (
    <>
      <style>{NUDGE_KEYFRAMES}</style>

      {/* Draggable HUD Container (X Axis for Collapse/Expand) */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-0 flex items-center z-40 pointer-events-auto touch-pan-y"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: isCollapsed ? -88 : 12, opacity: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        drag="x"
        dragConstraints={{ left: isCollapsed ? -88 : 12, right: 12 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (!isCollapsed && info.offset.x < -30) toggleCollapse(true);
          if (isCollapsed && info.offset.x > 30) toggleCollapse(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 relative">
          {/* Multi-response Indicator Dots */}
          {responses.length > 1 && (
            <div className="flex flex-col gap-1.5 justify-center">
              {responses.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-300 shadow-md ${
                    idx === activeIndex ? "h-4 bg-[#e07c30]" : "h-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Stack Container with Y Axis Vertical Swapping */}
          <div className="relative w-[64px] h-[88px]">
            <AnimatePresence mode="wait">
              {activeResponse && (
                <motion.div
                  key={activeResponse.id}
                  initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                  drag={!isCollapsed ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.3}
                  onDragEnd={(e, info) => {
                    e.stopPropagation();
                    const threshold = 20;
                    if (info.offset.y < -threshold && activeIndex < responses.length - 1) {
                      setManualIndex((prev) => prev + 1);
                    } else if (info.offset.y > threshold && activeIndex > 0) {
                      setManualIndex((prev) => prev - 1);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCollapsed) setExpandedIndex(activeIndex);
                  }}
                  className="absolute inset-0 rounded-[14px] border border-white/20 shadow-xl bg-black/40 cursor-grab active:cursor-grabbing group z-10"
                >
                  <div className="absolute inset-0 rounded-[14px] overflow-hidden" style={{ transform: "scaleX(-1)" }}>
                    <img
                      src={activeResponse.imageUrl}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                      alt="Response"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 drop-shadow-md rounded-full shadow-lg">
                    <Avatar src={activeResponse.user?.image} name={activeResponse.user?.name} size={24} ring />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hidden State Pull Tab */}
          <motion.div
            animate={{ opacity: isCollapsed ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-[100%] top-1/2 -translate-y-1/2 ml-2 w-16 overflow-visible"
            style={{ pointerEvents: isCollapsed ? "auto" : "none" }}
          >
            <div
              key={nudgeSeq}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(false);
              }}
              className={`w-8 bg-black/50 backdrop-blur-xl border border-white/20 border-l-0 rounded-r-xl flex flex-col items-center justify-center cursor-pointer shadow-[4px_0_16px_rgba(0,0,0,0.4)] py-2 gap-1.5 ${
                isCollapsed && nudgeSeq > 0 ? "hud-knock-anim" : ""
              }`}
            >
              {responses.length > 1 && <ChevronUp size={10} className="text-white/40" />}
              <Images size={14} className="text-white/80 my-0.5" />
              {responses.length > 1 && <ChevronDown size={10} className="text-white/40" />}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Fullscreen 3D Carousel Expansion Layer */}
      <AnimatePresence>
        {expandedIndex !== null && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center overflow-hidden pointer-events-auto touch-none"
          >
            <div
              className="absolute inset-0 z-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedIndex(null);
              }}
            />

            <div className="absolute top-0 inset-x-0 p-4 z-50 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
              <span className="text-white text-sm font-bold tracking-tight drop-shadow-md px-2">
                Responses ({expandedIndex + 1}/{responses.length})
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedIndex(null);
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors pointer-events-auto border border-white/10"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none perspective-[1000px]">
              {responses.map((res, i) => {
                const offset = i - expandedIndex;
                const absOffset = Math.abs(offset);
                const isCenter = offset === 0;
                const xPos = offset * 84;
                const scale = 1 - absOffset * 0.15;
                const opacity = isCenter ? 1 : absOffset > 1 ? 0 : 0.55;
                const blur = absOffset * 8;
                const zIndex = 50 - absOffset;

                return (
                  <motion.div
                    key={res.id}
                    initial={false}
                    animate={{ x: `${xPos}%`, scale, opacity, filter: `blur(${blur}px)`, zIndex }}
                    transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
                    className="absolute w-[80%] max-w-[340px] aspect-[3/4] sm:aspect-[9/16] flex flex-col items-center justify-center pointer-events-auto"
                    drag={isCenter ? true : false}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.8}
                    onDragEnd={(_, info) => {
                      if (!isCenter) return;
                      const t = 50;
                      if (info.offset.x < -t && expandedIndex < responses.length - 1)
                        setExpandedIndex(expandedIndex + 1);
                      else if (info.offset.x > t && expandedIndex > 0)
                        setExpandedIndex(expandedIndex - 1);
                      else if (Math.abs(info.offset.y) > t * 2) setExpandedIndex(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (offset < 0 && expandedIndex > 0) setExpandedIndex(expandedIndex - 1);
                      if (offset > 0 && expandedIndex < responses.length - 1)
                        setExpandedIndex(expandedIndex + 1);
                    }}
                  >
                    <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-neutral-900 cursor-grab active:cursor-grabbing">
                      <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
                        <img
                          src={res.imageUrl}
                          className="w-full h-full object-cover pointer-events-none"
                          alt="Response"
                        />
                      </div>
                      <AnimatePresence>
                        {isCenter && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-5 left-5 right-5 flex items-center gap-3 bg-black/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-xl pointer-events-none"
                          >
                            <Avatar src={res.user?.image} name={res.user?.name} size={40} />
                            <div className="flex flex-col text-left min-w-0">
                              <span className="text-white text-[15px] font-bold truncate leading-tight">
                                {res.user?.name}
                              </span>
                              <span className="text-white/60 text-[11px] font-medium mt-0.5">
                                Photo Response
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}