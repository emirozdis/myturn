// ./components/record/preview-view.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, ChevronRight, Clock, MapPin, AlertCircle, Check, X } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { getCurrentTimePeriodLabel } from "./utils";

type GroupSelectorSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  userGroups: any[];
  selectedGroup: any;
  onSelectGroup: (group: any) => void;
};

export function GroupSelectorSheet({ isOpen, onClose, userGroups, selectedGroup, onSelectGroup }: GroupSelectorSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={30} className="p-6 max-h-[75%]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-white text-sm font-bold">Choose a Group</h3>
        <button onClick={onClose} className="text-xs text-white/50 hover:text-white">Cancel</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-hide pb-6">
        {userGroups.map((group) => {
          const isCurrent = group.id === selectedGroup?.id;
          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                isCurrent
                  ? "bg-white/[0.06] border-[#e07c30]/50"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{group.emoji || "🏠"}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white text-xs font-bold leading-tight">{group.name}</span>
                  <span className="text-white/40 text-[9px] font-semibold">{group.memberCount} members</span>
                </div>
              </div>
              {isCurrent && <Check size={14} className="text-[#e07c30] stroke-[3]" />}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export function UploadSuccessOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.1 }}
        className="mb-6"
      >
        <img
          src="/assets/icons/tick.png"
          className="w-20 h-24 object-contain filter drop-shadow-[0_4px_16px_rgba(34,197,94,0.15)]"
          alt="Success Check"
        />
      </motion.div>
      <motion.span
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
        className="text-white text-lg font-extrabold tracking-tight"
      >
        Vlog Shared Successfully!
      </motion.span>
      <motion.span
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
        className="text-white/50 text-xs mt-2 max-w-[220px] leading-relaxed font-medium"
      >
        Your daily update is live, and your friends have been notified.
      </motion.span>
    </motion.div>
  );
}

type PreviewViewProps = {
  previewUrl: string | null;
  recordedFacingMode: "user" | "environment";
  miniVideoRef: React.RefObject<HTMLVideoElement | null>;
  miniProgress: number;
  speedSegments: {start: number, speed: number}[];
  onMiniTimeUpdate: () => void;
  caption: string;
  onCaptionChange: (value: string) => void;
  isUploading: boolean;
  selectedGroup: any;
  onOpenGroupSelector: () => void;
  assignment: any;
  checkingTurn: boolean;
  isTurnAuthorized: boolean;
  error: string;
  locationName: string;
  onLocationChange: (value: string) => void;
  uploadProgress: number;
  onRetake: () => void;
  onPublish: () => void;
  showGroupDrawer: boolean;
  onCloseGroupDrawer: () => void;
  userGroups: any[];
  onSelectGroup: (group: any) => void;
  isPreviewFullscreen: boolean;
  onOpenFullscreen: () => void;
  onCloseFullscreen: () => void;
  uploadSuccess: boolean;
};

