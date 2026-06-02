"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Btn, FadeSlide } from "../ui";
import type { FlowType, GoFn, StepName } from "../types";

export function Welcome({
  go,
  goTo,
  setFlowType,
}: {
  go: GoFn;
  goTo: (name: StepName) => void;
  setFlowType: Dispatch<SetStateAction<FlowType>>;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 48 }}>
      <FadeSlide show={show} delay={0}>
        <div style={{ marginBottom: 48 }}>
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
            Welcome
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              letterSpacing: "-1.2px",
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Your circle,
            <br />
            your story.
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, letterSpacing: "-0.1px" }}>
            A new way to stay close with the people who matter — one day at a time.
          </div>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={180}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <Btn
            onClick={() => {
              setFlowType("new");
              go(1);
            }}
            variant="primary"
          >
            Create an account
          </Btn>
          <Btn
            onClick={() => {
              setFlowType("login");
              goTo("setup_name");
            }}
            variant="ghost"
          >
            I already have an account
          </Btn>
        </div>
      </FadeSlide>

      <FadeSlide show={show} delay={320}>
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <span style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer" }}>
            Terms
          </span>
          {" & "}
          <span style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer" }}>
            Privacy Policy
          </span>
        </div>
      </FadeSlide>
    </div>
  );
}
