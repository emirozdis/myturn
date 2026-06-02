"use client";

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Btn, FadeSlide } from "../ui";
import type { GoFn } from "../types";

export function PermGallery({
  go,
  galleryGranted,
  setGalleryGranted,
}: {
  go: GoFn;
  galleryGranted: boolean;
  setGalleryGranted: Dispatch<SetStateAction<boolean>>;
}) {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Fallback to reset requesting state if the user cancels the file dialog 
  // without triggering the onCancel event (which happens on some older mobile browsers)
  useEffect(() => {
    const handleFocus = () => {
      if (requesting) {
        setTimeout(() => setRequesting(false), 300);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [requesting]);

  const request = () => {
    setRequesting(true);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setRequesting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequesting(false);
    if (e.target.files && e.target.files.length > 0) {
      // On the web, selecting a file validates access to the native gallery/picker
      setGalleryGranted(true);
    }
  };

  const handleCancel = () => {
    setRequesting(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 48 }}>
      {/* Hidden input to trigger native gallery/file picker */}
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        onCancel={handleCancel}
      />

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
            <AppIcon icon={ImageIcon} size={48} color="rgba(255,255,255,0.35)" />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Gallery access needed</div>
          </div>
          {galleryGranted && (
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
                <div style={{ fontSize: 13, color: "rgba(52,199,89,0.8)", marginTop: 8 }}>Gallery ready</div>
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
            Share past
            <br />
            moments.
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            Allow gallery access to upload videos you've already taken today.
          </div>
        </div>
      </FadeSlide>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <FadeSlide show={show} delay={300}>
          {galleryGranted ? (
            <Btn onClick={() => go(1)}>Continue →</Btn>
          ) : (
            <Btn onClick={request} disabled={requesting}>
              {requesting ? "Requesting…" : "Allow gallery access"}
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