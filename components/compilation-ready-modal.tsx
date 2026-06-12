"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Sparkles, Clock, Calendar, Clapperboard } from "lucide-react";
import { ParticleEffect } from "@/components/achievements/particle-effect";
import { glassStyle } from "@/components/shared/glass-style";

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

  const compilationClips = assignment?.clips || [];

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

  // Determine title and subtitle based on entry context (Archive lookup vs New Recap popup)
  const titleLine = isArchive ? (
    <>
      Relive the <span className="text-[#e07c30]">Day!</span>
    </>
  ) : (
    <>
      Day Recap is <span className="text-[#e07c30]">Ready!</span>
    </>
  );

  const subtitleText = isArchive 
    ? "This day's compiled vlog is saved in your archives. Relive the moments!" 
    : "Yesterday's vlog has been compiled and is ready to watch. Relive the moments!";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
      className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-none"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      {/* Particles behind the sheet */}
      <ParticleEffect type="confetti" active={showConfetti} />

      {/* Bottom Sheet Container */}
      {!isPlayingCompilation && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-md mx-auto bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] pt-4 pb-8 pointer-events-auto flex flex-col max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] select-none"
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2 flex-shrink-0" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-20 pointer-events-auto"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-4 flex flex-col w-full min-h-full">
            {/* Play Icon Header */}
            <div className="relative w-full h-[90px] flex flex-col items-center justify-end mb-4 z-0">
              <div className="relative z-10 w-[96px] h-[96px] rounded-full flex items-center justify-center">
                <div className="absolute inset-0 bg-[#e07c30]/20 blur-xl rounded-full" />
                <img src="/assets/icons/play.png" alt="Play" className="w-48 h-48 object-contain" />
              </div>
            </div>

            {/* Text Headers */}
            <div className="flex flex-col items-center text-center px-2 mb-6">
              <h1 className="text-white text-[28px] font-bold tracking-tight mb-2">
                {titleLine}
              </h1>
              <p className="text-white/50 text-[14px] leading-relaxed max-w-[280px]">
                {subtitleText}
              </p>
              <div className="mt-4 flex items-center gap-2 text-white/40 text-[12px] font-medium">
                <Calendar size={14} />
                <span>
                  {new Date(assignment.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Media Card */}
            <div className="relative w-full aspect-video rounded-[24px] bg-neutral-900 border border-white/10 overflow-hidden mb-5 shadow-lg group cursor-pointer" onClick={() => playCompilation("full")}>
              <img
                src={compilationClips[0]?.thumbnailUrl || "/image1.png"}
                alt="Vlog Thumbnail"
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80 pointer-events-none" />
              
              {/* Media Card Overlay Items */}
              <div className="absolute top-4 left-4 flex flex-col z-10">
                <span className="text-white/80 text-[10px] font-semibold mb-0.5">Today's Vlogger</span>
                <span className="text-white text-[16px] font-bold drop-shadow-md">{assignment.user?.name || "User"}</span>
              </div>
              <div className="absolute top-4 right-4 z-10 text-white/90 text-[12px] font-medium drop-shadow-md">
                {firstClipTime}
              </div>
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div 
                  style={glassStyle(0.12, 16, 0.15)}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform"
                >
                  <Play size={24} className="text-white fill-white ml-1" />
                </div>
              </div>

              <div 
                style={glassStyle(0.08, 12, 0.1)}
                className="absolute bottom-4 right-4 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 z-10 shadow-md"
              >
                <Clock size={12} className="text-white/80" />
                <span className="text-white text-[11px] font-bold font-mono tracking-wider">{totalLengthStr}</span>
              </div>
            </div>

            {/* Info Stats Card */}
            <div 
              style={glassStyle(0.04, 20, 0.08)}
              className="w-full rounded-[24px] p-5 mb-6 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-[#e07c30] mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-white text-[14px] font-bold mb-1">Full Day Vlog Ready</span>
                  <span className="text-white/50 text-[12px] leading-relaxed">
                    {assignment.user?.name || "They"} captured and shared moments throughout the day. Now it's all yours to enjoy!
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div 
                  style={glassStyle(0.02, 12, 0.05)}
                  className="rounded-2xl p-3.5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#e07c30]/10 flex items-center justify-center flex-shrink-0">
                    <Clapperboard size={16} className="text-[#e07c30]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-[15px] font-bold leading-tight">{compilationClips.length}</span>
                    <span className="text-white/40 text-[9px] font-medium uppercase tracking-wider truncate">Moments</span>
                  </div>
                </div>
                <div 
                  style={glassStyle(0.02, 12, 0.05)}
                  className="rounded-2xl p-3.5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#e07c30]/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-[#e07c30]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-[15px] font-bold leading-tight font-mono tracking-tight">{totalLengthStr}</span>
                    <span className="text-white/40 text-[9px] font-medium uppercase tracking-wider truncate">Total Length</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-auto">
              <button
                onClick={() => playCompilation("full")}
                className="w-full py-4 rounded-[20px] bg-[#e07c30] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:opacity-95"
              >
                <Play size={18} className="fill-white" />
                Watch Full Day Vlog
              </button>
              
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-white/30 text-[11px] uppercase tracking-wider font-semibold">or</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <button
                onClick={() => playCompilation("highlights")}
                style={glassStyle(0.04, 16, 0.08)}
                className="w-full py-3.5 rounded-[20px] border border-[#e07c30] text-[#e07c30] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#e07c30]/10"
              >
                <Sparkles size={16} />
                See Highlights
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fullscreen Video Player State */}
      <AnimatePresence>
        {isPlayingCompilation && compilationClips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            className="absolute inset-0 z-50 bg-black flex flex-col justify-between pointer-events-auto"
          >
            <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => {
               e.stopPropagation();
               if (currentClipIndex > 0) setCurrentClipIndex(prev => prev - 1);
            }} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => {
               e.stopPropagation();
               if (currentClipIndex < compilationClips.length - 1) setCurrentClipIndex(prev => prev - 1 + 2); // forces next
               else {
                 setIsPlayingCompilation(false);
                 onClose();
               }
            }} />

            <video
              key={compilationClips[currentClipIndex].id}
              src={compilationClips[currentClipIndex].videoUrl}
              autoPlay
              playsInline
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />

            <div 
              className="relative z-20 p-4 flex justify-between items-center pointer-events-auto"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))" }}
            >
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold tracking-tight drop-shadow-md">
                  {new Date(compilationClips[currentClipIndex].recordedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-white/60 text-xs font-medium">{compilationClips[currentClipIndex].location || "Earth"}</span>
              </div>
              
              <div className="flex gap-2">
                {playbackMode === "highlights" && (
                  <div className="px-3 py-1.5 bg-[#e07c30]/20 border border-[#e07c30]/30 rounded-full flex items-center gap-1.5 mr-2 backdrop-blur-sm">
                    <Sparkles size={12} className="text-[#e07c30]" />
                    <span className="text-[#e07c30] text-[10px] font-bold uppercase tracking-widest">Highlights</span>
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

            <div className="relative z-20 p-6 mt-auto pointer-events-none w-full">
               <div className="flex gap-1 mb-2">
                  {compilationClips.map((c: any, i: number) => (
                    <div key={c.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      {i === currentClipIndex && (
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: "100%" }}
                           transition={{ duration: playbackMode === "highlights" ? 2.5 : 15, ease: "linear" }}
                           className="h-full bg-white"
                        />
                      )}
                      {i < currentClipIndex && <div className="h-full bg-white" />}
                    </div>
                  ))}
               </div>
              <span className="text-white/50 text-[11px] font-medium tracking-wide uppercase">
                {playbackMode === "highlights" ? "Fast Recap" : "Archive Playback"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}