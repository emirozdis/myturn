"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Link2, Sparkles } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide } from "../ui";
import { ease } from "../utils";
import type { FlowType, GoFn } from "../types";

export function CreateOrJoin({ go }: { go: GoFn; flowType: FlowType }) {
  const [show, setShow] = useState(false);
  const [choice, setChoice] = useState<"create" | "join" | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  const ChoiceCard = ({
    id,
    icon,
    title,
    desc,
  }: {
    id: "create" | "join";
    icon: ReactNode;
    title: string;
    desc: string;
  }) => {
    const active = choice === id;
    const [pressed, setPressed] = useState(false);
    return (
      <div
        onClick={() => setChoice(id)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{
          padding: "20px",
          borderRadius: 20,
          border: active ? "1.5px solid rgba(255,255,255,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
          background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
          cursor: "pointer",
          transition: `all 0.25s ${ease.spring}`,
          transform: pressed ? "scale(0.97)" : "scale(1)",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 15,
              background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s ease",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "-0.2px", marginBottom: 3 }}>
              {title}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{desc}</div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: active ? "#fff" : "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            {active && <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff" }} />}
          </div>
        </div>
      </div>
    );
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
            Step 1 of 3
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
            Start or join
            <br />
            a group?
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={150}>
        <div style={{ flex: 1 }}>
          <ChoiceCard
            id="create"
            icon={<AppIcon icon={Sparkles} size={24} color="rgba(255,255,255,0.9)" />}
            title="Create a group"
            desc="Invite your people and set the rotation."
          />
          <ChoiceCard
            id="join"
            icon={<AppIcon icon={Link2} size={24} color="rgba(255,255,255,0.9)" />}
            title="Join with a code"
            desc="Someone sent you a link or code."
          />
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={350}>
        <Btn onClick={() => go(1)} disabled={!choice}>
          Continue →
        </Btn>
      </FadeSlide>
    </div>
  );
}
