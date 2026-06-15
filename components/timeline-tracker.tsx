// ./components/timeline-tracker.tsx
"use client";

import { Star } from "lucide-react";
import { ACCENT, TIMELINE_POINTS } from "@/lib/theme";

export function TimelineTracker({
  currentHourIndex,
  actualHourIndex,
  onHourChange,
  uploadedSlots = [],
}: {
  currentHourIndex: number;
  actualHourIndex: number;
  onHourChange: (index: number) => void;
  uploadedSlots?: number[];
}) {
  return (
    <div className="px-4 pb-3 flex-shrink-0">
      <div className="relative mt-4">
        <div className="absolute left-0 -top-4">
          <Star size={10} className="text-[#e07c30] fill-[#e07c30]" />
        </div>
        <div className="absolute right-0 -top-4">
          <Star size={10} className="text-white/30" />
        </div>

        <div className="absolute left-[7px] right-[7px] top-[6px] h-[2px] bg-white/10 rounded-full z-0">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${(currentHourIndex / (TIMELINE_POINTS.length - 1)) * 100}%`,
              background: ACCENT,
            }}
          />
        </div>

        <div className="flex justify-between relative z-10">
          {TIMELINE_POINTS.map((pt) => {
            const isCurrent = pt.key === currentHourIndex;
            const isDone = pt.key < currentHourIndex;
            const hasUpload = uploadedSlots.includes(pt.key);
            const isFuture = pt.key > actualHourIndex;

            return (
              <button
                key={pt.key}
                onClick={() => {
                  if (!isFuture) onHourChange(pt.key);
                }}
                disabled={isFuture}
                className={`flex flex-col items-center gap-1.5 group focus:outline-none ${isFuture ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                  style={{
                    background: isCurrent
                      ? "rgba(224,124,48,0.3)"
                      : hasUpload
                        ? `${ACCENT}88`
                        : isDone
                          ? ACCENT
                          : "rgba(0,0,0,0.6)",
                    border: isCurrent
                      ? `2px solid ${ACCENT}`
                      : hasUpload
                        ? `1.5px solid ${ACCENT}`
                        : isDone
                          ? "none"
                          : "1.5px solid rgba(255,255,255,0.2)",
                  }}
                >
                </div>
                <span
                  className="text-[9px] font-medium transition-colors"
                  style={{
                    color: isCurrent
                      ? ACCENT
                      : hasUpload
                        ? ACCENT
                        : isDone
                          ? "rgba(255,255,255,0.8)"
                          : "rgba(255,255,255,0.4)",
                  }}
                >
                  {pt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}