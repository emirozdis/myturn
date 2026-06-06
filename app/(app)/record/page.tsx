"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, CircleDot, Loader2, Sparkles, AlertCircle, RefreshCcw, Zap, MapPin } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { getOrCreateTodayAssignment, getSignedUploadUrls, createClip } from "@/actions/vlog";

export default function RecordPage() {
  const [step, setStep] = useState<"CAMERA" | "PREVIEW">("CAMERA");
  const [cameraFilter, setCameraFilter] = useState("Raw");
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [cameraZoom, setCameraZoom] = useState("1x");
  const [flashActive, setFlashActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [locationName, setLocationName] = useState("Earth");

  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Load today's assignment
  const checkTurn = async (targetGroupId?: any) => {
    let activeGroupId = typeof targetGroupId === "string" ? targetGroupId : null;
    if (!activeGroupId && typeof window !== "undefined") {
      activeGroupId = localStorage.getItem("active_group_id");
    }
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
      setError("");
    }
  };

  // Initial load
  useEffect(() => {
    checkTurn();

    const handleGroupChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        checkTurn(customEvent.detail);
      }
    };

    window.addEventListener("group-changed", handleGroupChange);
    return () => window.removeEventListener("group-changed", handleGroupChange);
  }, []);

  // Request camera access and get live location
  useEffect(() => {
    async function setupCamera() {
      if (assignment && step === "CAMERA") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: true,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          const track = stream.getVideoTracks()[0];
          setVideoTrack(track);

          // Attempt getting location async
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                const data = await res.json();
                const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Earth";
                setLocationName(city);
              } catch (e) {
                setLocationName("Earth");
              }
            }, () => setLocationName("Earth"));
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
  }, [assignment, step, facingMode]);

  // Handle maximum 60s recording threshold timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTime((t) => {
          if (t >= 59) {
            stopRecording();
            return 60;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleFlash = async () => {
    const next = !flashActive;
    setFlashActive(next);
    if (videoTrack) {
      try {
        await videoTrack.applyConstraints({ advanced: [{ torch: next }] as any });
      } catch (e) {
        console.warn("Torch constraint not supported", e);
      }
    }
  };

  const handleZoom = async (zoomStr: string) => {
    setCameraZoom(zoomStr);
    if (videoTrack) {
      const val = parseFloat(zoomStr);
      try {
        await videoTrack.applyConstraints({ advanced: [{ zoom: val }] as any });
      } catch (e) {
        console.warn("Zoom constraint not supported", e);
      }
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    let mimeType = "video/webm;codecs=vp8,opus";
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4"; // MP4 fallback target for iOS Safari compatibility
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 3000000, // Boost video quality threshold limit to 3 Mbps target
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setStep("PREVIEW");
      setIsRecording(false);
      setRecordTime(0);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const generateThumbnail = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoBlob);
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, video.duration / 2);
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/jpeg", 0.8);
      };
      video.onerror = reject;
    });
  };

  const handlePublish = async () => {
    try {
      setIsUploading(true);
      const activeGroupId = localStorage.getItem("active_group_id");
      if (!activeGroupId || !assignment || !recordedBlob) {
        setError("Invalid state. Missing parameters.");
        return;
      }

      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const res = await getSignedUploadUrls(activeGroupId, assignment.id, ext);

      if (res.error || !res.video || !res.thumbnail) {
        throw new Error(res.error || "Failed to generate signed urls.");
      }

      // Execute Direct Chunk Video Upload mapping against Cloud Node Signed Links
      const videoUploadRes = await fetch(res.video.url, {
        method: "PUT",
        body: recordedBlob,
        headers: { "Content-Type": recordedBlob.type },
      });

      if (!videoUploadRes.ok) throw new Error("Failed to save video clip.");

      // Intercept blob matrix to fetch static frame thumbnail canvas references
      const thumbBlob = await generateThumbnail(recordedBlob);
      const thumbUploadRes = await fetch(res.thumbnail.url, {
        method: "PUT",
        body: thumbBlob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!thumbUploadRes.ok) throw new Error("Failed to save frame thumbnail.");

      // Record Clip database entry linking assignments and distinct bucket URLs
      const clipRes = await createClip({
        groupId: activeGroupId,
        assignmentId: assignment.id,
        videoUrl: res.video.path,
        thumbnailUrl: res.thumbnail.path,
        location: locationName,
      });

      if (clipRes.error) throw new Error(clipRes.error);

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setRecordedBlob(null);
        setStep("CAMERA");
      }, 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to publish vlog format clip.");
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
        className="flex-1 rounded-2xl p-0 flex flex-col justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 z-0 bg-neutral-900/40 border border-white/5 flex flex-col justify-between p-0">
          
          {error && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-black/80">
              <AlertCircle size={40} className="text-[#e07c30] mb-3" />
              <p className="text-white font-bold text-sm mb-1">Upload Blocked</p>
              <p className="text-white/50 text-xs leading-relaxed max-w-[240px]">{error}</p>
            </div>
          )}

          {/* ACTIVE RECORDING COMPOSITOR LAYER */}
          {step === "CAMERA" && !error && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              
              <div className="absolute inset-x-8 inset-y-12 border border-white/5 border-dashed pointer-events-none z-10" />

              <div className="flex items-center justify-between z-10 p-4">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[11px] font-mono shadow-md">
                  <CircleDot
                    size={10}
                    className={`${isRecording ? "text-red-500 animate-pulse" : "text-white"}`}
                  />
                  <span>{isRecording ? `REC 00:${String(recordTime).padStart(2, "0")}` : "STANDBY"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleCamera} className="p-2 rounded-full bg-black/40 border border-white/10 text-white backdrop-blur shadow-md hover:bg-white/10 transition">
                    <RefreshCcw size={14} />
                  </button>
                  <button onClick={toggleFlash} className={`p-2 rounded-full bg-black/40 border border-white/10 backdrop-blur shadow-md hover:bg-white/10 transition ${flashActive ? "text-amber-400" : "text-white"}`}>
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

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
                <Camera size={26} className="text-white/40 mb-1" />
                <span className="text-[10px] text-white/50 tracking-wide bg-black/20 px-2 py-0.5 rounded-full uppercase font-mono">
                  Lens {cameraFilter}
                </span>
              </div>

              <div className="flex items-center justify-between mt-auto z-10 w-full p-4">
                <div className="flex gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-md">
                  {["0.5x", "1x", "2x"].map((zoom) => (
                    <button
                      key={zoom}
                      onClick={() => handleZoom(zoom)}
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

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!!error || isUploading}
                  className="w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center bg-black/40 disabled:opacity-50 shadow-xl"
                >
                  <motion.div
                    animate={{
                      scale: isRecording ? 0.6 : 1,
                      borderRadius: isRecording ? "8px" : "9999px",
                    }}
                    className="w-10 h-10 bg-red-500"
                  />
                </button>

                <div className="flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-md">
                  {["Raw", "Vivid", "Noir"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCameraFilter(filter)}
                      className="text-[9px] font-semibold px-2 py-1.5 rounded-full text-white/70 transition-colors"
                      style={{
                        background: cameraFilter === filter ? "rgba(255,255,255,0.15)" : "transparent",
                        color: cameraFilter === filter ? "#fff" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ACTIVE PREVIEW LAYER */}
          {step === "PREVIEW" && recordedBlob && (
            <div className="absolute inset-0 z-20 bg-black flex flex-col justify-between">
              <video
                src={URL.createObjectURL(recordedBlob)}
                autoPlay
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-10" />
              
              <div className="relative z-20 flex justify-between items-center p-4">
                 <span className="text-white text-[14px] font-bold shadow-md">Preview Vlog</span>
                 <button onClick={() => setStep("CAMERA")} disabled={isUploading} className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-[11px] font-bold shadow-md hover:bg-white/30 disabled:opacity-50">Retake</button>
              </div>
              
              <div className="relative z-20 flex flex-col gap-4 p-4 mt-auto">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur w-fit px-3.5 py-2 rounded-full text-white text-[11px] font-semibold shadow-md">
                  <MapPin size={12} className="text-[#e07c30]" />
                  <span>{locationName}</span>
                </div>
                <button 
                  onClick={handlePublish} 
                  disabled={isUploading} 
                  className="w-full py-4 bg-[#e07c30] text-black rounded-xl font-bold text-base shadow-[0_0_20px_rgba(224,124,48,0.4)] transition-transform active:scale-95 disabled:opacity-50"
                >
                  Publish to Group
                </button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
              <span className="text-white text-[13px] font-bold mt-2">Publishing Update...</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="absolute inset-0 z-30 bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
              <Sparkles size={40} className="text-emerald-400 mb-3 animate-pulse" />
              <span className="text-white text-base font-bold">Vlog Published Successfully! 🎉</span>
              <span className="text-white/60 text-[12px] font-medium mt-1.5">Your group members have been notified.</span>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}