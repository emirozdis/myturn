export function getCachedStreaks() {
  if (typeof window !== "undefined") {
    try {
      const groupId = localStorage.getItem("active_group_id");
      if (!groupId) return null;
      const cached = localStorage.getItem(`cached_streaks_${groupId}`);
      if (cached) return JSON.parse(cached);
    } catch { }
  }
  return null;
}
