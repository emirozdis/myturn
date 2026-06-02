"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide } from "../ui";
import type { GoFn } from "../types";
import { requestMediaAccess, stopMediaStream } from "@/lib/media-permissions";

export function PermCamera({
  go,
  cameraGranted,
  setCameraGranted,
}: {
  go: GoFn;
  cameraGranted: boolean;
  setCameraGranted: Dispatch<SetStateAction<boolean>>;
}) {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  const request = async () => {
    setRequesting(true);
    setError(null);
    const result = await requestMediaAccess();
    if (result.ok) {
      stopMediaStream(result.stream);
      setCameraGranted(true);
    } else {
      setError(result.message ?? "Could not access camera and microphone.");
    }
    setRequesting(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 48 }}>
      <FadeSlide show={show} delay={0}>
        <div
          style={{
            height: 200,
            borderRadius: 24,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {[
            { top: 16, left: 16 },
            { top: 16, right: 16 },
            { bottom: 16, left: 16 },
            { bottom: 16, right: 16 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 20,
                height: 20,
                borderTop: i < 2 ? "2px solid rgba(255,255,255,0.3)" : "none",
                borderBottom: i >= 2 ? "2px solid rgba(255,255,255,0.3)" : "none",
                borderLeft: i % 2 === 0 ? "2px solid rgba(255,255,255,0.3)" : "none",
                borderRight: i % 2 === 1 ? "2px solid rgba(255,255,255,0.3)" : "none",
                ...pos,
              }}
            />
          ))}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <AppIcon icon={Camera} size={48} color="rgba(255,255,255,0.35)" />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Camera access needed</div>
          </div>
          {cameraGranted && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(52,199,89,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <AppIcon icon={CheckCircle2} size={48} color="rgba(52,199,89,0.9)" />
                <div style={{ fontSize: 13, color: "rgba(52,199,89,0.8)", marginTop: 8 }}>Camera ready</div>
              </div>
            </div>
          )}
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={100}>
        <div style={{ marginBottom: 32 }}>
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
            Record your day
            <br />
            on the fly.
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            Camera and microphone access lets you capture moments instantly. No editing, no pressure.
          </div>
        </div>
      </FadeSlide>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <FadeSlide show={show} delay={300}>
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(255,59,48,0.12)",
                border: "1px solid rgba(255,59,48,0.25)",
                fontSize: 14,
                color: "rgba(255,120,110,0.95)",
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}
          {cameraGranted ? (
            <Btn onClick={() => go(1)}>Continue →</Btn>
          ) : (
            <Btn onClick={request} disabled={requesting}>
              {requesting ? "Requesting…" : "Allow camera & mic"}
            </Btn>
          )}
        </FadeSlide>
        <FadeSlide show={show} delay={380}>
          <Btn onClick={() => go(1)} variant="text">
            Skip for now
          </Btn>
        </FadeSlide>
      </div>
    </div>
  );
}
