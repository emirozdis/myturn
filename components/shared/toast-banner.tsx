"use client";

import { motion } from "framer-motion";

type ToastBannerProps = {
  message: string;
  type: "success" | "error";
};

export function ToastBanner({ message, type }: ToastBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -20, x: "-50%" }}
      className={`absolute top-4 left-1/2 z-[60] w-[90%] p-3 rounded-2xl flex items-center justify-center shadow-lg border backdrop-blur-md ${
        type === "success"
          ? "bg-emerald-900/90 border-emerald-500/20 text-emerald-400"
          : "bg-red-900/90 border-red-500/20 text-red-400"
      }`}
    >
      <span className="text-xs font-bold">{message}</span>
    </motion.div>
  );
}
