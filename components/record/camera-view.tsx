// ./components/record/camera-view.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleDot, RefreshCcw, Zap, AlertCircle, Play, Pause } from "lucide-react";

type CameraViewProps = {
  setVideoRef: (el: HTMLVideoElement | null) => void;
  stream: MediaStream | null;
  facingMode: "user" | "environment";
  isRecording: boolean;
  isPaused: boolean;
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
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
};

export function CameraView({
  setVideoRef,
  stream,
  facingMode,
  isRecording,
  isPaused,
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
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
}: CameraViewProps) {
  const [activeBars, setActiveBars] = useState(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setActiveBars(0);
      return;
    }

    let audioCtx: AudioContext;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      return;
    }

    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;
    try {
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (err) {
      console.error("Audio analysis setup failed:", err);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let rafId: number;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      const binsToCheck = 32; 
      for (let i = 0; i < binsToCheck; i++) {
        sum += dataArray[i];
      }
      const avg = sum / binsToCheck;
      
      const volume = Math.min(1, avg / 100); 
      const bars = Math.round(volume * 6);
      setActiveBars(bars);

      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      try { source.disconnect(); } catch (e) {}
      try { audioCtx.close().catch(() => {}); } catch (e) {}
    };
  }, [stream]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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

      {/* Show the <5s error if triggered after hitting stop */}
      {isTurnAuthorized && error && !isRecording && (
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
        {isRecording ? (
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[11px] font-mono shadow-md">
            <CircleDot
              size={10}
              className={`${isPaused ? "text-amber-500" : "text-red-500 animate-pulse"}`}
            />
            <span>{isPaused ? `PAUSED ${formatTime(recordTime)}` : `REC ${formatTime(recordTime)}`}</span>
          </div>
        ) : (
          <div /> 
        )}
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleCamera} 
            disabled={isRecording}
            className={`p-2 rounded-full bg-black/40 border border-white/10 text-white backdrop-blur shadow-md transition ${isRecording ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10"}`}
          >
            <RefreshCcw size={14} />
          </button>
          <button onClick={onToggleFlash} className={`p-2 rounded-full bg-black/40 border border-white/10 backdrop-blur shadow-md hover:bg-white/10 transition ${flashActive ? "text-amber-400" : "text-white"}`}>
            <Zap size={14} />
          </button>
        </div>
      </div>

      <div className="absolute left-3.5 bottom-12 flex flex-col gap-[2px] w-2.5 h-24 bg-black/30 rounded-full p-[2px] justify-end overflow-hidden border border-white/10 z-10 shadow-md">
        {[6, 5, 4, 3, 2, 1].map((bar) => {
          const isActive = bar <= activeBars;
          return (
            <div
              key={bar}
              className={`w-full h-2 rounded-[1px] transition-colors duration-75 ${
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

        <div className="relative flex items-center justify-center">
          {isRecording && recordTime >= 105 && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-white font-bold text-[10px] tracking-wide whitespace-nowrap bg-red-600/90 px-2.5 py-1 rounded-full backdrop-blur-md border border-red-500/50 shadow-md animate-pulse">
              {120 - recordTime}s remaining
            </span>
          )}

          <AnimatePresence>
            {isRecording && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={isPaused ? onResumeRecording : onPauseRecording}
                className="absolute -left-16 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xl focus:outline-none"
              >
                {isPaused ? <Play size={14} className="ml-0.5 fill-white" /> : <Pause size={14} className="fill-white" />}
              </motion.button>
            )}
          </AnimatePresence>

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
        </div>

        <div className="w-[84px]" />
      </div>
    </motion.div>
  );
}