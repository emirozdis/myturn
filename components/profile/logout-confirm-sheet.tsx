"use client";

import { LogOut } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "../shared/glass-style";
import { BottomSheet } from "@/components/shared/bottom-sheet";

type LogoutConfirmSheetProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmSheet({ isOpen, onCancel, onConfirm }: LogoutConfirmSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onCancel} zIndex={60} className="p-6">
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border border-[#e07c30]/20 shadow-sm"
          style={{ background: `${ACCENT}15` }}
        >
          <LogOut size={24} className="text-[#e07c30]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-white text-lg font-bold">Log out?</h3>
          <p className="text-white/50 text-xs leading-relaxed max-w-[280px]">
            You&apos;ll need to sign in again to access your account.
          </p>
        </div>
        <div className="w-full flex gap-3 mt-4">
          <button
            type="button"
            style={glassStyle(0.04, 24, 0.08)}
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-white/[0.06] border border-white/10 border-b-[4px] border-white/5 hover:bg-white/[0.1] active:translate-y-[2px] active:border-b-[2px] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ background: ACCENT }}
            className="flex-1 py-3.5 rounded-xl text-black font-black text-sm border-b-[4px] border-[#b85b1c] hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] active:brightness-100 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}