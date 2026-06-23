"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share, PlusSquare, MoreVertical, MonitorDown, Info, ShieldCheck, Copy, Sparkles
} from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { listenForInstallPrompt, promptPwaInstall, BeforeInstallPromptEvent } from "@/lib/pwa-install";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function InstallEnforcerScreen() {
  const { t } = useTranslation();
  const [deviceInfo, setDeviceInfo] = useState<{
    os: "ios" | "android" | "desktop" | "unknown";
    browser: "safari" | "chrome" | "samsung" | "other";
    iosVersion: number;
    isIPad: boolean;
  }>({
    os: "unknown",
    browser: "other",
    iosVersion: 0,
    isIPad: false
  });

  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent || "";
      const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isIPhone = /iPhone|iPod/.test(ua);
      const isIOS = isIPad || isIPhone;
      const isAndroid = /Android/i.test(ua);

      let iosVersion = 0;
      if (isIOS) {
        const match = ua.match(/OS (\d+)_/);
        if (match) iosVersion = parseInt(match[1], 10);
      }

      let browser: "safari" | "chrome" | "samsung" | "other" = "other";
      const nav = window.navigator as any;
      const isBrave = (nav.brave !== undefined && nav.brave.isBrave?.name === 'isBrave') || /Brave/i.test(ua);

      if (isIOS) {
        if (/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Focus|YaBrowser|Aloha|Instagram|FBAV|FBAN/i.test(ua) && !isBrave) {
          browser = "safari";
        }
      } else if (isAndroid) {
        if (/SamsungBrowser/i.test(ua)) {
          browser = "samsung";
        } else if (/Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser|DuckDuckGo|Firefox|FxiOS|YaBrowser|Instagram|FBAV|FBAN/i.test(ua) && !isBrave) {
          browser = "chrome";
        }
      } else {
        if (/Chrome/i.test(ua) && !/Edg|OPR|DuckDuckGo|Firefox|YaBrowser|Brave/i.test(ua)) browser = "chrome";
      }

      setDeviceInfo({
        os: isIOS ? "ios" : isAndroid ? "android" : "desktop",
        browser,
        iosVersion,
        isIPad
      });

      const cleanup = listenForInstallPrompt((e) => setPromptEvent(e));
      return cleanup;
    }
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWrongBrowser = (deviceInfo.os === "ios" && deviceInfo.browser !== "safari") || (deviceInfo.os === "android" && deviceInfo.browser !== "chrome" && deviceInfo.browser !== "samsung");
  const isDevBypass = process.env.NEXT_PUBLIC_ALLOW_WEB_BYPASS === "true";
  const showRecommendBrowser = isWrongBrowser && !dismissedWarning && !isDevBypass;

  const storeName = deviceInfo.os === "android" ? "Play Store" : "App Store";
  const isApple = deviceInfo.os === "ios";

  if (showRecommendBrowser) {
    const recommendedBrowser = deviceInfo.os === "ios" ? "Safari" : "Chrome";
    const browserIcon = deviceInfo.os === "ios" ? "/assets/icons/safari.png" : "/assets/icons/chrome.png";

    return (
      <div className="flex-1 flex flex-col pt-6 min-h-0 w-full relative z-10">
        <div className="flex-1 flex flex-col justify-center items-center text-center pb-8 overflow-y-auto scrollbar-hide px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center w-full max-w-[320px] mx-auto"
          >
            <div className="relative mb-6 mt-2">
              <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
              <img src={browserIcon} className="w-28 h-28 object-contain relative z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" alt={recommendedBrowser} />
            </div>

            <h2 className="text-white text-[28px] font-bold mb-3 tracking-tight">{t("onboarding.openInBrowser", { browser: recommendedBrowser })}</h2>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8">
              {t("onboarding.openInBrowserBody", { browser: `<strong>${recommendedBrowser}</strong>` }).split(`<strong>${recommendedBrowser}</strong>`).reduce((acc: any[], part, i) => {
                if (i === 0) return [<span key={i}>{part}</span>];
                return [...acc, <strong key={`b${i}`}>{recommendedBrowser}</strong>, <span key={i}>{part}</span>];
              }, [])}
            </p>

            <button
              onClick={copyLink}
              style={glassStyle(0.04, 16, 0.08)}
              className="w-full py-4 rounded-[20px] text-white font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 shadow-lg"
            >
              <Copy size={18} className={copied ? "text-emerald-400" : "text-white/70"} />
              {copied ? t("common.copied") : t("onboarding.copyAppLink")}
            </button>

            <button
              onClick={() => setDismissedWarning(true)}
              className="mt-8 text-white/30 hover:text-white/60 text-[13px] font-medium underline underline-offset-4 transition-colors cursor-pointer text-center pb-2"
            >
              {t("onboarding.continueAnyway")}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Dynamic Instructions Assembly
  let instruction1: { text1: string; bold: string; icon: any; text2: string };
  let instruction2: { text1: string; bold: string; icon: any; text2: string } | null = null;

  if (deviceInfo.os === "ios") {
    instruction2 = { text1: "Scroll down and select ", bold: "Add to Home Screen", icon: PlusSquare, text2: "." };
    if (deviceInfo.isIPad) {
      instruction1 = { text1: "Tap the ", bold: "Share", icon: Share, text2: " button at the top right of the screen." };
    } else if (deviceInfo.iosVersion >= 15) {
      instruction1 = { text1: "Tap the ", bold: "Share", icon: Share, text2: " button in Safari's bottom toolbar (or address bar)." };
    } else {
      instruction1 = { text1: "Tap the ", bold: "Share", icon: Share, text2: " button at the bottom of the screen." };
    }
  } else if (deviceInfo.os === "android") {
    if (deviceInfo.browser === "samsung") {
      instruction1 = { text1: "Tap the ", bold: "Menu", icon: MoreVertical, text2: " (three horizontal lines) at the bottom right." };
      instruction2 = { text1: "Select ", bold: "Add to Home screen", icon: MonitorDown, text2: "." };
    } else {
      instruction1 = { text1: "Tap the ", bold: "Menu", icon: MoreVertical, text2: " (three dots) in the top right corner." };
      instruction2 = { text1: "Select ", bold: "Install app", icon: MonitorDown, text2: " or Add to Home screen." };
    }
  } else {
    instruction1 = { text1: "Click the ", bold: "Install", icon: MonitorDown, text2: " icon in your browser's address bar." };
  }

  return (
    <>
      <div className="flex-1 flex flex-col pt-6 min-h-0 w-full relative z-10">
        <div className="flex-1 flex flex-col justify-center items-center pb-8 overflow-y-auto scrollbar-hide px-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full max-w-[320px] mx-auto mt-4"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#e07c30]/20 blur-3xl rounded-full" />
              <img src="/logo.png" className="w-28 h-28 object-contain relative z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" alt="Logo" />
            </div>

            <h2 className="text-white text-[28px] font-bold mb-3 tracking-tight text-center">{t("onboarding.installTitle")}</h2>
            <p className="text-white/60 text-[15px] leading-relaxed mb-6 text-center">
              {t("onboarding.installBody")}
            </p>

            {promptEvent ? (
              <button
                onClick={() => promptPwaInstall(promptEvent)}
                style={{ background: ACCENT }}
                className="w-full py-4 rounded-[20px] text-black font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <MonitorDown size={20} />
                {t("onboarding.installButton")}
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <div className="space-y-4 py-2">
                  <div className="flex items-start gap-3.5 text-white/70">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-white/50 border border-white/10 text-[11px] font-bold mt-0.5">1</div>
                    <p className="text-white/60 text-[14px] leading-relaxed">
                      {instruction1.text1}
                      <strong className="text-white font-semibold inline-flex items-center gap-1 mx-1">
                        {instruction1.bold} <instruction1.icon size={14} className="inline-block text-[#e07c30]" />
                      </strong>
                      {instruction1.text2}
                    </p>
                  </div>
                  {instruction2 && (
                    <div className="flex items-start gap-3.5 text-white/70">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-white/50 border border-white/10 text-[11px] font-bold mt-0.5">2</div>
                      <p className="text-white/60 text-[14px] leading-relaxed">
                        {instruction2.text1}
                        <strong className="text-white font-semibold inline-flex items-center gap-1 mx-1">
                          {instruction2.bold} <instruction2.icon size={14} className="inline-block text-[#e07c30]" />
                        </strong>
                        {instruction2.text2}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center bg-[#e07c30]/10 border border-[#e07c30]/20 py-3 rounded-2xl shadow-inner">
                  <span className="text-[#e07c30] text-[13px] font-semibold flex items-center justify-center gap-2">
                    <Sparkles size={15} />
                    {t("onboarding.launchFromHomeScreen")}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowStoreModal(true)}
              className="mt-6 text-white/40 hover:text-white/60 text-[13px] font-semibold underline underline-offset-4 transition-colors cursor-pointer text-center"
            >
              {t("onboarding.whyNotInStore", { store: storeName })}
            </button>
          </motion.div>
        </div>
      </div>

      {isApple && !deviceInfo.isIPad && !promptEvent && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center w-full max-w-[320px]">
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center"
          >
            <div className="relative flex flex-col items-center">
              <div className="absolute -inset-1 bg-[#e07c30]/25 rounded-2xl blur-md animate-pulse" />
              <div className="relative bg-[#e07c30] text-black px-4 py-2.5 rounded-2xl font-black text-xs shadow-[0_12px_24px_rgba(224,124,48,0.5)] flex items-center gap-2 border border-[#f49b56]">
                <Share size={15} strokeWidth={3} className="animate-pulse text-black" />
                <span className="tracking-wide uppercase font-extrabold">{t("onboarding.tapShareToStart")}</span>
              </div>
              <div className="w-3.5 h-3.5 bg-[#e07c30] rotate-45 -mt-1.5 border-r border-b border-[#f49b56] shadow-[0_12px_24px_rgba(224,124,48,0.5)]" />
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showStoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-6 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-8 sm:p-10"
            onClick={() => setShowStoreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="w-full max-w-[340px] rounded-[32px] p-6 text-left flex flex-col bg-[#0a0a0a] border border-white/10 max-h-[90%] overflow-y-auto scrollbar-hide shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative z-50"
              style={glassStyle(0.08, 20, 0.15)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                <Info size={22} className="text-[#e07c30]" />
                <h3 className="text-white text-xl font-bold tracking-tight">{t("onboarding.storeModalTitle", { store: storeName })}</h3>
              </div>

              <div className="flex-1 space-y-4 text-[13px] leading-relaxed text-white/70 overflow-y-auto scrollbar-hide mb-6">
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-[#e07c30]/90">{t("onboarding.storeCostsTitle")}</h4>
                  <p>{t("onboarding.storeCostsBody")}</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-[#e07c30]/90">{t("onboarding.soloDevTitle")}</h4>
                  <p>{t("onboarding.soloDevBody")}</p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider text-emerald-400">{t("onboarding.isSafeTitle")}</h4>
                  </div>
                  <p>{t("onboarding.isSafeBody")}</p>
                </div>
              </div>

              <button
                onClick={() => setShowStoreModal(false)}
                style={{ background: ACCENT }}
                className="w-full py-3.5 rounded-[18px] text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 shadow-md flex items-center justify-center flex-shrink-0"
              >
                {t("common.understood")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
