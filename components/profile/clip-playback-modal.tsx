// ./components/profile/clip-playback-modal.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, X } from "lucide-react";
import { useHls } from "@/components/shared/use-hls";
import { PhotoResponsesOverlay } from "@/components/shared/photo-responses-overlay";

type ClipPlaybackModalProps = {
  clip: any;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
};

export function ClipPlaybackModal({ clip, deleting, onDelete, onClose }: ClipPlaybackModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [disableAbr, setDisableAbr] = useState(false);

  // Sync state to prevent hydration mismatches and guarantee responsive ABR toggling tracking
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDisableAbr(localStorage.getItem("disable_abr") === "true");
    }
  }, []);
  
  const activeUrl = (!disableAbr && clip?.hlsUrl) ? clip.hlsUrl : clip?.videoUrl;

  const isFrontFacing = clip?.metadata ? (() => {
    try {
      const meta = JSON.parse(clip.metadata);
      return meta.facingMode !== "environment";
    } catch {
      return true;
    }
  })() : true;

  useHls(videoRef, activeUrl);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
      className="absolute inset-0 z-50 bg-black flex flex-col justify-between"
    >
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onTimeUpdate={(e) => {
            // Guarantee transition happens only AFTER first real frame is painted by the GPU
            if (e.currentTarget.currentTime > 0) {
              setIsVideoLoaded(true);
            }
            const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
            if (!isNaN(progress)) setVideoProgress(progress);

            // DYNAMIC SPEED MULTIPLIER PARSING FOR HISTORICAL PROFILE ARCHIVES
            try {
              const metadata = clip?.metadata ? JSON.parse(clip.metadata) : null;
              const segs = metadata?.speedSegments;
              if (segs && segs.length > 0) {
                const ct = e.currentTarget.currentTime;
                const activeSeg = [...segs].reverse().find((s: any) => ct >= s.start);
                const targetSpeed = activeSeg ? activeSeg.speed : 1;
                if (videoRef.current && videoRef.current.playbackRate !== targetSpeed) {
                  videoRef.current.playbackRate = targetSpeed;
                }
              }
            } catch (err) {}
          }}
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play().catch(() => {});
          }}
          className={`absolute inset-0 w-full h-full object-cover z-0 ${isFrontFacing ? "-scale-x-100" : ""}`}
        />
        <AnimatePresence>
          {!isVideoLoaded && (clip?.thumbnailBlurUrl || clip?.thumbnailUrl) && (
            <motion.img
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={clip.thumbnailBlurUrl || clip.thumbnailUrl}
              alt="Loading vlog..."
              className={`absolute inset-0 w-full h-full object-cover z-10 blur-xl scale-[1.06] pointer-events-none ${isFrontFacing ? "-scale-x-100" : ""}`}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />
      
      <PhotoResponsesOverlay 
        responses={clip?.photoResponses || []} 
        videoProgress={videoProgress}
      />

      <div className="relative z-20 p-4 pt-12 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold tracking-tight drop-shadow-md">
            {new Date(clip.recordedAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </span>
          <span className="text-white/60 text-xs font-medium">{clip.location || "Earth"}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-10 h-10 bg-black/40 backdrop-blur rounded-full text-white/80 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition border border-white/10"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-black/40 backdrop-blur rounded-full text-white font-extrabold flex items-center justify-center hover:bg-white/20 transition border border-white/10"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="relative z-20 p-6 mt-auto text-center pointer-events-none">
        <span className="text-white/50 text-[11px] font-medium tracking-wide uppercase">Historical Archive</span>
      </div>
    </motion.div>
  );
}