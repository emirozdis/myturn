"use client";

import { motion } from "framer-motion";
import { X, Sparkles, Camera, Flame, BellRing, ChevronRight, Heart, MessageCircle } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";

const APP_VERSION = "2.1.0";

type NewFeaturesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function NewFeaturesModal({ isOpen, onClose }: NewFeaturesModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 z-[100] bg-black/85 backdrop-blur-xl flex flex-col justify-end select-none pointer-events-auto"
    >
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Slide-Up Premium Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.9 }}
        className="relative w-full max-w-md mx-auto bg-neutral-950/95 border-t border-white/10 rounded-t-[40px] pt-4 pb-8 flex flex-col max-h-[85vh] shadow-[0_-12px_48px_rgba(0,0,0,0.65)] z-10 pointer-events-auto"
      >
        {/* Pull Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2 flex-shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-20 border border-white/5"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-3 flex flex-col w-full min-h-full">
          {/* Header Title badge */}
          <div className="flex justify-center mb-4">
            <div className="px-3 py-1 bg-[#e07c30]/10 border border-[#e07c30]/20 rounded-full flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#e07c30] animate-pulse" />
              <span className="text-[#e07c30] text-[10px] font-black uppercase tracking-wider">Release v{APP_VERSION}</span>
            </div>
          </div>

          {/* Title Area */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1.5 leading-none">
              What's <span className="text-[#e07c30]">New!</span>
            </h1>
            <p className="text-white/50 text-xs font-semibold">
              Discover the latest visual updates on MyTurn.
            </p>
          </div>

          <div className="flex flex-col gap-5 mb-8 mt-1">
            {/* Feature 1: Photo Responses Mockup */}
            <div 
              style={glassStyle(0.04, 16, 0.08)}
              className="rounded-[24px] p-4 flex gap-4 border border-white/5 relative overflow-hidden items-center"
            >
              {/* Left Side: Mock PWA Vlog player with real layout parameters */}
              <div className="w-[124px] h-[180px] rounded-2xl bg-[#060814] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex items-center justify-center">
                {/* Simulated Vlog Video Sunset background gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-rose-950 to-amber-900/60 opacity-95" />
                
                {/* Top Segmented Story Indicators (Direct duplicate of top HUD segments) */}
                <div className="absolute top-1.5 left-2 right-2 flex gap-1 z-10">
                  <div className="h-[2px] flex-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ["0%", "100%", "100%", "100%", "0%"] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                      className="h-full bg-white" 
                    />
                  </div>
                  <div className="h-[2px] flex-1 bg-white/20 rounded-full" />
                  <div className="h-[2px] flex-1 bg-white/20 rounded-full" />
                </div>

                {/* Location Pill top-right */}
                <div className="absolute top-3 right-1.5 bg-black/40 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-full text-[6px] text-white/80 max-w-[55px] truncate scale-90">
                  📍 Phuket, TH
                </div>

                {/* Real Collapsed/Stack Photo Response Card (Perfect replica of PWA Left Stack) */}
                <motion.div 
                  animate={{ 
                    x: [-45, -45, 4, 4, -45], // Simulates pull out from viewport edge
                    opacity: [0, 0, 1, 1, 0],
                    scale: [0.85, 0.85, 1, 1, 0.85]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.2, 0.28, 0.88, 1] 
                  }}
                  className="absolute top-1/2 -translate-y-1/2 left-0 z-20 flex items-center"
                >
                  {/* Glass Photo Card */}
                  <div className="relative w-8 h-12 rounded-lg border border-white/20 shadow-md bg-black/40 p-[2px]">
                    <div className="w-full h-full rounded-md bg-gradient-to-tr from-sky-400 via-[#e07c30]/70 to-rose-500 overflow-hidden relative">
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />
                    </div>
                    {/* Tiny bottom-right overlay avatar */}
                    <div className="absolute -bottom-1 -right-1 rounded-full border border-black overflow-hidden flex items-center justify-center bg-amber-500 text-[5px] font-black text-black w-3.5 h-3.5 shadow-sm">
                      S
                    </div>
                  </div>
                </motion.div>

                {/* Bottom Vlog details */}
                <div className="absolute bottom-2 left-2 z-10 text-left flex flex-col gap-0.5">
                  <span className="text-white text-[8px] font-black leading-none drop-shadow-md">Sarah</span>
                  <span className="text-[#e07c30] text-[6px] leading-none drop-shadow-md">3 day streak</span>
                </div>

                {/* Bottom-right interactive reaction HUD icons */}
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
                  <Heart size={8} className="text-white/80 fill-white/10" />
                  <span className="text-[6px] text-white/50 font-bold">-</span>
                  
                  {/* Glowing, pulsing Camera icon representing active response trigger */}
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 rounded-full bg-[#e07c30]/40 w-5 h-5"
                    />
                    <div className="w-4 h-4 rounded-full bg-[#e07c30] flex items-center justify-center text-black z-10 shadow-lg">
                      <Camera size={8} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Text Description */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <span className="text-[#e07c30] text-[10px] font-black uppercase tracking-wider mb-1">New Feature</span>
                <h3 className="text-white text-[15px] font-extrabold tracking-tight leading-tight mb-1.5">
                  Photo Responses
                </h3>
                <p className="text-white/60 text-[11px] leading-relaxed font-medium">
                  Reply to your friends' daily stories with live photo reactions. Tap the camera icon in any vlog feed to share a snap!
                </p>
              </div>
            </div>

            {/* Feature 2: Poke Fix Mockup */}
            <div 
              style={glassStyle(0.04, 16, 0.08)}
              className="rounded-[24px] p-4 flex gap-4 border border-white/5 relative overflow-hidden items-center"
            >
              {/* Left Side: Mock Waiting State screen with actual layout parameters */}
              <div className="w-[124px] h-[180px] rounded-2xl bg-[#060814] border border-white/10 relative overflow-hidden flex-shrink-0 shadow-lg flex flex-col items-center justify-start p-3 text-center">
                {/* Background image fade blur layer from Today empty state */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-[#060814]/50 to-black pointer-events-none z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#e07c3010,transparent_70%)] pointer-events-none z-0" />

                {/* Inner simulated empty state details */}
                <div className="relative z-10 flex flex-col items-center mt-3">
                  <div className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1.5">
                    <span className="text-white/40 text-[9px]">👤</span>
                  </div>
                  <h4 className="text-white text-[9px] font-black leading-none mb-1">Waiting for Sarah</h4>
                  <p className="text-white/40 text-[6.5px] leading-tight max-w-[80px] font-medium">
                    No clips shared today yet. Poke them!
                  </p>
                </div>

                {/* Actual PWA Bottom Poke button style recreated in miniature */}
                <div className="absolute bottom-2.5 inset-x-2 z-10">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1], 
                      boxShadow: ["0 0 0px rgba(224,124,48,0)", "0 0 12px rgba(224,124,48,0.35)", "0 0 0px rgba(224,124,48,0)"] 
                    }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="w-full py-1.5 bg-[#e07c30]/10 border border-[#e07c30]/30 rounded-xl text-[7px] text-[#e07c30] font-black text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <BellRing size={7} strokeWidth={2.5} />
                    <span>Poke Vlogger</span>
                  </motion.div>
                </div>
              </div>

              {/* Right Side: Text Description */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">Stability Fix</span>
                <h3 className="text-white text-[15px] font-extrabold tracking-tight leading-tight mb-1.5">
                  Improved Pokes
                </h3>
                <p className="text-white/60 text-[11px] leading-relaxed font-medium">
                  Poking is now active throughout the entire business day! Prompt your group vlogger to upload, even after they've posted their morning clip.
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-auto">
            <button
              onClick={onClose}
              style={{
                background: `${ACCENT}`,
              }}
              className="w-full py-4 rounded-2xl text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-1.5"
              
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