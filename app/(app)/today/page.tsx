"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Heart,
  Smile,
  User,
  Sparkles,
  Clock,
  Loader2,
  VideoOff,
  MessageCircle,
  Send,
  X,
  Trash2,
  AlertCircle,
  Camera,
  Hand
} from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { Avatar } from "@/components/shared/avatar";
import { ACCENT } from "@/lib/theme";
import { TimelineTracker } from "@/components/timeline-tracker";
import { getOrCreateTodayAssignment, getSignedReadUrl, toggleReaction, addComment, trackView, deleteComment, pokeVlogger } from "@/actions/vlog";

function getSlotForClip(recordedAt: Date | string): number {
  const date = new Date(recordedAt);
  const hours = date.getHours();
  if (hours >= 9 && hours < 12) return 0;
  if (hours >= 12 && hours < 15) return 1;
  if (hours >= 15 && hours < 18) return 2;
  if (hours >= 18 && hours < 21) return 3;
  if (hours >= 21 && hours < 24) return 4;
  return 5;
}

const getCachedToday = () => {
  if (typeof window !== "undefined") {
    try {
      const groupId = localStorage.getItem("active_group_id");
      if (!groupId) return null;
      const cached = localStorage.getItem(`cached_today_${groupId}`);
      if (cached) return JSON.parse(cached);
    } catch { }
  }
  return null;
};

