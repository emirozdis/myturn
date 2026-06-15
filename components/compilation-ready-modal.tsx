// ./components/compilation-ready-modal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Sparkles, Clock, Calendar, Clapperboard, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { ParticleEffect } from "@/components/achievements/particle-effect";
import { glassStyle } from "@/components/shared/glass-style";
import { useHls } from "@/components/shared/use-hls";

export function CompilationReadyModal({ 
  assignment, 
  onClose,
  isArchive = false 
}: { 
  assignment: any; 
  onClose: () => void;
  isArchive?: boolean;
}) {
  const [isPlayingCompilation, setIsPlayingCompilation] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<"full" | "highlights">("full");
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [disableAbr, setDisableAbr] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync state to prevent hydration mismatches and guarantee responsive ABR toggling tracking
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDisableAbr(localStorage.getItem("disable_abr") === "true");
    }
  }, []);

  const compilationClips = assignment?.clips || [];
  const currentClip = compilationClips[currentClipIndex];
  const activeUrl = (!disableAbr && currentClip?.hlsUrl) ? currentClip.hlsUrl : currentClip?.videoUrl;

  useHls(videoRef, isPlayingCompilation ? activeUrl : null);

  // Reset local state on clip transitions
  useEffect(() => {
    setIsVideoLoaded(false);
  }, [currentClipIndex]);

  // Disable the confetti particles exactly 3 seconds after the modal has mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const playCompilation = (mode: "full" | "highlights") => {
    if (compilationClips.length > 0) {
      setPlaybackMode(mode);
      setCurrentClipIndex(0);
      setIsPlayingCompilation(true);
    }
  };

  useEffect(() => {
    if (isPlayingCompilation && playbackMode === "highlights") {
      const timer = setTimeout(() => {
        if (currentClipIndex < compilationClips.length - 1) {
          setCurrentClipIndex((prev) => prev + 1);
        } else {
          setIsPlayingCompilation(false);
          onClose(); // Automatically dismiss after playing
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isPlayingCompilation, playbackMode, currentClipIndex, compilationClips.length, onClose]);

  let totalLengthStr = "00:00";
  let firstClipTime = "";
  if (compilationClips.length > 0) {
    const totalSeconds = compilationClips.length * 15; 
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    totalLengthStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    firstClipTime = new Date(compilationClips[0].recordedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // Determine title and subtitle based on entry context
  const titleLine = isArchive ? (
    <>
      Relive the <span className="text-[#e07c30] font-black">Day!</span>
    </>
  ) : (
    <>
      Recap is <span className="text-[#e07c30] font-black">Ready!</span>
    </>
  );

  const subtitleText = isArchive 
    ? "This compiled vlog is safely preserved in your group archives." 
    : "Yesterday's daily moments have been compiled into a single vlog.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
      className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-none"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md pointer-events-auto" onClick={onClose} />
      
      {/* Confetti Particles */}
      <ParticleEffect type="confetti" active={showConfetti} />

      {/* Premium Bottom Sheet */}
      {!isPlayingCompilation && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-md mx-auto bg-neutral-950/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[36px] pt-4 pb-10 pointer-events-auto flex flex-col max-h-[90vh] shadow-[0_-12px_48px_rgba(0,0,0,0.6)] select-none"
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto mb-2 flex-shrink-0" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-20 pointer-events-auto"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-2 flex flex-col w-full min-h-full">
            {/* Sparkle Header Indicator */}
            <div className="flex justify-center mb-3">
              <div className="px-3 py-1 bg-[#e07c30]/10 border border-[#e07c30]/20 rounded-full flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#e07c30]" />
                <span className="text-[#e07c30] text-[10px] font-black uppercase tracking-wider">Group Compilation</span>
              </div>
            </div>

            {/* Typography Header */}
            <div className="flex flex-col items-center text-center px-2 mb-6">
              <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1.5 leading-none">
                {titleLine}
              </h1>
              <p className="text-white/50 text-xs font-medium leading-relaxed max-w-[280px]">
                {subtitleText}
              </p>
            </div>

            {/* Redesigned 3:4 Vertical Poster Preview Card */}
            <div 
              onClick={() => playCompilation("full")}
              style={glassStyle(0.04, 20, 0.12)}
              className="relative w-full max-w-[200px] aspect-[3/4] mx-auto rounded-[28px] overflow-hidden mb-6 shadow-2xl group cursor-pointer border border-white/10 flex flex-col justify-between p-3.5"
            >
              {/* Vertical cover image */}
              <img
                src={compilationClips[0]?.thumbnailUrl || "/image1.png"}
                alt="Vlog Cover"
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/85 pointer-events-none z-0" />
              
              {/* Card Header (Z-Indexed over gradient) */}
              <div className="relative z-10 flex justify-between items-start w-full">
                <div className="flex flex-col min-w-0">
                  <span className="text-white/60 text-[9px] font-black uppercase tracking-wider mb-0.5">Vlogger</span>
                  <span className="text-white text-xs font-black truncate drop-shadow-md">{assignment.user?.name || "User"}</span>
                </div>
                <span className="text-white/95 text-[10px] font-mono font-bold drop-shadow-md bg-black/35 px-2 py-0.5 rounded-md border border-white/5">
                  {firstClipTime}
                </span>
              </div>
              
              {/* Translucent Pulsing Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div 
                  style={glassStyle(0.15, 16, 0.25)}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-300 relative"
                >
                  {/* Subtle pulsing glow ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping opacity-35" />
                  <Play size={20} className="text-white fill-white ml-1" />
                </div>
              </div>
            </div>

            {/* Polished Stats Pill Block */}
            <div 
              style={glassStyle(0.04, 20, 0.08)}
              className="w-full rounded-[24px] p-4 mb-6 flex flex-col gap-3.5 border border-white/5"
            >
              <div className="flex items-center gap-2.5 px-1">
                <Calendar size={14} className="text-[#e07c30]" />
                <span className="text-white/80 text-xs font-bold">
                  {new Date(assignment.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div 
                  style={glassStyle(0.02, 12, 0.05)}
                  className="rounded-2xl p-3 flex items-center gap-3 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#e07c30]/10 flex items-center justify-center flex-shrink-0">
                    <Film size={14} className="text-[#e07c30]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-black leading-none mb-0.5">{compilationClips.length}</span>
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider truncate">Moments</span>
                  </div>
                </div>
                <div 
                  style={glassStyle(0.02, 12, 0.05)}
                  className="rounded-2xl p-3 flex items-center gap-3 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#e07c30]/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-[#e07c30]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-black leading-none mb-0.5 font-mono">{totalLengthStr}</span>
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider truncate">Total Duration</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3.5 mt-auto">
              <button
                onClick={() => playCompilation("full")}
                className="w-full py-3.5 rounded-[20px] bg-[#e07c30] text-black font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:opacity-95 shadow-lg cursor-pointer"
              >
                <Play size={16} className="fill-black" />
                Watch Full Vlog
              </button>

              <button
                onClick={() => playCompilation("highlights")}
                style={glassStyle(0.04, 16, 0.08)}
                className="w-full py-3 rounded-[20px] border border-[#e07c30]/30 text-[#e07c30] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:bg-[#e07c30]/10 cursor-pointer"
              >
                <Sparkles size={13} />
                Quick Highlights
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fullscreen Video Player */}
      <AnimatePresence>
        {isPlayingCompilation && compilationClips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            className="absolute inset-0 z-50 bg-black flex flex-col justify-between pointer-events-auto"
          >
            {/* Nav Touch Zones */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => {
               e.stopPropagation();
               if (currentClipIndex > 0) setCurrentClipIndex(prev => prev - 1);
            }} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => {
               e.stopPropagation();
               if (currentClipIndex < compilationClips.length - 1) setCurrentClipIndex(prev => prev + 1);
               else {
                 setIsPlayingCompilation(false);
                 onClose();
               }
            }} />

            {/* Absolute Video Frame */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
              <video
                key={compilationClips[currentClipIndex].id}
                ref={videoRef}
                autoPlay
                playsInline
                onTimeUpdate={(e) => {
                  if (e.currentTarget.currentTime > 0) {
                    setIsVideoLoaded(true);
                  }
                }}
                onEnded={() => {
                  if (currentClipIndex < compilationClips.length - 1) {
                    setCurrentClipIndex(prev => prev + 1);
                  } else {
                    setIsPlayingCompilation(false);
                    onClose();
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <AnimatePresence>
                {!isVideoLoaded && compilationClips[currentClipIndex]?.thumbnailBlurUrl && (
                  <motion.img
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={compilationClips[currentClipIndex].thumbnailBlurUrl}
                    alt="Loading clip..."
                    className="absolute inset-0 w-full h-full object-cover z-10 blur-xl scale-[1.06] pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />

            {/* Fullscreen HUD Header */}
            <div 
              className="relative z-20 p-4 flex justify-between items-center pointer-events-auto"
              style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 1.25rem))" }}
            >
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold tracking-tight drop-shadow-md">
                  {new Date(compilationClips[currentClipIndex].recordedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-white/60 text-xs font-semibold mt-0.5">{compilationClips[currentClipIndex].location || "Earth"}</span>
              </div>
              
              <div className="flex gap-2">
                {playbackMode === "highlights" && (
                  <div className="px-3 py-1.5 bg-[#e07c30]/20 border border-[#e07c30]/30 rounded-full flex items-center gap-1.5 mr-1 backdrop-blur-sm">
                    <Sparkles size={11} className="text-[#e07c30]" />
                    <span className="text-[#e07c30] text-[10px] font-black uppercase tracking-widest">Highlights</span>
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPlayingCompilation(false); onClose(); }}
                  className="w-10 h-10 bg-black/40 backdrop-blur rounded-full text-white font-extrabold flex items-center justify-center hover:bg-white/20 transition border border-white/10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Custom Progress Bar HUD Footer */}
            <div className="relative z-20 p-6 mt-auto pointer-events-none w-full">
               <div className="flex gap-1.5 mb-3.5">
                  {compilationClips.map((c: any, i: number) => (
                    <div key={c.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden shadow-inner">
                      {i === currentClipIndex && (
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: "100%" }}
                           transition={{ duration: playbackMode === "highlights" ? 2.5 : 15, ease: "linear" }}
                           className="h-full bg-white rounded-full"
                        />
                      )}
                      {i < currentClipIndex && <div className="h-full bg-white rounded-full" />}
                    </div>
                  ))}
               </div>
              <span className="text-white/50 text-[10px] font-black tracking-widest uppercase">
                {playbackMode === "highlights" ? "Fast Recap" : "Archive Playback"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}