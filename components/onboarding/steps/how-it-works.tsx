"use client";

import { useState, useEffect } from "react";
import { Clapperboard, Dices, Eye, Users } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide, HowCard } from "../ui";
import type { GoFn } from "../types";

export function HowItWorks({ go }: { go: GoFn }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  const steps = [
    {
      icon: <AppIcon icon={Users} size={22} color="rgba(255,255,255,0.85)" />,
      title: "Join a group",
      desc: "Create or join a private circle — friends, roommates, family.",
    },
    {
      icon: <AppIcon icon={Dices} size={22} color="rgba(255,255,255,0.85)" />,
      title: "One person per day",
      desc: "Each morning, someone in your group is chosen as the day's vlogger.",
    },
    {
      icon: <AppIcon icon={Clapperboard} size={22} color="rgba(255,255,255,0.85)" />,
      title: "Record your day",
      desc: "Capture short clips throughout the day. No editing required.",
    },
    {
      icon: <AppIcon icon={Eye} size={22} color="rgba(255,255,255,0.85)" />,
      title: "Everyone watches",
      desc: "Your group sees your day as it unfolds — real life, unfiltered.",
    },
  ];

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
            How it works
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              letterSpacing: "-1.1px",
              lineHeight: 1.1,
            }}
          >
            Simple by design.
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={100}>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "8px 20px",
            marginBottom: 32,
            flex: 1,
          }}
        >
          {steps.map((s, i) => (
            <HowCard key={i} num={i + 1} icon={s.icon} title={s.title} desc={s.desc} delay={200 + i * 100} />
          ))}
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={700}>
        <Btn onClick={() => go(1)}>Sounds good →</Btn>
      </FadeSlide>
    </div>
  );
}
