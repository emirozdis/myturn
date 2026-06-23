"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Bell, Check } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import {
  registerPushServiceWorker,
  subscribeToPush,
  getVapidPublicKey,
  urlBase64ToUint8Array
} from "@/lib/push-client";
import { saveSubscription } from "@/actions/push";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Step } from "@/components/onboarding/shared";

export function PermissionsScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const { t } = useTranslation();
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
      setCameraError(t("onboarding.cameraError"));
    } finally {
      setLoadingCamera(false);
    }
  };

  const handleNotificationRequest = async () => {
    setLoadingNotify(true);
    setNotifyError("");
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifyError(t("onboarding.notifyError_unsupported"));
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
        setNotifyError(t("onboarding.notifyError_denied"));
      }
    } catch (err: any) {
      console.warn("Notification request failed:", err);
      let msg = err?.message || t("onboarding.notifyError_failed");
      if (msg.includes("Registration failed - push service error") || msg.includes("push service error")) {
        msg = t("onboarding.notifyError_pushService");
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
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">{t("onboarding.enablePermissions")}</h1>
        <p className="text-white/60 text-[13px] leading-relaxed">
          {t("onboarding.permissionsBody")}
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
                <h4 className="text-white font-bold text-[14px]">{t("onboarding.cameraMicTitle")}</h4>
                <p className="text-white/40 text-[11px] leading-tight mt-0.5">{t("onboarding.cameraMicBody")}</p>
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
                  <span>{t("onboarding.accessGranted")}</span>
                </>
              ) : (
                t("onboarding.grantCameraAccess")
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
                <h4 className="text-white font-bold text-[14px]">{t("onboarding.pushNotificationsTitle")}</h4>
                <p className="text-white/40 text-[11px] leading-tight mt-0.5">{t("onboarding.pushNotificationsBody")}</p>
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
                  <span>{t("onboarding.alertsActivated")}</span>
                </>
              ) : (
                t("onboarding.enableDailyNotifications")
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleContinue}
          style={{ background: ACCENT }}
          className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 mt-auto flex-shrink-0"
        >
          <span>{t("common.continue")}</span>
        </button>
      </div>
    </div>
  );
}
