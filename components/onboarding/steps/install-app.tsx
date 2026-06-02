"use client";

import { useState, useEffect } from "react";
import {
  getPwaPlatform,
  isStandaloneMode,
  listenForAppInstalled,
  listenForInstallPrompt,
  promptPwaInstall,
  type BeforeInstallPromptEvent,
  type PwaPlatform,
} from "@/lib/pwa-install";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide } from "../ui";
import { ease } from "../utils";
import type { GoFn } from "../types";

function PwaInstallSteps({ platform }: { platform: PwaPlatform }) {
  const steps =
    platform === "ios"
      ? [
          { n: 1, text: 'Tap the Share button at the bottom of Safari' },
          { n: 2, text: 'Scroll down and tap "Add to Home Screen"' },
          { n: 3, text: 'Tap "Add" — dayroll will appear on your home screen' },
        ]
      : platform === "android"
        ? [
            { n: 1, text: 'Tap the menu (⋮) in Chrome' },
            { n: 2, text: 'Tap "Install app" or "Add to Home screen"' },
            { n: 3, text: "Confirm — you'll open dayroll from your home screen" },
          ]
        : [
            { n: 1, text: 'Click the install icon in the address bar, or use the button below' },
            { n: 2, text: 'Choose "Install" in the browser prompt' },
            { n: 3, text: "Launch dayroll from your dock or start menu" },
          ];

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 28,
      }}
    >
      {steps.map((item, i) => (
        <div
          key={item.n}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "10px 0",
            borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {item.n}
          </span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

export function InstallApp({ go, isStandalone }: { go: GoFn; isStandalone: boolean }) {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [platform, setPlatform] = useState<PwaPlatform>("unknown");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setPlatform(getPwaPlatform());
    const offPrompt = listenForInstallPrompt((event) => {
      setInstallPrompt(event);
      setInstallError(null);
    });
    const offInstalled = listenForAppInstalled(() => setInstallPrompt(null));
    return () => {
      offPrompt();
      offInstalled();
    };
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    const t = setTimeout(() => go(1), 600);
    return () => clearTimeout(t);
  }, [isStandalone, go]);

  const requestInstall = async () => {
    setInstallError(null);
    if (isStandaloneMode()) return;
    if (!installPrompt) {
      setInstallError(
        platform === "ios"
          ? "Follow the steps below to add dayroll from Safari's Share menu."
          : "Use the steps below, or look for Install in your browser menu."
      );
      return;
    }
    setInstalling(true);
    try {
      await promptPwaInstall(installPrompt);
      setInstallPrompt(null);
    } catch {
      setInstallError("Install was cancelled. Try again or use the steps below.");
    } finally {
      setInstalling(false);
    }
  };

  const canOneTapInstall = Boolean(installPrompt) && !isStandalone;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 48 }}>
      <FadeSlide show={show} delay={0}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192x192.png"
              alt="dayroll app icon"
              width={90}
              height={90}
              style={{
                borderRadius: 24,
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                transition: `transform 0.4s ${ease.spring}`,
                transform: isStandalone ? "scale(0.9)" : "scale(1)",
              }}
            />
            {isStandalone && (
              <div
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: -6,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#34c759",
                  border: "3px solid #0d0d0d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon icon={Check} size={16} color="#fff" />
              </div>
            )}
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={100}>
        <div style={{ marginBottom: 24 }}>
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
            Install app
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
            {isStandalone ? "You're all set." : "Add dayroll\nto your home screen."}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {isStandalone
              ? "dayroll is installed and opens like a native app — including push notifications on iPhone."
              : "Install the PWA for one-tap access, no browser bar, and reliable notifications (especially on iPhone)."}
          </div>
        </div>
      </FadeSlide>

      {!isStandalone && (
        <FadeSlide show={show} delay={180}>
          <PwaInstallSteps platform={platform} />
        </FadeSlide>
      )}

      {isStandalone && (
        <FadeSlide show={show} delay={220}>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 18,
              background: "rgba(52,199,89,0.08)",
              border: "1px solid rgba(52,199,89,0.2)",
              marginBottom: 28,
              fontSize: 14,
              color: "rgba(180,255,200,0.85)",
              lineHeight: 1.5,
            }}
          >
            dayroll is on your home screen. Open it from the icon for the full experience.
          </div>
        </FadeSlide>
      )}

      {installError && !isStandalone && (
        <FadeSlide show delay={0}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(255,199,0,0.08)",
              border: "1px solid rgba(255,199,0,0.15)",
              marginBottom: 16,
              fontSize: 13,
              color: "rgba(255,199,0,0.85)",
              lineHeight: 1.5,
            }}
          >
            {installError}
          </div>
        </FadeSlide>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <FadeSlide show={show} delay={380}>
          {isStandalone ? (
            <Btn onClick={() => go(1)}>Continue →</Btn>
          ) : canOneTapInstall ? (
            <Btn onClick={requestInstall} disabled={installing}>
              {installing ? "Installing…" : "Install dayroll"}
            </Btn>
          ) : (
            <Btn onClick={requestInstall} disabled={installing}>
              {installing ? "Installing…" : "Install dayroll"}
            </Btn>
          )}
        </FadeSlide>
        {!isStandalone && (
          <FadeSlide show={show} delay={460}>
            <Btn onClick={() => go(1)} variant="text">
              Maybe later
            </Btn>
          </FadeSlide>
        )}
      </div>
    </div>
  );
}
