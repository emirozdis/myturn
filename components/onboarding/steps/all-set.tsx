"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide } from "../ui";
import { ease } from "../utils";

export function AllSet({ name, onEnterApp }: { name: string; onEnterApp?: () => void }) {
  const [show, setShow] = useState(false);
  const [checkScale, setCheckScale] = useState(0);
  const displayName = name || "there";

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 80);
    const t2 = setTimeout(() => setCheckScale(1), 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          background: "rgba(52,199,89,0.12)",
          border: "1px solid rgba(52,199,89,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
          transition: `transform 0.65s ${ease.spring}`,
          transform: `scale(${checkScale})`,
        }}
      >
        <AppIcon icon={CheckCircle2} size={48} color="rgba(52,199,89,0.95)" />
      </div>

      <FadeSlide show={show} delay={200}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              letterSpacing: "-1.3px",
              lineHeight: 1.05,
              marginBottom: 8,
            }}
          >
            You're all set,
            <br />
            {displayName}! 👋
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={320}>
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
            maxWidth: 280,
            marginBottom: 48,
          }}
        >
          Your account is ready. Now invite your people and start your first rotation.
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={480}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <Btn onClick={onEnterApp} variant="primary">
            Enter dayroll
          </Btn>
          <Btn onClick={onEnterApp} variant="ghost">
            Invite friends first
          </Btn>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={600}>
        <div style={{ marginTop: 32, fontSize: 13, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
          Your first daily assignment will land
          <br />
          tomorrow morning at 9:00 AM.
        </div>
      </FadeSlide>
    </div>
  );
}
