"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, Bell, Check } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import {
  registerPushServiceWorker,
  subscribeToPush,
  getVapidPublicKey,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import { saveSubscription } from "@/actions/push";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function NotificationEnforcer({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // Initialize states with a default optimistic assumptions to allow immediate first-paint SSR and avoid spinners
  const [permission, setPermission] = useState<PermissionState | "default">("granted");
  const [isSupported, setIsSupported] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [subscribingNotifications, setSubscribingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setIsSupported(false);
      } else {
        setPermission(window.Notification.permission);
      }
      setInitialized(true);
    }
  }, []);

  const handleRequestNotifications = async () => {
    setSubscribingNotifications(true);
    setNotificationsError("");
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const registration = await registerPushServiceWorker();
        const key = getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(key);
        const subscription = await subscribeToPush(registration, convertedKey);
        await saveSubscription(subscription.toJSON() as any);
      } else if (result === "denied") {
        setNotificationsError(t("enforcer.blockedError"));
      }
    } catch (err: any) {
      let msg = err?.message || t("onboarding.notifyError_failed");
      if (msg.includes("Registration failed - push service error") || msg.includes("push service error")) {
        msg = t("onboarding.notifyError_pushService");
      }
      setNotificationsError(msg);
    } finally {
      setSubscribingNotifications(false);
    }
  };

  const isNotificationsGranted = permission === "granted";

  if (initialized && isSupported && !isNotificationsGranted) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col pt-8 min-h-0 px-6 pb-6 bg-[#161618] sm:rounded-[40px] animate-fade-in select-none">
        <div className="mb-4 flex-shrink-0 mt-4 text-center">
          <div className="flex justify-center mb-6">
            <motion.img
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: [0.95, 1.05, 0.95], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              src="/assets/icons/notification.png"
              alt="Notifications Required"
              className="w-28 h-28 object-contain relative z-10 drop-shadow-2xl mb-4"
            />
          </div>
          <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">{t("enforcer.title")}</h1>
          <p className="text-white/60 text-[13px] leading-relaxed max-w-[280px] mx-auto">
            {t("enforcer.body")}
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-start max-w-sm mx-auto w-full gap-4">
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="p-4 rounded-[22px] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: isNotificationsGranted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <Bell size={20} className={isNotificationsGranted ? "text-emerald-400" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[14px]">{t("enforcer.channelTitle")}</h4>
                <p className="text-white/40 text-[10.5px] leading-tight mt-0.5">
                  {t("enforcer.channelBody")}
                </p>
              </div>
            </div>
            {notificationsError && <p className="text-red-500 text-[10.5px] font-semibold leading-relaxed whitespace-pre-line">{notificationsError}</p>}
            <button
              onClick={handleRequestNotifications}
              disabled={isNotificationsGranted || subscribingNotifications}
              style={{
                background: isNotificationsGranted ? "rgba(34,197,94,0.15)" : ACCENT,
                color: isNotificationsGranted ? "#22c55e" : "#000",
                border: isNotificationsGranted ? "1px solid rgba(34,197,94,0.3)" : "none"
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {subscribingNotifications ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : isNotificationsGranted ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>{t("enforcer.activated")}</span>
                </>
              ) : (
                t("enforcer.enableBtn")
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
