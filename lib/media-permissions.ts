export type MediaPermissionResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; reason: "denied" | "unavailable" | "error"; message?: string };

export type FacingMode = "user" | "environment";

export async function requestMediaAccess(
  facingMode: FacingMode = "environment"
): Promise<MediaPermissionResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: "unavailable", message: "Camera is not supported in this browser." };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: true,
    });
    return { ok: true, stream };
  } catch (err) {
    const error = err as DOMException;
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return { ok: false, reason: "denied", message: "Camera and microphone access was denied." };
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return { ok: false, reason: "unavailable", message: "No camera or microphone was found." };
    }
    return { ok: false, reason: "error", message: error.message || "Could not access camera." };
  }
}

export function stopMediaStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function getRecordingMimeType(): string {
  const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

export async function captureVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => {
      video.currentTime = 0.15;
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 360;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    video.onerror = () => reject(new Error("Could not load video"));
  });
}
