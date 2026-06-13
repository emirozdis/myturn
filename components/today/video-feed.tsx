// ./components/today/video-feed.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Heart, MessageCircle, Volume2, VolumeX, Maximize, Minimize
} from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
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
  onPoke: (e: React.MouseEvent) => void;
  isSleepMode: boolean;
};

export function VideoFeed({
  isVideoExpanded,
  onToggleExpand,
  assignment,
  activeClip,
  activeClipUrl,
  isCurrentUserVlogger,
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
  onPoke,
  isSleepMode,
}: VideoFeedProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);

  // Sync mute state with expansion state natively
  useEffect(() => {
    setIsMuted(!isVideoExpanded);
  }, [isVideoExpanded]);

  // Filter out the vlogger (assignment owner) from the views list
  const displayViews = activeClip?.views?.filter((v: any) => v.user?.id !== assignment?.userId) || [];

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

      {isSleepMode && !activeClipUrl ? (
        <div className="absolute inset-0 bg-[#060814] z-0 flex flex-col items-center justify-start p-6 text-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: "url('/assets/images/resting.jpeg')" }}
          />

          <div className="absolute top-0 left-0 right-0 h-[60%] overflow-hidden z-10 pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-[28px] scale-[1.08] origin-top"
              style={{ 
                backgroundImage: "url('/assets/images/resting.jpeg')",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-transparent"
            />
          </div>

          <div className="relative z-20 flex flex-col items-center max-w-[280px] mt-6 text-center">
            <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">MyTurn is Resting</h2>
            <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
              Quiet hours are active. Pokes and rolls are paused. Next vlogger selection rolls at 9:00 AM local time.
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/streaks");
                }}
                style={glassStyle(0.08, 16, 0.12)}
                className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center"
              >
                <span>Watch Last Completed Vlog</span>
              </button>
            </div>
          </div>
        </div>
      ) : activeClipUrl ? (
        <video
          src={activeClipUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : (
        <div className="absolute inset-0 bg-[#060814] z-0 flex flex-col items-center justify-start p-6 text-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: "url('/assets/images/no-clip-yet.jpeg')" }}
          />

          <div className="absolute top-0 left-0 right-0 h-[60%] overflow-hidden z-10 pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-[28px] scale-[1.08] origin-top"
              style={{ 
                backgroundImage: "url('/assets/images/no-clip-yet.jpeg')",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-transparent"
            />
          </div>

          <div className="relative z-20 flex flex-col items-center max-w-[280px] mt-4 text-center">
            {isCurrentUserVlogger ? (
              <>
                <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">It&apos;s Your Turn Today</h2>
                <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
                  Your friends are waiting for your updates. Post your first clip of the day to keep the group streak alive!
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push("/record"); }}
                  style={glassStyle(0.08, 16, 0.12)}
                  className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  <span>Record Now</span>
                </button>
              </>
            ) : (
              <>
                <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">
                  Waiting for {assignment?.user?.name || "Vlogger"}
                </h2>
                <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
                  No clips have been shared today yet. Send them a poke to let them know it&apos;s their turn!
                </p>
                <button
                  onClick={onPoke}
                  disabled={poking || pokeCooldown > 0}
                  style={glassStyle(0.08, 16, 0.12)}
                  className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {pokeCooldown > 0 ? (
                    <span>
                      Poke Cooldown ({Math.floor(pokeCooldown / 60)}:{(pokeCooldown % 60).toString().padStart(2, "0")})
                    </span>
                  ) : poking ? (
                    <span>Poking...</span>
                  ) : (
                    <span>Poke Vlogger</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {!(isSleepMode && !activeClipUrl) && (
        <>
          {activeClipUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              style={glassStyle(0.04, 16, 0.08)}
              className="absolute top-3 left-3 z-30 w-[26px] h-[26px] rounded-full text-white/90 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}

          {activeClipUrl && (
            <div style={glassStyle(0.04, 16, 0.08)} className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[9px] font-semibold z-10 shadow-md max-w-[140px]">
              <MapPin size={10} className="text-white/60 flex-shrink-0" />
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
                    {displayViews.slice(0, 3).map((view: any, idx: number) => (
                      <div key={view.id || idx} className="relative z-10 border border-black rounded-full">
                        <Avatar src={view.user?.image} name={view.user?.name} size={20} />
                      </div>
                    ))}
                    {displayViews.length === 0 && (
                      <span className="text-white/40 text-[9px] font-semibold pl-1">0 views</span>
                    )}
                  </div>
                  {displayViews.length > 0 && (
                    <span className="text-white/65 text-[9px] font-bold tracking-tight pl-1.5">
                      {displayViews.length} viewer{displayViews.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pr-2">
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
                  <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
                    {isVideoExpanded ? (
                      <Minimize size={16} className="text-white/95" />
                    ) : (
                      <Maximize size={16} className="text-white/95" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
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
        views={displayViews}
      />
    </div>
  );
}