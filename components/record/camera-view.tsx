// ./components/record/camera-view.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleDot,
  RefreshCw,
  Zap,
  ZapOff,
  Gauge,
  AlertCircle,
  Play,
  Pause,
  Mic,
  Sliders,
  X
} from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";

type CameraViewProps = {
  setVideoRef: (el: HTMLVideoElement | null) => void;
  stream: MediaStream | null;
  facingMode: "user" | "environment";
  videoTrack: MediaStreamTrack | null;
  isRecording: boolean;
  isPaused: boolean;
  recordTime: number;
  isTurnAuthorized: boolean;
  error: string;
  isUploading: boolean;
  zoomSupported: boolean;
  setZoomSupported: (val: boolean) => void;
  cameraZoom: string;
  flashActive: boolean;
  currentSpeed: number;
  onToggleSpeed: () => void;
  onToggleCamera: () => void;
  onToggleFlash: () => void;
  onZoom: (zoom: string) => void;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
};

// Shared spring config for all pill morphing — feels like liquid metal
const PILL_SPRING = { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.8 };
// Slightly softer for content fade-ins inside the pill
const CONTENT_SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.7 };

export function CameraView({
  setVideoRef,
  stream,
  facingMode,
  videoTrack,
  isRecording,
  isPaused,
  recordTime,
  isTurnAuthorized,
  error,
  isUploading,
  zoomSupported,
  setZoomSupported,
  cameraZoom,
  flashActive,
  currentSpeed,
  onToggleSpeed,
  onToggleCamera,
  onToggleFlash,
  onZoom,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
}: CameraViewProps) {
  const [activeBars, setActiveBars] = useState(0);
  const [availableZooms, setAvailableZooms] = useState<string[]>(["1x"]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prevRecordingRef = useRef(isRecording);

  // Auto-collapse tools menu only at the exact moment recording begins
  useEffect(() => {
    if (isRecording && !prevRecordingRef.current) {
      setIsMenuOpen(false);
    }
    prevRecordingRef.current = isRecording;
  }, [isRecording]);

  // Pull advanced camera zoom constraints and properties
  useEffect(() => {
    if (videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities() as any;
        const zooms = [];
        if ("zoom" in capabilities) {
          const min = capabilities.zoom?.min || 1;
          const max = capabilities.zoom?.max || 1;
          if (min <= 0.5) zooms.push("0.5x");
          zooms.push("1x");
          if (max >= 2) zooms.push("2x");
          if (max >= 3) zooms.push("3x");
        } else {
          zooms.push("1x");
        }
        setAvailableZooms(zooms);
        setZoomSupported(zooms.length > 1);

        if (!zooms.includes(cameraZoom)) {
          onZoom("1x");
        }
      } catch (e) {
        setAvailableZooms(["1x"]);
        setZoomSupported(false);
      }
    }
  }, [videoTrack, facingMode, setZoomSupported, cameraZoom, onZoom]);

  // Audio frequency analyser for dynamic microphone level feedback
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
      const bars = Math.round(volume * 8);
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
      {/* Viewfinder Video Stream */}
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-transform ${
          facingMode === "user" ? "-scale-x-100" : ""
        }`}
      />

      {/* Front Camera Flash Ring Fill Light Overlay */}
      <AnimatePresence>
        {facingMode === "user" && flashActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "radial-gradient(circle, transparent 35%, rgba(255, 253, 245, 0.45) 65%, rgba(255, 253, 245, 0.95) 100%)",
              boxShadow: "inset 0 0 120px rgba(255, 253, 245, 0.95)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Grid Alignment Guides */}
      <div className="absolute inset-x-8 inset-y-12 border border-white/5 border-dashed pointer-events-none z-10" />

      {/* Top Header Status Section */}
      <div
        style={{ paddingTop: "max(8px, env(safe-area-inset-top, 8px))" }}
        className="absolute top-2 left-4 z-20"
      >
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs font-mono shadow-lg"
            >
              <CircleDot
                size={12}
                className={`${isPaused ? "text-amber-500" : "text-red-500 animate-pulse"}`}
              />
              <span className="font-extrabold tracking-wide uppercase">
                {isPaused ? `PAUSED • ${formatTime(recordTime)}` : `REC • ${formatTime(recordTime)}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*
        ─── Liquid Morphing Tools Pill ───────────────────────────────────────
        Strategy: single persistent pill with `layout` on the container.
        No AnimatePresence mode="wait" — content is conditionally rendered
        but shares the same DOM parent so Framer can interpolate width/height
        as a single continuous layout animation (true liquid morph).
        overflow-hidden clips during the squeeze/stretch.
      ──────────────────────────────────────────────────────────────────────── */}
      <motion.div
        layout
        transition={PILL_SPRING}
        style={{ top: 8, ...glassStyle(0.04, 12, 0.08) }}
        className="absolute left-1/2 -translate-x-1/2 z-30 rounded-full border border-white/5 shadow-xl select-none overflow-hidden"
      >
        {/* Inner row — always rendered, items switch via AnimatePresence */}
        <div className="flex items-center h-10 px-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isMenuOpen ? (
              /* ── Collapsed: "Tools" trigger ── */
              <motion.div
                key="collapsed"
                layout
                initial={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
                transition={{ ...CONTENT_SPRING, duration: 0.18 }}
                className="flex items-center"
              >
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
                  title="Expand Tools"
                >
                  <Sliders size={13} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Tools</span>
                </button>
                {/* Active state badges — siblings of the button so pill layout detects width change */}
                <AnimatePresence>
                  {(flashActive || currentSpeed !== 1) && (
                    <motion.div
                      key="badges"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ ...CONTENT_SPRING, duration: 0.2 }}
                      className="flex items-center gap-1 pr-3 overflow-hidden"
                    >
                      <div className="w-[1px] h-3 bg-white/20" />
                      {flashActive && (
                        <Zap size={11} className="text-amber-400 fill-amber-400" />
                      )}
                      {currentSpeed !== 1 && (
                        <span className="text-[9px] font-black text-[#e07c30] uppercase tracking-wider whitespace-nowrap">
                          {currentSpeed}x
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ── Expanded: full tool strip ── */
              <motion.div
                key="expanded"
                layout
                initial={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
                transition={{ ...CONTENT_SPRING, duration: 0.18 }}
                className="flex items-center gap-1"
              >
                {/* Flip Camera */}
                <motion.button
                  layout
                  transition={PILL_SPRING}
                  onClick={onToggleCamera}
                  disabled={isRecording}
                  className="flex items-center gap-1 px-2.5 h-8 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white disabled:opacity-35 cursor-pointer"
                  title="Flip Camera Mode"
                >
                  <RefreshCw size={12} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Flip</span>
                </motion.button>

                {/* Flash Toggle */}
                <motion.button
                  layout
                  transition={PILL_SPRING}
                  onClick={onToggleFlash}
                  className="flex items-center gap-1 px-2.5 h-8 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
                  title="Toggle Flash Light"
                >
                  {flashActive ? (
                    <Zap size={12} className="text-amber-400 fill-amber-400" />
                  ) : (
                    <ZapOff size={12} className="text-white/60" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-wider">Flash</span>
                </motion.button>

                {/* Speed */}
                <motion.button
                  layout
                  transition={PILL_SPRING}
                  onClick={onToggleSpeed}
                  disabled={isRecording && !isPaused}
                  className="flex items-center gap-1 px-2.5 h-8 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white disabled:opacity-35 cursor-pointer"
                  title="Adjust Speed Multiplier"
                >
                  <Gauge size={12} className={currentSpeed === 2 ? "text-[#e07c30]" : "text-white"} />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {currentSpeed === 2 ? "2x" : "1x"}
                  </span>
                </motion.button>

                {/* Divider */}
                <motion.div
                  layout
                  transition={PILL_SPRING}
                  className="w-[1px] h-4 bg-white/10 mx-0.5 flex-shrink-0"
                />

                {/* Collapse */}
                <motion.button
                  layout
                  transition={PILL_SPRING}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
                  title="Collapse Tools"
                >
                  <X size={12} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Error / Warnings HUD */}
      {isTurnAuthorized && error && !isRecording && (
        <div
          style={{ marginTop: "max(14px, env(safe-area-inset-top, 14px))" }}
          className="absolute top-16 inset-x-4 z-20 p-3 bg-red-950/80 backdrop-blur-md border border-red-500/20 rounded-2xl flex items-start gap-2.5 shadow-lg animate-fade-in"
        >
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-white text-xs font-semibold leading-tight">{error}</p>
        </div>
      )}

      {/* Left-Side Audio Spectrum */}
      <div className="absolute left-4 top-[180px] flex flex-col items-center gap-2.5 z-20">
        <div className="text-white/40 flex items-center justify-center mb-1 flex-shrink-0">
          <Mic size={14} className={activeBars > 0 ? "text-[#e07c30] animate-pulse" : "text-white/40"} />
        </div>
        {[8, 7, 6, 5, 4, 3, 2, 1].map((bar) => {
          const isActive = bar <= activeBars;
          return (
            <motion.div
              key={bar}
              animate={{
                backgroundColor: isActive ? (bar > 6 ? "#ef4444" : "#e07c30") : "rgba(255, 255, 255, 0.15)",
              }}
              transition={{ duration: 0.08 }}
              className="w-1.5 h-4 rounded-full"
              style={{
                boxShadow: isActive ? `0 0 10px ${bar > 6 ? "rgba(239,68,68,0.6)" : "rgba(224,124,48,0.6)"}` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Zoom Dial */}
      {zoomSupported && (
        <div className="absolute bottom-[92px] left-1/2 -translate-x-1/2 z-20 flex gap-2.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg">
          {availableZooms.map((zoom) => {
            const isActive = cameraZoom === zoom;
            return (
              <button
                key={zoom}
                onClick={() => onZoom(zoom)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all active:scale-90 cursor-pointer"
                style={{
                  background: isActive ? "#e07c30" : "transparent",
                  color: isActive ? "#000" : "rgba(255, 255, 255, 0.7)",
                  border: isActive ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}
              >
                {zoom}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Shutter Controls Bar */}
      <div className="flex items-center justify-between mt-auto z-10 w-full p-6 pb-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
        <div className="w-14 h-14" />

        <div className="relative flex items-center justify-center">
          {isRecording && recordTime >= 105 && (
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-white font-bold text-[10px] tracking-wide whitespace-nowrap bg-red-600/90 px-3 py-1 rounded-full backdrop-blur-md border border-red-500/50 shadow-md animate-pulse">
              {120 - recordTime}s remaining
            </span>
          )}

          <AnimatePresence>
            {isRecording && (
              <motion.button
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={isPaused ? onResumeRecording : onPauseRecording}
                className="absolute -left-16 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xl focus:outline-none hover:bg-black/80 transition"
              >
                {isPaused ? (
                  <Play size={15} className="ml-1 fill-white" />
                ) : (
                  <Pause size={15} className="fill-white" />
                )}
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={!isTurnAuthorized || isUploading}
            className="w-16 h-14 rounded-full border-[3px] border-white flex items-center justify-center bg-black/20 disabled:opacity-30 shadow-2xl relative focus:outline-none active:scale-95 transition-transform"
          >
            <motion.div
              animate={{
                scale: isRecording ? 0.6 : 1,
                borderRadius: isRecording ? "8px" : "9999px",
                width: isRecording ? "24px" : "40px",
                height: isRecording ? "24px" : "40px",
              }}
              className="bg-red-500"
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            />
          </button>
        </div>

        <div className="w-14 h-14" />
      </div>
    </motion.div>
  );
}