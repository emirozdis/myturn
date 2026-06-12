"use client";

import { motion } from "framer-motion";
import { CircleDot, RefreshCcw, Zap, AlertCircle } from "lucide-react";

type CameraViewProps = {
  setVideoRef: (el: HTMLVideoElement | null) => void;
  facingMode: "user" | "environment";
  isRecording: boolean;
  recordTime: number;
  isTurnAuthorized: boolean;
  error: string;
  isUploading: boolean;
  zoomSupported: boolean;
  cameraZoom: string;
  flashActive: boolean;
  onToggleCamera: () => void;
  onToggleFlash: () => void;
  onZoom: (zoom: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

export function CameraView({
  setVideoRef,
  facingMode,
  isRecording,
  recordTime,
  isTurnAuthorized,
  error,
  isUploading,
  zoomSupported,
  cameraZoom,
  flashActive,
  onToggleCamera,
  onToggleFlash,
  onZoom,
  onStartRecording,
  onStopRecording,
}: CameraViewProps) {
  return (
    <motion.div
      key="camera-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 flex flex-col justify-between z-10 bg-black/20"
    >
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-transform ${facingMode === "user" ? "-scale-x-100" : ""}`}
      />

      <div className="absolute inset-x-8 inset-y-12 border border-white/5 border-dashed pointer-events-none z-10" />

      {!isTurnAuthorized && error && (
        <div
          style={{ marginTop: "max(12px, env(safe-area-inset-top, 12px))" }}
          className="absolute top-4 inset-x-4 z-20 p-3 bg-red-950/80 backdrop-blur-md border border-red-500/20 rounded-2xl flex items-center gap-2.5 shadow-lg"
        >
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-white text-[11px] font-semibold leading-tight">{error}</p>
        </div>
      )}

      <div
        style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
        className="flex items-center justify-between z-10 p-4"
      >
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[11px] font-mono shadow-md">
          <CircleDot
            size={10}
            className={`${isRecording ? "text-red-500 animate-pulse" : "text-white"}`}
          />
          <span>{isRecording ? `REC 00:${String(recordTime).padStart(2, "0")}` : "STANDBY"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleCamera} className="p-2 rounded-full bg-black/40 border border-white/10 text-white backdrop-blur shadow-md hover:bg-white/10 transition">
            <RefreshCcw size={14} />
          </button>
          <button onClick={onToggleFlash} className={`p-2 rounded-full bg-black/40 border border-white/10 backdrop-blur shadow-md hover:bg-white/10 transition ${flashActive ? "text-amber-400" : "text-white"}`}>
            <Zap size={14} />
          </button>
        </div>
      </div>

      <div className="absolute left-3.5 bottom-12 flex flex-col gap-[2px] w-2.5 h-24 bg-black/30 rounded-full p-[2px] justify-end overflow-hidden border border-white/10 z-10 shadow-md">
        {[1, 2, 3, 4, 5, 6].map((bar) => {
          const isActive = isRecording && (recordTime / 10 >= bar - 1);
          return (
            <div
              key={bar}
              className={`w-full h-2 rounded-[1px] transition-colors duration-300 ${
                isActive ? (bar > 4 ? "bg-red-500" : "bg-emerald-400") : "bg-neutral-600"
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-auto z-10 w-full p-4">
        {zoomSupported ? (
          <div className="flex gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-md">
            {["0.5x", "1x", "2x"].map((zoom) => (
              <button
                key={zoom}
                onClick={() => onZoom(zoom)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors"
                style={{
                  background: cameraZoom === zoom ? "#e07c30" : "transparent",
                  color: cameraZoom === zoom ? "#000" : "#fff",
                }}
              >
                {zoom}
              </button>
            ))}
          </div>
        ) : <div className="w-[84px]" />}

        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={!isTurnAuthorized || isUploading}
          className="w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center bg-black/40 disabled:opacity-30 shadow-xl relative focus:outline-none"
        >
          <motion.div
            animate={{
              scale: isRecording ? 0.6 : 1,
              borderRadius: isRecording ? "8px" : "9999px",
            }}
            className="w-10 h-10 bg-red-500"
          />
        </button>

        <div className="w-[84px]" />
      </div>
    </motion.div>
  );
}
