"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Repeat } from "lucide-react";
import { glassStyle } from "./shared/glass-style";

const FADE_BLUR_TRANSITION = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

const fadeBlur = {
  initial: { opacity: 0, filter: "blur(6px)", y: 4 },
  animate: { opacity: 1, filter: "blur(0px)", y: 0 },
  exit: { opacity: 0, filter: "blur(6px)", y: -4 },
};

export function GroupSelector({
  groups,
  activeIndex,
  onSelectIndex,
}: {
  groups: any[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  const active = groups[activeIndex];
  if (!active) return null;

  const handleNextGroup = () => {
    onSelectIndex((activeIndex + 1) % groups.length);
  };

  return (
    <div className="flex-shrink-0 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2 z-20 relative">
      <div  style={glassStyle(0.04, 16, 0.08)} className="flex items-center justify-between p-2 pr-3 bg-[#131313] border border-white/5 rounded-[32px] shadow-lg">
        
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            
            initial={fadeBlur.initial}
            animate={fadeBlur.animate}
            exit={fadeBlur.exit}
            transition={FADE_BLUR_TRANSITION}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            {/* Emoji Circle */}
            <div className="w-12 h-12 rounded-full bg-[#1c1c1c] border-[1.5px] border-[#e07c30]/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-xl leading-none" aria-hidden>
                {active.emoji || "🏠"}
              </span>
            </div>

            {/* Text Info */}
            <div className="flex flex-col min-w-0 justify-center">
              <h1 className="text-white text-[15px] font-bold tracking-tight truncate leading-tight">
                {active.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] flex-shrink-0" />
                <span className="text-white/50 text-[11px] font-medium truncate">
                  {active.memberCount} members
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 flex-shrink-0 pl-2">
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              <img src="/profile.jpg" alt="" className="w-6 h-6 rounded-full border-[2px] border-[#131313] object-cover relative z-30" />
              <img src="/image1.png" alt="" className="w-6 h-6 rounded-full border-[2px] border-[#131313] object-cover relative z-20" />
              <img src="/profile.jpg" alt="" className="w-6 h-6 rounded-full border-[2px] border-[#131313] object-cover relative z-10" />
            </div>
            {active.memberCount > 3 && (
              <span className="text-white/70 text-[11px] font-bold ml-1.5">
                +{active.memberCount - 3}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleNextGroup}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
          >
            <Repeat size={16} className="text-white/70" />
          </button>
        </div>
      </div>

      {/* Dots Indicator */}
      {groups.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 mt-3"
          role="tablist"
          aria-label="Groups"
        >
          {groups.map((group, index) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={group.name}
              onClick={() => onSelectIndex(index)}
              className={`h-1 rounded-full transition-all duration-150 ease-out ${
                index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}