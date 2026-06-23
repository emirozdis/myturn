"use client";

import { Loader2, LogOut } from "lucide-react";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export interface LeaveGroupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leavingGroup: boolean;
}

export function LeaveGroupSheet({ isOpen, onClose, onConfirm, leavingGroup }: LeaveGroupSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      zIndex={60}
      className="p-6"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border border-red-500/20 shadow-sm"
          style={{ background: `rgba(239,68,68,0.15)` }}
        >
          <LogOut size={24} className="text-red-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-white text-lg font-bold">{t("sheets.leaveGroupQuestion")}</h3>
          <p className="text-white/50 text-xs leading-relaxed max-w-[280px]">
            {t("sheets.leaveWarning")}
          </p>
        </div>
        <div className="w-full flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-white/[0.06] border border-white/10 border-b-[4px] border-white/5 hover:bg-white/[0.1] active:translate-y-[2px] active:border-b-[2px] transition-all"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={leavingGroup}
            className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-gradient-to-b from-red-500 to-red-600 border-b-[4px] border-red-800 hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] active:brightness-100 transition-all flex justify-center items-center gap-2 shadow-[0_4px_12px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:translate-y-0 disabled:border-b-[4px]"
          >
            {leavingGroup ? <Loader2 size={16} className="animate-spin" /> : t("sheets.leaveBtn")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
