"use client";

import { motion } from "framer-motion";
import { Flame, Clapperboard, ChevronRight, Star, Lock } from "lucide-react";
import { glassStyle } from "../shared/glass-style";
import { Avatar } from "../shared/avatar";
import {
  calendarDays,
  friendsStreaks,
  achievementsData,
  GROUP_STREAK_STATS,
  type MockGroup,
} from "../shared/mock-data";

export function StreaksPage({ group }: { group: MockGroup }) {
  const stats = GROUP_STREAK_STATS[group.id] ?? GROUP_STREAK_STATS.apt;
  return (
    <motion.div
      key="streaks-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 h-full overflow-y-auto px-4 pt-6 pb-6 scrollbar-hide flex flex-col gap-4"
      style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
      ::-webkit-scrollbar { display: none; }
    `,
        }}
      />

      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight">Streaks</h2>
          <p className="text-white/60 text-[12px] mt-0.5">Keep the streak alive 🔥</p>
        </div>
        <div
          style={glassStyle(0.05, 10, 0.1)}
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <Flame size={12} className="text-[#e07c30] fill-[#e07c30]" />
          <span className="text-[#e07c30] text-[10px] font-bold">{stats.current} day streak</span>
          <ChevronRight size={12} className="text-[#e07c30]" />
        </div>
      </div>

      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="rounded-[24px] p-5 flex items-center justify-between"
      >
        <div className="flex flex-col items-center gap-2.5 flex-1">
          <div className="relative w-[76px] h-[76px]">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="38"
                cy="38"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle
                cx="38"
                cy="38"
                r="34"
                fill="none"
                stroke="#e07c30"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="213.6"
                strokeDashoffset="128"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
              <Flame size={16} className="text-white fill-[#e07c30] mb-0.5" />
              <span className="text-white text-2xl font-bold leading-none tracking-tighter">
                {stats.current}
              </span>
              <span className="text-white/50 text-[10px] font-medium mt-0.5">days</span>
            </div>
          </div>
          <span className="text-[#e07c30] text-[11px] font-bold">Current Streak</span>
        </div>

        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col items-center flex-1">
          <span className="text-white/60 text-[11px] font-medium mb-1.5">Best Streak</span>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-3xl font-bold leading-none tracking-tighter">
              {stats.best}
            </span>
            <span className="text-white/60 text-[11px] font-medium">days</span>
          </div>
          <div className="mt-2.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[9px] text-white/50 font-medium">
            Apr 3 - Apr 14
          </div>
        </div>

        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col items-center flex-1">
          <span className="text-white/60 text-[11px] font-medium mb-1.5">Total Vlogs</span>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-3xl font-bold leading-none tracking-tighter">
              {stats.totalVlogs}
            </span>
            <span className="text-white/60 text-[11px] font-medium">vlogs</span>
          </div>
          <Clapperboard size={14} className="text-white/30 mt-2.5" />
        </div>
      </div>

      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="rounded-[20px] p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <span className="text-2xl drop-shadow-md">🚀</span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-white text-[12px] font-bold tracking-wide">You&apos;re on fire!</h3>
            <p className="text-white/50 text-[10px] leading-snug max-w-[170px]">
              Record 1 more day to reach your new best streak.
            </p>
          </div>
        </div>
        <div className="relative w-11 h-11 flex flex-col items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="none"
              stroke="#e07c30"
              strokeWidth="3"
              strokeDasharray="119.3"
              strokeDashoffset="89.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center z-10 pt-0.5">
            <span className="text-[#e07c30] text-[12px] font-bold leading-none tracking-tight">
              1<span className="text-white/50">/4</span>
            </span>
            <span className="text-white/40 text-[6px] font-medium uppercase tracking-wider mt-0.5">
              days to go
            </span>
          </div>
        </div>
      </div>

      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="rounded-[24px] p-5 flex flex-col gap-4"
      >
        <div className="flex justify-between items-center">
          <span className="text-white text-[14px] font-bold tracking-wide">April 2025</span>
          <div className="flex gap-2">
            <button className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/10 transition-colors">
              <ChevronRight className="rotate-180" size={12} color="#fff" opacity={0.5} />
            </button>
            <button className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/10 transition-colors">
              <ChevronRight size={12} color="#fff" opacity={0.5} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-3.5 gap-x-1 text-center">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
            <span key={day} className="text-white/40 text-[9px] font-medium tracking-wider mb-2">
              {day}
            </span>
          ))}

          {calendarDays.map((item, i) => (
            <div key={i} className="flex justify-center relative">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
              ${
                item.type === "vlogged"
                  ? "bg-gradient-to-br from-[#ff9a44] to-[#e07c30] text-white shadow-[0_2px_10px_rgba(224,124,48,0.3)]"
                  : item.type === "missed"
                    ? "border border-white/5 bg-white/[0.03] text-white/50"
                    : "text-white/20"
              }
            `}
              >
                {item.d}
              </div>
              {"best" in item && item.best && (
                <div className="absolute -bottom-1 -right-0 w-3.5 h-3.5 bg-[#e07c30] rounded-full flex items-center justify-center border-2 border-[#1c1c1e]">
                  <Star size={7} className="text-white fill-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between px-2 mt-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#ff9a44] to-[#e07c30]"></div>
            <span className="text-[10px] font-medium text-white/60">Vlogged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-[#e07c30]"></div>
            <span className="text-[10px] font-medium text-white/60">Partially vlogged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-white/10 bg-white/5"></div>
            <span className="text-[10px] font-medium text-white/60">Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star size={11} className="text-[#e07c30] fill-[#e07c30]" />
            <span className="text-[10px] font-medium text-white/60">Best day</span>
          </div>
        </div>
      </div>

      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="rounded-[24px] p-5 flex flex-col gap-4"
      >
        <div className="flex justify-between items-center">
          <span className="text-white text-[14px] font-bold tracking-wide">Friends Streaks</span>
          <span className="text-[#e07c30] text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer hover:text-white transition-colors">
            View All <ChevronRight size={12} />
          </span>
        </div>

        <div className="flex justify-between items-end mt-2">
          {friendsStreaks.map((friend) => (
            <div key={friend.name} className="flex flex-col items-center gap-2 relative">
              <div
                className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[9px] font-bold text-white z-10 shadow-lg"
                style={
                  friend.isMe ? { background: "#e07c30", borderColor: "#ffb880" } : {}
                }
              >
                {friend.rank}
              </div>

              <div
                className={`p-[2.5px] rounded-full ${friend.isMe ? "bg-gradient-to-br from-[#ff9a44] to-[#e07c30]" : "bg-white/10"}`}
              >
                <Avatar src={friend.img} size={46} />
              </div>

              <div className="flex flex-col items-center text-center gap-0.5">
                <span className="text-white text-[11px] font-bold tracking-tight">{friend.name}</span>
                <span
                  className={`text-[10px] font-medium ${friend.isMe ? "text-[#e07c30]" : "text-white/60"}`}
                >
                  {friend.streak} days
                </span>
                {friend.isMe ? (
                  <div className="mt-1 px-2.5 py-[2px] rounded-full bg-white/10 border border-white/5 text-[9px] text-white/70 font-medium">
                    You
                  </div>
                ) : (
                  <Flame size={11} className="text-[#e07c30] fill-[#e07c30] mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="rounded-[24px] p-5 flex flex-col gap-4"
      >
        <div className="flex justify-between items-center">
          <span className="text-white text-[14px] font-bold tracking-wide">Streak Achievements</span>
          <span className="text-[#e07c30] text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer hover:text-white transition-colors">
            View All <ChevronRight size={12} />
          </span>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-2 px-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {achievementsData.map((ach) => (
            <div
              key={ach.title}
              className="flex-shrink-0 w-[96px] h-[120px] rounded-[20px] p-2 flex flex-col items-center justify-center relative border border-white/5 bg-white/[0.02]"
            >
              {ach.unlocked && (
                <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[9px] font-medium text-white/80">
                  {ach.level}
                </div>
              )}

              <div
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 ${ach.unlocked ? "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-white/5 border border-white/10"}`}
              >
                {ach.unlocked ? (
                  <span className="text-2xl drop-shadow-lg">{ach.icon}</span>
                ) : (
                  <Lock size={20} className="text-white/20" />
                )}
              </div>
              <span className="text-white text-[10px] font-bold text-center leading-tight tracking-wide mb-1">
                {ach.title}
              </span>
              <span className="text-white/40 text-[9px] font-medium">{ach.req}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
