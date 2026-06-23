"use client";

import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type MemoryCalendarProps = {
  calendarDays: any[];
  startOffset: number;
  onDayClick: (day: any) => void;
};

export function MemoryCalendar({ calendarDays, startOffset, onDayClick }: MemoryCalendarProps) {
  const { t } = useTranslation();

  return (
    <div
      style={glassStyle(0.04, 20, 0.08)}
      className="rounded-[24px] p-5 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <span className="text-white text-[14px] font-bold tracking-wide">
          {t("streaks.memoryCalendar")}
        </span>
        <span className="text-white/40 text-[10px]">
          {t("streaks.tapHighlighted")}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-y-3.5 gap-x-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-white/40 text-[9px] font-medium tracking-wider mb-2">
            {day}
          </span>
        ))}

        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {calendarDays.map((item: any, i: number) => {
          const isVlogged = item.type === "vlogged";

          return (
            <div key={i} className="flex justify-center relative">
              <button
                onClick={() => onDayClick(item)}
                disabled={!isVlogged}
                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold transition-all overflow-hidden
                    ${isVlogged
                    ? "ring-1 ring-[#e07c30]/50 hover:scale-105"
                    : item.type === "missed"
                      ? "border border-white/5 bg-white/[0.03] text-white/50 cursor-not-allowed"
                      : "text-white/20 cursor-not-allowed"
                  }
                    `}
              >
                {isVlogged && item.assignment?.user ? (
                  <>
                    <div className="absolute inset-0 z-0 flex items-center justify-center">
                      <Avatar src={item.assignment.user.image} name={item.assignment.user.name} size={36} />
                    </div>
                    <div className="absolute inset-0 bg-black/40 z-10 hover:bg-black/20 transition-colors" />
                    <span className="relative z-20 text-white font-extrabold text-[11px] sm:text-[12px] drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.9)]">
                      {item.d}
                    </span>
                  </>
                ) : (
                  <span>{item.d}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}