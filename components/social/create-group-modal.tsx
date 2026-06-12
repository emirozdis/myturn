"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";

type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  newGroupName: string;
  onNameChange: (value: string) => void;
  createdGroupCode: string;
  copySuccess: boolean;
  createError: string;
  creating: boolean;
  onCreate: () => void;
  onCopyCode: () => void;
};

export function CreateGroupModal({
  isOpen,
  onClose,
  newGroupName,
  onNameChange,
  createdGroupCode,
  copySuccess,
  createError,
  creating,
  onCreate,
  onCopyCode,
}: CreateGroupModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute inset-0 bg-[#111] z-50 flex flex-col p-6 overflow-y-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/70 hover:text-white transition-colors hover:bg-white/5"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">Create a Group</h2>
          </div>

          {createdGroupCode ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Sparkles size={48} className="text-[#e07c30] mb-4 animate-bounce" />
              <h3 className="text-white text-2xl font-bold mb-2">Group Created! 🎉</h3>
              <p className="text-white/60 text-xs leading-relaxed max-w-[280px] mb-8">
                Invite your friends to your group using this unique code. Once they join, you can start rolling daily vlog assignments!
              </p>

              <div
                style={glassStyle(0.04, 16, 0.08)}
                className="rounded-2xl p-6 w-full max-w-[280px] flex flex-col items-center gap-4 mb-8"
              >
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Invite Code</span>
                <span className="text-white font-mono text-3xl font-extrabold tracking-widest selection:bg-amber-500/30">
                  {createdGroupCode}
                </span>

                <button
                  onClick={onCopyCode}
                  style={{ background: copySuccess ? "#22c55e" : ACCENT }}
                  className="w-full py-2.5 rounded-xl text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {copySuccess ? (
                    <>
                      <Check size={14} strokeWidth={3} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                className="w-full max-w-[280px] py-3.5 rounded-xl text-white font-bold text-sm transition-transform active:scale-[0.98]"
              >
                Finish Setup
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                {createError && (
                  <p className="text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 mb-2">
                    {createError}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend Warriors"
                    value={newGroupName}
                    onChange={(e) => onNameChange(e.target.value)}
                    style={glassStyle(0.04, 16, 0.08)}
                    className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30"
                  />
                </div>
              </div>

              <button
                onClick={onCreate}
                disabled={creating || !newGroupName.trim()}
                className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                {creating && <Loader2 size={18} className="animate-spin" />}
                {creating ? "Creating..." : "Create Group"}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
