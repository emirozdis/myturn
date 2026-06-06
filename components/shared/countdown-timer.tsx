"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getSecondsUntilMidnight(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour")?.value || "0";
    const minPart = parts.find((p) => p.type === "minute")?.value || "0";
    const secPart = parts.find((p) => p.type === "second")?.value || "0";
    
    let hour = parseInt(hourPart, 10);
    if (hour === 24) hour = 0; // Guard for certain environment formatting styles
    const minute = parseInt(minPart, 10);
    const second = parseInt(secPart, 10);
    
    const currentSeconds = hour * 3600 + minute * 60 + second;
    const totalSecondsInDay = 24 * 3600;
    
    return Math.max(0, totalSecondsInDay - currentSeconds);
  } catch (e) {
    // Graceful fallback to UTC if target timezone is missing or unsupported
    const now = new Date();
    const currentSeconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    return Math.max(0, 24 * 3600 - currentSeconds);
  }
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
      <div className="relative w-full aspect-square bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-md">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 15, opacity: 0, filter: "blur(4px)", scale: 0.9 }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ y: -15, opacity: 0, filter: "blur(4px)", scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute text-xs sm:text-base font-mono font-bold tracking-tight text-white drop-shadow-md"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[7px] sm:text-[8px] font-bold text-white/40 uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ timezone = "UTC" }: { timezone?: string }) {
  const [time, setTime] = useState(() => getSecondsUntilMidnight(timezone));

  useEffect(() => {
    // Reset timer state cleanly whenever the selected group's timezone changes
    setTime(getSecondsUntilMidnight(timezone));

    const id = setInterval(() => {
      setTime(getSecondsUntilMidnight(timezone));
    }, 1000);

    return () => clearInterval(id);
  }, [timezone]);

  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");

  return (
    <div className="flex items-start justify-center font-sans mt-0.5 w-full">
      <div className="flex w-full max-w-[150px] items-start gap-1 sm:gap-1.5">
        <TimeUnit value={h} label="hrs" />
        <div className="flex flex-col items-center justify-start pt-1.5 sm:pt-2.5">
          <span className="text-white/20 text-xs sm:text-base font-bold animate-pulse leading-none">:</span>
        </div>
        <TimeUnit value={m} label="min" />
        <div className="flex flex-col items-center justify-start pt-1.5 sm:pt-2.5">
          <span className="text-white/20 text-xs sm:text-base font-bold animate-pulse leading-none">:</span>
        </div>
        <TimeUnit value={s} label="sec" />
      </div>
    </div>
  );
}