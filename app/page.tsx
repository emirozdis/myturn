// ./app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, EyeOff, Eye, Camera, User, Loader2, Bell, Check, Sparkles, MapPin,
  Share, PlusSquare, MoreVertical, MonitorDown, Info, ShieldCheck, Copy
} from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { signUpUser } from "@/actions/auth";
import { joinGroup, createGroup } from "@/actions/group";
import {
  registerPushServiceWorker,
  subscribeToPush,
  getVapidPublicKey,
  urlBase64ToUint8Array
} from "@/lib/push-client";
import { saveSubscription } from "@/actions/push";
import { updateProfile, uploadAvatar } from "@/actions/profile";
import { listenForInstallPrompt, promptPwaInstall, BeforeInstallPromptEvent, isStandaloneMode } from "@/lib/pwa-install";

type Step = "intro1" | "intro2" | "intro3" | "installPwa" | "signin" | "signup" | "permissions" | "customizeProfile" | "join";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.142 2.97c-.984 1.22-2.392 2.003-3.834 1.954-.216-1.41.455-2.85 1.4-3.778 1.002-1.002 2.45-1.636 3.794-1.558.232 1.44-.396 2.846-1.36 3.382zm1.666 10.428c-.035-2.58 2.073-3.837 2.167-3.896-1.182-1.748-3.033-1.988-3.712-2.016-1.576-.162-3.084.938-3.896.938-.813 0-2.05-.888-3.344-.863-1.688.026-3.242.99-4.116 2.525-1.782 3.106-.456 7.708 1.282 10.237.854 1.238 1.866 2.624 3.167 2.573 1.25-.05 1.74-.814 3.256-.814 1.516 0 1.954.814 3.28.79 1.352-.026 2.223-1.264 3.078-2.522 1.002-1.464 1.41-2.885 1.432-2.96-.03-.016-2.56-1.01-2.594-3.992z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 8,
            backgroundColor: i === current ? ACCENT : "rgba(255,255,255,0.2)",
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

