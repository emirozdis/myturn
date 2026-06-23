"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Volume2, VolumeX, Rewind, FastForward, Pause
} from "lucide-react";
import { CommentsSheet } from "./comments-sheet";
import { ViewsSheet } from "./views-sheet";
import { glassStyle } from "../shared/glass-style";
import { useHls } from "@/components/shared/use-hls";
import { PhotoResponsesOverlay } from "@/components/shared/photo-responses-overlay";
import { PhotoCaptureModal } from "./photo-capture-modal";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { SleepModeView } from "./sleep-mode-view";
import { NoClipView } from "./no-clip-view";
import { VideoActionBar } from "./video-action-bar";
import { VideoStoryIndicators } from "./video-story-indicators";

// Isolated component used to cleanly mount `useHls` while hiding it securely from normal rendering boundaries.
// `useHls` natively kicks off preload network requests simply by binding the src. 
function PrefetchVideo({ src }: { src: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  
  // Set autoplay to false to ensure it strictly buffers the stream into the cache, rather than aggressively running CPU cycles to decode/playback.
  useHls(ref, src, false);
  
  if (!src) return null;
  
  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="auto"
      className="absolute opacity-0 pointer-events-none w-1 h-1 -z-10"
    />
  );
}

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
  nextClipUrl: string | null;
  activeClipThumbnailUrl: string | null;
  activeClipThumbnailBlurUrl: string | null;
  groupMembers: any[];
  isCurrentUserVlogger: boolean;
  liked: boolean;
  likeCount: number;
  commentList: any[];
  isCommentsOpen: boolean;
  isViewsOpen: boolean;
  isPhotoCaptureOpen: boolean;
  setIsPhotoCaptureOpen: (val: boolean) => void;
  newComment: string;
  poking: boolean;
  pokeCooldown: number;
  currentUserId?: string;
  onLike: () => void;
  onOpenComments: (e: React.MouseEvent) => void;
  onCloseComments: () => void;
  onOpenViews: (e: React.MouseEvent) => void;
  onCloseViews: () => void;
  onNewCommentChange: (val: string) => void;
  onSendComment: (e: React.FormEvent, parentId?: string) => void;
  onDeleteComment: (id: string) => void;
  onReportComment: () => void;
  onPoke: (e: React.MouseEvent) => void;
  isSleepMode: boolean;
  hasPostedInCurrentSlot: boolean;
  uploadingPhoto: boolean;
  hasResponded: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoResponseClick: (e: React.MouseEvent) => void;
  onPhotoResponseUpload: (blob: Blob | File) => void;
  allVideosViewed?: boolean;
  isLastClipOverall?: boolean;
  hasVolunteeredForTomorrow: boolean;
  canVolunteer: boolean;
  volunteerEligibilityReason: string;
  isVolunteering: boolean;
  volunteerError: string;
  onToggleVolunteer: () => void;
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
  nextClipUrl,
  activeClipThumbnailUrl,
  activeClipThumbnailBlurUrl,
  groupMembers,
  isCurrentUserVlogger,
  liked,
  likeCount,
  commentList,
  isCommentsOpen,
  isViewsOpen,
  isPhotoCaptureOpen,
  setIsPhotoCaptureOpen,
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
  onPoke,
  isSleepMode,
  hasPostedInCurrentSlot,
  uploadingPhoto,
  hasResponded,
  fileInputRef,
  onPhotoResponseClick,
  onPhotoResponseUpload,
  allVideosViewed = false,
  isLastClipOverall = false,
  hasVolunteeredForTomorrow = false,
  canVolunteer = false,
  volunteerEligibilityReason = "",
  isVolunteering = false,
  volunteerError = "",
  onToggleVolunteer,
}: VideoFeedProps) {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Micro gesture HUD states
  const [gesture, setGesture] = useState<"none" | "paused" | "rewind" | "fastforward">("none");
  const [seekProgress, setSeekProgress] = useState<number | null>(null);
  const [seekIndicatorText, setSeekIndicatorText] = useState("");

  const pointerIdRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHoldingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastSeekTimeRef = useRef(0);

  const isFrontFacing = activeClip?.metadata ? (() => {
    try {
      const meta = JSON.parse(activeClip.metadata);
      return meta.facingMode !== "environment";
    } catch {
      return true;
    }
  })() : true;

  useHls(videoRef, activeClipUrl);

  useEffect(() => {
    setIsMuted(!isVideoExpanded);
  }, [isVideoExpanded]);

  useEffect(() => {
    setIsVideoLoaded(false);
    setVideoProgress(0);
    setGesture("none");
    setSeekProgress(null);
  }, [activeClipUrl, currentClipSubIndex]);

  const displayViews = activeClip?.views?.filter(
    (v: any) => v.user?.id !== assignment?.userId && v.user?.id !== activeClip?.userId
  ) || [];

  // Loop only if it's the absolute last clip in the entire feed for the day
  const shouldLoop = isLastClipOverall;

  // Unified Pointer Event Controller
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Completely disable gesture controls if any modal/sheet overlay is active
    if (isCommentsOpen || isViewsOpen || isPhotoCaptureOpen) return;
    
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;

    // Safety gate filters input nodes, buttons, or overlay selectors to prevent gesture collisions
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      (target.closest('.pointer-events-auto') && !target.classList.contains('touch-pan-y'))
    ) {
      return;
    }

    // Stop propagation natively to isolate interactions from the parent GroupSwipePager
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }

    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHoldingRef.current = false;
    hasMovedRef.current = false;

    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      if (videoRef.current) {
        videoRef.current.pause();
        setGesture("paused");
      }
    }, 250); // 250ms press-and-hold trigger threshold

    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isCommentsOpen || isViewsOpen || isPhotoCaptureOpen) return;
    if (pointerIdRef.current !== e.pointerId) return;

    // Stop propagation to prevent drag handlers on parent layers from firing
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopPropagation();

    const diffX = e.clientX - startXRef.current;
    const diffY = e.clientY - startYRef.current;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    if (distance > 10) {
      hasMovedRef.current = true;
    }

    // Scrubbing gesture evaluation
    if (isHoldingRef.current && videoRef.current) {
      e.preventDefault();
      const dragThreshold = 15;

      if (Math.abs(diffX) > dragThreshold) {
        const direction = diffX > 0 ? 1 : -1;
        const speedMultiplier = Math.min(4, 1 + Math.abs(diffX) / 80);

        if (direction === 1) {
          setGesture("fastforward");
          setSeekIndicatorText(`FF >> ${speedMultiplier.toFixed(1)}x`);
        } else {
          setGesture("rewind");
          setSeekIndicatorText(`RW << ${speedMultiplier.toFixed(1)}x`);
        }

        const now = Date.now();
        if (now - lastSeekTimeRef.current > 40) {
          lastSeekTimeRef.current = now;
          const duration = videoRef.current.duration || 15;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = diffX / (rect.width || 340);

          const seekDelta = ratio * duration * 0.45;
          let newTime = videoRef.current.currentTime + seekDelta;
          newTime = Math.max(0, Math.min(duration, newTime));
          videoRef.current.currentTime = newTime;

          setSeekProgress((newTime / duration) * 100);
        }
      } else {
        setGesture("paused");
        setSeekIndicatorText(t("today.holdToPause"));
        setSeekProgress(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isCommentsOpen || isViewsOpen || isPhotoCaptureOpen) return;
    if (pointerIdRef.current !== e.pointerId) return;

    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopPropagation();

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) { }

    pointerIdRef.current = null;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const diffX = e.clientX - startXRef.current;

    if (isHoldingRef.current) {
      // Release holding -> Resume playback
      if (videoRef.current) {
        videoRef.current.play().catch(() => { });
      }
      setGesture("none");
      setSeekProgress(null);
    } else {
      // Tap vs Swipe evaluation
      const swipeThreshold = 40;
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX < -swipeThreshold) {
          onNextSubClip();
        } else if (diffX > swipeThreshold) {
          onPrevSubClip();
        }
      } else {
        if (!hasMovedRef.current) {
          onToggleExpand();
        }
      }
    }

    isHoldingRef.current = false;
    hasMovedRef.current = false;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className="relative flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col cursor-pointer select-none"
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

      {/* Automatically prefetch the initial blocks of the next active consecutive clip */}
      <PrefetchVideo src={nextClipUrl} />

      {isSleepMode && !activeClipUrl ? (
        <SleepModeView
          hasVolunteeredForTomorrow={hasVolunteeredForTomorrow}
          canVolunteer={canVolunteer}
          volunteerEligibilityReason={volunteerEligibilityReason}
          isVolunteering={isVolunteering}
          volunteerError={volunteerError}
          onToggleVolunteer={onToggleVolunteer}
        />
      ) : activeClipUrl ? (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black touch-pan-y">
          {/* Top Story Indicators */}
          <VideoStoryIndicators
            clips={activeSlotClips}
            currentClipSubIndex={currentClipSubIndex}
            videoProgress={videoProgress}
            gesture={gesture}
          />

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
            loop={shouldLoop}          
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => {
              if (e.currentTarget.currentTime > 0) setIsVideoLoaded(true);
              const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
              if (!isNaN(progress)) setVideoProgress(progress);

              // HLS-safe looping: seek back before the stream ends
              if (shouldLoop && !isNaN(e.currentTarget.duration)) {
                const remaining = e.currentTarget.duration - e.currentTarget.currentTime;
                if (remaining < 0.3) {
                  e.currentTarget.currentTime = 0;
                  e.currentTarget.play().catch(() => { });
                }
              }

              // Speed segments
              try {
                const metadata = activeClip.metadata ? JSON.parse(activeClip.metadata) : null;
                const segs = metadata?.speedSegments;
                if (segs && segs.length > 0) {
                  const ct = e.currentTarget.currentTime;
                  const activeSeg = [...segs].reverse().find((s: any) => ct >= s.start);
                  const targetSpeed = activeSeg ? activeSeg.speed : 1;
                  if (videoRef.current && videoRef.current.playbackRate !== targetSpeed) {
                    videoRef.current.playbackRate = targetSpeed;
                  }
                }
              } catch (err) { }
            }}
            onEnded={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
              if (shouldLoop) {
                e.currentTarget.currentTime = 0;
                e.currentTarget.play().catch(() => { });
              } else {
                onNextSubClip();
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover z-0 ${isFrontFacing ? "-scale-x-100" : ""}`}
          />
          <AnimatePresence>
            {!isVideoLoaded && activeClipThumbnailBlurUrl && (
              <motion.img
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={activeClipThumbnailBlurUrl}
                alt="Loading vlog..."
                className={`absolute inset-0 w-full h-full object-cover z-10 blur-xl scale-[1.06] pointer-events-none ${isFrontFacing ? "-scale-x-100" : ""}`}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        <NoClipView
          isCurrentUserVlogger={isCurrentUserVlogger}
          assignment={assignment}
          poking={poking}
          pokeCooldown={pokeCooldown}
          hasPostedInCurrentSlot={hasPostedInCurrentSlot}
          onPoke={onPoke}
        />
      )}

      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Smooth Non-Blocking Micro-Sized Bottom-Center HUD Overlay */}
      <AnimatePresence>
        {gesture !== "none" && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-1/2 z-40 pointer-events-none"
          >
            <div
              style={glassStyle(0.3, 8, 0.25)}
              className="h-7 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 bg-black/75 border border-white/10"
            >
              {gesture === "paused" && <Pause className="text-white fill-white" size={10} />}
              {gesture === "rewind" && <Rewind className="text-[#e07c30] fill-[#e07c30]" size={10} />}
              {gesture === "fastforward" && <FastForward className="text-[#e07c30] fill-[#e07c30]" size={10} />}

              <span className="text-white font-extrabold text-[9px] tracking-wider uppercase leading-none">
                {gesture === "paused" ? t("record.paused") : seekIndicatorText.replace("FF >> ", ">> ").replace("RW << ", "<< ")}
              </span>

              {seekProgress !== null && (
                <div className="w-8 h-[2px] bg-white/20 rounded-full overflow-hidden ml-1 relative">
                  <div
                    className="h-full bg-[#e07c30] rounded-full"
                    style={{ width: `${seekProgress}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span className="truncate">{activeClip?.location || t("today.liveVlog")}</span>
            </div>
          )}

          {activeClipUrl && (
            <VideoActionBar
              activeClip={activeClip}
              activeSlotClips={activeSlotClips}
              displayViews={displayViews}
              liked={liked}
              likeCount={likeCount}
              commentList={commentList}
              uploadingPhoto={uploadingPhoto}
              hasResponded={hasResponded}
              isVideoExpanded={isVideoExpanded}
              videoProgress={videoProgress}
              onLike={onLike}
              onOpenComments={onOpenComments}
              onOpenViews={onOpenViews}
              onPhotoResponseClick={onPhotoResponseClick}
              onToggleExpand={onToggleExpand}
            />
          )}
        </>
      )}

      <CommentsSheet
        isOpen={isCommentsOpen}
        onClose={onCloseComments}
        groupMembers={groupMembers}
        commentList={commentList}
        newComment={newComment}
        onNewCommentChange={onNewCommentChange}
        onSubmit={onSendComment}
        onDeleteComment={onDeleteComment}
        currentUserId={currentUserId}
      />

      <ViewsSheet
        isOpen={isViewsOpen}
        onClose={onCloseViews}
        views={displayViews}
      />

      <AnimatePresence>
        {isPhotoCaptureOpen && (
          <PhotoCaptureModal
            isOpen={isPhotoCaptureOpen}
            onClose={() => setIsPhotoCaptureOpen(false)}
            onUpload={onPhotoResponseUpload}
            uploading={uploadingPhoto}
          />
        )}
      </AnimatePresence>

    </div>
  );
}