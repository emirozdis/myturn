"use client";

import { Camera } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function Intro1() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col justify-center min-h-0 pb-[130px]">
      <div className="flex-1 flex items-center justify-center min-h-0 pt-4">
        <div className="relative h-full w-full max-h-[200px] flex items-center justify-center">
          <div className="relative h-full aspect-square flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-[40px] blur-2xl" />
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.add("fallback-logo");
              }}
            />
            <div className="fallback-logo-content hidden absolute inset-0 items-center justify-center z-10">
              <Camera size={64} color="white" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 mt-4">
        <h1 className="text-white text-4xl sm:text-[38px] font-bold leading-[1.15] mb-4 tracking-tight" style={{ whiteSpace: "pre-line" }}>
          {t("onboarding.intro1Title")}<span style={{ color: ACCENT }}>{t("onboarding.intro1TitleAccent")}</span>
        </h1>
        <p className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-sm">
          {t("onboarding.intro1Body")}
        </p>
      </div>
    </div>
  );
}
