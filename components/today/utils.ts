export function getSlotForClip(recordedAt: Date | string): number {
  const date = new Date(recordedAt);
  const hours = date.getHours();
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
      if (cached) return JSON.parse(cached);
    } catch { }
  }
  return null;
}
