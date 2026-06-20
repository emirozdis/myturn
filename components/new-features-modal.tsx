// ./components/new-features-modal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants, useDragControls, PanInfo } from "framer-motion";
import { 
  X, Sparkles, ChevronRight, HeartHandshake, Trophy, Heart
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
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

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

              {/* 1. VOLUNTEER FEATURE */}
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.03, 12, 0.06)}
                className="rounded-[22px] p-3.5 flex gap-3.5 border border-white/5 items-center relative overflow-hidden pointer-events-none select-none"
              >
                <div className="w-[110px] h-[110px] rounded-xl bg-[#08080c] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col justify-center items-center p-2 gap-2">
                  <motion.div
                    animate={{ scale: [1, 0.95, 1], y: [0, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 1] }}
                    className="w-[90%] bg-gradient-to-b from-[#f05a7e] to-[#e84365] border-b-[3px] border-[#a01a35] rounded-xl py-2 flex flex-col items-center gap-1 shadow-[0_4px_12px_rgba(232,67,101,0.35)]"
                  >
                    <HeartHandshake size={16} className="text-white" />
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-white">Volunteered</span>
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <div className="flex -space-x-2">
                      <div className="z-20 relative"><Avatar src="/profile.jpg" name="U1" size={22} ring /></div>
                      <div className="z-10 relative"><Avatar src="/image1.png" name="U2" size={22} ring /></div>
                    </div>
                    <span className="text-[6px] text-white/50 font-bold mt-1.5 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">Tiebreaker</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[#e07c30] text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <HeartHandshake size={10} /> Take the Stage
                  </span>
                  <h3 className="text-white text-[13px] font-extrabold tracking-tight leading-tight mb-1">
                    Volunteer System
                  </h3>
                  <p className="text-white/50 text-[10px] leading-relaxed font-medium">
                    Step up before 7 AM to claim tomorrow's vlog! If multiple eligible friends volunteer, the system randomly tie-breaks. <span className="text-white font-semibold">(You can't go twice in one cycle!)</span>
                  </p>
                </div>
              </motion.div>

              {/* 2. VOLUNTEER ACHIEVEMENTS FEATURE */}
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.03, 12, 0.06)}
                className="rounded-[22px] p-3.5 flex gap-3.5 border border-white/5 items-center relative overflow-hidden pointer-events-none select-none"
              >
                <div className="w-[110px] h-[110px] rounded-xl bg-[#08080c] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col p-2 justify-center gap-2.5">
                  <motion.div
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="flex items-center gap-2 bg-white/[0.05] p-1.5 rounded-lg border border-white/10 shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#e07c30]/20 flex items-center justify-center flex-shrink-0">
                      <Heart size={11} className="text-[#e07c30]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider truncate">The Tribute</span>
                      <span className="text-[6px] text-[#e07c30] font-bold">1st Time</span>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [2, -2, 2] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="flex items-center gap-2 bg-white/[0.05] p-1.5 rounded-lg border border-white/10 shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Heart size={11} className="text-purple-400 fill-purple-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider truncate">The Altruist</span>
                      <span className="text-[6px] text-purple-400 font-bold">5x Volunteer</span>
                    </div>
                  </motion.div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[#e07c30] text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Trophy size={10} /> New Rewards
                  </span>
                  <h3 className="text-white text-[13px] font-extrabold tracking-tight leading-tight mb-1">
                    Exclusive Badges & XP
                  </h3>
                  <p className="text-white/50 text-[10px] leading-relaxed font-medium">
                    Volunteering grants a massive <span className="text-white font-semibold text-[#e07c30]">1.5x XP boost!</span> Unlock "The Tribute" on your first run, and "The Altruist" badge for stepping up 5 times.
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
              className="w-full py-4 rounded-2xl text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
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