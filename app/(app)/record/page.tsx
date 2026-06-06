"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CircleDot, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { getOrCreateTodayAssignment, getSignedUploadUrl, createClip } from "@/actions/vlog";

export default function RecordPage() {
  const [cameraFilter, setCameraFilter] = useState("Raw");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraZoom, setCameraZoom] = useState("1x");
  const [flashActive, setFlashActive] = useState(false);
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Load today's assignment and listen to active group events
  useEffect(() => {
    async function checkTurn() {
      const activeGroupId = localStorage.getItem("active_group_id");
      if (!activeGroupId) {
        setError("Please choose or join a group first.");
        setLoadingAssignment(false);
        return;
      }

      setLoadingAssignment(true);
      const res = await getOrCreateTodayAssignment(activeGroupId);
      setLoadingAssignment(false);

      if (res.error) {
        setError(res.error);
        setAssignment(null);
      } else {
        setAssignment(res.assignment);
        setError(""); // Clear previous errors
      }
    }
    
    checkTurn();

    window.addEventListener("group-changed", checkTurn);
    return () => window.removeEventListener("group-changed", checkTurn);
  }, []);

  // Request camera and microphone access
  useEffect(() => {
    async function setupCamera() {
      if (assignment) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access failed:", err);
          setError("Could not access camera or microphone. Please grant access permissions.");
        }
      }
    }
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [assignment]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      await handleVideoUpload(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVideoUpload = async (videoBlob: Blob) => {
    try {
      setIsUploading(true);
      const activeGroupId = localStorage.getItem("active_group_id");
      if (!activeGroupId || !assignment) {
        setError("Invalid state. Missing parameters.");
        return;
      }

      // Generate preset paths and pre-signed urls for raw storage upload
      const fileName = `${Date.now()}-vlog.webm`;
      const res = await getSignedUploadUrl(activeGroupId, assignment.id, fileName);

      if (res.error || !res.signedUrl || !res.path) {
        throw new Error(res.error || "Failed to generate signed url.");
      }

      // Upload file directly using the pre-signed URL to bypass Next.js payload limits
      const uploadRes = await fetch(res.signedUrl, {
        method: "PUT",
        body: videoBlob,
        headers: {
          "Content-Type": "video/webm",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to save recording blob directly into Supabase Storage.");
      }

      // Record Clip database entry linking assignments and bucket URLs
      const clipRes = await createClip({
        groupId: activeGroupId,
        assignmentId: assignment.id,
        videoUrl: res.path,
        thumbnailUrl: res.path, // Reusing the main path for simulated thumbnail for consistency
      });

      if (clipRes.error) {
        throw new Error(clipRes.error);
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to upload video clip.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingAssignment) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-white/50">
        <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
        <span className="text-[12px] font-medium tracking-wide">Checking your daily turn...</span>
      </div>
    );
  }

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
          
          {/* Main camera preview or error feedback overlay */}
          {error ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/80">
              <AlertCircle size={40} className="text-[#e07c30] mb-3" />
              <p className="text-white font-bold text-sm mb-1">Upload Blocked</p>
              <p className="text-white/50 text-xs leading-relaxed max-w-[240px]">{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover z-0 rounded-2xl"
            />
          )}

          {isUploading && (
            <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
              <span className="text-white text-xs font-bold">Uploading your update...</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="absolute inset-0 z-30 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <Sparkles size={40} className="text-emerald-400 mb-3 animate-pulse" />
              <span className="text-white text-sm font-bold">Vlog Uploaded Successfully! 🎉</span>
              <span className="text-white/60 text-xs mt-1">Your group has been notified.</span>
            </div>
          )}

          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-white text-[9px] font-mono">
              <CircleDot
                size={8}
                className={`${isRecording ? "text-red-500 animate-pulse" : "text-white"}`}
              />
              <span>{isRecording ? "REC 00:08" : "STANDBY"}</span>
            </div>
            <button
              onClick={() => setFlashActive(!flashActive)}
              className={`p-1.5 rounded-full bg-black/40 border border-white/10 text-[9px] z-10 ${flashActive ? "text-amber-400" : "text-white"}`}
            >
              ⚡ FLASH {flashActive ? "ON" : "OFF"}
            </button>
          </div>

          <div className="absolute inset-x-8 inset-y-12 border border-white/5 border-dashed pointer-events-none z-10" />

          <div className="absolute left-3.5 bottom-12 flex flex-col gap-[2px] w-2.5 h-20 bg-black/30 rounded-full p-[2px] justify-end overflow-hidden border border-white/10 z-10">
            {[1, 2, 3, 4, 5, 6].map((bar) => (
              <div
                key={bar}
                className={`w-full h-2 rounded-[1px] transition-colors ${
                  isRecording ? (bar > 4 ? "bg-red-500" : "bg-emerald-400") : "bg-neutral-600"
                }`}
              />
            ))}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <Camera size={26} className="text-white/40 mb-1" />
            <span className="text-[10px] text-white/50 tracking-wide bg-black/20 px-2 py-0.5 rounded-full uppercase font-mono">
              Lens {cameraFilter}
            </span>
          </div>

          <div className="flex items-center justify-between mt-auto z-10 w-full">
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
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!error || isUploading}
              className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-black/40 disabled:opacity-50"
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