// components/shared/language-toggle.tsx
"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  const toggle = () => setLocale(locale === "tr" ? "en" : "tr");

  return (
    <button
      onClick={toggle}
      aria-label="Toggle language"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white/70 hover:text-white transition-all active:scale-95 select-none"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={locale}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="text-[13px] leading-none"
        >
          {locale === "tr" ? "🇹🇷" : "🇬🇧"}
        </motion.span>
      </AnimatePresence>
      <span className="text-[11px] font-bold uppercase tracking-wider leading-none">
        {locale === "tr" ? "TR" : "EN"}
      </span>
    </button>
  );
}
