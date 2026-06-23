import { Flame } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type StreaksHeaderProps = {
  currentStreak: number;
};

export function StreaksHeader({ currentStreak }: StreaksHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-start mb-2">
      <div>
        <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight">{t("streaks.archivesTitle")}</h2>
        <p className="text-white/60 text-[12px] mt-0.5">{t("streaks.archivesSubtitle")}</p>
      </div>
      <div
        style={glassStyle(0.05, 10, 0.1)}
        className="px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <Flame size={12} className="text-[#e07c30] fill-[#e07c30]" />
        <span className="text-[#e07c30] text-[10px] font-bold">{t("streaks.dayStreakLabel", { count: currentStreak })}</span>
      </div>
    </div>
  );
}