export default function TodayPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const cachedData = getCachedToday();
  const [assignment, setAssignment] = useState<any>(cachedData?.assignment || null);
  const [clips, setClips] = useState<any[]>(cachedData?.clips || []);
  const [resolvedClipUrls, setResolvedClipUrls] = useState<Record<string, string>>(cachedData?.resolvedClipUrls || {});

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

    if (res.success && res.assignment) {
      setAssignment(res.assignment);
      const fetchedClips = res.assignment.clips || [];
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
          resolvedClipUrls: urls
        }));
      }
    } else {
      setAssignment(null);
      setClips([]);
      setResolvedClipUrls({});
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

  // Searches backward from the chronologically sorted clips array to always display the newest upload inside this time window
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
          setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, views: [...(c.views || []), { id: "temp-view" }] } : c));
          
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
  }, [activeClip]);

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

  if (initialLoad && !assignment) {
    return (
      <div className="flex-1 flex flex-col gap-3 animate-pulse">
        <div className="flex-1 min-h-0 rounded-3xl bg-white/[0.04]" />
        <div className="h-[138px] rounded-[24px] bg-white/[0.03]" />
      </div>
    );
  }

  const todayVloggerHandle = assignment?.user?.handle ? `@${assignment.user.handle}` : "No vlogger";

  return (
    <motion.div
      key="today-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col justify-between min-h-0 gap-3 relative"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`absolute top-4 left-1/2 z-[60] w-[90%] p-3 rounded-2xl flex items-center justify-center shadow-lg border backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-emerald-900/90 border-emerald-500/20 text-emerald-400" 
                : "bg-red-900/90 border-red-500/20 text-red-400"
            }`}
          >
            <span className="text-xs font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {refreshing && (
        <div className="absolute top-0 right-0 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e07c30] animate-pulse" />
          <span className="text-white/50 text-[9px] font-semibold tracking-wide">updating</span>
        </div>
      )}
      <div
        onClick={() => setIsVideoExpanded((prev) => !prev)}
        className="relative flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col cursor-pointer"
        style={{
          flex: isVideoExpanded ? 1.35 : 1,
          transition: "flex 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.6)",
            borderLeft: "1px solid rgba(255,255,255,0.3)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.6), 0 20px 40px -10px rgba(0,0,0,0.8)",
          }}
          className="absolute inset-0 rounded-3xl pointer-events-none z-10"
        />

        {activeClipUrl ? (
          <video
            src={activeClipUrl}
            autoPlay
            loop
            muted={!isVideoExpanded}
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900/60 z-0 flex flex-col items-center justify-center p-6 text-center">
            {isCurrentUserVlogger ? (
              <>
                <Camera size={40} className="text-[#e07c30] mb-4 animate-pulse" />
                <h2 className="text-white text-lg font-bold mb-2">It's your turn today!</h2>
                <p className="text-white/60 text-[12px] max-w-[200px] mb-6">Your friends are waiting for your vlog.</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push("/record"); }} 
                  className="px-6 py-3 bg-[#e07c30] text-black font-bold rounded-full active:scale-95 transition-transform"
                >
                  Record Now
                </button>
              </>
            ) : (
              <>
                <VideoOff size={32} className="text-white/20 mb-3" />
                <span className="text-white/80 text-[14px] font-bold mb-1">Waiting for {assignment?.user?.name || "vlogger"}</span>
                <span className="text-white/40 text-[11px] max-w-[200px] mb-6">No updates uploaded yet.</span>
                <button 
                  onClick={handlePoke} 
                  disabled={poking || pokeCooldown > 0} 
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold rounded-full transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {pokeCooldown > 0 ? (
                    <>
                      <Clock size={14} className="opacity-50" />
                      <span className="opacity-50 font-mono tracking-widest">{Math.floor(pokeCooldown / 60)}:{(pokeCooldown % 60).toString().padStart(2, "0")}</span>
                    </>
                  ) : (
                    <>
                      {poking ? <Loader2 size={14} className="animate-spin" /> : <Hand size={14} />}
                      <span>{poking ? "Poking..." : "Poke"}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-1 pr-4 py-1 rounded-full z-10 shadow-md">
          <div className="relative">
            <div
              className="p-[1.5px] rounded-full"
              style={{ background: ACCENT }}
            >
              <Avatar src={assignment?.user?.image} name={assignment?.user?.name} size={28} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-black rounded-full" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-semibold text-[10px] tracking-tight">
              {todayVloggerHandle}
            </span>
            <span className="text-white/45 text-[9px]">Today's Turn</span>
          </div>
        </div>

        {activeClipUrl && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[9px] font-semibold z-10 shadow-md max-w-[140px]">
            <MapPin size={10} className="text-[#e07c30] flex-shrink-0" />
            <span className="truncate">{activeClip?.location || "Live Vlog"}</span>
          </div>
        )}

        {activeClipUrl && (
          <div className="mt-auto relative z-10 flex flex-col w-full">
            <div className="py-2 px-3.5 flex items-center justify-between flex-shrink-0">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewsOpen(true);
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex -space-x-1.5">
                  {activeClip?.views?.slice(0, 3).map((view: any, idx: number) => (
                    <div key={view.id || idx} className="relative z-10 border border-black rounded-full">
                      <Avatar src={view.user?.image} name={view.user?.name} size={20} />
                    </div>
                  ))}
                  {(!activeClip?.views || activeClip.views.length === 0) && (
                    <span className="text-white/40 text-[9px] font-semibold pl-1">0 views</span>
                  )}
                </div>
                {activeClip?.views && activeClip.views.length > 0 && (
                  <span className="text-white/65 text-[9px] font-bold tracking-tight pl-1.5">
                    {activeClip.views.length} viewer{activeClip.views.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleLike} className="flex items-center gap-1 cursor-pointer">
                  <Heart
                    size={16}
                    className="transition-transform duration-200"
                    style={{
                      fill: liked ? "#ff6b6b" : "none",
                      color: liked ? "#ff6b6b" : "rgba(255,255,255,0.9)",
                      transform: liked ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                  <span
                    className="text-[11px] font-bold drop-shadow-md"
                    style={{ color: liked ? "#ff6b6b" : "rgba(255,255,255,0.9)" }}
                  >
                    {likeCount}
                  </span>
                </button>
                <span className="w-[1px] h-3.5 bg-white/20" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCommentsOpen(true);
                  }}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle size={16} className="text-white/95" />
                  <span className="text-[11px] font-bold text-white/95">{commentList.length}</span>
                </button>
                <span className="w-[1px] h-3.5 bg-white/20" />
                <button 
                  onClick={(e) => { e.stopPropagation(); showToast("Reported to moderation team."); }} 
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  title="Report Vlog"
                >
                  <AlertCircle size={15} className="text-white/90" />
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 h-[65%] bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[24px] z-30 flex flex-col p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-white text-[12px] font-bold tracking-wide">Comments ({commentList.length})</span>
                <button
                  onClick={() => setIsCommentsOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-hide">
                {commentList.length > 0 ? (
                  commentList.map((c) => (
                    <div key={c.id} className="flex gap-2.5 items-start">
                      <Avatar src={c.user?.image} name={c.user?.name} size={24} />
                      <div className="flex flex-col flex-1 min-w-0 bg-white/[0.04] rounded-2xl px-3.5 py-2 border border-white/5">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-white text-[10px] font-bold">@{c.user?.name || "user"}</span>
                          <span className="text-white/40 text-[8px] font-medium flex items-center gap-1.5">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {c.userId === session?.user?.id ? (
                              <button onClick={() => handleDeleteComment(c.id)} className="text-white/30 hover:text-red-400 transition" title="Delete">
                                <Trash2 size={10} />
                              </button>
                            ) : (
                              <button onClick={() => showToast("Comment reported.")} className="text-white/30 hover:text-red-400 transition" title="Report">
                                <AlertCircle size={10} />
                              </button>
                            )}
                          </span>
                        </div>
                        <p className="text-white/80 text-[11px] leading-relaxed break-words">{c.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <MessageCircle size={24} className="text-white/20 mb-1.5" />
                    <span className="text-white/40 text-[11px] font-semibold">No comments yet.</span>
                    <span className="text-white/25 text-[9px] mt-0.5">Be the first to react to today's turn!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendComment} className="pt-2 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-full py-2.5 px-4 text-white text-[11px] outline-none placeholder:text-white/30 focus:border-[#e07c30]/50"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-2 bg-[#e07c30] disabled:bg-neutral-800 disabled:text-white/30 text-black rounded-full transition-colors flex items-center justify-center h-8 w-8"
                >
                  <Send size={11} strokeWidth={2.5} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isViewsOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 h-[50%] bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[24px] z-30 flex flex-col p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-white text-[12px] font-bold tracking-wide">Viewers ({activeClip?.views?.length || 0})</span>
                <button
                  onClick={() => setIsViewsOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-hide">
                {activeClip?.views && activeClip.views.length > 0 ? (
                  activeClip.views.map((v: any, idx: number) => (
                    <div key={v.id || idx} className="flex items-center gap-3">
                      <Avatar src={v.user?.image} name={v.user?.name} size={32} />
                      <div className="flex flex-col">
                        <span className="text-white text-[12px] font-bold">@{v.user?.name || "user"}</span>
                        <span className="text-white/40 text-[9px] font-medium">Watched today</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <User size={24} className="text-white/20 mb-1.5" />
                    <span className="text-white/40 text-[11px] font-semibold">No views tracked yet.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={`flex-shrink-0 rounded-[24px] flex flex-col gap-3.5 shadow-lg transition-all duration-500 ${isVideoExpanded
            ? "max-h-0 opacity-0 overflow-hidden pointer-events-none p-0"
            : "max-h-[320px] opacity-100"
          }`}
      >
        <div className="grid grid-cols-2 gap-3">
          <div style={glassStyle(0.04, 16, 0.08)} className="rounded-[20px] p-3 flex flex-col justify-between min-h-[118px]">
            <div className="flex items-center gap-1.5 text-white mb-2">
              <Sparkles size={14} className="text-[#e07c30]" />
              <span className="text-[11px] font-bold tracking-wide">Today&apos;s Vlogger</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Avatar src={assignment?.user?.image} name={assignment?.user?.name} size={44} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white font-bold text-[14px] leading-tight truncate">
                  {assignment?.user?.name || "Unassigned"}
                </span>
                <span className="text-white/40 text-[10px] truncate">
                  {assignment?.user?.handle ? `@${assignment.user.handle}` : ""}
                </span>
              </div>
            </div>

            {isCurrentUserVlogger && activeClipUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); router.push("/record"); }} 
                className="mt-2 w-full py-1.5 bg-[#e07c30]/10 text-[#e07c30] border border-[#e07c30]/20 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition hover:bg-[#e07c30]/20 active:scale-95"
              >
                <Camera size={10} />
                Record Another Update
              </button>
            )}
          </div>

          <div style={glassStyle(0.04, 16, 0.08)} className="p-3 rounded-[20px] min-h-[118px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-1.5 text-white mb-3 flex-shrink-0">
              <Clock size={14} className="text-[#e07c30]" />
              <span className="text-[11px] font-bold tracking-wide">Time Left</span>
            </div>
            <div className="flex flex-col flex-1 justify-center items-center w-full min-w-0">
              <div className="w-full mb-1.5">
                <CountdownTimer timezone={assignment?.group?.timezone} />
              </div>
              <div className="text-white/60 text-[9px] sm:text-[10px] font-semibold tracking-wide text-center">until day ends</div>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] p-1.5">
          <TimelineTracker
            currentHourIndex={currentHourIndex}
            onHourChange={setCurrentHourIndex}
            uploadedSlots={uploadedSlots}
          />
        </div>
      </div>
    </motion.div>
  );
}