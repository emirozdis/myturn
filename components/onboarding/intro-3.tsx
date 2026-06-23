"use client";

import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function Intro3() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col justify-center min-h-0 pb-[130px]">
      <div className="flex-1 relative flex items-center justify-center w-full min-h-0 pt-4">
        <div className="relative h-full w-full max-h-[320px] flex items-center justify-center">
          <div
            className="relative h-full aspect-[3/4] rounded-[24px] overflow-hidden flex flex-col p-2 shadow-2xl mx-auto"
            style={glassStyle(0.04, 20, 0.1)}
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px]">🏠</div>
              <span className="text-white text-xs font-bold truncate">The Apartment</span>
            </div>
            <div className="relative flex-1 rounded-[16px] overflow-hidden bg-black/40 border border-white/5">
              <img src="/image1.png" className="absolute inset-0 w-full h-full object-cover" alt="" />
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 z-10">
                {["😮", "😂", "❤️"].map((e, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-[10px] border border-white/10">{e}</div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-2 h-[42px] flex-shrink-0">
              <div className="flex-1 rounded-[14px] p-2 flex items-center gap-2 overflow-hidden" style={glassStyle(0.04, 10, 0.1)}>
                <img src="/profile.jpg" className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-[10px] font-bold truncate">Emir</span>
                  <span className="text-[#e07c30] text-[8px] truncate">3 {t("onboarding.dayStreakLabel")}</span>
                </div>
              </div>
              <div className="flex-1 rounded-[14px] p-2 flex flex-col justify-center items-center" style={glassStyle(0.04, 10, 0.1)}>
                <span className="text-white font-bold text-[11px] tracking-widest">08:44:05</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 mt-8">
        <h1 className="text-white text-4xl sm:text-[38px] font-bold leading-[1.15] mb-4 tracking-tight" style={{ whiteSpace: "pre-line" }}>
          {t("onboarding.intro3Title")}<span style={{ color: ACCENT }}>{t("onboarding.intro3TitleAccent")}</span>
        </h1>
        <p className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-sm">
          {t("onboarding.intro3Body")}
        </p>
      </div>
    </div>
  );
}
