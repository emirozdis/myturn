"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export function CountdownTimer() {
  const [time, setTime] = useState(8 * 3600 + 45 * 60 + 12);

  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

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