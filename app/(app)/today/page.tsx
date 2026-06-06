"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { Avatar } from "@/components/shared/avatar";
import { ACCENT } from "@/lib/theme";
import { TimelineTracker } from "@/components/timeline-tracker";
import { getOrCreateTodayAssignment, getSignedReadUrl, toggleReaction, addComment, trackView } from "@/actions/vlog";

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

export default function TodayPage() {
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [currentHourIndex, setCurrentHourIndex] = useState(0);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [resolvedClipUrls, setResolvedClipUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Comments and Views Drawer Integration States
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isViewsOpen, setIsViewsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentList, setCommentList] = useState<any[]>([]);

  // Explicit group load and update triggers
  const loadTodayVlogs = async (targetGroupId?: any) => {
    let activeGroupId = typeof targetGroupId === "string" ? targetGroupId : null;
    if (!activeGroupId && typeof window !== "undefined") {
      activeGroupId = localStorage.getItem("active_group_id");
    }
    if (!activeGroupId) return;

    setLoading(true);
    const res = await getOrCreateTodayAssignment(activeGroupId);
    setLoading(false);

    if (res.success && res.assignment) {
      setAssignment(res.assignment);
      const fetchedClips = res.assignment.clips || [];
      setClips(fetchedClips);
      
      // Default to the timeline slot of the latest uploaded clip if clips exist
      if (fetchedClips.length > 0) {
        const latestClip = fetchedClips[fetchedClips.length - 1];
        setCurrentHourIndex(getSlotForClip(latestClip.recordedAt));
      } else {
        setCurrentHourIndex(getSlotForClip(new Date()));
      }
      
      // Resolve pre-signed read URLs from Supabase Storage
      const urls: Record<string, string> = {};
      for (const clip of fetchedClips) {
        const urlRes = await getSignedReadUrl("vlogs", clip.videoUrl);
        if (urlRes.success && urlRes.url) {
          urls[clip.id] = urlRes.url;
        }
      }
      setResolvedClipUrls(urls);
    } else {
      setAssignment(null);
      setClips([]);
      setResolvedClipUrls({});
    }
  };

  // Load initial group config on mount
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

  // Sync like count, views, comments and status whenever active clip changes
  const activeClip = clips.find((clip) => getSlotForClip(clip.recordedAt) === currentHourIndex);
  const activeClipUrl = activeClip ? resolvedClipUrls[activeClip.id] : null;
  const uploadedSlots = clips.map((clip) => getSlotForClip(clip.recordedAt));

  useEffect(() => {
    if (activeClip) {
      setLikeCount(activeClip.reactions?.length || 0);
      setLiked(false); // Match backend reaction context
      setCommentList(activeClip.comments || []);

      // Fire view tracking dynamically on load
      const recordViewEvent = async () => {
        const res = await trackView(activeClip.id);
        if (res.success && !res.alreadyViewed) {
          setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, views: [...(c.views || []), { id: "temp-view" }] } : c));
        }
      };
      recordViewEvent();
    } else {
      setLikeCount(0);
      setLiked(false);
      setCommentList([]);
    }
  }, [activeClip]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeClip) return;

    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    await toggleReaction(activeClip.id, "❤️");
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
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-white/50">
        <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
        <span className="text-[12px] font-medium tracking-wide">Loading daily updates...</span>
      </div>
    );
  }

  return (
    <motion.div
      key="today-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col justify-between min-h-0 gap-3 relative"
    >
      {/* Video Container Frame */}
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
            muted={!isVideoExpanded} // Unmuted on extend, muted on minimize
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900/60 z-0 flex flex-col items-center justify-center p-6 text-center">
            <VideoOff size={32} className="text-white/20 mb-2" />
            <span className="text-white/40 text-[11px] font-semibold leading-relaxed max-w-[200px]">
              No updates uploaded for this timeframe yet.
            </span>
          </div>
        )}

        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-1 pr-4 py-1 rounded-full z-10 shadow-md">
          <div className="relative">
            <div
              className="p-[1.5px] rounded-full"
              style={{ background: ACCENT }}
            >
              <Avatar src={assignment?.user?.image || "/profile.jpg"} size={28} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-black rounded-full" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-semibold text-[10px] tracking-tight">
              @{assignment?.user?.name || "No vlogger"}
            </span>
            <span className="text-white/45 text-[9px]">Today's Turn</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[9px] font-semibold z-10 shadow-md max-w-[140px]">
          <MapPin size={10} className="text-[#e07c30] flex-shrink-0" />
          <span className="truncate">{activeClip?.location || "Live Vlog"}</span>
        </div>

        <div className="mt-auto relative z-10 flex flex-col w-full">
          <div className="py-2 px-3.5 flex items-center justify-between flex-shrink-0">
            {/* Watchers Click Integration to trigger Viewers overlay */}
            <div 
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering video container extend/minimize
                setIsViewsOpen(true);
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex -space-x-1.5">
                {activeClip?.views?.slice(0, 3).map((view: any, idx: number) => (
                  <div key={view.id || idx} className="relative z-10 border border-black rounded-full">
                    <Avatar src={view.user?.image || "/profile.jpg"} size={20} />
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
              {/* Comments Trigger Panel */}
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
              <button className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <Smile size={16} className="text-white/90" />
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Comments Glassmorphic Tray Overlay */}
        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 h-[65%] bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[24px] z-30 flex flex-col p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent expansion trigger
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
                      <Avatar src={c.user?.image || "/profile.jpg"} size={24} />
                      <div className="flex flex-col flex-1 min-w-0 bg-white/[0.04] rounded-2xl px-3.5 py-2 border border-white/5">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-white text-[10px] font-bold">@{c.user?.name || "user"}</span>
                          <span className="text-white/40 text-[8px] font-medium">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* Sliding Viewers List Glassmorphic Sheet Overlay */}
        <AnimatePresence>
          {isViewsOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 h-[50%] bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[24px] z-30 flex flex-col p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent expansion trigger
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
                      <Avatar src={v.user?.image || "/profile.jpg"} size={32} />
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

      {/* Dynamic collapsing View Menu */}
      <div
        className={`flex-shrink-0 rounded-[24px] flex flex-col gap-3.5 shadow-lg transition-all duration-500 ${
          isVideoExpanded
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
              <Avatar src={assignment?.user?.image || "/profile.jpg"} size={44} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white font-bold text-[14px] leading-tight truncate">
                  {assignment?.user?.name || "Unassigned"}
                </span>
                <span className="text-[#e07c30] text-[10px] font-semibold">Active Turn 🔥</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-full border border-white/10 py-1.5 text-[10px] font-semibold text-white/90 transition-colors hover:bg-white/10 active:scale-[0.98]"
            >
              View Profile
            </button>
          </div>

          <div style={glassStyle(0.04, 16, 0.08)} className="p-3 rounded-[20px] min-h-[118px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-1.5 text-white mb-3 flex-shrink-0">
              <Clock size={14} className="text-[#e07c30]" />
              <span className="text-[11px] font-bold tracking-wide">Time Left</span>
            </div>
            <div className="flex flex-col flex-1 justify-center items-center w-full min-w-0">
              <div className="w-full mb-1.5">
                <CountdownTimer />
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