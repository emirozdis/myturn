"use client";

import { useState, useEffect } from "react";
import { Sliders, RefreshCcw, Trash2, Check, Loader2 } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { SlidePanel } from "./slide-panel";
import { signOut } from "next-auth/react";

type AdvancedPanelProps = {
  onBack: () => void;
};

export function AdvancedPanel({ onBack }: AdvancedPanelProps) {
  const [disableAbr, setDisableAbr] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDisableAbr(localStorage.getItem("disable_abr") === "true");
    }
  }, []);

  const handleToggleAbr = (val: boolean) => {
    setDisableAbr(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("disable_abr", val ? "true" : "false");
      // Force refreshing the feed immediately on toggle
      window.dispatchEvent(new CustomEvent("vlogs-refreshed"));
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheCleared(false);
    try {
      if ("caches" in window) {
        await caches.delete("myturn-vlogs-cache-v1");
        await caches.delete("myturn-vlogs-metadata-v1");
      }
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } catch (e) {
      console.error("Failed to clear vlogs cache:", e);
    } finally {
      setClearingCache(false);
    }
  };

  const handleClearAllData = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all data? This will delete all local files, cached vlogs, preferences, and log you out."
    );
    if (!confirmClear) return;

    setClearingAll(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      signOut({ callbackUrl: "/" });
    } catch (e) {
      console.error("Failed to factory reset site:", e);
      setClearingAll(false);
    }
  };

  return (
    <SlidePanel title="Advanced Settings" onBack={onBack}>
      <div className="flex flex-col gap-6 px-4">
        {/* Toggle ABR Card */}
        <div style={glassStyle(0.04, 20, 0.08)} className="rounded-[18px] p-5 flex flex-col gap-4 border border-white/5">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-[15px] font-bold">Adaptive Bitrate (ABR)</span>
              <span className="text-white/45 text-[11px] leading-snug max-w-[200px]">
                Streams multi-quality video dynamically based on network speed. Turn off to enforce original raw files.
              </span>
            </div>
            
            {/* Custom iOS Toggle Switch */}
            <button
              onClick={() => handleToggleAbr(!disableAbr)}
              className="w-12 h-6 rounded-full relative p-0.5 transition-colors duration-200 outline-none flex items-center"
              style={{
                background: !disableAbr ? ACCENT : "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200"
                style={{
                  transform: !disableAbr ? "translateX(24px)" : "translateX(0px)"
                }}
              />
            </button>
          </div>
        </div>

        {/* Clear Cache Card */}
        <div style={glassStyle(0.04, 20, 0.08)} className="rounded-[18px] p-5 flex flex-col gap-4 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              <RefreshCcw size={18} className="text-[#e07c30]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-[14px] font-bold">Clear Video Cache</span>
              <span className="text-white/45 text-[11px] leading-snug">
                Evicts all locally cached HLS streams and segments from your browser storage. Releases disk space.
              </span>
            </div>
          </div>
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            style={{
              background: cacheCleared ? "#22c55e" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
            className="w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            {clearingCache ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : cacheCleared ? (
              <>
                <Check size={14} strokeWidth={3} />
                <span>Cache Evicted!</span>
              </>
            ) : (
              "Evict Cache Storage"
            )}
          </button>
        </div>

        {/* Clear All Data Card */}
        <div style={glassStyle(0.04, 20, 0.08)} className="rounded-[18px] p-5 flex flex-col gap-4 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-[14px] font-bold">Factory Reset App</span>
              <span className="text-white/45 text-[11px] leading-snug">
                Nukes all browser caches, localized variables, preferences, and cookie tokens. Forces a complete clean reboot.
              </span>
            </div>
          </div>
          <button
            onClick={handleClearAllData}
            disabled={clearingAll}
            className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] hover:bg-red-500/20"
          >
            {clearingAll ? (
              <Loader2 size={14} className="animate-spin text-red-400" />
            ) : (
              "Reset & Log Out"
            )}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}