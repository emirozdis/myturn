"use client";

import { motion } from "framer-motion";
import { Search, Compass } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type DiscoverTabProps = {
  trending: any[];
};

export function DiscoverTab({ trending }: DiscoverTabProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="discover"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8 pb-24"
    >
      <div className="relative">
        <input
          type="text"
          placeholder={t("social.discoverSearchPlaceholder")}
          className="w-full rounded-[18px] py-3.5 pl-10 pr-4 text-[13px] text-white outline-none placeholder:text-white/40 shadow-inner transition-all focus:border-[#e07c30]/50"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Compass size={18} className="text-[#e07c30]" />
          <h2 className="text-white text-[17px] font-bold tracking-tight">{t("social.activeGroups")}</h2>
        </div>
        <div className="flex flex-col gap-3">
          {trending.length > 0 ? trending.map((group: any) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-3.5 rounded-[22px] transition-all hover:bg-white/[0.06]"
              style={glassStyle(0.03, 16, 0.06)}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/15 shadow-sm text-white font-bold text-lg">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[15px] font-bold truncate tracking-tight">
                    {group.name}
                  </div>
                  <div className="text-white/50 text-[11px] font-medium mt-0.5">{t("social.members", { count: group.members })}</div>
                  <div className="text-[#e07c30] text-[10px] font-semibold mt-1">{t("social.activeLabel", { active: group.active })}</div>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-white/30 text-xs">{t("social.noSuggestedGroups")}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
