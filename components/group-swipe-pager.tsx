"use client";

import { useRef, useEffect, useCallback, type ReactNode } from "react";
import type { MockGroup } from "@/components/shared/mock-data";

type GroupSwipePagerProps = {
  groups: MockGroup[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  children: (group: MockGroup, index: number) => ReactNode;
  disabled?: boolean;
};

function scrollIndexAtHalf(el: HTMLDivElement) {
  const { scrollLeft, clientWidth } = el;
  if (clientWidth === 0) return 0;
  return Math.round(scrollLeft / clientWidth);
}

export function GroupSwipePager({
  groups,
  activeIndex,
  onIndexChange,
  children,
  disabled = false,
}: GroupSwipePagerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const reportedIndexRef = useRef(activeIndex);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    syncingRef.current = true;
    reportedIndexRef.current = index;
    el.scrollTo({ left: index * el.clientWidth, behavior });
    window.setTimeout(() => {
      syncingRef.current = false;
    }, behavior === "smooth" ? 320 : 0);
  }, []);

  useEffect(() => {
    reportedIndexRef.current = activeIndex;
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    if (scrollIndexAtHalf(el) !== activeIndex) {
      scrollToIndex(activeIndex, "smooth");
    }
  }, [activeIndex, scrollToIndex]);

  const handleScroll = () => {
    if (syncingRef.current || disabled) return;

    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;

    const index = Math.max(0, Math.min(groups.length - 1, scrollIndexAtHalf(el)));
    if (index !== reportedIndexRef.current) {
      reportedIndexRef.current = index;
      onIndexChange(index);
    }
  };

  if (groups.length <= 1) {
    return <div className="flex-1 min-h-0 flex flex-col">{children(groups[0], 0)}</div>;
  }

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      className={`flex flex-1 min-h-0 w-full overflow-y-hidden scrollbar-hide ${
        disabled ? "overflow-x-hidden" : "overflow-x-auto snap-x snap-mandatory"
      }`}
      style={{
        WebkitOverflowScrolling: "touch",
        scrollSnapType: disabled ? "none" : "x mandatory",
        overscrollBehaviorX: "contain",
        touchAction: "manipulation",
      }}
    >
      {groups.map((group, index) => (
        <div
          key={group.id}
          className={`w-full flex-shrink-0 h-full min-h-0 flex flex-col ${
            disabled ? "" : "snap-center"
          }`}
          style={{
            scrollSnapAlign: disabled ? "none" : "center",
            scrollSnapStop: disabled ? "normal" : "always",
          }}
        >
          {children(group, index)}
        </div>
      ))}
    </div>
  );
}