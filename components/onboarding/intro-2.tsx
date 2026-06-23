"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function Intro2() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col justify-center min-h-0 pb-[130px]">
      <div className="flex-1 relative flex items-center justify-center w-full min-h-0 pt-4">
        <div className="relative h-full w-full max-h-[300px] flex items-center justify-center">
          <div className="relative h-full aspect-[4/5]">
            <motion.div
              animate={{ y: [-5, 5, -5], rotateZ: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              style={glassStyle(0.06, 20, 0.1)}
              className="absolute inset-0 rounded-[32px] overflow-hidden p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-3 z-10"
            >
              <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-black/50">
                <img src="/image1.png" className="absolute inset-0 w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 right-4 w-[22%] aspect-square min-w-[32px] bg-[#e07c30] rounded-full flex items-center justify-center border-[2px] border-[#111] shadow-lg">
                  <Camera size={18} color="white" />
                </div>
              </div>
            </motion.div>

            <div className="absolute top-[0%] left-[0%] -translate-x-1/3 -translate-y-1/3 w-[30%] aspect-square rounded-full border-[3px] border-[#161618] overflow-hidden z-20 shadow-xl bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute bottom-[5%] right-[0%] translate-x-1/3 translate-y-1/3 w-[25%] aspect-square rounded-full border-[3px] border-[#161618] overflow-hidden z-20 shadow-xl bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover grayscale opacity-70" alt="" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 mt-8">
        <h1 className="text-white text-4xl sm:text-[38px] font-bold leading-[1.15] mb-4 tracking-tight" style={{ whiteSpace: "pre-line" }}>
          {t("onboarding.intro2Title")}<span style={{ color: ACCENT }}>{t("onboarding.intro2TitleAccent")}</span>
        </h1>
        <p className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-sm">
          {t("onboarding.intro2Body")}
        </p>
      </div>
    </div>
  );
}
