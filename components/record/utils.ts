import { PROMPTS } from "@/lib/theme";

export function getCurrentTimePeriodLabel(): string {
  const hours = new Date().getHours();
  if (hours >= 9 && hours < 12) return "Morning Vlog (9AM - 12PM)";
  if (hours >= 12 && hours < 15) return "Midday Vlog (12PM - 3PM)";
  if (hours >= 15 && hours < 18) return "Afternoon Vlog (3PM - 6PM)";
  if (hours >= 18 && hours < 21) return "Evening Vlog (6PM - 9PM)";
  if (hours >= 21 && hours < 24) return "Late Night Vlog (9PM - 12AM)";
  return "Early Morning Vlog (12AM - 9AM)";
}

export function getDailyPrompt(): string {
  const day = new Date().getDate();
  return PROMPTS[day % PROMPTS.length];
}

export async function generateThumbnail(videoBlob: Blob, recordedFacingMode: "user" | "environment"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, 720, 1280);
      }
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Timeout toBlob")), "image/jpeg", 0.8);
    }, 3000);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext("2d");

      if (recordedFacingMode === "user" && ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Video error"));
    };
  });
}
