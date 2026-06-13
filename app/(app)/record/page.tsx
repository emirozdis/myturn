"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getOrCreateTodayAssignment, createClip } from "@/actions/vlog";
import { getUserGroups } from "@/actions/group";
import { CameraView } from "@/components/record/camera-view";
import { PreviewView } from "@/components/record/preview-view";
import { RecordLoadingState } from "@/components/record/record-loading-state";
import { generateThumbnail, generateBlurThumbnail } from "@/components/record/utils";

export default function RecordPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<"CAMERA" | "PREVIEW">("CAMERA");
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [cameraZoom, setCameraZoom] = useState("1x");
  const [zoomSupported, setZoomSupported] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [recordedFacingMode, setRecordedFacingMode] = useState<"user" | "environment">("user");
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
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
      if (step === "CAMERA") {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
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

          if (videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.warn("Video playback was interrupted:", e));
          }

          const track = stream.getVideoTracks()[0];
          setVideoTrack(track);

          try {
            const capabilities = track.getCapabilities();
            setZoomSupported("zoom" in capabilities);
          } catch { setZoomSupported(false); }

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
      }
    }

    setupCamera();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [step, facingMode]);

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
      recordTimeRef.current = 0;
      interval = setInterval(() => {
        setRecordTime((t) => {
          const nextTime = t + 1;
          recordTimeRef.current = nextTime;
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

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

  const startRecording = () => {
    setError("");
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedFacingMode(facingMode);

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
      const duration = recordTimeRef.current;
      setFinalDuration(duration);
      if (duration >= 5) {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || mimeType });
        setRecordedBlob(blob);
        handleStepChange("PREVIEW");
      } else {
        setError("Video clip must be at least 5 seconds long.");
      }
      setIsRecording(false);
      setRecordTime(0);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); 
    setIsRecording(true);
    setRecordTime(0);
    recordTimeRef.current = 0;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  const handlePublish = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(15);

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
        handleStepChange("CAMERA");
      }, 2500);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setError(err?.message || "Failed to publish vlog format clip.");
    }
  };

  if (loadingAssignment) return <RecordLoadingState />;

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
        <AnimatePresence>
          {step === "CAMERA" ? (
            <CameraView
              setVideoRef={setVideoRef}
              facingMode={facingMode}
              isRecording={isRecording}
              recordTime={recordTime}
              isTurnAuthorized={isTurnAuthorized}
              error={error}
              isUploading={isUploading}
              zoomSupported={zoomSupported}
              cameraZoom={cameraZoom}
              flashActive={flashActive}
              onToggleCamera={toggleCamera}
              onToggleFlash={toggleFlash}
              onZoom={handleZoom}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          ) : (
            <PreviewView
              previewUrl={previewUrl}
              recordedFacingMode={recordedFacingMode}
              miniVideoRef={miniVideoRef}
              miniProgress={miniProgress}
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