"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, CircleDot } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";

export default function RecordPage() {
  const [cameraFilter, setCameraFilter] = useState("Raw");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraZoom, setCameraZoom] = useState("1x");
  const [flashActive, setFlashActive] = useState(false);

  return (
    <motion.div
      key="record-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col justify-between min-h-0"
    >
      <div
        style={glassStyle(0.04, 20, 0.08)}
        className="flex-1 rounded-2xl p-3 flex flex-col justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 z-0 bg-neutral-900/40 border border-white/5 flex flex-col justify-between p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-white text-[9px] font-mono">
              <CircleDot
                size={8}
                className={`${isRecording ? "text-red-500 animate-pulse" : "text-white"}`}
              />
              <span>{isRecording ? "REC 00:08" : "STANDBY"}</span>
            </div>
            <button
              onClick={() => setFlashActive(!flashActive)}
              className={`p-1.5 rounded-full bg-black/40 border border-white/10 text-[9px] ${flashActive ? "text-amber-400" : "text-white"}`}
            >
              ⚡ FLASH {flashActive ? "ON" : "OFF"}
            </button>
          </div>

          <div className="absolute inset-x-8 inset-y-12 border border-white/5 border-dashed pointer-events-none" />

          <div className="absolute left-3.5 bottom-12 flex flex-col gap-[2px] w-2.5 h-20 bg-black/30 rounded-full p-[2px] justify-end overflow-hidden border border-white/10">
            {[1, 2, 3, 4, 5, 6].map((bar) => (
              <div
                key={bar}
                className={`w-full h-2 rounded-[1px] transition-colors ${
                  isRecording ? (bar > 4 ? "bg-red-500" : "bg-emerald-400") : "bg-neutral-600"
                }`}
              />
            ))}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <Camera size={26} className="text-white/40 mb-1" />
            <span className="text-[10px] text-white/50 tracking-wide bg-black/20 px-2 py-0.5 rounded-full uppercase font-mono">
              Lens {cameraFilter}
            </span>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
              {["0.5x", "1x", "2x"].map((zoom) => (
                <button
                  key={zoom}
                  onClick={() => setCameraZoom(zoom)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{
                    background: cameraZoom === zoom ? "#e07c30" : "transparent",
                    color: cameraZoom === zoom ? "#000" : "#fff",
                  }}
                >
                  {zoom}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsRecording(!isRecording)}
              className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-black/40"
            >
              <motion.div
                animate={{
                  scale: isRecording ? 0.85 : 1,
                  borderRadius: isRecording ? "4px" : "9999px",
                }}
                className="w-7 h-7 bg-red-500"
              />
            </button>

            <div className="flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
              {["Raw", "Vivid", "Noir"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCameraFilter(filter)}
                  className="text-[8px] px-2 py-1 rounded-full text-white/70"
                  style={{
                    background:
                      cameraFilter === filter ? "rgba(255,255,255,0.15)" : "transparent",
                    color: cameraFilter === filter ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
