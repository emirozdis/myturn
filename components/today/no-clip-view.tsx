"use client";

import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "../shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type NoClipViewProps = {
  isCurrentUserVlogger: boolean;
  assignment: any;
  poking: boolean;
  pokeCooldown: number;
  hasPostedInCurrentSlot: boolean;
  onPoke: (e: React.MouseEvent) => void;
};

export function NoClipView({
  isCurrentUserVlogger,
  assignment,
  poking,
  pokeCooldown,
  hasPostedInCurrentSlot,
  onPoke,
}: NoClipViewProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 bg-[#060814] z-0 flex flex-col items-center justify-start p-6 text-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/assets/images/no-clip-yet.jpeg')" }}
      />

      <div className="absolute top-0 left-0 right-0 h-[60%] overflow-hidden z-10 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[28px] scale-[1.08] origin-top"
          style={{
            backgroundImage: "url('/assets/images/no-clip-yet.jpeg')",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-transparent" />
      </div>

      <div className="relative z-20 flex flex-col items-center max-w-[280px] mt-4 text-center">
        {isCurrentUserVlogger ? (
          <>
            <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">{t("today.itsYourTurn")}</h2>
            <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
              {t("today.itsYourTurnBody")}
            </p>
            <button
              onClick={() => router.push("/record")}
              style={{ background: ACCENT }}
              className="w-full py-3.5 text-black font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98]"
            >
              {t("today.recordNow")}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-white text-lg font-extrabold tracking-tight mb-2">
              {t("today.waitingForVlogger", { name: assignment?.user?.name || "Vlogger" })}
            </h2>
            <p className="text-white/60 text-[12px] leading-relaxed mb-6 font-medium">
              {assignment?.clips?.length > 0
                ? t("today.noClipsYet")
                : t("today.noClipsTodayYet")}
            </p>
            <button
              onClick={onPoke}
              disabled={poking || pokeCooldown > 0 || hasPostedInCurrentSlot}
              style={glassStyle(0.08, 16, 0.12)}
              className="w-full py-3 text-white font-extrabold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 pointer-events-auto"
            >
              {pokeCooldown > 0 ? (
                <span>{t("today.pokeCooldown", { time: `${Math.floor(pokeCooldown / 60)}:${(pokeCooldown % 60).toString().padStart(2, "0")}` })}</span>
              ) : hasPostedInCurrentSlot ? (
                <span>{t("today.vloggerAlreadyPosted")}</span>
              ) : poking ? (
                <span>{t("today.poking")}</span>
              ) : (
                <span>{t("today.pokeVlogger")}</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
