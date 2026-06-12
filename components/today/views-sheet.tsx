"use client";

import { User, X } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { BottomSheet } from "@/components/shared/bottom-sheet";

type ViewsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  views?: any[];
};

export function ViewsSheet({ isOpen, onClose, views }: ViewsSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={30} className="h-[50%] p-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-white text-[12px] font-bold tracking-wide">Viewers ({views?.length || 0})</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-hide">
        {views && views.length > 0 ? (
          views.map((v: any, idx: number) => (
            <div key={v.id || idx} className="flex items-center gap-3">
              <Avatar src={v.user?.image} name={v.user?.name} size={32} />
              <div className="flex flex-col">
                <span className="text-white text-[12px] font-bold">@{v.user?.handle || v.user?.name || "User"}</span>
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
    </BottomSheet>
  );
}
