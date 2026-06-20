// ./app/(app)/today/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshingBadge } from "@/components/shared/refreshing-badge";
import { ToastBanner } from "@/components/shared/toast-banner";
import { TodaySkeleton } from "@/components/today/today-skeleton";
import { VideoFeed } from "@/components/today/video-feed";
import { TodayBottomPanel } from "@/components/today/today-bottom-panel";
import { useTodayPage } from "@/components/today/use-today-page";

export default function TodayPage() {
  const {
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
    actualHourIndex,
    hasPostedInCurrentSlot,
    uploadingPhoto,
    hasResponded,
    fileInputRef,
    handlePhotoResponseClick,
    handlePhotoResponseUpload,
    allVideosViewed,
    isLastClipOverall,
  } = useTodayPage();

  if (initialLoad && !assignment && !isSleepMode) {
    return <TodaySkeleton />;
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
      <AnimatePresence>
        {toast && <ToastBanner message={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {refreshing && <RefreshingBadge />}

      <VideoFeed
        isVideoExpanded={isVideoExpanded}
        onToggleExpand={() => setIsVideoExpanded((prev) => !prev)}
        assignment={assignment}
        activeSlotClips={activeSlotClips}
        currentClipSubIndex={currentClipSubIndex}
        onNextSubClip={handleNextSubClip}
        onPrevSubClip={handlePrevSubClip}
        activeClip={activeClip}
        activeClipUrl={activeClipUrl}
        activeClipThumbnailUrl={activeClipThumbnailUrl}
        activeClipThumbnailBlurUrl={activeClipThumbnailBlurUrl}
        groupMembers={groupMembers}
        isCurrentUserVlogger={isCurrentUserVlogger}
        liked={liked}
        likeCount={likeCount}
        commentList={commentList}
        isCommentsOpen={isCommentsOpen}
        isViewsOpen={isViewsOpen}
        isPhotoCaptureOpen={isPhotoCaptureOpen}
        setIsPhotoCaptureOpen={setIsPhotoCaptureOpen}
        newComment={newComment}
        poking={poking}
        pokeCooldown={pokeCooldown}
        currentUserId={session?.user?.id}
        onLike={handleLike}
        onOpenComments={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}
        onCloseComments={() => setIsCommentsOpen(false)}
        onOpenViews={(e) => { e.stopPropagation(); setIsViewsOpen(true); }}
        onCloseViews={() => setIsViewsOpen(false)}
        onNewCommentChange={setNewComment}
        onSendComment={handleSendComment}
        onDeleteComment={handleDeleteComment}
        onReportComment={() => showToast("Comment reported.")}
        onPoke={handlePoke}
        isSleepMode={isSleepMode}
        hasPostedInCurrentSlot={hasPostedInCurrentSlot}
        uploadingPhoto={uploadingPhoto}
        hasResponded={hasResponded}
        fileInputRef={fileInputRef}
        onPhotoResponseClick={handlePhotoResponseClick}
        onPhotoResponseUpload={handlePhotoResponseUpload}
        allVideosViewed={allVideosViewed}
        isLastClipOverall={isLastClipOverall}
      />

      <TodayBottomPanel
        isVideoExpanded={isVideoExpanded}
        assignment={assignment}
        isCurrentUserVlogger={isCurrentUserVlogger}
        activeClipUrl={activeClipUrl}
        currentHourIndex={currentHourIndex}
        actualHourIndex={actualHourIndex}
        uploadedSlots={uploadedSlots}
        onHourChange={setCurrentHourIndex}
        isSleepMode={isSleepMode}
      />
    </motion.div>
  );
}