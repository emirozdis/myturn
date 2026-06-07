"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import type { GroupConfig } from "@/app/(app)/layout";

type GroupSwipePagerProps = {
  groups: GroupConfig[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  children: ReactNode;
  disabled?: boolean;
};

export function GroupSwipePager({
  groups,
  activeIndex,
  onIndexChange,
  children,
  disabled = false,
}: GroupSwipePagerProps) {
  const [prevIndex, setPrevIndex] = useState(activeIndex);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (activeIndex !== prevIndex) {
      setDirection(activeIndex > prevIndex ? 1 : -1);
      setPrevIndex(activeIndex);
    }
  }, [activeIndex, prevIndex]);

  // Single group: no gesture container needed, just render children directly
  if (groups.length <= 1) {
    return <div className="flex-1 min-h-0 flex flex-col">{children}</div>;
  }

  const handleDragEnd = (event: any, info: any) => {
    if (disabled) return;
    
    const swipeThreshold = 50; // minimum swipe distance in pixels
    const velocityThreshold = 200; // minimum velocity in px/sec
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0 && activeIndex > 0) {
        // Swiped right -> navigate to the previous group
        onIndexChange(activeIndex - 1);
      } else if (offset.x < 0 && activeIndex < groups.length - 1) {
        // Swiped left -> navigate to the next group
        onIndexChange(activeIndex + 1);
      }
    }
  };

  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : dir < 0 ? "-100%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : dir > 0 ? "-100%" : 0,
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={groups[activeIndex]?.id || "group-pager"}
          custom={direction}
          variants={slideVariants}
          initial={disabled ? "center" : "enter"}
          animate="center"
          exit={disabled ? "center" : "exit"}
          drag={disabled ? false : "x"}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={handleDragEnd}
          className="flex-1 min-h-0 w-full flex flex-col absolute inset-0 touch-pan-y select-none"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}