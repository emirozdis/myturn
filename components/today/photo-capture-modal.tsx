// ./components/today/photo-capture-modal.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Zap, ZapOff, Send, Loader2, ChevronLeft } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";

type PhotoCaptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (blob: Blob) => void;
  uploading: boolean;
};

export function PhotoCaptureModal({ isOpen, onClose, onUpload, uploading }: PhotoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    let active = true;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied or failed", err);
      }
    }

    setupCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [previewBlob]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) setPreviewBlob(blob);
      }, "image/jpeg", 0.85);
    }
  }, []);

  const handleCaptureClick = () => {
    if (flashActive) {
      setIsFlashing(true);
      setTimeout(() => {
        captureFrame();
        setTimeout(() => setIsFlashing(false), 50);
      }, 150);
    } else {
      captureFrame();
    }
  };

  const handleRetake = () => {
    setPreviewBlob(null);
  };

  const handleSend = () => {
    if (previewBlob) {
      onUpload(previewBlob);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 26, stiffness: 260 }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerCancel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden touch-none"
    >
      {/* Viewfinder / Preview Container */}
      <div className="absolute inset-0 z-0">
        {!previewBlob ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          />
        ) : (
          <img 
            src={previewUrl!} 
            alt="Preview" 
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          />
        )}
      </div>

      {/* Screen Flash Overlay */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="absolute inset-0 bg-white z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Dynamic Header Controls */}
      <div 
        className="absolute top-0 inset-x-0 p-4 z-30 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 1.25rem))" }}
      >
        {!previewBlob ? (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto border border-white/10"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={handleRetake}
            disabled={uploading}
            style={glassStyle(0.08, 16, 0.12)}
            className="px-4 py-2 rounded-full text-white font-bold text-xs flex items-center gap-1.5 hover:bg-white/10 transition-colors disabled:opacity-50 pointer-events-auto"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            Retake
          </button>
        )}
        
        {previewBlob && (
          <span className="text-white/90 font-extrabold text-[13px] tracking-wide drop-shadow-md">
            Photo Response
          </span>
        )}

        <div className="w-10 flex justify-end">
          {!previewBlob && (
            <button
              onClick={() => setFlashActive(!flashActive)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto border border-white/10"
            >
              {flashActive ? (
                <Zap size={16} className="text-amber-400 fill-amber-400" />
              ) : (
                <ZapOff size={16} className="text-white/60" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Bottom Controls */}
      <div className="absolute bottom-0 inset-x-0 p-6 pb-10 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center pointer-events-none">
        {!previewBlob ? (
          /* Capture Shutter Button */
          <button
            onClick={handleCaptureClick}
            disabled={!hasPermission}
            className="w-20 h-20 rounded-full border-[4px] border-white flex items-center justify-center bg-transparent focus:outline-none active:scale-95 transition-transform pointer-events-auto disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
          </button>
        ) : (
          /* Premium Send Action Dock */
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSend}
            disabled={uploading}
            style={{ ...glassStyle(0.1, 20, 0.15), background: uploading ? "rgba(224,124,48,0.5)" : ACCENT }}
            className="w-full max-w-[260px] py-4 rounded-full text-black font-extrabold text-[15px] flex items-center justify-center gap-2 pointer-events-auto disabled:opacity-50 shadow-[0_8px_32px_rgba(224,124,48,0.4)] transition-all border border-[#ffffff]/20"
          >
            {uploading ? (
               <>
                 <Loader2 size={18} className="animate-spin text-black" />
                 Publishing...
               </>
            ) : (
               <>
                 Send to Group
                 <Send size={16} className="ml-1" />
               </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}