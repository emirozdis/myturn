"use client";

import { Heart, MessageCircle, Camera, Maximize, Minimize, Loader2 } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type VideoActionBarProps = {
  activeClip: any;
  activeSlotClips: any[];
  displayViews: any[];
  liked: boolean;
  likeCount: number;
  commentList: any[];
  uploadingPhoto: boolean;
  hasResponded: boolean;
  isVideoExpanded: boolean;
  videoProgress: number;
  onLike: () => void;
  onOpenComments: (e: React.MouseEvent) => void;
  onOpenViews: (e: React.MouseEvent) => void;
  onPhotoResponseClick: (e: React.MouseEvent) => void;
  onToggleExpand: () => void;
};

export function VideoActionBar({
  activeClip,
  activeSlotClips,
  displayViews,
  liked,
  likeCount,
  commentList,
  uploadingPhoto,
  hasResponded,
  isVideoExpanded,
  videoProgress,
  onLike,
  onOpenComments,
  onOpenViews,
  onPhotoResponseClick,
  onToggleExpand,
}: VideoActionBarProps) {
  const { t } = useTranslation();

  return (
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
              <span className="text-white/40 text-[9px] font-semibold pl-1">0 {t("today.views")}</span>
            )}
          </div>
          {displayViews.length > 0 && (
            <span className="text-white/65 text-[9px] font-bold tracking-tight pl-1.5">
              {displayViews.length} {displayViews.length > 1 ? t("today.viewers") : t("today.viewer")}
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
  );
}
