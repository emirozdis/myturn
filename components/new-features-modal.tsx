// ./components/new-features-modal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants, useDragControls, PanInfo } from "framer-motion";
import { 
  X, Sparkles, ChevronRight, AtSign, CornerDownRight, 
  Gauge, Rewind, Zap, Pause
} from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";

const APP_VERSION = "2.2.0";

interface NewFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

export function NewFeaturesModal({ isOpen, onClose }: NewFeaturesModalProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [activeNudge, setActiveNudge] = useState(0);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveNudge((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const checkScroll = (target: HTMLDivElement) => {
    const hasScroll = target.scrollHeight > target.clientHeight;
    if (!hasScroll) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }
    
    const isAtTop = target.scrollTop <= 5;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    
    setShowTopFade(!isAtTop);
    setShowBottomFade(!isAtBottom);
  };

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (el) {
      const timer = setTimeout(() => {
        checkScroll(el);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    checkScroll(e.currentTarget);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offsetThreshold = 80;
    const velocityThreshold = 400;
    if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[110] flex flex-col justify-end pointer-events-auto"
      onClick={onClose}
    >
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Slide-Up Premium Bottom Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.9 }}
        className="relative w-full max-w-md mx-auto bg-neutral-950/95 border-t border-white/10 rounded-t-[40px] pt-4 pb-8 flex flex-col max-h-[93vh] shadow-[0_-12px_48px_rgba(0,0,0,0.65)] z-10 pointer-events-auto"
        style={glassStyle(0.08, 20, 0.15)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle Container */}
        <div 
          className="w-full -mt-2 pb-5 flex justify-center cursor-grab active:cursor-grabbing touch-none flex-shrink-0 z-30"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full pointer-events-none" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-20 border border-white/5 cursor-pointer pointer-events-auto"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        <div className="flex-1 overflow-hidden px-6 pt-3 flex flex-col w-full min-h-0">
          {/* Header Area */}
          <div className="flex flex-col items-center text-center mb-5 flex-shrink-0">
            <div className="px-3 py-1 bg-[#e07c30]/10 border border-[#e07c30]/20 rounded-full flex items-center gap-1.5 mb-2.5">
              <Sparkles size={11} className="text-[#e07c30] animate-pulse" />
              <span className="text-[#e07c30] text-[10px] font-black uppercase tracking-wider">Release v{APP_VERSION}</span>
            </div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-none mb-1">
              What&apos;s <span className="text-[#e07c30]">New!</span>
            </h1>
            <p className="text-white/50 text-[11px] font-semibold">
              Explore latest features and stability upgrades.
            </p>
          </div>

          {/* Scroll container with overflow clipping fades */}
          <div className="relative flex-1 min-h-0 w-full mb-5">

            {/* Top fade — sits inside clip boundary, bleeds into first card */}
            <AnimatePresence>
              {showTopFade && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-0 inset-x-0 h-10 pointer-events-none z-20"
                  style={{
                    background: "linear-gradient(to bottom, rgb(10 10 10 / 0.95) 0%, rgb(10 10 10 / 0.6) 40%, transparent 100%)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Bottom fade — tight, feathers into scroll list */}
            <AnimatePresence>
              {showBottomFade && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-0 inset-x-0 h-10 pointer-events-none z-20"
                  style={{
                    background: "linear-gradient(to top, rgb(10 10 10 / 0.95) 0%, rgb(10 10 10 / 0.6) 40%, transparent 100%)",
                  }}
                />
              )}
            </AnimatePresence>
            
            {/* Staggered Features List */}
            <motion.div
              ref={listRef}
              onScroll={handleScroll}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="overflow-y-auto pr-1 space-y-4 pointer-events-auto touch-pan-y scrollbar-hide h-full"
              style={{
                maxHeight: "52vh",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

              {/* 1. MENTIONS FEATURE */}
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.03, 12, 0.06)}
                className="rounded-[22px] p-3.5 flex gap-3.5 border border-white/5 items-center relative overflow-hidden pointer-events-none select-none"
              >
                <div className="w-[110px] h-[110px] rounded-xl bg-[#08080c] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col justify-between p-2">
                  <AnimatePresence>
                    {activeNudge === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={glassStyle(0.12, 6, 0.2)}
                        className="absolute top-1.5 inset-x-1.5 p-1 rounded-lg border border-white/10 flex items-center gap-1.5 bg-black/60 shadow-md z-20"
                      >
                        <div className="w-4 h-4 bg-[#e07c30] rounded-full flex items-center justify-center text-[7px] text-black font-extrabold flex-shrink-0">
                          @
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[6.5px] font-black text-white leading-none">Mention!</span>
                          <span className="text-white/50 text-[5.5px] truncate mt-0.5 leading-none">Sarah tagged you</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto flex gap-1.5 items-start">
                    <Avatar src="/profile.jpg" name="Sarah" size={16} />
                    <div className="flex-1 bg-white/[0.04] border border-white/5 rounded-lg p-1.5 text-left">
                      <span className="text-white/40 text-[6px] font-extrabold block">@sarah</span>
                      <p className="text-white/80 text-[7px] leading-tight mt-0.5 font-medium">
                        Awesome view <span className="text-[#e07c30] font-black bg-[#e07c30]/10 rounded-[3px] px-0.5">@you</span>!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[#e07c30] text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <AtSign size={10} /> User Mentions
                  </span>
                  <h3 className="text-white text-[13px] font-extrabold tracking-tight leading-tight mb-1">
                    Tag Your Friends
                  </h3>
                  <p className="text-white/50 text-[10px] leading-relaxed font-medium">
                    Mention friends in comments using <span className="text-white font-semibold">@handle</span>. They will receive instant push notifications to jump right into the thread!
                  </p>
                </div>
              </motion.div>

              {/* 2. COMMENT REPLIES FEATURE */}
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.03, 12, 0.06)}
                className="rounded-[22px] p-3.5 flex gap-3.5 border border-white/5 items-center relative overflow-hidden pointer-events-none select-none"
              >
                <div className="w-[110px] h-[110px] rounded-xl bg-[#08080c] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col p-2.5 text-left justify-center gap-2">
                  <div className="flex gap-1.5 items-start">
                    <Avatar src="/profile.jpg" name="Alex" size={16} />
                    <div className="flex-1 bg-white/[0.04] p-1.5 rounded-xl border border-white/5">
                      <span className="text-white/30 text-[7px] font-bold block leading-none">@alex</span>
                      <span className="text-white/70 text-[8px] leading-tight mt-0.5 block">Vibe check?</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-start ml-4 relative">
                    <div className="absolute -left-2.5 top-0 bottom-1/2 w-2 border-l border-b border-white/20 rounded-bl-sm" />
                    <Avatar src="/image1.png" name="Zeynep" size={12} />
                    <div className="flex-1 bg-white/[0.06] p-1 rounded-lg border border-white/5">
                      <span className="text-white/30 text-[6px] font-bold block leading-none">@zeynep</span>
                      <span className="text-white/80 text-[7.5px] leading-tight mt-0.5 block">10/10 today!</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[#e07c30] text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <CornerDownRight size={10} /> Comment Threads
                  </span>
                  <h3 className="text-white text-[13px] font-extrabold tracking-tight leading-tight mb-1">
                    Direct Replies
                  </h3>
                  <p className="text-white/50 text-[10px] leading-relaxed font-medium">
                    Tap <span className="text-white font-semibold">Reply</span> on any comment to start a nested thread, keeping discussions clean and beautifully organized.
                  </p>
                </div>
              </motion.div>

              {/* 3. FAST RECORDING FEATURE */}
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.04, 16, 0.08)}
                className="rounded-[24px] p-3.5 flex gap-3.5 border border-white/5 items-center relative overflow-hidden pointer-events-none select-none"
              >
                <div className="w-[110px] h-[110px] rounded-xl bg-[#08080c] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center w-full z-10">
                    <span className="text-[6px] font-black text-red-500 uppercase tracking-widest flex items-center gap-0.5 animate-pulse bg-red-500/10 px-1 py-0.5 rounded">
                      ● REC
                    </span>
                    <div className="px-1.5 py-0.5 bg-[#e07c30]/20 border border-[#e07c30]/40 rounded-full flex items-center gap-0.5">
                      <Zap size={6} className="text-[#e07c30] fill-[#e07c30]/20" />
                      <span className="text-[#e07c30] text-[6px] font-black">2x Speed</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-[#e07c30]/30 w-10 h-10"
                      />
                      <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-[8px] text-white font-extrabold">
                        2x
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-center gap-1.5 z-10 w-full">
                    <span className="text-white/40 text-[5px] font-bold">0.5x</span>
                    <span className="text-white/40 text-[5px] font-bold">1x</span>
                    <span className="text-[#e07c30] text-[5px] font-extrabold underline underline-offset-1">2x active</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[#e07c30] text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Gauge size={10} /> Dynamic Speed
                  </span>
                  <h3 className="text-white text-[13px] font-extrabold tracking-tight leading-tight mb-1">
                    Fast Recording
                  </h3>
                  <p className="text-white/50 text-[10px] leading-relaxed font-medium">
                    Want a dynamic timelapse style? Toggle the <span className="text-white font-semibold">2x speed button</span> in camera tools to record fast-paced, high-energy clips!
                  </p>
                </div>
              </motion.div>

              {/* 4. HAND GESTURE PLAYBACK CONTROLS FEATURE */}
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.04, 16, 0.08)}
                className="rounded-[24px] p-3.5 flex gap-3.5 border border-white/5 items-center relative overflow-hidden pointer-events-none select-none"
              >
                <div className="w-[110px] h-[110px] rounded-xl bg-[#08080c] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col justify-between p-2 text-center">
                  <div className="flex justify-center w-full z-10 mt-1">
                    <div className="px-2 py-0.5 bg-black/60 border border-white/10 rounded-full flex items-center gap-1">
                      <Pause size={6} className="text-white fill-white" />
                      <span className="text-white text-[6px] font-black uppercase tracking-wider">PAUSED</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ x: [-20, 20, -20] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow-lg relative"
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </motion.div>
                      
                      <div className="absolute -left-7 text-white/30 text-[8px] font-bold tracking-tighter">&lt;&lt;</div>
                      <div className="absolute -right-7 text-white/30 text-[8px] font-bold tracking-tighter">&gt;&gt;</div>
                    </div>
                  </div>

                  <div className="mt-auto w-full z-10 px-1">
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden w-full relative">
                      <motion.div 
                        animate={{ width: ["15%", "85%", "15%"] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 left-0 bg-[#e07c30] rounded-full"
                      />
                    </div>
                    <span className="text-[5px] text-white/40 font-bold block mt-1 uppercase tracking-widest">Hold & Drag</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[#e07c30] text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Rewind size={10} /> Scrubbing Gestures
                  </span>
                  <h3 className="text-white text-[13px] font-extrabold tracking-tight leading-tight mb-1">
                    Gesture Playback
                  </h3>
                  <p className="text-white/50 text-[10px] leading-relaxed font-medium">
                    Navigate seamlessly. <span className="text-white font-semibold">Press & hold</span> to pause, or <span className="text-white font-semibold">drag horizontally</span> to scrub backwards or forwards through any vlog!
                  </p>
                </div>
              </motion.div>
            </motion.div>

          </div>

          {/* Action Button */}
          <div className="flex-shrink-0 pt-2 pb-1 pointer-events-auto">
            <button
              onClick={onClose}
              style={{
                background: ACCENT
              }}
              className="w-full py-4 rounded-2xl text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore New Features</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}