"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  getOrCreateTodayAssignment,
  getSignedReadUrl,
  toggleReaction,
  addComment,
  trackView,
  deleteComment,
  pokeVlogger,
} from "@/actions/vlog";
import { getSlotForClip, getCachedToday } from "./utils";

export function useTodayPage() {
  const { data: session } = useSession();
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const cachedData = getCachedToday();
  const [assignment, setAssignment] = useState<any>(cachedData?.assignment || null);
  const [clips, setClips] = useState<any[]>(cachedData?.clips || []);
  const [resolvedClipUrls, setResolvedClipUrls] = useState<Record<string, string>>(cachedData?.resolvedClipUrls || {});
  const [isSleepMode, setIsSleepMode] = useState<boolean>(cachedData?.isSleepMode || false);

  const [currentHourIndex, setCurrentHourIndex] = useState(() => {
    if (cachedData?.clips && cachedData.clips.length > 0) {
      const latestClip = cachedData.clips[cachedData.clips.length - 1];
      return getSlotForClip(latestClip.recordedAt);
    }
    return getSlotForClip(new Date());
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

      if (fetchedClips.length > 0) {
        const latestClip = fetchedClips[fetchedClips.length - 1];
        setCurrentHourIndex(getSlotForClip(latestClip.recordedAt));
      } else {
        setCurrentHourIndex(getSlotForClip(new Date()));
      }

      const urls: Record<string, string> = {};
      for (const clip of fetchedClips) {
        const urlRes = await getSignedReadUrl("vlogs", clip.videoUrl);
        if (urlRes.success && urlRes.url) {
          urls[clip.id] = urlRes.url;
        }
      }
      setResolvedClipUrls(urls);

      if (typeof window !== "undefined") {
        localStorage.setItem(`cached_today_${activeGroupId}`, JSON.stringify({
          assignment: res.assignment,
          clips: fetchedClips,
          resolvedClipUrls: urls,
          isSleepMode: res.isSleepMode || false,
        }));
      }
    } else {
      setAssignment(null);
      setClips([]);
      setResolvedClipUrls({});
      setIsSleepMode(false);
    }

    isFetchingRef.current = false;
  };

  useEffect(() => {
    loadTodayVlogs();

    const handleGroupChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        loadTodayVlogs(customEvent.detail);
      }
    };

    const handleRefreshed = () => {
      loadTodayVlogs();
    };

    window.addEventListener("group-changed", handleGroupChange);
    window.addEventListener("vlogs-refreshed", handleRefreshed);
    return () => {
      window.removeEventListener("group-changed", handleGroupChange);
      window.removeEventListener("vlogs-refreshed", handleRefreshed);
    };
  }, []);

  const activeClip = [...clips].reverse().find((clip) => getSlotForClip(clip.recordedAt) === currentHourIndex);
  const activeClipUrl = activeClip ? resolvedClipUrls[activeClip.id] : null;
  const uploadedSlots = clips.map((clip) => getSlotForClip(clip.recordedAt));
  const isCurrentUserVlogger = assignment?.userId === session?.user?.id;

  useEffect(() => {
    if (activeClip) {
      setLikeCount(activeClip.reactions?.length || 0);
      setLiked(false);
      setCommentList(activeClip.comments || []);

      const recordViewEvent = async () => {
        const res = await trackView(activeClip.id);
        if (res.success && !res.alreadyViewed) {
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

          if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
            res.newlyUnlocked.forEach((id: string) => {
              window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
            });
          }
        }
      };
      recordViewEvent();
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
    activeClip,
    activeClipUrl,
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
    isSleepMode,
    setIsSleepMode,
  };
}