"use client";

import { motion } from "framer-motion";
import { Loader2, Trash2, X } from "lucide-react";

type ClipPlaybackModalProps = {
  clip: any;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
};

export function ClipPlaybackModal({ clip, deleting, onDelete, onClose }: ClipPlaybackModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
      className="absolute inset-0 z-50 bg-black flex flex-col justify-between"
    >
      <video
        src={clip.videoUrl}
        autoPlay
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />

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