export function PreviewView(props: PreviewViewProps) {
  const {
    previewUrl,
    recordedFacingMode,
    miniVideoRef,
    miniProgress,
    speedSegments,
    onMiniTimeUpdate,
    caption,
    onCaptionChange,
    isUploading,
    selectedGroup,
    onOpenGroupSelector,
    checkingTurn,
    isTurnAuthorized,
    error,
    locationName,
    onLocationChange,
    uploadProgress,
    onRetake,
    onPublish,
    showGroupDrawer,
    onCloseGroupDrawer,
    userGroups,
    onSelectGroup,
    isPreviewFullscreen,
    onOpenFullscreen,
    onCloseFullscreen,
    uploadSuccess,
  } = props;

  return (
    <motion.div
      key="preview-view"
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 35 }}
      transition={{ type: "spring", damping: 26, stiffness: 220 }}
      className="absolute inset-0 z-20 bg-neutral-950 flex flex-col justify-between overflow-hidden"
    >
      {isUploading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 z-50 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-[#e07c30]"
            animate={{ width: `${uploadProgress}%` }}
            transition={{ ease: "easeInOut", duration: 0.15 }}
          />
        </div>
      )}
      <div
        style={{ paddingTop: "max(14px, env(safe-area-inset-top, 14px))" }}
        className="flex items-center justify-between px-4 pb-3.5 border-b border-white/5 bg-neutral-900/60 backdrop-blur-md relative z-10 flex-shrink-0"
      >
        <button
          onClick={onRetake}
          disabled={isUploading}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Retake</span>
        </button>
        <span className="text-white text-sm font-extrabold tracking-tight">New Post</span>
        <div className="w-12 h-6" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-6">
        <div className="flex gap-4 items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-24 aspect-[3/4] flex-shrink-0">
              <motion.div
                layout
                onClick={() => {
                  if (!isPreviewFullscreen) onOpenFullscreen();
                  else onCloseFullscreen();
                }}
                transition={{
                  layout: { type: "spring", damping: 30, stiffness: 250, mass: 0.9 },
                }}
                className={`overflow-hidden ${
                  isPreviewFullscreen
                    ? "fixed inset-0 z-[100] bg-black flex flex-col justify-between cursor-default"
                    : "absolute inset-0 bg-neutral-900 shadow-lg cursor-pointer group"
                }`}
                style={{
                  borderRadius: isPreviewFullscreen ? 0 : 16,
                  willChange: "transform",
                }}
              >
                <motion.video
                  layout
                  ref={miniVideoRef}
                  src={previewUrl || ""}
                  autoPlay
                  loop
                  muted={!isPreviewFullscreen}
                  playsInline
                  onTimeUpdate={(e) => {
                    onMiniTimeUpdate();
                    
                    // Interpret variable 2x speed maps seamlessly scaling up video parameters
                    const ct = e.currentTarget.currentTime;
                    let targetSpeed = 1;
                    if (speedSegments && speedSegments.length > 0) {
                      const activeSeg = [...speedSegments].reverse().find(s => ct >= s.start);
                      if (activeSeg) targetSpeed = activeSeg.speed;
                    }
                    if (miniVideoRef.current && miniVideoRef.current.playbackRate !== targetSpeed) {
                      miniVideoRef.current.playbackRate = targetSpeed;
                    }
                  }}
                  transition={{
                    layout: { type: "spring", damping: 30, stiffness: 250, mass: 0.9 },
                  }}
                  className={`absolute inset-0 w-full h-full object-cover ${recordedFacingMode === "user" ? "-scale-x-100" : ""}`}
                />
                <AnimatePresence>
                  {!isPreviewFullscreen && (
                    <motion.div
                      key="mini-overlays"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.45)",
                          borderLeft: "1px solid rgba(255,255,255,0.25)",
                          borderRight: "1px solid rgba(255,255,255,0.05)",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          boxShadow: "inset 0 1.5px 3px rgba(255,255,255,0.35), inset 0 -1.5px 3px rgba(0,0,0,0.55)",
                        }}
                        className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
                        <div
                          className="h-full bg-[#e07c30] transition-all duration-100 ease-linear"
                          style={{ width: `${miniProgress}%` }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 pointer-events-none">
                        <span className="text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Unmute</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isPreviewFullscreen && (
                    <motion.div
                      key="full-overlays"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: 0.1 }}
                      className="absolute inset-0 pointer-events-none flex flex-col justify-between"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60 pointer-events-none z-10" />
                      <div className="relative z-20 p-4 pt-12 flex justify-between items-center pointer-events-auto">
                        <span className="text-white text-sm font-bold tracking-tight drop-shadow-md">Fullscreen Preview</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onCloseFullscreen(); }}
                          className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 hover:bg-white/30 transition-colors"
                        >
                          <X size={12} strokeWidth={2.5} />
                          <span>Close</span>
                        </button>
                      </div>
                      <div className="relative z-20 p-6 mt-auto text-center pointer-events-auto">
                        <span className="text-white/60 text-xs drop-shadow font-medium tracking-wide">Tap anywhere to return</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
                        <div
                          className="h-full bg-[#e07c30] transition-all duration-100 ease-linear"
                          style={{ width: `${miniProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2 block text-center select-none">
              Tap to preview
            </span>
          </div>
          <div className="flex-1 h-full min-w-0">
            <textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Write a caption... (Will post as first comment)"
              rows={4}
              disabled={isUploading}
              className="w-full bg-transparent border-none text-white text-xs placeholder:text-white/30 outline-none resize-none h-full"
            />
          </div>
        </div>
        <hr className="border-t border-white/5" />
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Post Destination</span>
            <span className="text-[10px] font-semibold text-[#e07c30]">Select Group</span>
          </div>
          <div
            onClick={() => { if (!isUploading) onOpenGroupSelector(); }}
            style={glassStyle(0.04, 16, 0.08)}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">
                {selectedGroup?.emoji || "🏠"}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white text-xs font-bold truncate leading-tight">
                  {selectedGroup?.name || "Choose target group"}
                </span>
                <span className="text-white/40 text-[9px] font-semibold">
                  {selectedGroup?.memberCount || 0} members enrolled
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/30" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1">Vlogging Context</span>
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="rounded-2xl border border-white/5 p-4 flex flex-col gap-3.5 text-xs text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Clock size={13} className="text-[#e07c30]" />
                <span>Active Period</span>
              </div>
              <span className="font-semibold text-right">{getCurrentTimePeriodLabel()}</span>
            </div>
          </div>
        </div>
        {checkingTurn ? (
          <div className="flex items-center gap-2 px-1 text-[10px] text-white/50 animate-pulse">
            <Loader2 size={12} className="animate-spin text-[#e07c30]" />
            <span>Verifying turn access parameters...</span>
          </div>
        ) : (
          error && (
            <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-red-400 text-xs font-bold leading-tight">
                  {!isTurnAuthorized ? "Posting Blocked" : "Upload Error"}
                </span>
                <span className="text-white/60 text-[10px] leading-snug">{error}</span>
              </div>
            </div>
          )
        )}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1">Location details</span>
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/5"
          >
            <MapPin size={15} className="text-[#e07c30]" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Search or add location..."
              disabled={isUploading}
              className="flex-1 bg-transparent border-none text-white text-xs placeholder:text-white/30 outline-none"
            />
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-white/5 bg-neutral-900/40 backdrop-blur-md flex-shrink-0">
        <button
          onClick={onPublish}
          disabled={isUploading || !isTurnAuthorized || checkingTurn}
          className="w-full py-3.5 bg-[#e07c30] text-black font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin animate-fade-in" />
              <span>Uploading Vlog ({uploadProgress}%)</span>
            </>
          ) : (
            <span>Share to {selectedGroup?.name || "Group"}</span>
          )}
        </button>
      </div>
      <GroupSelectorSheet
        isOpen={showGroupDrawer}
        onClose={onCloseGroupDrawer}
        userGroups={userGroups}
        selectedGroup={selectedGroup}
        onSelectGroup={onSelectGroup}
      />
      <AnimatePresence>
        {uploadSuccess && <UploadSuccessOverlay />}
      </AnimatePresence>
    </motion.div>
  );
}