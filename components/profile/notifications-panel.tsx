"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { registerPushServiceWorker, subscribeToPush, getVapidPublicKey, urlBase64ToUint8Array } from "@/lib/push-client";
import { saveSubscription } from "@/actions/push";
import { SlidePanel } from "./slide-panel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function NotificationsPanel({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isSupported = typeof window !== "undefined" && typeof window.Notification !== "undefined";

  useEffect(() => {
    if (isSupported) {
      setPermission(window.Notification.permission);
    }
  }, [isSupported]);

  const handleRequestPermission = async () => {
    setError("");
    setSuccess(false);
    if (!isSupported) {
      setError(t("profile.pushUnsupportedDevice"));
      return;
    }

    setSubscribing(true);
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const registration = await registerPushServiceWorker();
        const key = getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(key);
        const subscription = await subscribeToPush(registration, convertedKey);

        const res = await saveSubscription(subscription.toJSON() as any);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess(true);
        }
      } else if (result === "denied") {
        setError(t("profile.notifDenied"));
      }
    } catch (err: any) {
      let msg = err?.message || t("profile.notifFailed");
      if (msg.includes("Registration failed - push service error") || msg.includes("push service error")) {
        msg = t("profile.pushServiceError");
      }
      setError(msg);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <SlidePanel title={t("profile.notifTitle")} onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
        <div style={{ padding: "0 16px" }}>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: `${ACCENT}15`, border: `1px solid ${ACCENT}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={24} color={ACCENT} className={subscribing ? "animate-bounce" : ""} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t("profile.notifDescription")}</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>
                {t("profile.notifBody")}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 text-emerald-500 text-sm font-semibold text-center bg-emerald-500/10 py-2.5 px-4 rounded-xl border border-emerald-500/20">
            {t("profile.notifSuccessful")}
          </div>
        )}

        <div style={{ padding: "0 16px" }}>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "16px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600 }}>{t("profile.permissionStatus")}</span>
              <span style={{
                color: !isSupported ? "#ef4444" : permission === "granted" ? "#22c55e" : permission === "denied" ? "#ef4444" : ACCENT,
                fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginLeft: "auto",
              }}>
                {!isSupported ? t("profile.unsupported") : permission === "granted" ? t("profile.permissionGranted") : permission === "denied" ? t("profile.permissionDenied") : t("profile.permissionDefault")}
              </span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{t("profile.notificationChannels")}</span>
              <ul style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, paddingLeft: "16px", listStyleType: "disc", display: "flex", flexDirection: "column", gap: 6 }}>
                <li>{t("profile.channel1")}</li>
                <li>{t("profile.channel2")}</li>
                <li>{t("profile.channel3")}</li>
                <li>{t("profile.channel4")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={subscribing || !isSupported}
            style={{
              width: "100%",
              background: isSupported ? ACCENT : "rgba(255,255,255,0.05)",
              border: isSupported ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              color: isSupported ? "#000" : "rgba(255,255,255,0.3)",
              fontWeight: 700,
              fontSize: 15,
              padding: "13px 0",
              cursor: isSupported ? "pointer" : "not-allowed",
              display: permission === "granted" ? "none" : "flex",
              alignItems: "center" as const,
              justifyContent: "center" as const,
              gap: 8,
            }}
          >
            {subscribing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSupported ? (
              t("profile.enablePushAlerts")
            ) : (
              t("profile.pushUnsupported")
            )}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}
