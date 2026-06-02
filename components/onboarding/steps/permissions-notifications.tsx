"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  getVapidPublicKey,
  registerPushServiceWorker,
  subscribeToPush,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import { Bell, Eye, Zap } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide, PermRow } from "../ui";
import { sendTestNotification } from "../utils";
import type { GoFn } from "../types";

export function PermNotifications({
  go,
  notifGranted,
  setNotifGranted,
  name,
}: {
  go: GoFn;
  notifGranted: boolean;
  setNotifGranted: Dispatch<SetStateAction<boolean>>;
  name: string;
}) {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setNotifGranted(true);
    }
  }, [setNotifGranted]);

  const request = async () => {
    setRequesting(true);
    setNotifError(null);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifError("Notifications are not supported in this browser.");
      setRequesting(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotifGranted(true);

        if ("serviceWorker" in navigator && "PushManager" in window) {
          if (!window.isSecureContext) {
            setNotifError(
              "Web push only works on HTTPS or http://localhost — not on a network IP like 192.168.x.x. Open http://localhost:3000 to enable push."
            );
          } else {
            try {
              const readyRegistration = await registerPushServiceWorker();
              const applicationServerKey = urlBase64ToUint8Array(getVapidPublicKey());
              const subscription = await subscribeToPush(readyRegistration, applicationServerKey);
              const token = subscription.toJSON();

              const res = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username: name || "Anonymous",
                  token,
                }),
              });

              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                  typeof data.error === "string" ? data.error : "Could not save push subscription on the server."
                );
              }
            } catch (err) {
              console.error("Service Worker/Push subscription failed:", err);
              const message = err instanceof Error ? err.message : "Push subscription failed";
              setNotifError(
                message.includes("push service")
                  ? "Could not register with the browser push service. Use Chrome/Safari on localhost, check notification permissions, and try again."
                  : message
              );
            }
          }
        }

        sendTestNotification();
        setTestSent(true);
      } else if (permission === "denied") {
        setNotifError("Notifications were blocked. You can enable them in your browser settings.");
      } else {
        setNotifError("Notification permission was not granted.");
      }
    } catch {
      setNotifError("Could not request notification permission.");
    } finally {
      setRequesting(false);
    }
  };

  const sendTest = () => {
    if (sendTestNotification()) {
      setTestSent(true);
      setNotifError(null);
    } else {
      setNotifError("Allow notifications first, then try the test again.");
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 48 }}>
      <FadeSlide show={show} delay={0}>
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Permissions
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              letterSpacing: "-1.1px",
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            Never miss
            <br />
            your turn.
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            We'll notify you when it's your day to vlog — and when someone in your group posts.
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={150}>
        <div style={{ marginBottom: 28 }}>
          <PermRow
            icon={<AppIcon icon={Bell} size={22} color="rgba(255,255,255,0.85)" />}
            title="Push notifications"
            desc='"Today is your turn 🎥" — daily assignment alerts'
            granted={notifGranted}
          />
          <PermRow
            icon={<AppIcon icon={Eye} size={22} color="rgba(255,255,255,0.85)" />}
            title="Group activity"
            desc="Know when your group members start vlogging"
            granted={notifGranted}
          />
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={300}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: "rgba(255,199,0,0.08)",
            border: "1px solid rgba(255,199,0,0.15)",
            marginBottom: 24,
            fontSize: 13,
            color: "rgba(255,199,0,0.7)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <AppIcon icon={Zap} size={14} color="rgba(255,199,0,0.85)" />
            Without notifications, you might miss your day and it&apos;ll skip to the next person.
          </span>
        </div>
      </FadeSlide>

      {notifError && (
        <FadeSlide show delay={0}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(255,59,48,0.08)",
              border: "1px solid rgba(255,59,48,0.2)",
              marginBottom: 16,
              fontSize: 13,
              color: "rgba(255,120,110,0.9)",
              lineHeight: 1.5,
            }}
          >
            {notifError}
          </div>
        </FadeSlide>
      )}

      {testSent && notifGranted && (
        <FadeSlide show delay={0}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(52,199,89,0.08)",
              border: "1px solid rgba(52,199,89,0.2)",
              marginBottom: 16,
              fontSize: 13,
              color: "rgba(52,199,89,0.9)",
              lineHeight: 1.5,
            }}
          >
            Test notification sent — check your system tray or lock screen.
          </div>
        </FadeSlide>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <FadeSlide show={show} delay={400}>
          {notifGranted ? (
            <>
              <Btn onClick={sendTest} variant="ghost">
                Send test notification
              </Btn>
              <Btn onClick={() => go(1)}>Continue →</Btn>
            </>
          ) : (
            <Btn onClick={request} disabled={requesting}>
              {requesting ? "Requesting…" : "Allow notifications"}
            </Btn>
          )}
        </FadeSlide>
        <FadeSlide show={show} delay={480}>
          <Btn onClick={() => go(1)} variant="text">
            Skip for now
          </Btn>
        </FadeSlide>
      </div>
    </div>
  );
}
