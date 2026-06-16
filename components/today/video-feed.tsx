// Changelog: Passed `videoProgress` parameter to the overlay to trigger synchronized swapping during the daily feed.
// ./components/today/video-feed.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Heart, MessageCircle, Volume2, VolumeX, Maximize, Minimize, Camera, Loader2
} from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { CommentsSheet } from "./comments-sheet";
import { ViewsSheet } from "./views-sheet";
import { glassStyle } from "../shared/glass-style";
import { useHls } from "@/components/shared/use-hls";
import { PhotoResponsesOverlay } from "@/components/shared/photo-responses-overlay";

type VideoFeedProps = {
  isVideoExpanded: boolean;
  onToggleExpand: () => void;
  assignment: any;
  activeSlotClips: any[];
  currentClipSubIndex: number;
  onNextSubClip: () => void;
  onPrevSubClip: () => void;
  activeClip: any;
  activeClipUrl: string | null;
  activeClipThumbnailUrl: string | null;
  activeClipThumbnailBlurUrl: string | null;
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
  hasPostedInCurrentSlot: boolean;
  uploadingPhoto: boolean;
  hasResponded: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoResponseClick: (e: React.MouseEvent) => void;
  onPhotoResponseUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function VideoFeed({
  isVideoExpanded,
  onToggleExpand,
  assignment,
  activeSlotClips,
  currentClipSubIndex,
  onNextSubClip,
  onPrevSubClip,
  activeClip,
  activeClipUrl,
  activeClipThumbnailUrl,
  activeClipThumbnailBlurUrl,
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
  hasPostedInCurrentSlot,
  uploadingPhoto,
  hasResponded,
  fileInputRef,
  onPhotoResponseClick,
  onPhotoResponseUpload,
}: VideoFeedProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useHls(videoRef, activeClipUrl);

  useEffect(() => {
    setIsMuted(!isVideoExpanded);
  }, [isVideoExpanded]);

  useEffect(() => {
    setIsVideoLoaded(false);
    setVideoProgress(0);
  }, [activeClipUrl, currentClipSubIndex]);

  const displayViews = activeClip?.views?.filter(
    (v: any) => v.user?.id !== assignment?.userId && v.user?.id !== activeClip?.userId
  ) || [];

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
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-transparent" />
          </div>

          <div className="relative z-20 flex flex-col items-center max-w-[280px] mt-6 text-center">
            <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">MyTurn is Resting</h2>
            <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
              Quiet hours are active. Pokes and rolls are paused. Next vlogger selection rolls at 9:00 AM local time.
            </p>
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); router.push("/streaks"); }}
                style={glassStyle(0.08, 16, 0.12)}
                className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center pointer-events-auto"
              >
                Watch Last Completed Vlog
              </button>
            </div>
          </div>
        </div>
      ) : activeClipUrl ? (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset }) => {
            const swipeThreshold = 40;
            if (offset.x < -swipeThreshold) {
              onNextSubClip();
            } else if (offset.x > swipeThreshold) {
              onPrevSubClip();
            }
          }}
          className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black touch-pan-y"
        >
          {/* Top Story Indicators */}
          {activeSlotClips.length > 1 && (
            <div className="absolute top-2.5 left-6 right-6 flex gap-2 z-40 pointer-events-none">
              {activeSlotClips.map((c, idx) => {
                const isActive = idx === currentClipSubIndex;
                const isDone = idx < currentClipSubIndex;
                return (
                  <div key={c.id || idx} className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    <div 
                      className={`h-full ${isDone ? 'bg-white/80' : 'bg-white'}`} 
                      style={{ 
                        width: isActive ? `${videoProgress}%` : isDone ? '100%' : '0%',
                        transition: isActive ? "width 0.1s linear" : "none" 
                      }} 
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Invisible Tap Zones for Manual Forward/Back Control */}
          <div className="absolute inset-y-0 left-0 w-[25%] z-20 pointer-events-auto" onClick={(e) => {
            e.stopPropagation();
            onPrevSubClip();
          }} />
          <div className="absolute inset-y-0 right-0 w-[25%] z-20 pointer-events-auto" onClick={(e) => {
            e.stopPropagation();
            onNextSubClip();
          }} />

          <video
            key={activeClip.id}
            ref={videoRef}
            autoPlay
            loop={activeSlotClips.length <= 1}
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => {
              if (e.currentTarget.currentTime > 0) setIsVideoLoaded(true);
              const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
              if (!isNaN(progress)) setVideoProgress(progress);
            }}
            onEnded={() => {
              onNextSubClip();
            }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
          <AnimatePresence>
            {!isVideoLoaded && activeClipThumbnailBlurUrl && (
              <motion.img
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={activeClipThumbnailBlurUrl}
                alt="Loading vlog..."
                className="absolute inset-0 w-full h-full object-cover z-10 blur-xl scale-[1.06] pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-transparent" />
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
                  className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center pointer-events-auto"
                >
                  Record Now
                </button>
              </>
            ) : (
              <>
                <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">
                  Waiting for {assignment?.user?.name || "Vlogger"}
                </h2>
                <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
                  {assignment?.clips?.length > 0 
                    ? "No clips have been shared in this time period yet. Send them a poke to let them know you're waiting!"
                    : "No clips have been shared today yet. Send them a poke to let them know it's their turn!"}
                </p>
                <button
                  onClick={onPoke}
                  disabled={poking || pokeCooldown > 0 || hasPostedInCurrentSlot}
                  style={glassStyle(0.08, 16, 0.12)}
                  className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 pointer-events-auto"
                >
                  {pokeCooldown > 0 ? (
                    <span>Poke Cooldown ({Math.floor(pokeCooldown / 60)}:{(pokeCooldown % 60).toString().padStart(2, "0")})</span>
                  ) : hasPostedInCurrentSlot ? (
                    <span>Vlogger already posted for this period</span>
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
            <PhotoResponsesOverlay 
              responses={activeClip.photoResponses} 
              videoProgress={videoProgress}
            />
          )}

          {activeClipUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsMuted((prev) => !prev); }}
              style={glassStyle(0.04, 16, 0.08)}
              className={`absolute ${activeSlotClips.length > 1 ? "top-6" : "top-3"} left-3 z-30 w-[26px] h-[26px] rounded-full text-white/90 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center pointer-events-auto`}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}

          {activeClipUrl && (
            <div style={glassStyle(0.04, 16, 0.08)} className={`absolute ${activeSlotClips.length > 1 ? "top-6" : "top-3"} right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[9px] font-semibold z-30 shadow-md max-w-[140px] pointer-events-auto`}>
              <MapPin size={10} className="text-white/60 flex-shrink-0" />
              <span className="truncate">{activeClip?.location || "Live Vlog"}</span>
            </div>
          )}

          {activeClipUrl && (
            <div className="mt-auto relative z-30 flex flex-col w-full pointer-events-none">
              <div className="py-2 px-3.5 flex items-center justify-between flex-shrink-0 pointer-events-auto">
                <div
                  onClick={onOpenViews}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
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
                  <button onClick={onPhotoResponseClick} disabled={uploadingPhoto || hasResponded} className="flex items-center gap-1 cursor-pointer disabled:opacity-50">
                    {uploadingPhoto ? <Loader2 size={16} className="text-white/95 animate-spin" /> : <Camera size={16} className="text-white/95" />}
                    <span className="text-[11px] font-bold text-white/95">{activeClip?.photoResponses?.length || 0}</span>
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={onPhotoResponseUpload} 
                    onClick={(e) => e.stopPropagation()}
                  />
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