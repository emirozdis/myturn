"use client";

import { useState, useEffect } from "react";
import { Video } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide } from "../ui";
import { ease } from "../utils";
import type { GoFn } from "../types";

export function Splash({ go }: { go: GoFn }) {
  const [show, setShow] = useState(false);
  const [logoScale, setLogoScale] = useState(0.6);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 100);
    const t2 = setTimeout(() => setLogoScale(1), 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 28,
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          transition: `transform 0.7s ${ease.spring}, opacity 0.5s ease`,
          transform: `scale(${logoScale})`,
          opacity: show ? 1 : 0,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <AppIcon icon={Video} size={44} color="#fff" />
      </div>

      <FadeSlide show={show} delay={200}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
            }}
          >
            dayroll
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={400}>
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            letterSpacing: "-0.1px",
            marginBottom: 72,
          }}
        >
          one life, once a day
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={700}>
        <div style={{ width: "100%" }}>
          <Btn onClick={() => go(1)}>Get started</Btn>
        </div>
      </FadeSlide>
    </div>
  );
}
