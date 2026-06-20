// ./app/(app)/record/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight } from "lucide-react";
import { getOrCreateTodayAssignment, createClip } from "@/actions/vlog";
import { getUserGroups } from "@/actions/group";
import { CameraView } from "@/components/record/camera-view";
import { PreviewView, GroupSelectorSheet } from "@/components/record/preview-view";
import { RecordLoadingState } from "@/components/record/record-loading-state";
import { generateThumbnail, generateBlurThumbnail } from "@/components/record/utils";

export default function RecordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<"CAMERA" | "PREVIEW">("CAMERA");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  
  // Speed Segments Local Tracker
  const [currentSpeed, setCurrentSpeed] = useState<number>(1);
  const [speedSegments, setSpeedSegments] = useState<{start: number, speed: number}[]>([{ start: 0, speed: 1 }]);
  
  const [cameraZoom, setCameraZoom] = useState("1x");
  const [zoomSupported, setZoomSupported] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [recordedFacingMode, setRecordedFacingMode] = useState<"user" | "environment">("user");
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [locationName, setLocationName] = useState("Earth");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isTurnAuthorized, setIsTurnAuthorized] = useState(true);
  const [checkingTurn, setCheckingTurn] = useState(false);
  const [showGroupDrawer, setShowGroupSelectorSheet] = useState(false);
  const [caption, setCaption] = useState("");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const [miniProgress, setMiniProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isCheckingTurnRef = useRef(false);

  // Exact timeline trackers for pause/resume
  const startTimeRef = useRef(0);
  const totalPausedTimeRef = useRef(0);
  const lastPauseTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  const recordTimeRef = useRef(0);

  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [recordedBlob]);

  const handleStepChange = (newStep: "CAMERA" | "PREVIEW") => {
    setStep(newStep);
    window.dispatchEvent(new CustomEvent("record-step-changed", { detail: newStep }));
  };

  const handleMiniTimeUpdate = () => {
    const vid = miniVideoRef.current;
    if (vid && vid.duration) setMiniProgress((vid.currentTime / vid.duration) * 100);
  };

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
        const isAuthorized = res.assignment.userId === session?.user?.id;
        setIsTurnAuthorized(isAuthorized);
        setError(isAuthorized ? "" : `Today's turn belongs to @${res.assignment.user?.name || "another friend"}.`);
      }
    } catch {
      setError("Failed to check group authorization.");
    } finally {
      setCheckingTurn(false);
    }
  };

  const loadGroupsList = async () => {
    try {
      const res = await getUserGroups();
      if (res.success && res.groups && res.groups.length > 0) {
        setUserGroups(res.groups);
        const storedGroupId = localStorage.getItem("active_group_id");
        const matched = res.groups.find((g: any) => g.id === storedGroupId);
        const initialGroup = matched || res.groups[0];
        setSelectedGroup(initialGroup);
        await checkGroupTurn(initialGroup.id);
      } else {
        setUserGroups([]);
        setError("Please choose or join a group first to vlog.");
        setIsTurnAuthorized(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (step === "PREVIEW" && recordedBlob) loadGroupsList();
  }, [step, recordedBlob]);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (step === "CAMERA" && isTurnAuthorized) {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setActiveStream(null);
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: true,
          });

          if (!active) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          streamRef.current = stream;
          setActiveStream(stream);

          if (videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.warn("Video playback was interrupted:", e));
          }

          const track = stream.getVideoTracks()[0];
          setVideoTrack(track);

          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                const data = await res.json();
                const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Earth";
                if (active) setLocationName(city);
              } catch {
                if (active) setLocationName("Earth");
              }
            }, () => { if (active) setLocationName("Earth"); });
          }
        } catch (err) {
          console.error("Camera access failed:", err);
          if (active) setError("Could not access camera or microphone. Please grant access permissions.");
        }
      } else if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setActiveStream(null);
      }
    }

    setupCamera();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setActiveStream(null);
      }
    };
  }, [step, facingMode, isTurnAuthorized]);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch((e) => console.warn("Video mount playback was interrupted:", e));
    }
  }, []);

  useEffect(() => {
    const checkInitialTurn = async () => {
      const activeGroupId = localStorage.getItem("active_group_id");
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
        setError(isAuthorized ? "" : `Today's turn belongs to @${res.assignment.user?.name || "another friend"}.`);
        if (isAuthorized && !userGroups.length) loadGroupsList();
      }

      isCheckingTurnRef.current = false;
    };
    checkInitialTurn();

    const handleGroupChange = () => loadGroupsList();
    window.addEventListener("group-changed", handleGroupChange);
    return () => window.removeEventListener("group-changed", handleGroupChange);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = isPausedRef.current
          ? lastPauseTimeRef.current - startTimeRef.current - totalPausedTimeRef.current
          : now - startTimeRef.current - totalPausedTimeRef.current;
        const currentSeconds = Math.floor(elapsed / 1000);
        setRecordTime(currentSeconds);
        recordTimeRef.current = currentSeconds;
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (recordTime >= 120 && isRecording) {
      stopRecording();
    }
  }, [recordTime, isRecording]);

  const toggleCamera = () => {
    if (isRecording) return;
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
      try {
        await videoTrack.applyConstraints({ advanced: [{ zoom: parseFloat(zoomStr) }] as any });
      } catch (e) {
        console.warn("Zoom constraint not supported", e);
      }
    }
  };

  const handleToggleSpeed = () => {
    if (isRecording && !isPaused) return; // Prevent speed swaps while actively rolling
    setCurrentSpeed(s => s === 1 ? 2 : 1);
  };

  const startRecording = () => {
    setError("");
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedFacingMode(facingMode);
    setSpeedSegments([{ start: 0, speed: currentSpeed }]);

    let mimeType = "video/webm;codecs=vp8,opus";
    if (typeof MediaRecorder !== "undefined") {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const types = isIOS 
        ? [
            "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
            "video/mp4",
            "video/webm"
          ]
        : [
            "video/webm;codecs=vp8,opus",
            "video/webm",
            "video/mp4"
          ];
          
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 3000000 });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      let finalElapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
      if (isPausedRef.current) {
        finalElapsed = lastPauseTimeRef.current - startTimeRef.current - totalPausedTimeRef.current;
      }
      
      const duration = finalElapsed / 1000;
      setFinalDuration(Math.floor(duration));

      // Relaxed minimum check boundary utilizing accurate precision mapping 
      if (duration >= 4.5) {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || mimeType });
        setRecordedBlob(blob);
        handleStepChange("PREVIEW");
      } else {
        setError("Video clip must be at least 5 seconds long.");
      }
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false;
      setRecordTime(0);
      recordTimeRef.current = 0;
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); 

    startTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;
    lastPauseTimeRef.current = 0;
    
    setIsRecording(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setRecordTime(0);
    recordTimeRef.current = 0;
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      lastPauseTimeRef.current = Date.now();
      setIsPaused(true);
      isPausedRef.current = true;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      totalPausedTimeRef.current += Date.now() - lastPauseTimeRef.current;
      
      // Stamp boundary into segments array allowing downstream players to scale playback dynamic multipliers safely
      setSpeedSegments(prev => {
        const last = prev[prev.length - 1];
        if (last && last.speed !== currentSpeed) {
          return [...prev, { start: recordTimeRef.current, speed: currentSpeed }];
        }
        return prev;
      });

      setIsPaused(false);
      isPausedRef.current = false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  const handlePublish = async () => {
    let progressInterval: any;
    try {
      setIsUploading(true);
      setUploadProgress(15);

      progressInterval = setInterval(() => {
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
      const timestamp = Date.now();
      const videoPath = `${activeGroupId}/${assignment.id}/${timestamp}-vlog.${ext}`;
      const thumbPath = `${activeGroupId}/${assignment.id}/${timestamp}-thumb.jpg`;
      const thumbBlurPath = `${activeGroupId}/${assignment.id}/${timestamp}-thumb-blur.jpg`;

      // 1. Upload Video through internal API
      const videoData = new FormData();
      videoData.append("file", recordedBlob, `video.${ext}`);
      videoData.append("bucket", "vlogs");
      videoData.append("path", videoPath);
      
      const videoUploadRes = await fetch("/api/media", {
        method: "POST",
        body: videoData,
      });
      if (!videoUploadRes.ok) {
         const errText = await videoUploadRes.text();
         throw new Error(errText || "Failed to save video clip.");
      }

      // 2. Upload High-Quality Frame Preview
      const thumbBlob = await generateThumbnail(recordedBlob, recordedFacingMode);
      const thumbData = new FormData();
      thumbData.append("file", thumbBlob, "thumb.jpg");
      thumbData.append("bucket", "vlogs");
      thumbData.append("path", thumbPath);

      const thumbUploadRes = await fetch("/api/media", {
        method: "POST",
        body: thumbData,
      });
      if (!thumbUploadRes.ok) {
         const errText = await thumbUploadRes.text();
         throw new Error(errText || "Failed to save frame thumbnail.");
      }

      // 3. Upload Ultra-Lightweight LQIP Placeholder
      const thumbBlurBlob = await generateBlurThumbnail(recordedBlob, recordedFacingMode);
      const thumbBlurData = new FormData();
      thumbBlurData.append("file", thumbBlurBlob, "thumb-blur.jpg");
      thumbBlurData.append("bucket", "vlogs");
      thumbBlurData.append("path", thumbBlurPath);

      const thumbBlurUploadRes = await fetch("/api/media", {
        method: "POST",
        body: thumbBlurData,
      });
      if (!thumbBlurUploadRes.ok) {
         const errText = await thumbBlurUploadRes.text();
         throw new Error(errText || "Failed to save blur thumbnail.");
      }

      // 4. Create Clip Record
      const clipRes = await createClip({
        groupId: activeGroupId,
        assignmentId: assignment.id,
        videoUrl: videoPath,
        thumbnailUrl: thumbPath,
        thumbnailBlurUrl: thumbBlurPath,
        location: locationName,
        caption,
        duration: finalDuration,
        metadata: JSON.stringify({ speedSegments, facingMode: recordedFacingMode })
      });
      
      if (clipRes.error) throw new Error(clipRes.error);

      if (clipRes.newlyUnlocked?.length) {
        clipRes.newlyUnlocked.forEach((id: string) => {
          window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
        });
      }

      if (clipRes.individualTierUp) {
        window.dispatchEvent(new CustomEvent("show-level-up", {
          detail: { type: "individual", from: clipRes.individualTierUp.from, to: clipRes.individualTierUp.to },
        }));
      } else if (clipRes.groupLevelUp) {
        window.dispatchEvent(new CustomEvent("show-level-up", {
          detail: {
            type: "group",
            from: clipRes.groupLevelUp.from,
            to: clipRes.groupLevelUp.to,
            name: selectedGroup?.name || "your group",
          },
        }));
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);

      setTimeout(() => {
        setUploadSuccess(false);
        setRecordedBlob(null);
        setCaption("");
        setUploadProgress(0);
        window.dispatchEvent(new CustomEvent("vlogs-refreshed"));
        router.push("/today");
        handleStepChange("CAMERA");
      }, 2500);
    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      setError(err?.message || "Failed to publish vlog format clip.");
    }
  };

  if (loadingAssignment) return <RecordLoadingState />;

  if (!isTurnAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-950 text-center select-none overflow-hidden h-full min-h-0">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
          <Camera size={32} className="text-white/20" />
        </div>
        <h2 className="text-white text-2xl font-bold tracking-tight mb-3">Not Your Turn</h2>
        <p className="text-white/60 text-sm max-w-[260px] leading-relaxed mb-8">
          {error || "It's not your turn to vlog today. Sit back and enjoy the show!"}
        </p>

        {userGroups.length > 1 && (
          <button
            onClick={() => setShowGroupSelectorSheet(true)}
            className="w-full max-w-[280px] py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition hover:bg-white/20"
          >
            <span>Switch Group</span>
            <ChevronRight size={16} />
          </button>
        )}
        <button
          onClick={() => router.push("/today")}
          className="mt-4 w-full max-w-[280px] py-4 bg-[#e07c30] text-black font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98]"
        >
          Watch Today's Vlog
        </button>

        <GroupSelectorSheet
          isOpen={showGroupDrawer}
          onClose={() => setShowGroupSelectorSheet(false)}
          userGroups={userGroups}
          selectedGroup={selectedGroup}
          onSelectGroup={async (group) => {
            setSelectedGroup(group);
            setShowGroupSelectorSheet(false);
            await checkGroupTurn(group.id);
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`flex-1 flex flex-col h-full min-h-0 mb-4 relative overflow-hidden transition-all duration-300 ${
        step === "CAMERA"
          ? "rounded-2xl bg-neutral-900/40 border border-white/5"
          : "rounded-none bg-neutral-950 border border-white/0"
      }`}
    >
      <div className="absolute inset-0 z-0 bg-neutral-900/40 flex flex-col justify-between p-0">
        <AnimatePresence>
          {step === "CAMERA" ? (
            <CameraView
              setVideoRef={setVideoRef}
              stream={activeStream}
              facingMode={facingMode}
              videoTrack={videoTrack}
              isRecording={isRecording}
              isPaused={isPaused}
              recordTime={recordTime}
              isTurnAuthorized={isTurnAuthorized}
              error={error}
              isUploading={isUploading}
              zoomSupported={zoomSupported}
              cameraZoom={cameraZoom}
              setZoomSupported={setZoomSupported}
              flashActive={flashActive}
              currentSpeed={currentSpeed}
              onToggleSpeed={handleToggleSpeed}
              onToggleCamera={toggleCamera}
              onToggleFlash={toggleFlash}
              onZoom={handleZoom}
              onStartRecording={startRecording}
              onPauseRecording={pauseRecording}
              onResumeRecording={resumeRecording}
              onStopRecording={stopRecording}
            />
          ) : (
            <PreviewView
              previewUrl={previewUrl}
              recordedFacingMode={recordedFacingMode}
              miniVideoRef={miniVideoRef}
              miniProgress={miniProgress}
              speedSegments={speedSegments}
              onMiniTimeUpdate={handleMiniTimeUpdate}
              caption={caption}
              onCaptionChange={setCaption}
              isUploading={isUploading}
              selectedGroup={selectedGroup}
              onOpenGroupSelector={() => setShowGroupSelectorSheet(true)}
              assignment={assignment}
              checkingTurn={checkingTurn}
              isTurnAuthorized={isTurnAuthorized}
              error={error}
              locationName={locationName}
              onLocationChange={setLocationName}
              uploadProgress={uploadProgress}
              onRetake={() => { handleStepChange("CAMERA"); setRecordedBlob(null); setCaption(""); setError(""); }}
              onPublish={handlePublish}
              showGroupDrawer={showGroupDrawer}
              onCloseGroupDrawer={() => setShowGroupSelectorSheet(false)}
              userGroups={userGroups}
              onSelectGroup={async (group) => {
                setSelectedGroup(group);
                setShowGroupSelectorSheet(false);
                await checkGroupTurn(group.id);
              }}
              isPreviewFullscreen={isPreviewFullscreen}
              onOpenFullscreen={() => setIsPreviewFullscreen(true)}
              onCloseFullscreen={() => setIsPreviewFullscreen(false)}
              uploadSuccess={uploadSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}