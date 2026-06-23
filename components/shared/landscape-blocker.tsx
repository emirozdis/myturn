"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function LandscapeBlocker() {
  const { t } = useTranslation();

  return (
    <div className="landscape-blocker hidden fixed inset-0 z-[9999] bg-[#0a0a0a] items-center justify-center text-center p-8 flex-col">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e07c30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>
      <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">{t("layout.rotateDevice")}</h2>
      <p className="text-white/50 text-[15px] max-w-[280px]">{t("layout.rotateDeviceBody")}</p>
    </div>
  );
}
