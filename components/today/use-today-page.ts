"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  getOrCreateTodayAssignment,
  toggleReaction,
  addComment,
  deleteComment,
  pokeVlogger,
  trackView,
  addPhotoResponse,
  toggleVolunteer,
} from "@/actions/vlog";
import posthog from "posthog-js";
import { getSlotForClip, getCachedToday } from "./utils";

const VIEWED_CLIPS_KEY = "myturn_viewed_clips";

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

  const [hasVolunteeredForTomorrow, setHasVolunteeredForTomorrow] = useState<boolean>(cachedData?.hasVolunteeredForTomorrow || false);
  const [canVolunteer, setCanVolunteer] = useState<boolean>(cachedData?.canVolunteer ?? false);
  const [volunteerEligibilityReason, setVolunteerEligibilityReason] = useState<string>(cachedData?.volunteerEligibilityReason || "");
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [volunteerError, setVolunteerError] = useState("");

  const timezone = assignment?.group?.timezone || cachedData?.assignment?.group?.timezone;

  const [actualHourIndex, setActualHourIndex] = useState(() => getSlotForClip(new Date(), timezone));

  // local in-flight tracking set to eliminate concurrent duplicate view tracking actions
  const trackingClipIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tz = assignment?.group?.timezone || cachedData?.assignment?.group?.timezone;
    const interval = setInterval(() => {
      setActualHourIndex(getSlotForClip(new Date(), tz));
    }, 60000);
    setActualHourIndex(getSlotForClip(new Date(), tz));
    return () => clearInterval(interval);
  }, [assignment?.group?.timezone, cachedData?.assignment?.group?.timezone]);

  const [currentHourIndex, setCurrentHourIndex] = useState(() => {
    const tz = cachedData?.assignment?.group?.timezone;
    if (cachedData?.clips && cachedData.clips.length > 0) {
      const viewed = getViewedClips();
      const oldestUnseen = cachedData.clips.find((c: any) => !viewed[c.id]);
      if (oldestUnseen) {
        return getSlotForClip(oldestUnseen.recordedAt, tz);
      }
      const latestClip = cachedData.clips[cachedData.clips.length - 1];
      return getSlotForClip(latestClip.recordedAt, tz);
    }
    return getSlotForClip(new Date(), tz);
  });

  const [currentClipSubIndex, setCurrentClipSubIndex] = useState(() => {
    const tz = cachedData?.assignment?.group?.timezone;
    if (cachedData?.clips && cachedData.clips.length > 0) {
      const viewed = getViewedClips();
      const oldestUnseen = cachedData.clips.find((c: any) => !viewed[c.id]);
      if (oldestUnseen) {
        const slot = getSlotForClip(oldestUnseen.recordedAt, tz);
        const slotClips = cachedData.clips.filter((c: any) => getSlotForClip(c.recordedAt, tz) === slot);
        const idx = slotClips.findIndex((c: any) => c.id === oldestUnseen.id);
        return Math.max(0, idx);
      }
      const latestClip = cachedData.clips[cachedData.clips.length - 1];
      const latestSlot = getSlotForClip(latestClip.recordedAt, tz);
      const slotClips = cachedData.clips.filter((c: any) => getSlotForClip(c.recordedAt, tz) === latestSlot);
      return Math.max(0, slotClips.length - 1);
    }
    return 0;
  });

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isViewsOpen, setIsViewsOpen] = useState(false);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);
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
      setHasVolunteeredForTomorrow(res.hasVolunteered || false);
      setCanVolunteer(res.canVolunteer ?? false);
      setVolunteerEligibilityReason(res.volunteerEligibilityReason || "");
      const fetchedClips = res.assignment?.clips || [];
      
      const tz = res.assignment?.group?.timezone;
      const viewed = getViewedClips();
      const oldestUnseen = fetchedClips.find((c: any) => !viewed[c.id]);

      if (oldestUnseen) {
        const slot = getSlotForClip(oldestUnseen.recordedAt, tz);
        setCurrentHourIndex(slot);
        const slotClips = fetchedClips.filter((c: any) => getSlotForClip(c.recordedAt, tz) === slot);
        const idx = slotClips.findIndex((c: any) => c.id === oldestUnseen.id);
        setCurrentClipSubIndex(Math.max(0, idx));
      } else if (fetchedClips.length > 0) {
        const latestClip = fetchedClips[fetchedClips.length - 1];
        const latestSlot = getSlotForClip(latestClip.recordedAt, tz);
        setCurrentHourIndex(latestSlot);
        const slotClips = fetchedClips.filter((c: any) => getSlotForClip(c.recordedAt, tz) === latestSlot);
        setCurrentClipSubIndex(Math.max(0, slotClips.length - 1));
      } else {
        setCurrentHourIndex(getSlotForClip(new Date(), tz));
        setCurrentClipSubIndex(0);
      }

      const urls: Record<string, string> = {};
      const thumbUrls: Record<string, string> = {};
      const blurThumbUrls: Record<string, string> = {};
      const disableAbr = typeof window !== "undefined" && localStorage.getItem("disable_abr") === "true";

      for (const clip of fetchedClips) {
        urls[clip.id] = disableAbr
          ? clip.videoUrl 
          : (clip.transcodeStatus === "COMPLETED" && clip.hlsUrl) ? clip.hlsUrl : clip.videoUrl;

        thumbUrls[clip.id] = clip.thumbnailUrl;
        blurThumbUrls[clip.id] = clip.thumbnailBlurUrl || clip.thumbnailUrl;
      }
      
      setClips([...fetchedClips]);
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
          hasVolunteeredForTomorrow: res.hasVolunteered || false,
          canVolunteer: res.canVolunteer ?? false,
          volunteerEligibilityReason: res.volunteerEligibilityReason || "",
          savedAt: Date.now(), 
        }));
      }
    } else {
      setAssignment(null);
      setClips([]);
      setResolvedClipUrls({});
      setResolvedClipThumbnails({});
      setResolvedClipBlurThumbnails({});
      setIsSleepMode(false);
      setHasVolunteeredForTomorrow(false);
      setCanVolunteer(false);
      setVolunteerEligibilityReason("");
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

  const activeSlotClips = clips.filter((clip) => getSlotForClip(clip.recordedAt, timezone) === currentHourIndex);

  const clipIdsStr = clips.map(c => c.id).join(",");
  const prevClipIdsStrRef = useRef(clipIdsStr);
  const prevHourIndexRef = useRef(currentHourIndex);

  useEffect(() => {
    const slotClips = clips.filter((clip) => getSlotForClip(clip.recordedAt, timezone) === currentHourIndex);
    
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
  }, [currentHourIndex, clips, clipIdsStr, timezone]);

  useEffect(() => {
    if (currentClipSubIndex >= activeSlotClips.length && activeSlotClips.length > 0) {
      setCurrentClipSubIndex(Math.max(0, activeSlotClips.length - 1));
    }
  }, [activeSlotClips.length, currentClipSubIndex]);

  const activeClip = activeSlotClips[currentClipSubIndex] || null;
  const activeClipUrl = activeClip ? resolvedClipUrls[activeClip.id] : null;
  const activeClipThumbnailUrl = activeClip ? resolvedClipThumbnails[activeClip.id] : null;
  const activeClipThumbnailBlurUrl = activeClip ? resolvedClipBlurThumbnails[activeClip.id] : null;
  
  const nextClipOverall = useMemo(() => {
    if (clips.length === 0 || !activeClip) return null;
    const currentIndex = clips.findIndex((c) => c.id === activeClip.id);
    if (currentIndex !== -1 && currentIndex < clips.length - 1) {
      return clips[currentIndex + 1];
    }
    return null;
  }, [clips, activeClip]);

  const nextClipUrl = nextClipOverall ? resolvedClipUrls[nextClipOverall.id] : null;

  const groupMembers = assignment?.group?.members?.map((m: any) => m.user) || [];
  const uploadedSlots = clips.map((clip) => getSlotForClip(clip.recordedAt, timezone));
  const isCurrentUserVlogger = assignment?.userId === session?.user?.id;
  const hasPostedInCurrentSlot = clips.some(c => getSlotForClip(c.recordedAt, timezone) === actualHourIndex);

  const handleNextSubClip = useCallback(() => {
    const slotClips = clips.filter((clip) => getSlotForClip(clip.recordedAt, timezone) === currentHourIndex);
    
    if (currentClipSubIndex < slotClips.length - 1) {
      setCurrentClipSubIndex(prev => prev + 1);
    } else {
      const activeSlotsSorted = Array.from(new Set(clips.map(c => getSlotForClip(c.recordedAt, timezone)))).sort((a, b) => a - b);
      const currentIdx = activeSlotsSorted.indexOf(currentHourIndex);
      if (currentIdx !== -1 && currentIdx < activeSlotsSorted.length - 1) {
        const nextSlot = activeSlotsSorted[currentIdx + 1];
        prevHourIndexRef.current = nextSlot;
        setCurrentHourIndex(nextSlot);
        setCurrentClipSubIndex(0);
      }
    }
  }, [clips, currentHourIndex, currentClipSubIndex, timezone]);

  const handlePrevSubClip = useCallback(() => {
    if (currentClipSubIndex > 0) {
      setCurrentClipSubIndex(prev => prev - 1);
    } else {
      let prevSlot = -1;
      for (let s = currentHourIndex - 1; s >= 0; s--) {
        const hasClips = clips.some(c => getSlotForClip(c.recordedAt, timezone) === s);
        if (hasClips) {
          prevSlot = s;
          break;
        }
      }

      if (prevSlot !== -1) {
        const prevSlotClips = clips.filter(c => getSlotForClip(c.recordedAt, timezone) === prevSlot);
        prevHourIndexRef.current = prevSlot;
        setCurrentHourIndex(prevSlot);
        setCurrentClipSubIndex(Math.max(0, prevSlotClips.length - 1));
      }
    }
  }, [clips, currentHourIndex, currentClipSubIndex, timezone]);

  const viewed = getViewedClips();
  const allVideosViewed = clips.length > 0 && clips.every((c) => !!viewed[c.id]);

  const isLastClipOverall = useMemo(() => {
    if (clips.length === 0 || !activeClip) return false;
    const sorted = [...clips].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return activeClip.id === sorted[sorted.length - 1].id;
  }, [clips, activeClip]);

  const activeClipId = activeClip?.id;
  const reactionsLength = activeClip?.reactions?.length;
  const isLikedByMe = activeClip?.reactions?.some((r: any) => r.userId === session?.user?.id);
  const commentsListString = JSON.stringify(activeClip?.comments || []);

  useEffect(() => {
    if (activeClip) {
      setLikeCount(reactionsLength || 0);
      setLiked(isLikedByMe || false);
      setCommentList(activeClip.comments || []);

      const timer = setTimeout(() => {
        const currentViewed = getViewedClips();
        const clipId = activeClip.id;

        if (!currentViewed[clipId] && !trackingClipIdsRef.current.has(clipId)) {
          trackingClipIdsRef.current.add(clipId);
          markClipAsViewed(clipId);
          
          trackView(clipId).then((res) => {
            if (res.success && res.newlyUnlocked && res.newlyUnlocked.length > 0) {
              res.newlyUnlocked.forEach((id: string) => {
                window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
              });
            }
          }).catch(() => {
            trackingClipIdsRef.current.delete(clipId);
          });
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [activeClipId, reactionsLength, isLikedByMe, commentsListString, session?.user?.id]);

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
    let interval: NodeJS.Timeout;
    if (pokeCooldown > 0) {
      interval = setInterval(() => {
        setPokeCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pokeCooldown]);

  const handleLike = useCallback(async () => {
    if (!activeClip) return;
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikeCount(prev => prevLiked ? prev - 1 : prev + 1);

    const res = await toggleReaction(activeClip.id, "❤️");
    if (!res.success) {
      setLiked(prevLiked);
      setLikeCount(prev => prevLiked ? prev + 1 : prev - 1);
    } else {
      if (!prevLiked) posthog.capture("vlog_liked", { clip_id: activeClip.id });
    }
    if (res.newlyUnlocked?.length) {
      res.newlyUnlocked.forEach((id: string) => {
        window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
      });
    }
  }, [liked, activeClip]);

  const handleSendComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!activeClip || !newComment.trim()) return;

    const tempCommentText = newComment.trim();

    try {
      const res = await addComment(activeClip.id, tempCommentText, parentId);
      
      if (res.success && res.comment) {
        setNewComment(""); 
        setCommentList((prev) => [...prev, res.comment]);
        setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, comments: [...(c.comments || []), res.comment] } : c));

        if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
          res.newlyUnlocked.forEach((id: string) => {
            window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
          });
        }
      } else {
        showToast(res.error || "Failed to post comment. Please try again.", "error");
      }
    } catch (err: any) {
      showToast("Network error. Unable to post comment.", "error");
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

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const hasResponded = activeClip?.photoResponses?.some((pr: any) => pr.userId === session?.user?.id);

  const handlePhotoResponseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasResponded && !uploadingPhoto) {
      setIsPhotoCaptureOpen(true);
    }
  };

  const handlePhotoResponseUpload = async (fileOrBlob: File | Blob) => {
    if (!fileOrBlob) return;

    const activeGroupId = assignment?.groupId || (typeof window !== "undefined" ? localStorage.getItem("active_group_id") : null);

    if (!activeClip || !activeGroupId) {
      showToast("Missing clip or group context", "error");
      return;
    }
    
    setUploadingPhoto(true);
    try {
      const ext = "jpg";
      const path = `${activeGroupId}/${assignment.id}/responses/${Date.now()}.${ext}`;
      
      const formData = new FormData();
      formData.append("file", fileOrBlob, `response.${ext}`);
      formData.append("bucket", "vlogs");
      formData.append("path", path);

      const uploadRes = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload request failed.");
      }

      const res = await addPhotoResponse(activeClip.id, path);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Photo response added!", "success");
        
        if (res.photoResponse) {
          const optimisticResponse = {
            ...res.photoResponse,
            imageUrl: URL.createObjectURL(fileOrBlob),
          };
          setClips((prev) => 
            prev.map((c) => 
              c.id === activeClip.id 
                ? { ...c, photoResponses: [...(c.photoResponses || []), optimisticResponse] }
                : c
            )
          );
        }

        window.dispatchEvent(new CustomEvent("vlogs-refreshed"));
      }
    } catch (err) {
      showToast("Failed to upload photo", "error");
    } finally {
      setUploadingPhoto(false);
      setIsPhotoCaptureOpen(false);
    }
  };

  const handleToggleVolunteer = async () => {
    const activeGroupId = assignment?.groupId || (typeof window !== "undefined" ? localStorage.getItem("active_group_id") : null);
    if (!activeGroupId) {
      showToast("Missing group context.", "error");
      return;
    }
    
    setIsVolunteering(true);
    setVolunteerError("");
    try {
      const res = await toggleVolunteer(activeGroupId);
      if (res.error) {
        setVolunteerError(res.error);
        showToast(res.error, "error");
      } else {
        setHasVolunteeredForTomorrow(res.hasVolunteered || false);
        showToast(res.hasVolunteered ? "Volunteered for tomorrow!" : "Volunteer status reverted.", "success");
        
        // Local state mutation for offline reactivity guarantees matching cycle
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`cached_today_${activeGroupId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.hasVolunteeredForTomorrow = res.hasVolunteered;
            localStorage.setItem(`cached_today_${activeGroupId}`, JSON.stringify(parsed));
          }
        }
      }
    } catch (err: any) {
      setVolunteerError("Network error.");
    } finally {
      setIsVolunteering(false);
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
    nextClipUrl,
    activeClipThumbnailUrl,
    activeClipThumbnailBlurUrl,
    groupMembers,
    uploadedSlots,
    isCurrentUserVlogger,
    refreshing,
    initialLoad,
    isCommentsOpen,
    setIsCommentsOpen,
    isViewsOpen,
    setIsViewsOpen,
    isPhotoCaptureOpen,
    setIsPhotoCaptureOpen,
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
    actualHourIndex,
    hasPostedInCurrentSlot,
    uploadingPhoto,
    hasResponded,
    fileInputRef: { current: null }, 
    handlePhotoResponseClick,
    handlePhotoResponseUpload,
    allVideosViewed,
    isLastClipOverall,
    hasVolunteeredForTomorrow,
    canVolunteer,
    volunteerEligibilityReason,
    isVolunteering,
    volunteerError,
    handleToggleVolunteer,
  };
}