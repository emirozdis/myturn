"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SwitchCamera, X, Zap, ZapOff, Play } from "lucide-react";
import type { Clip, MockAppState } from "@/lib/mock-app-data";
import {
  captureVideoThumbnail,
  getRecordingMimeType,
  requestMediaAccess,
  stopMediaStream,
  type FacingMode,
} from "@/lib/media-permissions";
import { appTheme as t } from "../theme";
import { AppBtn } from "../ui";
import { useAppNav } from "../navigation";

type RecordPhase = "loading" | "permission" | "camera" | "preview" | "uploading";

const MAX_SECONDS = 30;

export function RecordPage({
  data,
  onClipAdded,
}: {
  data: MockAppState;
  onClipAdded: (clip: Clip) => void;
}) {
  const { setTab } = useAppNav();
  const [localClips, setLocalClips] = useState<Clip[]>(data.todayClips);
  const [phase, setPhase] = useState<RecordPhase>("loading");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef(getRecordingMimeType());

  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => {});
    }
  }, []);

  const startCamera = useCallback(
    async (facing: FacingMode = facingMode) => {
      setPhase("loading");
      setPermissionError(null);
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      const result = await requestMediaAccess(facing);
      if (!result.ok) {
        setPermissionError(result.message ?? "Camera access is required.");
        setPhase("permission");
        return;
      }
      attachStream(result.stream);
      setPhase("camera");
    },
    [attachStream, facingMode]
  );

  useEffect(() => {
    void startCamera();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopMediaStream(streamRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => {
        if (s >= MAX_SECONDS - 1) {
          stopRecord();
          return MAX_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const flipCamera = async () => {
    if (recording) return;
    const next: FacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    await startCamera(next);
  };

  const startRecord = () => {
    const stream = streamRef.current;
    if (!stream || recording) return;
    chunksRef.current = [];
    const mimeType = mimeTypeRef.current;
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPhase("preview");
    };
    recorder.start(200);
    setRecordSeconds(0);
    setRecording(true);
  };

  const stopRecord = () => {
    if (!recording) return;
    setRecording(false);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
  };

  const retake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setPhase("camera");
    setRecordSeconds(0);
    setCaption("");
  };

  const formatTime = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  const addToToday = async () => {
    if (!recordedUrl) return;
    setPhase("uploading");
    setUploadProgress(0);
    let thumbnailUrl: string | undefined;
    try {
      thumbnailUrl = await captureVideoThumbnail(recordedUrl);
    } catch {
      thumbnailUrl = undefined;
    }
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const newClip: Clip = {
            id: `local-${Date.now()}`,
            thumbnailUrl: thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/200/300`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            duration: formatTime(recordSeconds || 1),
            caption: caption.trim() || undefined,
          };
          setLocalClips((c) => [newClip, ...c]);
          onClipAdded(newClip);
          if (recordedUrl) URL.revokeObjectURL(recordedUrl);
          setRecordedUrl(null);
          setPhase("camera");
          setCaption("");
          setRecordSeconds(0);
          return 100;
        }
        return p + 12;
      });
    }, 120);
  };

  // ── Not your turn ──────────────────────────────────────────────────────
  if (!data.isCurrentUserVlogger) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            fontSize: 60,
            marginBottom: 20,
            lineHeight: 1,
          }}
        >
          🔒
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: t.text,
            fontFamily: t.fontDisplay,
            letterSpacing: "-0.7px",
            marginBottom: 10,
            lineHeight: 1.15,
          }}
        >
          It&apos;s not your turn today
        </h2>
        <p
          style={{
            fontSize: 15,
            color: t.textSecondary,
            lineHeight: 1.55,
            maxWidth: 260,
            marginBottom: 28,
          }}
        >
          <strong style={{ color: "rgba(255,255,255,0.7)" }}>
            {data.todayVlogger.name}
          </strong>{" "}
          is vlogging today. Come back tomorrow — or watch their day.
        </p>
        <div
          style={{
            padding: "12px 18px",
            borderRadius: t.radius.md,
            background: t.card,
            fontSize: 14,
            color: t.textSecondary,
            marginBottom: 24,
          }}
        >
          {data.todayVlogger.hoursRemaining}h left in today&apos;s story
        </div>
        <AppBtn
          variant="tinted"
          onClick={() => setTab("home")}
          style={{ maxWidth: 240 }}
        >
          Watch today
        </AppBtn>
      </div>
    );
  }

  // ── Uploading ──────────────────────────────────────────────────────────
  if (phase === "uploading") {
    return (
      <div
        style={{
          flex: 1,
          margin: "0 -16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          background: "#000",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 18 }}>☁️</div>
        <p
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 20,
            letterSpacing: "-0.2px",
          }}
        >
          Saving to your day…
        </p>
        <div
          style={{
            width: "100%",
            maxWidth: 260,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${uploadProgress}%`,
              height: "100%",
              background: t.accent,
              borderRadius: 2,
              transition: "width 0.12s ease",
            }}
          />
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 14 }}>
          You can keep recording more moments
        </p>
      </div>
    );
  }

  // ── Preview ────────────────────────────────────────────────────────────
  if (phase === "preview" && recordedUrl) {
    return (
      <div
        style={{
          flex: 1,
          margin: "0 -16px",
          display: "flex",
          flexDirection: "column",
          background: "#000",
          minHeight: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            type="button"
            onClick={retake}
            style={{
              border: "none",
              background: "transparent",
              color: t.blue,
              fontSize: 17,
              fontFamily: t.fontText,
              cursor: "pointer",
              padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Retake
          </button>
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#fff",
              fontFamily: t.fontText,
            }}
          >
            Preview
          </span>
          <div
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.12)",
              padding: "4px 10px",
              borderRadius: 980,
              fontVariantNumeric: "tabular-nums",
              fontFamily: t.fontText,
            }}
          >
            {formatTime(recordSeconds)}
          </div>
        </div>

        {/* Video */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <video
            ref={previewVideoRef}
            src={recordedUrl}
            autoPlay
            loop
            playsInline
            muted={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Caption + post bar */}
        <div
          style={{
            padding: "14px 16px max(20px, env(safe-area-inset-bottom))",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <input
            placeholder="Add a caption…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: t.radius.md,
              border: "0.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 16,
              marginBottom: 12,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: t.fontText,
              letterSpacing: "-0.2px",
            }}
          />
          <AppBtn onClick={() => void addToToday()}>Add to Today</AppBtn>
        </div>
      </div>
    );
  }

  // ── Permission denied ──────────────────────────────────────────────────
  if (phase === "permission") {
    return (
      <div
        style={{
          flex: 1,
          margin: "0 -16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          background: "#000",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 18 }}>📷</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            fontFamily: t.fontDisplay,
            letterSpacing: "-0.5px",
            marginBottom: 8,
          }}
        >
          Camera access needed
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5,
            maxWidth: 260,
            marginBottom: 28,
          }}
        >
          {permissionError ?? "Allow camera and microphone to record your day."}
        </p>
        <div
          style={{
            width: "100%",
            maxWidth: 280,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <AppBtn onClick={() => void startCamera()}>Allow camera & mic</AppBtn>
          <AppBtn onClick={() => setTab("home")} variant="ghost">
            Go back
          </AppBtn>
        </div>
      </div>
    );
  }

  // ── Camera viewfinder ──────────────────────────────────────────────────
  const progress = recordSeconds / MAX_SECONDS;

  return (
    <div
      style={{
        flex: 1,
        margin: "0 -16px",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#000",
      }}
    >
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 240 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
            background: "#111",
            opacity: phase === "loading" ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        />

        {phase === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
              fontSize: 15,
              fontFamily: t.fontText,
            }}
          >
            Starting camera…
          </div>
        )}

        {flashOn && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,220,0.07)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* ── Top controls ── */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            right: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 3,
          }}
        >
          {/* Close */}
          <CamControl label="Close" onClick={() => setTab("home")}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </CamControl>

          {/* Timer pill */}
          {recording && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                borderRadius: 980,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: t.red,
                  boxShadow: `0 0 7px ${t.red}`,
                  animation: "recPulse 1.2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: t.fontText,
                }}
              >
                {formatTime(recordSeconds)}
              </span>
            </div>
          )}

          {/* Right controls */}
          <div style={{ display: "flex", gap: 8 }}>
            <CamControl label="Flash" onClick={() => setFlashOn(!flashOn)}>
              {flashOn ? (
                <Zap size={17} strokeWidth={2.2} color="#FFD60A" />
              ) : (
                <ZapOff size={17} strokeWidth={2.2} color="rgba(255,255,255,0.8)" />
              )}
            </CamControl>
            <CamControl
              label="Flip camera"
              onClick={() => void flipCamera()}
              disabled={recording}
            >
              <SwitchCamera size={17} strokeWidth={2.2} color="rgba(255,255,255,0.8)" />
            </CamControl>
          </div>
        </div>

        {/* ── Record button ── */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            zIndex: 3,
          }}
        >
          {!recording && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.01em",
                fontFamily: t.fontText,
              }}
            >
              Tap to record · max {MAX_SECONDS}s
            </span>
          )}

          <div style={{ position: "relative", width: 80, height: 80 }}>
            {/* Progress ring */}
            {recording && (
              <svg
                width={80}
                height={80}
                style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
                aria-hidden
              >
                <circle
                  cx={40}
                  cy={40}
                  r={36}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={3}
                />
                <circle
                  cx={40}
                  cy={40}
                  r={36}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}
                />
              </svg>
            )}

            <button
              type="button"
              onClick={recording ? stopRecord : startRecord}
              disabled={phase !== "camera"}
              aria-label={recording ? "Stop recording" : "Start recording"}
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: recording ? 34 : 64,
                height: recording ? 34 : 64,
                borderRadius: recording ? 8 : "50%",
                border: recording ? "none" : "3.5px solid #fff",
                background: t.red,
                cursor: phase === "camera" ? "pointer" : "not-allowed",
                opacity: phase === "camera" ? 1 : 0.5,
                transition: `all 0.2s ${t.ease.spring}`,
                boxShadow: recording
                  ? "none"
                  : "0 0 0 3px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.4)",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes recPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
        `}</style>
      </div>

      {/* ── Clips strip ──────────────────────────────────────────────────── */}
      {localClips.length > 0 && (
        <div
          style={{
            padding: "10px 16px 8px",
            background: "rgba(8,8,8,0.95)",
            borderTop: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(235,235,245,0.3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
              fontFamily: t.fontText,
            }}
          >
            Today&apos;s clips ({localClips.length})
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {localClips.map((clip) => (
              <div key={clip.id} style={{ flexShrink: 0, width: 50, position: "relative" }}>
                <div
                  style={{
                    width: 50,
                    height: 64,
                    borderRadius: 9,
                    background: `url(${clip.thumbnailUrl || "https://picsum.photos/seed/fb/200/300"}) center/cover no-repeat`,
                    backgroundColor: t.bg3,
                    border: "1.5px solid rgba(255,255,255,0.14)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#fff",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    fontFamily: t.fontText,
                  }}
                >
                  {clip.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CamControl({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "none",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: pressed ? "scale(0.87)" : "scale(1)",
        transition: "transform 0.1s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}