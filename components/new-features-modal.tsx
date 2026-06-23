// ./components/new-features-modal.tsx
"use client";

import { motion, useDragControls, PanInfo } from "framer-motion";
import { X, Sparkles, ChevronRight, Globe, Check } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface NewFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hardcoded translation schemas
const LOCAL_TEXTS = {
  en: {
    welcome: "Welcome to MyTurn!",
    welcomeSub: "Set up your language preference to get started",
    cardTitle: "Select App Language",
    cardDesc: "Choose your preferred language for the application interface.",
    btnText: "Get Started",
    badge: "Preference Setup"
  },
  tr: {
    welcome: "MyTurn'e Hoş Geldiniz!",
    welcomeSub: "Başlamak için dil tercihinizi ayarlayın",
    cardTitle: "Uygulama Dilini Seçin",
    cardDesc: "Uygulama arayüzü için tercih ettiğiniz dili belirleyin.",
    btnText: "Başlayın",
    badge: "Tercih Kurulumu"
  }
};

export function NewFeaturesModal({ isOpen, onClose }: NewFeaturesModalProps) {
  const { locale, setLocale } = useTranslation();
  const dragControls = useDragControls();

  const activeTexts = LOCAL_TEXTS[locale] || LOCAL_TEXTS.en;

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offsetThreshold = 80;
    const velocityThreshold = 400;
    if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[110] flex flex-col justify-end pointer-events-auto"
      onClick={onClose}
    >
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Slide-Up Premium Bottom Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.9 }}
        className="relative w-full max-w-md mx-auto bg-neutral-950/95 border-t border-white/10 rounded-t-[40px] pt-4 pb-8 flex flex-col shadow-[0_-12px_48px_rgba(0,0,0,0.65)] z-10 pointer-events-auto"
        style={glassStyle(0.08, 20, 0.15)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle Container */}
        <div 
          className="w-full -mt-2 pb-5 flex justify-center cursor-grab active:cursor-grabbing touch-none flex-shrink-0 z-30"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full pointer-events-none" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-20 border border-white/5 cursor-pointer pointer-events-auto"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        <div className="px-6 pt-3 flex flex-col w-full">
          {/* Sparkle Header Indicator */}
          <div className="flex justify-center mb-3">
            <div className="px-3 py-1 bg-[#e07c30]/10 border border-[#e07c30]/20 rounded-full flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#e07c30] animate-pulse" />
              <span className="text-[#e07c30] text-[10px] font-black uppercase tracking-wider">
                {activeTexts.badge}
              </span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center text-center px-2 mb-6">
            <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1.5 leading-none">
              {activeTexts.welcome}
            </h1>
            <p className="text-white/50 text-xs font-medium leading-relaxed">
              {activeTexts.welcomeSub}
            </p>
          </div>

          {/* Language Selection Card Container */}
          <div 
            style={glassStyle(0.03, 12, 0.06)}
            className="rounded-[24px] p-5 border border-white/5 flex flex-col gap-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Globe size={20} className="text-[#e07c30]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[14px] font-extrabold tracking-tight leading-tight mb-0.5">
                  {activeTexts.cardTitle}
                </h3>
                <p className="text-white/40 text-[10px] leading-relaxed font-medium">
                  {activeTexts.cardDesc}
                </p>
              </div>
            </div>

            {/* Interactive Toggle Selectors with High Contrast Design */}
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-white/[0.02] border border-white/5 rounded-2xl">
              {/* English Selection Option */}
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  locale === "en"
                    ? "bg-white text-black shadow-lg scale-[1.02]"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
                }`}
              >
                <span>🇬🇧 English</span>
                {locale === "en" && <Check size={12} className="stroke-[3]" />}
              </button>

              {/* Turkish Selection Option */}
              <button
                type="button"
                onClick={() => setLocale("tr")}
                className={`py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  locale === "tr"
                    ? "bg-white text-black shadow-lg scale-[1.02]"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
                }`}
              >
                <span>🇹🇷 Türkçe</span>
                {locale === "tr" && <Check size={12} className="stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pb-2 pointer-events-auto">
            <button
              onClick={onClose}
              style={{ background: ACCENT }}
              className="w-full py-4 rounded-2xl text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              <span>{activeTexts.btnText}</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}