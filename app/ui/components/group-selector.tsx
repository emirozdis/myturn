"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { MockGroup } from "../shared/mock-data";

const FADE_BLUR_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

const fadeBlur = {
  initial: { opacity: 0, filter: "blur(10px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(10px)" },
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
    <div className="flex-shrink-0 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5 leading-tight">
            Group
          </p>
          <div className="relative min-h-[36px] overflow-hidden flex items-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={fadeBlur.initial}
                animate={fadeBlur.animate}
                exit={fadeBlur.exit}
                transition={FADE_BLUR_TRANSITION}
                className="flex items-center gap-3 min-w-0 absolute inset-0"
              >
                <span className="text-2xl leading-none flex-shrink-0" aria-hidden>
                  {active.emoji}
                </span>
                <h1 className="text-white text-[28px] font-bold tracking-tight truncate leading-tight">
                  {active.name}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="relative min-h-[36px] flex-shrink-0 overflow-hidden flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${active.id}-members`}
              initial={fadeBlur.initial}
              animate={fadeBlur.animate}
              exit={fadeBlur.exit}
              transition={FADE_BLUR_TRANSITION}
              className="text-white/55 text-[12px] font-medium whitespace-nowrap block leading-tight"
            >
              {active.memberCount} members
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {groups.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 mt-5"
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
              className={`h-1.5 rounded-full transition-[width,background-color] duration-150 ease-out ${
                index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
