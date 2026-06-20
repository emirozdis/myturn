// ./components/today/today-bottom-panel.tsx
"use client";

import { useState } from "react";
import { Sparkles, Clock, User, HeartHandshake } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { Avatar } from "@/components/shared/avatar";
import { TimelineTracker } from "@/components/timeline-tracker";

type TodayBottomPanelProps = {
  isVideoExpanded: boolean;
  assignment: any;
  isCurrentUserVlogger: boolean;
  activeClipUrl: string | null;
  currentHourIndex: number;
  actualHourIndex: number;
  uploadedSlots: number[];
  onHourChange: (index: number) => void;
  isSleepMode: boolean;
};

export function TodayBottomPanel({
  isVideoExpanded,
  assignment,
  isCurrentUserVlogger,
  activeClipUrl,
  currentHourIndex,
  actualHourIndex,
  uploadedSlots,
  onHourChange,
  isSleepMode,
}: TodayBottomPanelProps) {
  const [localSleepMode, setLocalSleepMode] = useState(isSleepMode);

  const vloggerLabel = localSleepMode ? "Yesterday's Vlogger" : "Today's Vlogger";
  const countdownLabel = localSleepMode ? "until day starts" : "until day ends";

  return (
    <div
      className={`mb-2 flex-shrink-0 rounded-[24px] flex flex-col gap-3.5 shadow-lg transition-all duration-500 ${
        isVideoExpanded
          ? "max-h-0 opacity-0 overflow-hidden pointer-events-none p-0"
          : "max-h-[320px] opacity-100"
      }`}
    >
      <div className="grid grid-cols-2 gap-3">
        <div style={glassStyle(0.04, 16, 0.08)} className="rounded-[20px] p-3 flex flex-col justify-between min-h-[118px]">
          <div className="flex items-center gap-1.5 text-white mb-2">
            <Sparkles size={14} className="text-[#e07c30]" />
            <span className="text-[11px] font-bold tracking-wide">{vloggerLabel}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Avatar src={assignment?.user?.image} name={assignment?.user?.name} size={44} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-[14px] leading-tight truncate">
                  {assignment?.user?.name || "Unassigned"}
                </span>
                {assignment?.isVolunteer && (
                  <span className="bg-gradient-to-b from-[#f05a7e] to-[#e84365] border-b-[2px] border-[#a01a35] text-white rounded-full px-1.5 py-0.5 flex items-center flex-shrink-0" title="Volunteered">
                    <HeartHandshake size={10} fill="white" />
                  </span>
                )}
              </div>
              <span className="text-white/40 text-[10px] truncate">
                {assignment?.user?.handle ? `@${assignment.user.handle}` : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (assignment?.user?.id) {
                  window.dispatchEvent(
                    new CustomEvent("open-bottom-sheet", {
                      detail: { type: "user-profile", data: { userId: assignment.user.id } },
                    })
                  );
                }
              }}
              className="w-full py-1.5 bg-white/5 text-white border border-white/10 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition hover:bg-white/10 active:scale-95"
            >
              <User size={10} />
              View Profile
            </button>
          </div>
        </div>

        <div style={glassStyle(0.04, 16, 0.08)} className="p-3 rounded-[20px] min-h-[118px] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 text-white mb-3 flex-shrink-0">
            <Clock size={14} className="text-[#e07c30]" />
            <span className="text-[11px] font-bold tracking-wide">Time Left</span>
          </div>
          <div className="flex flex-col flex-1 justify-center items-center w-full min-w-0">
            <div className="w-full mb-1.5">
              <CountdownTimer 
                timezone={assignment?.group?.timezone} 
                onStateChange={setLocalSleepMode}
              />
            </div>
            <div className="text-white/60 text-[9px] sm:text-[10px] font-semibold tracking-wide text-center">
              {countdownLabel}
            </div>
          </div>
        </div>
      </div>

      {(!localSleepMode || (assignment?.clips && assignment.clips.length > 0)) && (
        <div className="rounded-[20px] p-1.5">
          <TimelineTracker
            currentHourIndex={currentHourIndex}
            actualHourIndex={actualHourIndex}
            onHourChange={onHourChange}
            uploadedSlots={uploadedSlots}
          />
        </div>
      )}
    </div>
  );
}