"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  getOrCreateTodayAssignment,
  getSignedReadUrl,
  toggleReaction,
  addComment,
  deleteComment,
  pokeVlogger,
} from "@/actions/vlog";
import { getSlotForClip, getCachedToday } from "./utils";

const VIEWED_CLIPS_KEY = "myturn_viewed_clips";

// Helper to retrieve viewed clips from localStorage, cleaning up entries older than 24 hours (1 day)
function getViewedClips(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VIEWED_CLIPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    
    const now = Date.now();
    const updated: Record<string, number> = {};
    let changed = false;
    for (const [id, timestamp] of Object.entries(parsed)) {
      if (typeof timestamp === "number" && now - timestamp < 24 * 60 * 60 * 1000) {
        updated[id] = timestamp;
      } else {
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(VIEWED_CLIPS_KEY, JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    console.error("Failed to read viewed clips:", e);
    return {};
  }
}

// Helper to save a viewed clip with current timestamp in localStorage
function markClipAsViewed(clipId: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getViewedClips();
    current[clipId] = Date.now();
    localStorage.setItem(VIEWED_CLIPS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to mark clip as viewed:", e);
  }
}

export function useTodayPage() {
  const { data: session } = useSession();
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const cachedData = getCachedToday();
  const [assignment, setAssignment] = useState<any>(cachedData?.assignment || null);
  const [clips, setClips] = useState<any[]>(cachedData?.clips || []);

  const [resolvedClipUrls, setResolvedClipUrls] = useState<Record<string, string>>(() => {
    if (!cachedData?.resolvedClipUrls) return {};
    const disableAbr = typeof window !== "undefined" && localStorage.getItem("disable_abr") === "true";
    const firstCachedUrl = Object.values(cachedData.resolvedClipUrls)[0] as string | undefined;

    if (firstCachedUrl) {
      const isCachedHls = firstCachedUrl.includes(".m3u8");
      if (disableAbr && isCachedHls) return {};
      if (!disableAbr && !isCachedHls && cachedData.clips?.some((c: any) => c.transcodeStatus === "COMPLETED")) return {};
    }
    return cachedData.resolvedClipUrls;
  });

  const [resolvedClipThumbnails, setResolvedClipThumbnails] = useState<Record<string, string>>(cachedData?.resolvedClipThumbnails || {});
  const [resolvedClipBlurThumbnails, setResolvedClipBlurThumbnails] = useState<Record<string, string>>(cachedData?.resolvedClipBlurThumbnails || {});
  const [isSleepMode, setIsSleepMode] = useState<boolean>(cachedData?.isSleepMode || false);

  // Initialize selected slot index focusing on the oldest unseen clip of the day (falling back to the latest clip)
  const [currentHourIndex, setCurrentHourIndex] = useState(() => {
    if (cachedData?.clips && cachedData.clips.length > 0) {
      const viewed = getViewedClips();
      const oldestUnseen = cachedData.clips.find((c: any) => !viewed[c.id]);
      if (oldestUnseen) {
        return getSlotForClip(oldestUnseen.recordedAt);
      }
      const latestClip = cachedData.clips[cachedData.clips.length - 1];
      return getSlotForClip(latestClip.recordedAt);
    }
    return getSlotForClip(new Date());
  });

  // Initialize selected sub-clip index focusing on the oldest unseen clip inside the initial active slot
  const [currentClipSubIndex, setCurrentClipSubIndex] = useState(() => {
    if (cachedData?.clips && cachedData.clips.length > 0) {
      const viewed = getViewedClips();
      const oldestUnseen = cachedData.clips.find((c: any) => !viewed[c.id]);
      if (oldestUnseen) {
        const slot = getSlotForClip(oldestUnseen.recordedAt);
        const slotClips = cachedData.clips.filter((c: any) => getSlotForClip(c.recordedAt) === slot);
        const idx = slotClips.findIndex((c: any) => c.id === oldestUnseen.id);
        return Math.max(0, idx);
      }
      const latestClip = cachedData.clips[cachedData.clips.length - 1];
      const latestSlot = getSlotForClip(latestClip.recordedAt);
      const slotClips = cachedData.clips.filter((c: any) => getSlotForClip(c.recordedAt) === latestSlot);
      return Math.max(0, slotClips.length - 1);
    }
    return 0;
  });

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isViewsOpen, setIsViewsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentList, setCommentList] = useState<any[]>([]);
  const [poking, setPoking] = useState(false);
  const [pokeCooldown, setPokeCooldown] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isFetchingRef = useRef(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTodayVlogs = async (targetGroupId?: any) => {
    let activeGroupId = typeof targetGroupId === "string" ? targetGroupId : null;
    if (!activeGroupId && typeof window !== "undefined") {
      activeGroupId = localStorage.getItem("active_group_id");
    }
    if (!activeGroupId) return;

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setRefreshing(true);
    const res = await getOrCreateTodayAssignment(activeGroupId);
    setRefreshing(false);
    setInitialLoad(false);

    if (res.success) {
      setIsSleepMode(res.isSleepMode || false);
      setAssignment(res.assignment);
      const fetchedClips = res.assignment?.clips || [];
      setClips(fetchedClips);

      const viewed = getViewedClips();
      const oldestUnseen = fetchedClips.find((c: any) => !viewed[c.id]);

      if (oldestUnseen) {
        const slot = getSlotForClip(oldestUnseen.recordedAt);
        setCurrentHourIndex(slot);
        const slotClips = fetchedClips.filter((c: any) => getSlotForClip(c.recordedAt) === slot);
        const idx = slotClips.findIndex((c: any) => c.id === oldestUnseen.id);
        setCurrentClipSubIndex(Math.max(0, idx));
      } else if (fetchedClips.length > 0) {
        const latestClip = fetchedClips[fetchedClips.length - 1];
        const latestSlot = getSlotForClip(latestClip.recordedAt);
        setCurrentHourIndex(latestSlot);
        const slotClips = fetchedClips.filter((c: any) => getSlotForClip(c.recordedAt) === latestSlot);
        setCurrentClipSubIndex(Math.max(0, slotClips.length - 1));
      } else {
        setCurrentHourIndex(getSlotForClip(new Date()));
        setCurrentClipSubIndex(0);
      }

      const urls: Record<string, string> = {};
      const thumbUrls: Record<string, string> = {};
      const blurThumbUrls: Record<string, string> = {};
      const disableAbr = typeof window !== "undefined" && localStorage.getItem("disable_abr") === "true";

      for (const clip of fetchedClips) {
        const videoTarget = (!disableAbr && clip.transcodeStatus === "COMPLETED" && clip.hlsUrl) ? clip.hlsUrl : clip.videoUrl;
        const urlRes = await getSignedReadUrl("vlogs", videoTarget);
        if (urlRes.success && urlRes.url) urls[clip.id] = urlRes.url;

        const thumbRes = await getSignedReadUrl("vlogs", clip.thumbnailUrl);
        if (thumbRes.success && thumbRes.url) thumbUrls[clip.id] = thumbRes.url;

        const blurTarget = clip.thumbnailBlurUrl || clip.thumbnailUrl;
        const blurThumbRes = await getSignedReadUrl("vlogs", blurTarget);
        if (blurThumbRes.success && blurThumbRes.url) blurThumbUrls[clip.id] = blurThumbRes.url;
      }
      
      setResolvedClipUrls(urls);
      setResolvedClipThumbnails(thumbUrls);
      setResolvedClipBlurThumbnails(blurThumbUrls);

      if (typeof window !== "undefined") {
        localStorage.setItem(`cached_today_${activeGroupId}`, JSON.stringify({
          assignment: res.assignment,
          clips: fetchedClips,
          resolvedClipUrls: urls,
          resolvedClipThumbnails: thumbUrls,
          resolvedClipBlurThumbnails: blurThumbUrls,
          isSleepMode: res.isSleepMode || false,
        }));
      }
    } else {
      setAssignment(null);
      setClips([]);
      setResolvedClipUrls({});
      setResolvedClipThumbnails({});
      setResolvedClipBlurThumbnails({});
      setIsSleepMode(false);
    }
    isFetchingRef.current = false;
  };

  useEffect(() => {
    loadTodayVlogs();

    const handleGroupChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) loadTodayVlogs(customEvent.detail);
    };

    const handleRefreshed = () => loadTodayVlogs();

    window.addEventListener("group-changed", handleGroupChange);
    window.addEventListener("vlogs-refreshed", handleRefreshed);
    return () => {
      window.removeEventListener("group-changed", handleGroupChange);
      window.removeEventListener("vlogs-refreshed", handleRefreshed);
    };
  }, []);

  // Filter clips belonging specifically to the chosen slot on the timeline
  const activeSlotClips = clips.filter((clip) => getSlotForClip(clip.recordedAt) === currentHourIndex);

  const clipIdsStr = clips.map(c => c.id).join(",");
  const prevClipIdsStrRef = useRef(clipIdsStr);
  const prevHourIndexRef = useRef(currentHourIndex);

  // Set the sub-index to the oldest unseen clip in this slot whenever the parent hour slot timeline index changes or clips load/switch
  useEffect(() => {
    const slotClips = clips.filter((clip) => getSlotForClip(clip.recordedAt) === currentHourIndex);
    
    const hourChanged = prevHourIndexRef.current !== currentHourIndex;
    const clipsListChanged = prevClipIdsStrRef.current !== clipIdsStr;

    if (hourChanged || clipsListChanged) {
      prevHourIndexRef.current = currentHourIndex;
      prevClipIdsStrRef.current = clipIdsStr;

      const viewed = getViewedClips();
      const oldestUnseenInSlot = slotClips.find((c) => !viewed[c.id]);

      if (oldestUnseenInSlot) {
        const idx = slotClips.findIndex((c) => c.id === oldestUnseenInSlot.id);
        setCurrentClipSubIndex(Math.max(0, idx));
      } else {
        if (slotClips.length > 0) {
          setCurrentClipSubIndex(slotClips.length - 1);
        } else {
          setCurrentClipSubIndex(0);
        }
      }
    }
  }, [currentHourIndex, clips, clipIdsStr]);

  // Prevent out-of-bounds index errors if clips are deleted remotely
  useEffect(() => {
    if (currentClipSubIndex >= activeSlotClips.length && activeSlotClips.length > 0) {
      setCurrentClipSubIndex(Math.max(0, activeSlotClips.length - 1));
    }
  }, [activeSlotClips.length, currentClipSubIndex]);

  const activeClip = activeSlotClips[currentClipSubIndex] || null;
  const activeClipUrl = activeClip ? resolvedClipUrls[activeClip.id] : null;
  const activeClipThumbnailUrl = activeClip ? resolvedClipThumbnails[activeClip.id] : null;
  const activeClipThumbnailBlurUrl = activeClip ? resolvedClipBlurThumbnails[activeClip.id] : null;
  
  const uploadedSlots = clips.map((clip) => getSlotForClip(clip.recordedAt));
  const isCurrentUserVlogger = assignment?.userId === session?.user?.id;

  const handleNextSubClip = useCallback(() => {
    if (currentClipSubIndex < activeSlotClips.length - 1) {
      setCurrentClipSubIndex(prev => prev + 1);
    }
  }, [currentClipSubIndex, activeSlotClips.length]);

  const handlePrevSubClip = useCallback(() => {
    if (currentClipSubIndex > 0) {
      setCurrentClipSubIndex(prev => prev - 1);
    }
  }, [currentClipSubIndex]);

  useEffect(() => {
    if (activeClip) {
      setLikeCount(activeClip.reactions?.length || 0);
      setLiked(false);
      setCommentList(activeClip.comments || []);

      // Avoid marking temporary/transitional clips as viewed immediately (e.g., during index adjustments or fast skipping).
      // Wait for 1.2 seconds of continuous viewing to mark as viewed.
      const timer = setTimeout(() => {
        const viewed = getViewedClips();
        if (!viewed[activeClip.id]) {
          markClipAsViewed(activeClip.id);
          
          setClips(prev => prev.map(c => c.id === activeClip.id ? { 
            ...c, 
            views: [...(c.views || []), { 
              id: "temp-view", 
              user: { 
                id: session?.user?.id, 
                name: session?.user?.name, 
                image: session?.user?.image, 
                handle: (session?.user as any)?.handle 
              } 
            }] 
          } : c));
        }
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setLikeCount(0);
      setLiked(false);
      setCommentList([]);
    }
  }, [activeClip, session]);

  useEffect(() => {
    if (assignment?.pokes?.[0]) {
      const lastPokeTime = new Date(assignment.pokes[0].createdAt).getTime();
      const diff = Date.now() - lastPokeTime;
      if (diff < 30 * 60 * 1000) {
        setPokeCooldown(Math.floor((30 * 60 * 1000 - diff) / 1000));
      } else {
        setPokeCooldown(0);
      }
    } else {
      setPokeCooldown(0);
    }
  }, [assignment]);

  useEffect(() => {
    if (pokeCooldown > 0) {
      const interval = setInterval(() => {
        setPokeCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pokeCooldown]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeClip) return;

    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    const res = await toggleReaction(activeClip.id, "❤️");

    if (res.success && res.newlyUnlocked && res.newlyUnlocked.length > 0) {
      res.newlyUnlocked.forEach((id: string) => {
        window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
      });
    }
  }, [liked, activeClip]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClip || !newComment.trim()) return;

    const tempCommentText = newComment;
    setNewComment("");

    const res = await addComment(activeClip.id, tempCommentText);
    if (res.success && res.comment) {
      setCommentList((prev) => [...prev, res.comment]);
      setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, comments: [...(c.comments || []), res.comment] } : c));

      if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
        res.newlyUnlocked.forEach((id: string) => {
          window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
        });
      }
    }
  };

  const handleDeleteComment = async (id: string) => {
    const res = await deleteComment(id);
    if (res.success) {
      setCommentList(prev => prev.filter(c => c.id !== id));
      setClips(prev => prev.map(c => c.id === activeClip?.id ? { ...c, comments: c.comments.filter((com: any) => com.id !== id) } : c));
    }
  };

  const handlePoke = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pokeCooldown > 0 || !assignment?.id) return;
    setPoking(true);
    const res = await pokeVlogger(assignment.id);
    setPoking(false);
    if (res.success) {
      setPokeCooldown(30 * 60);
      showToast("Poke sent! We notified the vlogger.", "success");
    } else {
      showToast(res.error || "Failed to send poke.", "error");
    }
  };

  return {
    session,
    isVideoExpanded,
    setIsVideoExpanded,
    liked,
    likeCount,
    assignment,
    activeSlotClips,
    currentClipSubIndex,
    activeClip,
    activeClipUrl,
    activeClipThumbnailUrl,
    activeClipThumbnailBlurUrl,
    uploadedSlots,
    isCurrentUserVlogger,
    refreshing,
    initialLoad,
    isCommentsOpen,
    setIsCommentsOpen,
    isViewsOpen,
    setIsViewsOpen,
    newComment,
    setNewComment,
    commentList,
    poking,
    pokeCooldown,
    toast,
    currentHourIndex,
    setCurrentHourIndex,
    showToast,
    handleLike,
    handleSendComment,
    handleDeleteComment,
    handlePoke,
    handleNextSubClip,
    handlePrevSubClip,
    isSleepMode,
    setIsSleepMode,
  };
}