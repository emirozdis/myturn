"use client";

import { Plus, Users } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function NoGroupsScreen({ onNavigate }: { onNavigate: (id: string, href: string) => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 relative overflow-hidden animate-fade-in">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none filter blur-[90px] opacity-20"
        style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
      />

      <div
        style={glassStyle(0.04, 24, 0.08)}
        className="relative z-10 w-full rounded-[36px] border border-white/5 p-6 flex flex-col items-center text-center shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full blur-xl scale-125 opacity-30"
            style={{ background: ACCENT }}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative z-10 bg-white/[0.03] backdrop-blur-md"
          >
            <Users size={32} style={{ color: ACCENT }} className="animate-pulse" />
          </div>
        </div>

        <h3 className="text-white font-extrabold text-xl tracking-tight mb-2">
          {t("noGroups.title")}
        </h3>

        <p className="text-white/50 text-[13px] leading-relaxed max-w-[250px] mb-6">
          {t("noGroups.subtitle")}
        </p>

        <div className="w-full flex flex-col gap-3 text-left mb-6">
          {[
            { step: "1", title: t("noGroups.step1Title"), desc: t("noGroups.step1Desc") },
            { step: "2", title: t("noGroups.step2Title"), desc: t("noGroups.step2Desc") },
            { step: "3", title: t("noGroups.step3Title"), desc: t("noGroups.step3Desc") }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3.5 items-start p-3 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                {item.step}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-xs leading-none mb-1">{item.title}</h4>
                <p className="text-white/40 text-[10px] leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onNavigate("social", "/social")}
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, #ff9a44)`,
            boxShadow: "0 6px 24px rgba(224,124,48,0.3)"
          }}
          className="w-full py-4 rounded-2xl text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-2"
        >
          <span>{t("noGroups.getStarted")}</span>
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
