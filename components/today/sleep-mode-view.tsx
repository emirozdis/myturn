"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, HeartHandshake } from "lucide-react";
import { glassStyle } from "../shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type SleepModeViewProps = {
  hasVolunteeredForTomorrow: boolean;
  canVolunteer: boolean;
  volunteerEligibilityReason: string;
  isVolunteering: boolean;
  volunteerError: string;
  onToggleVolunteer: () => void;
};

export function SleepModeView({
  hasVolunteeredForTomorrow,
  canVolunteer,
  volunteerEligibilityReason,
  isVolunteering,
  volunteerError,
  onToggleVolunteer,
}: SleepModeViewProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 bg-[#060814] z-0 flex flex-col items-center justify-start p-6 text-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/assets/images/resting.jpeg')" }}
      />

      <div className="absolute top-0 left-0 right-0 h-[60%] overflow-hidden z-10 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[28px] scale-[1.08] origin-top"
          style={{
            backgroundImage: "url('/assets/images/resting.jpeg')",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-transparent" />
      </div>

      <div className="relative z-20 flex flex-col items-center max-w-[280px] mt-6 text-center">
        <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">{t("today.restingTitle")}</h2>
        <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
          {t("today.restingBody")}
        </p>
        <div className="flex flex-col gap-3.5 w-full mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); router.push("/streaks"); }}
            style={glassStyle(0.08, 16, 0.12)}
            className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center pointer-events-auto border border-white/10"
          >
            {t("today.watchLastVlog")}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleVolunteer(); }}
            disabled={isVolunteering || !canVolunteer}
            className={`w-full py-3.5 font-extrabold rounded-2xl text-xs flex items-center justify-center pointer-events-auto transition-all duration-300 ease-out active:translate-y-[2px] ${
              hasVolunteeredForTomorrow
                ? "bg-gradient-to-b from-[#f05a7e] to-[#e84365] text-white border-b-[4px] border-[#a01a35] active:border-b-[2px] hover:brightness-110 shadow-[0_4px_12px_rgba(232,67,101,0.25)]"
                : !canVolunteer
                ? "bg-[#111112] text-white/40 border border-white/5 cursor-not-allowed"
                : "bg-[#222225] hover:bg-[#2b2b2f] text-white border-b-[4px] border-[#111112] active:border-b-[2px]"
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isVolunteering ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("today.updating")}</span>
                </motion.div>
              ) : hasVolunteeredForTomorrow ? (
                <motion.div
                  key="volunteered"
                  initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex items-center gap-2"
                >
                  <HeartHandshake size={16} />
                  <span>{t("today.volunteeredForTomorrow")}</span>
                </motion.div>
              ) : !canVolunteer ? (
                <motion.div
                  key="ineligible"
                  initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex items-center gap-2"
                >
                  <HeartHandshake size={16} className="opacity-50" />
                  <span>{volunteerEligibilityReason || t("today.notEligibleVolunteer")}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="unvolunteered"
                  initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex items-center gap-2"
                >
                  <HeartHandshake size={16} />
                  <span>{t("today.volunteerForTomorrow")}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {volunteerError && (
              <motion.span
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-[10px] font-semibold mt-0.5"
              >
                {volunteerError}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