function InputField({ label, type = "text", placeholder, icon: Icon, isPassword, value, onChange }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={glassStyle(0.04, 16, 0.08)}
          className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            {show ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
        {Icon && !isPassword && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

function Intro1() {
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
        <h1 className="text-white text-4xl sm:text-[38px] font-bold leading-[1.15] mb-4 tracking-tight">
          One camera.<br />
          One day.<br />
          <span style={{ color: ACCENT }}>Your story.</span>
        </h1>
        <p className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-sm">
          Every day, someone from your group vlogs their life. Randomly picked. Authentically yours.
        </p>
      </div>
    </div>
  );
}

function Intro2() {
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
        <h1 className="text-white text-4xl sm:text-[38px] font-bold leading-[1.15] mb-4 tracking-tight">
          Random. Fun.<br />
          <span style={{ color: ACCENT }}>Real.</span>
        </h1>
        <p className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-sm">
          A new vlogger is picked randomly each day. It could be you!
        </p>
      </div>
    </div>
  );
}

function Intro3() {
  return (
    <div className="flex-1 flex flex-col justify-center min-h-0 pb-[130px]">
      <div className="flex-1 relative flex items-center justify-center w-full min-h-0 pt-4">
        <div className="relative h-full w-full max-h-[320px] flex items-center justify-center">
          <div
            className="relative h-full aspect-[3/4] rounded-[24px] overflow-hidden flex flex-col p-2 shadow-2xl mx-auto"
            style={glassStyle(0.04, 20, 0.1)}
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px]">🏠</div>
              <span className="text-white text-xs font-bold truncate">The Apartment</span>
            </div>
            <div className="relative flex-1 rounded-[16px] overflow-hidden bg-black/40 border border-white/5">
              <img src="/image1.png" className="absolute inset-0 w-full h-full object-cover" alt="" />
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 z-10">
                {["😮", "😂", "❤️"].map((e, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-[10px] border border-white/10">{e}</div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-2 h-[42px] flex-shrink-0">
              <div className="flex-1 rounded-[14px] p-2 flex items-center gap-2 overflow-hidden" style={glassStyle(0.04, 10, 0.1)}>
                <img src="/profile.jpg" className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-[10px] font-bold truncate">Emir</span>
                  <span className="text-[#e07c30] text-[8px] truncate">3 day streak</span>
                </div>
              </div>
              <div className="flex-1 rounded-[14px] p-2 flex flex-col justify-center items-center" style={glassStyle(0.04, 10, 0.1)}>
                <span className="text-white font-bold text-[11px] tracking-widest">08:44:05</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 mt-8">
        <h1 className="text-white text-4xl sm:text-[38px] font-bold leading-[1.15] mb-4 tracking-tight">
          Watch. React.<br />
          <span style={{ color: ACCENT }}>Stay connected.</span>
        </h1>
        <p className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-sm">
          Watch their day unfold, react, and keep your friendship stronger.
        </p>
      </div>
    </div>
  );
}

function InstallEnforcerScreen() {
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

            <h2 className="text-white text-[28px] font-bold mb-3 tracking-tight">Open in {recommendedBrowser}</h2>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8">
              We recommend using <strong>{recommendedBrowser}</strong> to ensure camera and notification features work flawlessly.
            </p>

            <button
              onClick={copyLink}
              style={glassStyle(0.04, 16, 0.08)}
              className="w-full py-4 rounded-[20px] text-white font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 shadow-lg"
            >
              <Copy size={18} className={copied ? "text-emerald-400" : "text-white/70"} />
              {copied ? "Link Copied!" : "Copy App Link"}
            </button>

            <button
              onClick={() => setDismissedWarning(true)}
              className="mt-8 text-white/30 hover:text-white/60 text-[13px] font-medium underline underline-offset-4 transition-colors cursor-pointer text-center pb-2"
            >
              Continue in current browser anyway
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

            <h2 className="text-white text-[28px] font-bold mb-3 tracking-tight text-center">Install App</h2>
            <p className="text-white/60 text-[15px] leading-relaxed mb-6 text-center">
              MyTurn is a PWA app. Install it to your home screen to use it.
            </p>

            {promptEvent ? (
              <button
                onClick={() => promptPwaInstall(promptEvent)}
                style={{ background: ACCENT }}
                className="w-full py-4 rounded-[20px] text-black font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <MonitorDown size={20} />
                Install MyTurn
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
                    Launch from home screen to continue!
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowStoreModal(true)}
              className="mt-6 text-white/40 hover:text-white/60 text-[13px] font-semibold underline underline-offset-4 transition-colors cursor-pointer text-center"
            >
              Why isn't MyTurn in the {storeName}?
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
                <span className="tracking-wide uppercase font-extrabold">TAP SHARE BELOW TO START</span>
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
                <h3 className="text-white text-xl font-bold tracking-tight">Why No {storeName}?</h3>
              </div>

              <div className="flex-1 space-y-4 text-[13px] leading-relaxed text-white/70 overflow-y-auto scrollbar-hide mb-6">
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-[#e07c30]/90">Store Costs & Barriers</h4>
                  <p>Publishing on the Apple App Store and Google Play Store requires yearly paid developer accounts ($99/year for Apple, plus substantial setup hurdles). These ongoing platform fees artificially inflate development and operation costs, which are typically passed down to you through mandatory subscriptions.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-[#e07c30]/90">Solo Developer Mission</h4>
                  <p>As a solo developer, my mission is simple: keep the core features of MyTurn accessible to as many close friends and family circles as possible, completely free of charge. Cutting out corporate store fees keeps operating costs zero-paywall sustainable.</p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider text-emerald-400">Is it safe?</h4>
                  </div>
                  <p>Absolutely. Progressive Web Apps (PWAs) use native, sandboxed web browsers. It runs securely via HTTPS, cannot access your private system files, and includes no background trackers. It is 100% compliant with standard privacy and device security rules.</p>
                </div>
              </div>

              <button
                onClick={() => setShowStoreModal(false)}
                style={{ background: ACCENT }}
                className="w-full py-3.5 rounded-[18px] text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 shadow-md flex items-center justify-center flex-shrink-0"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SignIn({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Evaluate config flags for social logic UI rendering
  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== "false";
  const allowSocial = process.env.NEXT_PUBLIC_ALLOW_SOCIAL_LOGIN !== "false";
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN !== "false";
  const appleEnabled = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN !== "false";
  const facebookEnabled = process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN === "true";

  const handleSignIn = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setLoading(false);
      if (res?.error) {
        if (res.status === 429 || res.error.includes("Too many login attempts")) {
          setError("Too many login attempts. Please try again later.");
        } else {
          setError("Invalid email or password.");
        }
      } else {
        router.push("/today");
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
      console.error("Sign in failed:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <button onClick={() => onNavigate("intro3")} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white mb-2 -ml-3 rounded-full hover:bg-white/10 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Welcome back!</h1>
        <p className="text-white/60 text-[15px] sm:text-base">Sign in to continue your journey</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <InputField label="Email" placeholder="you@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        <InputField label="Password" placeholder="Enter your password" isPassword value={password} onChange={(e: any) => setPassword(e.target.value)} />

        <div className="flex justify-start mb-6 mt-1">
          <button onClick={() => alert("Password reset instructions sent to your email!")} className="text-[#e07c30] text-[13px] font-semibold hover:underline">Forgot password?</button>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] mb-8 shadow-lg flex-shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Signing In..." : "Sign In"}
        </button>

        {allowSocial && (googleEnabled || appleEnabled || facebookEnabled) && (
          <>
            <div className="flex items-center gap-4 mb-8 flex-shrink-0">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-white/40 text-[13px]">or continue with</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div className="flex items-center justify-center gap-4 mb-6 flex-shrink-0">
              {googleEnabled && (
                <button onClick={() => signIn("google")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <GoogleIcon />
                </button>
              )}
              {appleEnabled && (
                <button onClick={() => signIn("apple")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <AppleIcon />
                </button>
              )}
              {facebookEnabled && (
                <button onClick={() => alert("Facebook login coming soon!")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <FacebookIcon />
                </button>
              )}
            </div>
          </>
        )}

        {allowRegistration && (
          <div className="text-center mt-auto flex-shrink-0 pt-4">
            <span className="text-white/50 text-[14px]">Don't have an account? </span>
            <button onClick={() => onNavigate("signup")} className="text-[#e07c30] text-[14px] font-bold hover:underline">Sign Up</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SignUp({ onNavigate, onSignUpSuccess }: { onNavigate: (step: Step) => void; onSignUpSuccess: (name: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Evaluate config flags for social logic UI rendering
  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== "false";
  const allowSocial = process.env.NEXT_PUBLIC_ALLOW_SOCIAL_LOGIN !== "false";
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN !== "false";
  const appleEnabled = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN !== "false";
  const facebookEnabled = process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN === "true";

  const handleSignUp = async () => {
    setError("");
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUpUser({ name, email, password });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        setLoading(false);
        if (loginRes?.error) {
          if (loginRes.status === 429 || loginRes.error.includes("Too many login attempts")) {
            setError("Too many login attempts. Please try again later.");
          } else {
            setError("Account created, please proceed to sign in.");
          }
        } else {
          onSignUpSuccess(name);
          onNavigate("permissions");
        }
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
      console.error("Sign up failed:", err);
    }
  };

  // Gracefully block rendering if manual URL states access registration while closed
  if (!allowRegistration) {
    return (
      <div className="flex-1 flex flex-col pt-4 min-h-0 items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <User className="text-white/30" size={24} />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight mb-2">Registration Closed</h1>
        <p className="text-white/60 text-xs sm:text-sm max-w-xs mb-6 leading-relaxed">
          User registrations are currently disabled on this platform. If you already have an account, please log in.
        </p>
        <button
          onClick={() => onNavigate("signin")}
          style={{ background: ACCENT }}
          className="w-full max-w-xs py-3.5 rounded-full text-black font-bold text-sm transition-transform active:scale-[0.98]"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <button onClick={() => onNavigate("intro3")} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white mb-2 -ml-3 rounded-full hover:bg-white/10 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Create your account</h1>
        <p className="text-white/60 text-[15px] sm:text-base">Join your group and start vlogging</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <InputField label="Full Name" placeholder="Enter your name" value={name} onChange={(e: any) => setName(e.target.value)} />
        <InputField label="Email" placeholder="you@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        <InputField label="Password" placeholder="Create a password" isPassword value={password} onChange={(e: any) => setPassword(e.target.value)} />

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full mt-4 py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] mb-8 shadow-lg flex-shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        {allowSocial && (googleEnabled || appleEnabled || facebookEnabled) && (
          <>
            <div className="flex items-center gap-4 mb-8 flex-shrink-0">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-white/40 text-[13px]">or continue with</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div className="flex items-center justify-center gap-4 mb-6 flex-shrink-0">
              {googleEnabled && (
                <button onClick={() => signIn("google")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <GoogleIcon />
                </button>
              )}
              {appleEnabled && (
                <button onClick={() => signIn("apple")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <AppleIcon />
                </button>
              )}
              {facebookEnabled && (
                <button onClick={() => alert("Facebook login coming soon!")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <FacebookIcon />
                </button>
              )}
            </div>
          </>
        )}

        <div className="text-center mt-auto flex-shrink-0 pt-4">
          <span className="text-white/50 text-[14px]">Already have an account? </span>
          <button onClick={() => onNavigate("signin")} className="text-[#e07c30] text-[14px] font-bold hover:underline">Sign In</button>
        </div>
      </div>
    </div>
  );
}

function PermissionsScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [loadingNotify, setLoadingNotify] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [notifyError, setNotifyError] = useState("");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "camera" as any }).then((result) => {
        setCameraGranted(result.state === "granted");
      }).catch(() => { });
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationGranted(window.Notification.permission === "granted");
    }
  }, []);

  const handleCameraMicRequest = async () => {
    setLoadingCamera(true);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraGranted(true);
    } catch (err) {
      console.warn("Camera/Mic request failed:", err);
      setCameraError("Camera and microphone permission was denied or unavailable.");
    } finally {
      setLoadingCamera(false);
    }
  };

  const handleNotificationRequest = async () => {
    setLoadingNotify(true);
    setNotifyError("");
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifyError("Notifications not supported on this browser.");
      setLoadingNotify(false);
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setNotificationGranted(permission === "granted");

      if (permission === "granted") {
        const registration = await registerPushServiceWorker();
        const key = getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(key);
        const subscription = await subscribeToPush(registration, convertedKey);
        await saveSubscription(subscription.toJSON() as any);
      } else if (permission === "denied") {
        setNotifyError("Notification permission was denied.");
      }
    } catch (err: any) {
      console.warn("Notification request failed:", err);
      let msg = err?.message || "Failed to configure push alerts.";
      if (msg.includes("Registration failed - push service error") || msg.includes("push service error")) {
        msg = "Push service error. If you are using Brave Browser, please enable 'Use Google services for push messaging' in brave://settings/privacy and reload. Otherwise, ensure your browser has a connection to Google push servers.";
      }
      setNotifyError(msg);
    } finally {
      setLoadingNotify(false);
    }
  };

  const handleContinue = () => {
    onNavigate("customizeProfile");
  };

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <div className="mb-4 flex-shrink-0">
        <motion.img
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: [0.95, 1.05, 0.95], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          src="/assets/icons/notification.png"
          alt="Notifications & Access"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
          className="w-28 h-28 object-contain relative z-10 drop-shadow-2xl"
        />
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Enable Permissions</h1>
        <p className="text-white/60 text-[13px] leading-relaxed">
          MyTurn needs access to your camera and notifications to let you record vlogs and receive daily alerts.
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        <div className="relative w-full max-h-[160px] flex items-center justify-center my-4 flex-shrink-0">
          <div className="absolute inset-0 rounded-full blur-3xl w-40 h-40 mx-auto" />
          <div className="hidden absolute inset-0 flex items-center justify-center z-10">
            <Bell size={64} className="text-[#e07c30] animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-3.5 mb-8 flex-shrink-0">
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="p-4 rounded-[22px] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: cameraGranted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <Camera size={20} className={cameraGranted ? "text-emerald-400" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[14px]">Camera & Microphone</h4>
                <p className="text-white/40 text-[11px] leading-tight mt-0.5">Required to record and upload daily moments.</p>
              </div>
            </div>
            {cameraError && <p className="text-red-500 text-[11px] font-semibold">{cameraError}</p>}
            <button
              onClick={handleCameraMicRequest}
              disabled={cameraGranted || loadingCamera}
              style={{
                background: cameraGranted ? "rgba(34,197,94,0.15)" : ACCENT,
                color: cameraGranted ? "#22c55e" : "#000",
                border: cameraGranted ? "1px solid rgba(34,197,94,0.3)" : "none"
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {loadingCamera ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : cameraGranted ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Access Granted</span>
                </>
              ) : (
                "Grant Camera & Mic Access"
              )}
            </button>
          </div>

          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="p-4 rounded-[22px] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: notificationGranted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <Bell size={20} className={notificationGranted ? "text-emerald-400" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[14px]">Push Notifications</h4>
                <p className="text-white/40 text-[11px] leading-tight mt-0.5">Alerts when it is your turn or friends upload.</p>
              </div>
            </div>
            {notifyError && <p className="text-red-500 text-[11px] font-semibold leading-relaxed whitespace-pre-line">{notifyError}</p>}
            <button
              onClick={handleNotificationRequest}
              disabled={notificationGranted || loadingNotify}
              style={{
                background: notificationGranted ? "rgba(34,197,94,0.15)" : ACCENT,
                color: notificationGranted ? "#22c55e" : "#000",
                border: notificationGranted ? "1px solid rgba(34,197,94,0.3)" : "none"
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {loadingNotify ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : notificationGranted ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Alerts Activated</span>
                </>
              ) : (
                "Enable Daily Notifications"
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleContinue}
          style={{ background: ACCENT }}
          className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 mt-auto flex-shrink-0"
        >
          <span>Continue</span>
        </button>
      </div>
    </div>
  );
}

function CustomizeProfileScreen({ onNavigate, signUpName }: { onNavigate: (step: Step) => void; signUpName: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(signUpName || "");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Phuket, Thailand");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (signUpName) {
      const generated = signUpName.toLowerCase().replace(/[^a-z0-9_]/g, "") + Math.floor(100 + Math.random() * 900);
      setHandle(generated);
    }
  }, [signUpName]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 256;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);

          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarBase64(base64);
          setAvatarPreview(base64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setError("");
    if (!name.trim() || !handle.trim()) {
      setError("Name and username are required.");
      return;
    }

    setLoading(true);

    try {
      if (avatarBase64) {
        const avatarRes = await uploadAvatar(avatarBase64);
        if (avatarRes.error) {
          setError(`Avatar upload failed: ${avatarRes.error}`);
          setLoading(false);
          return;
        }
      }

      const profileRes = await updateProfile({
        name: name.trim(),
        handle: handle.toLowerCase().trim().replace(/\s+/g, ""),
        bio: bio.trim() || "Vlogging our days, making our memories ✨",
        location: location.trim() || "Phuket, Thailand",
      });

      if (profileRes.error) {
        setError(profileRes.error);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cached_profile");
        }
        onNavigate("join");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Create Your Profile</h1>
        <p className="text-white/60 text-xs sm:text-sm">Let your friends know who you are</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 flex-shrink-0">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-2.5 mb-6 flex-shrink-0">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-white/[0.05] border-[2.5px]"
              style={{ borderColor: ACCENT }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/50 text-2xl font-extrabold">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#161618] shadow-md transition-all active:scale-95"
              style={{ background: ACCENT }}
            >
              <Camera size={14} color="#000" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Select Profile Photo</span>
        </div>

        <div className="flex flex-col gap-1">
          <InputField
            label="Display Name"
            placeholder="Your Name"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />
          <InputField
            label="Username / Handle"
            placeholder="handle"
            value={handle}
            onChange={(e: any) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          />
          <InputField
            label="Location"
            placeholder="City, Country"
            value={location}
            onChange={(e: any) => setLocation(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your story..."
              rows={3}
              style={glassStyle(0.04, 16, 0.08)}
              className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30 resize-none leading-relaxed"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading || !name.trim() || !handle.trim()}
          style={{ background: ACCENT }}
          className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 mt-auto flex-shrink-0 disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin text-black" />}
          <span>{loading ? "Saving Profile..." : "Save & Continue"}</span>
        </button>
      </div>
    </div>
  );
}

function JoinGroup({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");
    if (!code) {
      setError("Please enter an invite code.");
      return;
    }

    setLoading(true);
    const res = await joinGroup(code);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/today");
    }
  };

  const handleCreateGroup = async () => {
    setError("");
    if (!groupName) {
      setError("Please enter a name for your group.");
      return;
    }

    setLoading(true);
    const res = await createGroup(groupName);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/today");
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <button onClick={() => onNavigate("customizeProfile")} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white mb-2 -ml-3 rounded-full hover:bg-white/10 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Join your group</h1>
        <p className="text-white/60 text-[15px] sm:text-base">Enter the invite code from your friends</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center py-4 mb-6 relative min-h-[160px]">
          <div className="relative h-full aspect-square max-h-[200px] w-full max-w-[200px] mx-auto">
            <svg className="absolute inset-0 w-full h-full text-white/15" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              <line x1="50" y1="50" x2="50" y2="15" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="20" y2="45" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="80" y2="45" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="30" y2="80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="70" y2="80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
            </svg>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] aspect-square rounded-full bg-[#111] border-[3px] border-[#e07c30] z-10 flex items-center justify-center overflow-hidden shadow-xl">
              <User size={24} className="text-[#e07c30]" />
            </div>

            <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[45%] left-[20%] -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/image1.png" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[45%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[80%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/image1.png" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[80%] left-[70%] -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>

            <div className="absolute top-[15%] right-[15%] text-[#e07c30]/50 animate-pulse">✨</div>
            <div className="absolute bottom-[20%] left-[10%] text-[#e07c30]/50 animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
          </div>
        </div>

        <div className="w-full flex-shrink-0 mt-auto">
          <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1 block mb-1.5">Enter invite code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. A1B2-C3"
            style={glassStyle(0.04, 16, 0.08)}
            className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30 text-center uppercase tracking-widest font-mono mb-4"
          />

          <button
            onClick={handleJoin}
            disabled={code.length < 4 || loading}
            className={`w-full py-4 rounded-[18px] font-bold text-[16px] transition-all mb-4 flex items-center justify-center gap-2 ${code.length >= 4
              ? "bg-[#e07c30] text-black active:scale-[0.98] shadow-lg"
              : "bg-white/5 text-white/30 border border-white/5"
              }`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Joining..." : "Join Group"}
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-white/40 text-[13px]">or create instead</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          <InputField label="Group Name" placeholder="e.g. The Apartment" value={groupName} onChange={(e: any) => setGroupName(e.target.value)} />

          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || loading}
            style={glassStyle(0.02, 16, 0.1)}
            className="w-full py-4 rounded-[18px] font-bold text-[16px] transition-transform active:scale-[0.98] border border-[#e07c30]/50 text-[#e07c30] hover:bg-[#e07c30]/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Create a New Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("intro1");
  const [direction, setDirection] = useState(1);
  const [signUpName, setSignUpName] = useState("");

  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== "false";

  // Prevent authenticated users from flashing the onboarding UI before server middleware can engage
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/today");
    }
  }, [status, router]);

  // Handle airtight PWA gatekeeping on mounting
  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const isStandalone = isStandaloneMode();
      const isDevBypass = process.env.NEXT_PUBLIC_ALLOW_WEB_BYPASS === "true";

      // If they are not running the installed PWA and we are not in development bypass, immediately lock them out.
      if (!isStandalone && !isDevBypass) {
        setStep("installPwa");
      }
    }
  }, []);

  const navigate = (newStep: Step) => {
    const order: Record<Step, number> = {
      intro1: 0,
      intro2: 1,
      intro3: 2,
      installPwa: 3,
      signin: 5,
      signup: 5,
      permissions: 6,
      customizeProfile: 7,
      join: 8
    };

    if (typeof window !== "undefined") {
      const isStandalone = isStandaloneMode();
      const isDevBypass = process.env.NEXT_PUBLIC_ALLOW_WEB_BYPASS === "true";

      if (!isStandalone && !isDevBypass && (newStep === "signin" || newStep === "signup")) {
        setDirection(order["installPwa"] >= order[step] ? 1 : -1);
        setStep("installPwa");
        return;
      }
    }

    setDirection(order[newStep] >= order[step] ? 1 : -1);
    setStep(newStep);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case "intro1": return <Intro1 />;
      case "intro2": return <Intro2 />;
      case "intro3": return <Intro3 />;
      case "installPwa": return <InstallEnforcerScreen />;
      case "signin": return <SignIn onNavigate={navigate} />;
      case "signup": return <SignUp onNavigate={navigate} onSignUpSuccess={setSignUpName} />;
      case "permissions": return <PermissionsScreen onNavigate={navigate} />;
      case "customizeProfile": return <CustomizeProfileScreen onNavigate={navigate} signUpName={signUpName} />;
      case "join": return <JoinGroup onNavigate={navigate} />;
      default: return null;
    }
  };

  const isIntro = step.startsWith("intro");
  const introIndex = isIntro ? parseInt(step.replace("intro", "")) - 1 : -1;

  if (!mounted || status === "loading" || status === "authenticated") {
    // Renders a completely blank background to prevent any client hydration flashes of slides or wrong state.
    return <div className="fixed inset-0 bg-[#060814]" />;
  }

  return (
    <div className="fixed inset-0 sm:relative sm:min-h-screen bg-black flex sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden select-none">
      <div
        className="absolute inset-0 sm:relative sm:w-[393px] sm:h-[812px] sm:rounded-[48px] overflow-hidden flex flex-col transition-all duration-300 bg-[#161618]"
        style={{
          boxShadow: "inset 0 2px 6px rgba(255,255,255,0.1), 0 30px 60px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex-1 relative flex flex-col overflow-hidden h-full">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex flex-col p-6 overflow-hidden"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {isIntro && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 z-10 flex flex-col px-6 pb-8 pt-12 pointer-events-none bg-gradient-to-t from-[#161618] via-[#161618]/90 to-transparent"
              >
                <div className="flex items-center justify-between pointer-events-auto">
                  <Dots total={3} current={introIndex} />
                  <button
                    onClick={() => navigate("signin")}
                    className="text-white/60 text-[14px] font-bold tracking-tight hover:text-white transition-colors"
                  >
                    Log In
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (step === "intro1") navigate("intro2");
                    else if (step === "intro2") navigate("intro3");
                    else navigate(allowRegistration ? "signup" : "signin");
                  }}
                  className="w-full mt-8 py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg pointer-events-auto"
                  style={{ background: ACCENT }}
                >
                  {step === "intro3" ? (allowRegistration ? "Get Started" : "Log In") : "Next"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}