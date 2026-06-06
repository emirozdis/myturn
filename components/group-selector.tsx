"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { MockGroup } from "@/components/shared/mock-data";

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
  groups: MockGroup[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  const active = groups[activeIndex];
  if (!active) return null;

  return (
    <div className="flex-shrink-0 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 border-b border-white/[0.05] bg-black/20 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 h-8">
        {/* Left Side: Emoji + Group Name */}
        <div className="relative flex-1 min-w-0 h-full flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={fadeBlur.initial}
              animate={fadeBlur.animate}
              exit={fadeBlur.exit}
              transition={FADE_BLUR_TRANSITION}
              className="flex items-center gap-2 min-w-0 absolute inset-y-0 left-0"
            >
              <span className="text-lg leading-none flex-shrink-0" aria-hidden>
                {active.emoji}
              </span>
              <h1 className="text-white text-base font-extrabold tracking-tight truncate leading-none">
                {active.name}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Member Count Pill */}
        <div className="relative h-full flex-shrink-0 flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${active.id}-members`}
              initial={fadeBlur.initial}
              animate={fadeBlur.animate}
              exit={fadeBlur.exit}
              transition={FADE_BLUR_TRANSITION}
              className="text-white/50 text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full whitespace-nowrap block leading-none"
            >
              {active.memberCount} members
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Subtle Pagination Indicators */}
      {groups.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 mt-2"
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
                index === activeIndex ? "w-4 bg-white" : "w-1 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}