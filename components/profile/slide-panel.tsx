"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export function SlidePanel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{
        position: "absolute", inset: 0, background: "#111", zIndex: 10,
        display: "flex", flexDirection: "column" as const, overflowY: "auto" as const,
        scrollbarWidth: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 0", flexShrink: 0 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "flex" }}
        >
          <ChevronLeft size={22} />
        </button>
        <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ flex: 1, padding: "20px 0 32px" }}>
        {children}
      </div>
    </motion.div>
  );
}
