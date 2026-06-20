// ./components/today/utils.ts
export function getSlotForClip(recordedAt: Date | string, timezone?: string): number {
  const date = new Date(recordedAt);
  let hours = date.getHours();
  
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const hourPart = parts.find((p) => p.type === "hour")?.value || "0";
      hours = parseInt(hourPart, 10);
      if (hours === 24) hours = 0;
    } catch (e) {
      hours = date.getHours();
    }
  }

  if (hours >= 9 && hours < 12) return 0;
  if (hours >= 12 && hours < 15) return 1;
  if (hours >= 15 && hours < 18) return 2;
  if (hours >= 18 && hours < 21) return 3;
  if (hours >= 21 && hours < 24) return 4;
  return 5;
}

export function getCachedToday() {
  if (typeof window !== "undefined") {
    try {
      const groupId = localStorage.getItem("active_group_id");
      if (!groupId) return null;
      const cached = localStorage.getItem(`cached_today_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        
        // If cache was saved more than 45 minutes ago, discard the pre-signed URLs
        // to prevent the player from loading expired R2 signatures (1 hour lifespan)
        if (parsed.savedAt && Date.now() - parsed.savedAt > 45 * 60 * 1000) {
          return {
            assignment: parsed.assignment,
            clips: parsed.clips,
            isSleepMode: parsed.isSleepMode,
            resolvedClipUrls: {}, // Forces silent background re-fetch of fresh tokens
            resolvedClipThumbnails: {},
            resolvedClipBlurThumbnails: {},
          };
        }
        return parsed;
      }
    } catch { }
  }
  return null;
}