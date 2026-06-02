"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Lock } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide, Input } from "../ui";
import type { FlowType, GoFn } from "../types";

export function SetupName({
  go,
  name,
  setName,
  groupCode,
  setGroupCode,
  flowType,
}: {
  go: GoFn;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  groupCode: string;
  setGroupCode: Dispatch<SetStateAction<string>>;
  flowType: FlowType;
}) {
  const [show, setShow] = useState(false);
  const isLogin = flowType === "login";
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

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
            {isLogin ? "Sign in" : "Step 2 of 3"}
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
            {isLogin ? "Welcome back." : "What should we\ncall you?"}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {isLogin
              ? "Enter your username and group code to rejoin your circle."
              : "This is how you'll appear to your group members."}
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={150}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "-0.1px" }}>
              {isLogin ? "Username" : "Your name"}
            </div>
            <Input placeholder={isLogin ? "e.g. emir_k" : "e.g. Emir"} value={name} onChange={setName} />
          </div>

          {isLogin && (
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "-0.1px" }}>
                Group code
              </div>
              <Input placeholder="Paste your invite code" value={groupCode} onChange={setGroupCode} />
            </div>
          )}

          {!isLogin && (
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "-0.1px" }}>
                Phone number (optional)
              </div>
              <Input placeholder="+1 (555) 000-0000" value="" onChange={() => {}} type="tel" />
            </div>
          )}
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={80}>
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 28,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <AppIcon icon={Lock} size={18} color="rgba(255,255,255,0.45)" />
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
            Your data stays private within your group. We never sell your information or show ads.
          </div>
        </div>
      </FadeSlide>

      <div style={{ marginTop: "auto" }}>
        <FadeSlide show={show} delay={300}>
          <Btn onClick={() => go(1)} disabled={name.trim().length < 2}>
            {isLogin ? "Sign in →" : "Continue →"}
          </Btn>
        </FadeSlide>
      </div>
    </div>
  );
}
