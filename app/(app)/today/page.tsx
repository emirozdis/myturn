"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Heart,
  Smile,
  Plus,
  User,
  Zap,
  Sparkles,
  Clock,
} from "lucide-react";
import { glassStyle } from "../../../components/shared/glass-style";
import { CountdownTimer } from "../../../components/shared/countdown-timer";
import { Avatar } from "../../../components/shared/avatar";
import { ACCENT } from "../../../lib/theme";
import { TimelineTracker } from "@/components/timeline-tracker";

export default function TodayPage() {
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [currentHourIndex, setCurrentHourIndex] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleLike = useCallback(() => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  }, [liked]);

  return (
    <motion.div
      key="today-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col justify-between min-h-0 gap-3"
    >
      <div
        onClick={() => setIsVideoExpanded((prev) => !prev)}
        className="relative flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col cursor-pointer"
        style={{
          flex: isVideoExpanded ? 1.35 : 1,
          transition: "flex 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.6)",
            borderLeft: "1px solid rgba(255,255,255,0.3)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.6), 0 20px 40px -10px rgba(0,0,0,0.8)",
          }}
          className="absolute inset-0 rounded-3xl pointer-events-none"
        />
        <img
          src={videoSrc}
          alt="Current Vlog Thumbnail"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-1 pr-4 py-1 rounded-full z-10">
          <div className="relative">
            <div
              className="p-[1.5px] rounded-full"
              style={{ background: ACCENT }}
            >
              <Avatar src="/profile.jpg" size={28} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-black rounded-full" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-semibold text-[10px] tracking-tight">
              @emirozdis
            </span>
            <span className="text-white/45 text-[9px]">22m ago</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[9px] z-10">
          <MapPin size={9} className="text-[#e07c30]" />
          <span>Phuket, Thailand</span>
        </div>

        <div className="mt-auto relative z-10 flex flex-col w-full">
          <div className="py-2 px-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[7px]"
                    style={{ background: `hsl(${i * 65 + 120}, 45%, 35%)` }}
                  >
                    <User size={8} className="text-white/90" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleLike} className="flex items-center gap-1 cursor-pointer">
                <Heart
                  size={16}
                  className="transition-transform duration-200"
                  style={{
                    fill: liked ? "#ff6b6b" : "none",
                    color: liked ? "#ff6b6b" : "rgba(255,255,255,0.9)",
                    transform: liked ? "scale(1.2)" : "scale(1)",
                  }}
                />
                <span
                  className="text-xs font-semibold drop-shadow-md"
                  style={{ color: liked ? "#ff6b6b" : "rgba(255,255,255,0.9)" }}
                >
                  {likeCount}
                </span>
              </button>
              <span className="w-[1px] h-3.5 bg-white/20" />
              <button className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <Smile size={16} className="text-white/90" />
              </button>
              <button className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <Plus size={16} className="text-white/90" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex-shrink-0 rounded-[24px] flex flex-col gap-3.5 shadow-lg transition-all duration-500 ${
          isVideoExpanded
            ? "max-h-0 opacity-0 overflow-hidden pointer-events-none p-0"
            : "max-h-[320px] opacity-100"
        }`}
      >
        <div className="grid grid-cols-2 gap-3">
          <div style={glassStyle(0.04, 16, 0.08)} className="rounded-[20px] p-3 flex flex-col justify-between min-h-[118px]">
            <div className="flex items-center gap-1.5 text-white mb-2">
              <Sparkles size={14} className="text-[#e07c30]" />
              <span className="text-[11px] font-bold tracking-wide">Today&apos;s Vlogger</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Avatar src="/profile.jpg" size={44} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white font-bold text-base leading-tight">Emir</span>
                <span className="text-[#e07c30] text-[10px] font-semibold">3 day streak 🔥</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-full border border-white/10 py-1.5 text-[10px] font-semibold text-white/90 transition-colors hover:bg-white/10 active:scale-[0.98]"
            >
              View Profile
            </button>
          </div>

          <div style={glassStyle(0.04, 16, 0.08)} className="p-3 rounded-[20px] min-h-[118px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white mb-3">
              <Clock size={14} className="text-[#e07c30]" />
              <span className="text-[11px] font-bold tracking-wide">Time Left</span>
            </div>
            <div className="flex flex-col flex-1 justify-center">
              <div className="text-white font-black text-3xl leading-none tracking-tighter mb-2">
                <CountdownTimer />
              </div>
              <div className="text-white/60 text-[10px] font-semibold tracking-wide">until day ends</div>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] p-1.5">
          <TimelineTracker
            currentHourIndex={currentHourIndex}
            onHourChange={setCurrentHourIndex}
          />
        </div>
      </div>
    </motion.div>
  );
}
