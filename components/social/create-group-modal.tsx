// ./components/social/create-group-modal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Sparkles, Copy, Check, Loader2, Globe, Smile, Keyboard, Sparkle } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  newGroupName: string;
  onNameChange: (value: string) => void;
  newGroupEmoji: string;
  onEmojiChange: (value: string) => void;
  newGroupTimezone: string;
  onTimezoneChange: (value: string) => void;
  createdGroupCode: string;
  copySuccess: boolean;
  createError: string;
  creating: boolean;
  onCreate: () => void;
  onCopyCode: () => void;
};

// Clean set of high-frequency presets for rapid setup
const PRESET_EMOJIS = ["🏠", "💼", "🎓", "🎉", "🎮", "🏋️", "🐾", "🔥"];

const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Universal Time)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

export function CreateGroupModal({
  isOpen,
  onClose,
  newGroupName,
  onNameChange,
  newGroupEmoji,
  onEmojiChange,
  newGroupTimezone,
  onTimezoneChange,
  createdGroupCode,
  copySuccess,
  createError,
  creating,
  onCreate,
  onCopyCode,
}: CreateGroupModalProps) {
  const { t } = useTranslation();
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [shortcutHelper, setShortcutHelper] = useState("Use system emoji keyboard");

  // Auto-detect the user's OS platform to render the appropriate native keyboard shortcut guide
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) {
        setShortcutHelper("Press ⌘ + Ctrl + Space");
      } else if (ua.includes("win")) {
        setShortcutHelper("Press Win + .");
      } else {
        setShortcutHelper("Tap to open system keyboard");
      }
    }
  }, []);

  const systemTimezone = typeof window !== "undefined" 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" 
    : "UTC";

  const timezones = [...COMMON_TIMEZONES];
  if (!COMMON_TIMEZONES.some(tz => tz.value === systemTimezone)) {
    timezones.unshift({ 
      value: systemTimezone, 
      label: `${systemTimezone.split("/").pop()?.replace("_", " ") || systemTimezone} (Local)` 
    });
  }

  const focusHiddenEmojiInput = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      hiddenInputRef.current.select();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute -inset-x-4 -bottom-4 bg-[#111] z-50 flex flex-col p-6 overflow-y-auto scrollbar-hide"
          style={{
            top: "calc(-1 * max(16px, env(safe-area-inset-top, 0px)))"
          }}
        >
          <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/70 hover:text-white transition-colors hover:bg-white/5"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">{t("social.createGroupModalTitle")}</h2>
          </div>

          {createdGroupCode ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6">
              <Sparkles size={48} className="text-[#e07c30] mb-4 animate-bounce" />
              <h3 className="text-white text-2xl font-bold mb-2">{t("social.groupCreated")}</h3>
              <p className="text-white/60 text-xs leading-relaxed max-w-[280px] mb-8">
                {t("social.groupCreatedBody")}
              </p>

              <div
                style={glassStyle(0.04, 16, 0.08)}
                className="rounded-2xl p-6 w-full max-w-[280px] flex flex-col items-center gap-4 mb-8"
              >
                <div 
                  className="w-16 h-14 rounded-full flex items-center justify-center text-2xl bg-white/10"
                  style={{
                    border: "2px solid #ffffff",
                    boxShadow: "0 0 16px rgba(255, 255, 255, 0.25)"
                  }}
                >
                  {newGroupEmoji}
                </div>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-none">{t("social.inviteCode")}</span>
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
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      {t("social.copyCode")}
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
                {t("social.finishSetup")}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-6 pb-6">
              <div className="flex flex-col gap-5">
                {createError && (
                  <p className="text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 mb-2">
                    {createError}
                  </p>
                )}

                {/* 1. Group Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">{t("social.groupName")}</label>
                  <input
                    type="text"
                    placeholder={t("social.groupNamePlaceholder")}
                    value={newGroupName}
                    onChange={(e) => onNameChange(e.target.value)}
                    style={glassStyle(0.04, 16, 0.08)}
                    className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30"
                  />
                </div>

                {/* 2. Custom Native Emoji Selection Row */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center pl-1 pr-1">
                    <div className="flex items-center gap-1.5">
                      <Smile size={14} className="text-[#e07c30]" />
                      <label className="text-white/70 text-[13px] font-semibold tracking-wide">{t("social.chooseEmoji")}</label>
                    </div>
                  </div>

                  {/* Native Input Picker Block - Tap to open keyboard */}
                  <div 
                    onClick={focusHiddenEmojiInput}
                    style={glassStyle(0.04, 16, 0.08)}
                    className="rounded-2xl border border-white/5 p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.05] active:scale-[0.99] transition-all"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white text-[14px] font-extrabold tracking-tight">{t("social.openEmojiMenu")}</span>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">{shortcutHelper}</span>
                    </div>

                    <div className="relative">
                      {/* Hidden text input overlay positioned securely to receive focus */}
                      <input
                        ref={hiddenInputRef}
                        type="text"
                        maxLength={4}
                        value={newGroupEmoji}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const charArray = Array.from(val);
                            onEmojiChange(charArray[charArray.length - 1]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
                        aria-label="Hidden Native Emoji Input"
                      />
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white/10"
                        style={{
                          border: "2px solid #ffffff",
                          boxShadow: "0 0 16px rgba(255, 255, 255, 0.25)"
                        }}
                      >
                        {newGroupEmoji}
                      </div>
                    </div>
                  </div>

                  {/* Curated Presets row with high-contrast, pure-white highlight styles */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider pl-1.5">{t("social.orChoosePreset")}</span>
                    <div className="flex justify-between items-center gap-2 p-2 rounded-2xl bg-white/[0.01] border border-white/5">
                      {PRESET_EMOJIS.map((emoji) => {
                        const isSelected = emoji === newGroupEmoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => onEmojiChange(emoji)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all active:scale-90"
                            style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.12)" : "rgba(255,255,255,0.03)",
                              border: isSelected ? "2.5px solid #ffffff" : "1.5px solid rgba(255,255,255,0.08)",
                              transform: isSelected ? "scale(1.15)" : "scale(1)",
                              boxShadow: isSelected ? "0 0 0 1px rgba(255,255,255,0.2)" : "none",
                            }}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Custom Timezone Select Input */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 pl-1">
                    <Globe size={14} className="text-[#e07c30]" />
                    <label className="text-white/70 text-[13px] font-semibold tracking-wide">{t("social.groupTimezone")}</label>
                  </div>
                  <div className="relative">
                    <select
                      value={newGroupTimezone}
                      onChange={(e) => onTimezoneChange(e.target.value)}
                      style={glassStyle(0.04, 16, 0.08)}
                      className="w-full rounded-[18px] py-3.5 px-4 text-white text-[14px] outline-none transition-colors focus:border-[#e07c30]/50 bg-[#111] appearance-none cursor-pointer pr-10"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value} className="bg-[#111] text-white">
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Action */}
              <button
                onClick={onCreate}
                disabled={creating || !newGroupName.trim()}
                className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-auto"
                style={{ background: ACCENT }}
              >
                {creating && <Loader2 size={18} className="animate-spin" />}
                {creating ? t("social.creating") : t("social.createGroup")}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}