"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { 
  Camera, CircleDot, Loader2, AlertCircle, RefreshCcw, Zap, MapPin, 
  ChevronRight, Check, Clock, Target, User, X, ArrowLeft
} from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { getOrCreateTodayAssignment, getSignedUploadUrls, createClip, addComment } from "@/actions/vlog";
import { getUserGroups } from "@/actions/group";
import { PROMPTS, ACCENT } from "@/lib/theme";

function getCurrentTimePeriodLabel(): string {
  const hours = new Date().getHours();
  if (hours >= 9 && hours < 12) return "Morning Vlog (9AM - 12PM)";
  if (hours >= 12 && hours < 15) return "Midday Vlog (12PM - 3PM)";
  if (hours >= 15 && hours < 18) return "Afternoon Vlog (3PM - 6PM)";
  if (hours >= 18 && hours < 21) return "Evening Vlog (6PM - 9PM)";
  if (hours >= 21 && hours < 24) return "Late Night Vlog (9PM - 12AM)";
  return "Early Morning Vlog (12AM - 9AM)";
}

function getDailyPrompt(): string {
  const day = new Date().getDate();
  return PROMPTS[day % PROMPTS.length];
}

export default function RecordPage() {
  const { data: session } = useSession();
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

  // Stable URL memory allocation reference
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Instagram-style Publish Flow states
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isTurnAuthorized, setIsTurnAuthorized] = useState(true);
  const [checkingTurn, setCheckingTurn] = useState(false);
  const [showGroupDrawer, setShowGroupSelectorSheet] = useState(false);
  const [caption, setCaption] = useState("");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // Live Playbar state tracking
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [miniProgress, setMiniProgress] = useState(0);
  const [fullProgress, setFullProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Guard to prevent concurrent duplicate turn checking
  const isCheckingTurnRef = useRef(false);

  // Handle single-allocation, self-cleaning object URLs to prevent render-loop flashes
  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [recordedBlob]);

  // Custom step changer to trigger layout transitions globally on parent frames
  const handleStepChange = (newStep: "CAMERA" | "PREVIEW") => {
    setStep(newStep);
    window.dispatchEvent(new CustomEvent("record-step-changed", { detail: newStep }));
  };

  const handleMiniTimeUpdate = () => {
    const vid = miniVideoRef.current;
    if (vid && vid.duration) {
      setMiniProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const handleFullTimeUpdate = () => {
    const vid = fullscreenVideoRef.current;
    if (vid && vid.duration) {
      setFullProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  // Check turn constraints dynamically for the chosen group
  const checkGroupTurn = async (groupId: string) => {
    setCheckingTurn(true);
    setError("");
    try {
      const res = await getOrCreateTodayAssignment(groupId);
      if (res.error) {
        setIsTurnAuthorized(false);
        setError(res.error);
        setAssignment(null);
      } else if (res.success && res.assignment) {
        setAssignment(res.assignment);
        // Verify if today's turn belongs to current user
        const isAuthorized = res.assignment.userId === session?.user?.id;
        setIsTurnAuthorized(isAuthorized);
        if (!isAuthorized) {
          setError(`Today's turn belongs to @${res.assignment.user?.name || "another friend"}.`);
        } else {
          setError("");
        }
      }
    } catch (err) {
      setError("Failed to check group authorization.");
    } finally {
      setCheckingTurn(false);
    }
  };

  // Fetch all of the user's groups when Preview opens
  const loadGroupsList = async () => {
    try {
      const res = await getUserGroups();
      if (res.success && res.groups && res.groups.length > 0) {
        setUserGroups(res.groups);
        
        // Find if current local active group exists, default to that
        const storedGroupId = localStorage.getItem("active_group_id");
        const matched = res.groups.find((g: any) => g.id === storedGroupId);
        const initialGroup = matched || res.groups[0];
        setSelectedGroup(initialGroup);
        
        // Check turn constraints for the initial group selection
        await checkGroupTurn(initialGroup.id);
      } else {
        setUserGroups([]);
        setError("Please choose or join a group first to vlog.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (step === "PREVIEW" && recordedBlob) {
      loadGroupsList();
    }
  }, [step, recordedBlob]);

  // Request camera access and get live location
  useEffect(() => {
    let active = true;
    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      if (step === "CAMERA") {
        try {
          // Clear any stale stream tracks before spinning up a new session
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: true,
          });

          if (!active) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          currentStream = stream;
          streamRef.current = stream;
          setActiveStream(stream);

          const track = stream.getVideoTracks()[0];
          setVideoTrack(track);

          // Attempt getting location async
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                const data = await res.json();
                const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Earth";
                if (active) setLocationName(city);
              } catch (e) {
                if (active) setLocationName("Earth");
              }
            }, () => {
              if (active) setLocationName("Earth");
            });
          }
        } catch (err) {
          console.error("Camera access failed:", err);
          if (active) {
            setError("Could not access camera or microphone. Please grant access permissions.");
          }
        }
      } else {
        // Explicitly tear down visual hardware feed when active view shifts to background
        if (active) setActiveStream(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      }
    }
    
    setupCamera();

    return () => {
      active = false;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [step, facingMode]);

  // Bind the active video stream dynamically to the camera video elements whenever stream updates
  useEffect(() => {
    if (videoRef.current) {
      if (activeStream) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.play().catch((e) => console.warn("Video playback was interrupted:", e));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [activeStream]);

  // Callback ref to cleanly mount video elements and attach active state streams immediately on render
  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      if (activeStream) {
        el.srcObject = activeStream;
        el.play().catch((e) => console.warn("Video mount playback was interrupted:", e));
      } else {
        el.srcObject = null;
      }
    }
  };

  // Initial turn check logic on standby
  useEffect(() => {
    const checkInitialTurn = async () => {
      let activeGroupId = localStorage.getItem("active_group_id");
      if (!activeGroupId) {
        setError("Please choose or join a group first.");
        setIsTurnAuthorized(false);
        setLoadingAssignment(false);
        return;
      }

      if (isCheckingTurnRef.current) return;
      isCheckingTurnRef.current = true;

      setLoadingAssignment(true);
      const res = await getOrCreateTodayAssignment(activeGroupId);
      setLoadingAssignment(false);

      if (res.error) {
        setError(res.error);
        setIsTurnAuthorized(false);
        setAssignment(null);
      } else if (res.success && res.assignment) {
        setAssignment(res.assignment);
        const isAuthorized = res.assignment.userId === session?.user?.id;
        setIsTurnAuthorized(isAuthorized);
        if (!isAuthorized) {
          setError(`Today's turn belongs to @${res.assignment.user?.name || "another friend"}.`);
        } else {
          setError("");
        }
      }

      isCheckingTurnRef.current = false;
    };
    checkInitialTurn();

    const handleGroupChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        loadGroupsList();
      }
    };

    window.addEventListener("group-changed", handleGroupChange);
    return () => window.removeEventListener("group-changed", handleGroupChange);
  }, []);

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
      handleStepChange("PREVIEW");
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
      setUploadProgress(15);
      
      // Animate progress smoothly in parallel with file transfer actions
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return p + 5;
        });
      }, 150);

      const activeGroupId = selectedGroup?.id;
      if (!activeGroupId || !assignment || !recordedBlob) {
        throw new Error("Invalid state. Missing group parameters.");
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

      // Auto-publish the written caption as the very first commentary row under the post
      if (caption.trim() && clipRes.clip?.id) {
        await addComment(clipRes.clip.id, caption.trim());
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Delay and reset back to camera
      setTimeout(() => {
        setUploadSuccess(false);
        setRecordedBlob(null);
        setCaption("");
        setUploadProgress(0);
        handleStepChange("CAMERA");
      }, 2500);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setError(err?.message || "Failed to publish vlog format clip.");
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`flex-1 flex flex-col h-full min-h-0 relative overflow-hidden transition-all duration-300 ${
        step === "CAMERA" 
          ? "rounded-2xl bg-neutral-900/40 border border-white/5" 
          : "rounded-none bg-neutral-950 border border-white/0"
      }`}
    >
      <div className="absolute inset-0 z-0 bg-neutral-900/40 flex flex-col justify-between p-0">

        {/* Dynamic crossfade step rendering without mode="wait" for concurrent transitions */}
        <AnimatePresence>
          {step === "CAMERA" ? (
            <motion.div
              key="camera-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col justify-between z-10"
            >
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              
              <div className="absolute inset-x-8 inset-y-12 border border-white/5 border-dashed pointer-events-none z-10" />

              {/* Subdued notice top-banner if it is not their turn */}
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

                {/* Shutter button disabled if not authorized turn */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!isTurnAuthorized || isUploading}
                  className="w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center bg-black/40 disabled:opacity-30 shadow-xl"
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
            </motion.div>
          ) : (
            <motion.div
              key="preview-view"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 35 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="absolute inset-0 z-20 bg-neutral-950 flex flex-col justify-between overflow-hidden"
            >
              {/* Instagram-Style Top Progress Bar */}
              {isUploading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 z-50 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 to-[#e07c30]"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeInOut", duration: 0.15 }}
                  />
                </div>
              )}

              {/* Header Bar */}
              <div 
                style={{ paddingTop: "max(14px, env(safe-area-inset-top, 14px))" }}
                className="flex items-center justify-between px-4 pb-3.5 border-b border-white/5 bg-neutral-900/60 backdrop-blur-md relative z-10 flex-shrink-0"
              >
                <button 
                  onClick={() => { handleStepChange("CAMERA"); setCaption(""); setError(""); }} 
                  disabled={isUploading} 
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-semibold"
                >
                  <ArrowLeft size={16} />
                  <span>Retake</span>
                </button>
                <span className="text-white text-sm font-extrabold tracking-tight">New Post</span>
                <div className="w-12 h-6" />
              </div>

              {/* Scrollable Publishing Panel Body */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-6">
                
                {/* Visual split section: Mini preview & caption text field */}
                <div className="flex gap-4 items-start">
                  
                  {/* Visual Video Container - styled exactly like Today UI */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div 
                      onClick={() => setIsPreviewFullscreen(true)}
                      className="relative w-24 aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 flex-shrink-0 shadow-lg cursor-pointer group transition-transform active:scale-[0.97]"
                    >
                      <video
                        ref={miniVideoRef}
                        src={previewUrl || ""}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onTimeUpdate={handleMiniTimeUpdate}
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Today UI glazing frame, glare highlights, and inset shadows */}
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.45)",
                          borderLeft: "1px solid rgba(255,255,255,0.25)",
                          borderRight: "1px solid rgba(255,255,255,0.05)",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          boxShadow: "inset 0 1.5px 3px rgba(255,255,255,0.35), inset 0 -1.5px 3px rgba(0,0,0,0.55)",
                        }}
                        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                      />

                      {/* Miniature live playbar matching Today UI requirements */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
                        <div 
                          className="h-full bg-[#e07c30] transition-all duration-100 ease-linear"
                          style={{ width: `${miniProgress}%` }}
                        />
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                        <span className="text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Unmute</span>
                      </div>
                    </div>

                    {/* Clean text label directly below preview box */}
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2 block text-center select-none">
                      Tap to preview
                    </span>
                  </div>
                  
                  <div className="flex-1 h-full min-w-0">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a caption... (Will post as first comment)"
                      rows={4}
                      disabled={isUploading}
                      className="w-full bg-transparent border-none text-white text-xs placeholder:text-white/30 outline-none resize-none h-full"
                    />
                  </div>
                </div>

                <hr className="border-t border-white/5" />

                {/* Dynamic Group Select Panel */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Post Destination</span>
                    <span className="text-[10px] font-semibold text-[#e07c30]">Select Group</span>
                  </div>

                  <div 
                    onClick={() => { if (!isUploading) setShowGroupSelectorSheet(true); }}
                    style={glassStyle(0.04, 16, 0.08)} 
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">
                        {selectedGroup?.emoji || "🏠"}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-white text-xs font-bold truncate leading-tight">
                          {selectedGroup?.name || "Choose target group"}
                        </span>
                        <span className="text-white/40 text-[9px] font-semibold">
                          {selectedGroup?.memberCount || 0} members enrolled
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </div>
                </div>

                {/* Dynamic Turn Detail Information Panel */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1">Vlogging Context</span>
                  
                  <div 
                    style={glassStyle(0.04, 16, 0.08)} 
                    className="rounded-2xl border border-white/5 p-4 flex flex-col gap-3.5 text-xs text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock size={13} className="text-[#e07c30]" />
                        <span>Active Period</span>
                      </div>
                      <span className="font-semibold text-right">{getCurrentTimePeriodLabel()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/60">
                        <Target size={13} className="text-[#e07c30]" />
                        <span>Today&apos;s Prompt</span>
                      </div>
                      <span className="font-semibold text-right max-w-[180px] truncate">{getDailyPrompt()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/60">
                        <User size={13} className="text-[#e07c30]" />
                        <span>Turn Owner</span>
                      </div>
                      <span className="font-semibold text-[#e07c30] text-right">
                        @{assignment?.user?.handle || assignment?.user?.name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Authorization Warning Banner */}
                {checkingTurn ? (
                  <div className="flex items-center gap-2 px-1 text-[10px] text-white/50 animate-pulse">
                    <Loader2 size={12} className="animate-spin text-[#e07c30]" />
                    <span>Verifying turn access parameters...</span>
                  </div>
                ) : (
                  !isTurnAuthorized && error && (
                    <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-red-400 text-xs font-bold leading-tight">Posting Blocked</span>
                        <span className="text-white/60 text-[10px] leading-snug">{error}</span>
                      </div>
                    </div>
                  )
                )}

                {/* Location Input */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1">Location details</span>
                  <div 
                    style={glassStyle(0.04, 16, 0.08)} 
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/5"
                  >
                    <MapPin size={15} className="text-[#e07c30]" />
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Search or add location..."
                      disabled={isUploading}
                      className="flex-1 bg-transparent border-none text-white text-xs placeholder:text-white/30 outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Immersive Large Footer Trigger Share Button - Restored */}
              <div className="p-4 border-t border-white/5 bg-neutral-900/40 backdrop-blur-md flex-shrink-0">
                <button
                  onClick={handlePublish}
                  disabled={isUploading || !isTurnAuthorized || checkingTurn}
                  className="w-full py-3.5 bg-[#e07c30] text-black font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin animate-fade-in" />
                      <span>Uploading Vlog ({uploadProgress}%)</span>
                    </>
                  ) : (
                    <span>Share to {selectedGroup?.name || "Group"}</span>
                  )}
                </button>
              </div>

              {/* Dynamic sliding group picker sheet overlay */}
              <AnimatePresence>
                {showGroupDrawer && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowGroupSelectorSheet(false)}
                      className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm cursor-pointer"
                    />
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 30, stiffness: 350 }}
                      className="absolute bottom-0 inset-x-0 z-40 bg-neutral-950 border-t border-white/10 rounded-t-[32px] p-6 max-h-[75%] flex flex-col"
                    >
                      <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 flex-shrink-0" />
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 className="text-white text-sm font-bold">Choose a Group</h3>
                        <button onClick={() => setShowGroupSelectorSheet(false)} className="text-xs text-white/50 hover:text-white">Cancel</button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-hide pb-6">
                        {userGroups.map((group) => {
                          const isCurrent = group.id === selectedGroup?.id;
                          return (
                            <div
                              key={group.id}
                              onClick={async () => {
                                setSelectedGroup(group);
                                setShowGroupSelectorSheet(false);
                                await checkGroupTurn(group.id);
                              }}
                              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                                isCurrent 
                                  ? "bg-white/[0.06] border-[#e07c30]/50" 
                                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{group.emoji || "🏠"}</span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-white text-xs font-bold leading-tight">{group.name}</span>
                                  <span className="text-white/40 text-[9px] font-semibold">{group.memberCount} members</span>
                                </div>
                              </div>
                              {isCurrent && <Check size={14} className="text-[#e07c30] stroke-[3]" />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Immersive full-screen playback mode on preview click */}
              <AnimatePresence>
                {isPreviewFullscreen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                    className="absolute inset-0 z-50 bg-black flex flex-col justify-between"
                    onClick={() => setIsPreviewFullscreen(false)}
                  >
                    <video
                      ref={fullscreenVideoRef}
                      src={previewUrl || ""}
                      autoPlay
                      loop
                      muted={false} // Unmuted with audio!
                      playsInline
                      onTimeUpdate={handleFullTimeUpdate}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    {/* Backdrop Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60 pointer-events-none z-10" />

                    {/* Dynamic playbar for Fullscreen Mode */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
                      <div 
                        className="h-full bg-[#e07c30] transition-all duration-100 ease-linear"
                        style={{ width: `${fullProgress}%` }}
                      />
                    </div>

                    <div className="relative z-20 p-4 pt-12 flex justify-between items-center">
                      <span className="text-white text-sm font-bold tracking-tight drop-shadow-md">Fullscreen Preview</span>
                      <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 hover:bg-white/30 transition-colors">
                        <X size={12} strokeWidth={2.5} />
                        <span>Close</span>
                      </button>
                    </div>

                    <div className="relative z-20 p-6 mt-auto text-center pointer-events-none">
                      <span className="text-white/60 text-xs drop-shadow font-medium tracking-wide">Tap anywhere to return</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* High-end spring popped iOS Success screen */}
              <AnimatePresence>
                {uploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.1 }}
                      className="mb-6"
                    >
                      <img 
                        src="/assets/icons/tick.png" 
                        className="w-20 h-24 object-contain filter drop-shadow-[0_4px_16px_rgba(34,197,94,0.15)]" 
                        alt="Success Check" 
                      />
                    </motion.div>
                    
                    <motion.span
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                      className="text-white text-lg font-extrabold tracking-tight"
                    >
                      Vlog Shared Successfully!
                    </motion.span>
                    
                    <motion.span
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
                      className="text-white/50 text-xs mt-2 max-w-[220px] leading-relaxed font-medium"
                    >
                      Your daily update is live, and your friends have been notified.
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}