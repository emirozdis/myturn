"use client";

import { useRouter } from "next/navigation";
import {
  MapPin, Heart, MessageCircle, AlertCircle, VideoOff, Camera, Clock, Loader2, Hand, Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { ACCENT } from "@/lib/theme";
import { CommentsSheet } from "./comments-sheet";
import { ViewsSheet } from "./views-sheet";
import { glassStyle } from "../shared/glass-style";

type VideoFeedProps = {
  isVideoExpanded: boolean;
  onToggleExpand: () => void;
  assignment: any;
  activeClip: any;
  activeClipUrl: string | null;
  isCurrentUserVlogger: boolean;
  todayVloggerHandle: string;
  liked: boolean;
  likeCount: number;
  commentList: any[];
  isCommentsOpen: boolean;
  isViewsOpen: boolean;
  newComment: string;
  poking: boolean;
  pokeCooldown: number;
  currentUserId?: string;
  onLike: (e: React.MouseEvent) => void;
  onOpenComments: (e: React.MouseEvent) => void;
  onCloseComments: () => void;
  onOpenViews: (e: React.MouseEvent) => void;
  onCloseViews: () => void;
  onNewCommentChange: (value: string) => void;
  onSendComment: (e: React.FormEvent) => void;
  onDeleteComment: (id: string) => void;
  onReportComment: () => void;
  onReportVlog: () => void;
  onPoke: (e: React.MouseEvent) => void;
};

export function VideoFeed({
  isVideoExpanded,
  onToggleExpand,
  assignment,
  activeClip,
  activeClipUrl,
  isCurrentUserVlogger,
  todayVloggerHandle,
  liked,
  likeCount,
  commentList,
  isCommentsOpen,
  isViewsOpen,
  newComment,
  poking,
  pokeCooldown,
  currentUserId,
  onLike,
  onOpenComments,
  onCloseComments,
  onOpenViews,
  onCloseViews,
  onNewCommentChange,
  onSendComment,
  onDeleteComment,
  onReportComment,
  onReportVlog,
  onPoke,
}: VideoFeedProps) {
  const router = useRouter();

  return (
    <div
      onClick={onToggleExpand}
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
             <Camera size={40} className="text-white/30 mb-2" />
              <h2 className="text-white text-lg font-bold mb-2">It&apos;s your turn today!</h2>
              <p className="text-white/60 text-[12px] max-w-[200px] mb-6">Your friends are waiting for your vlog.</p>
              <button
                onClick={(e) => { e.stopPropagation(); router.push("/record"); }}
                style={{ background: ACCENT }}
                className="px-6 py-3 text-black font-black rounded-full border-b-[4px] border-black/25 hover:brightness-105 active:border-b-0 active:translate-y-[4px] transition-all duration-75 shadow-md"
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
                onClick={onPoke}
                disabled={poking || pokeCooldown > 0}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold rounded-full transition active:scale-95 flex items-center justify-center gap-2"
              >
                {pokeCooldown > 0 ? (
                  <>
                    <Clock size={14} className="opacity-50" />
                    <span className="opacity-50 font-mono tracking-widest">
                      {Math.floor(pokeCooldown / 60)}:{(pokeCooldown % 60).toString().padStart(2, "0")}
                    </span>
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
          <div className="p-[1.5px] rounded-full" style={{ background: ACCENT }}>
            <Avatar src={assignment?.user?.image} name={assignment?.user?.name} size={28} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-black rounded-full" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-white font-semibold text-[10px] tracking-tight">{todayVloggerHandle}</span>
          <span className="text-white/45 text-[9px]">Today&apos;s Turn</span>
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
              onClick={onOpenViews}
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
              <button onClick={onLike} className="flex items-center gap-1 cursor-pointer">
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
              <button onClick={onOpenComments} className="flex items-center gap-1 cursor-pointer">
                <MessageCircle size={16} className="text-white/95" />
                <span className="text-[11px] font-bold text-white/95">{commentList.length}</span>
              </button>
              <span className="w-[1px] h-3.5 bg-white/20" />
              <button
                onClick={(e) => { e.stopPropagation(); onReportVlog(); }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                title="Report Vlog"
              >
                <AlertCircle size={15} className="text-white/90" />
              </button>
            </div>
          </div>
        </div>
      )}

      <CommentsSheet
        isOpen={isCommentsOpen}
        onClose={onCloseComments}
        commentList={commentList}
        newComment={newComment}
        onNewCommentChange={onNewCommentChange}
        onSubmit={onSendComment}
        onDeleteComment={onDeleteComment}
        onReportComment={onReportComment}
        currentUserId={currentUserId}
      />

      <ViewsSheet
        isOpen={isViewsOpen}
        onClose={onCloseViews}
        views={activeClip?.views}
      />
    </div>
  );
}
