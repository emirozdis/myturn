"use client";

import { motion, AnimatePresence } from "framer-motion";
import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";
import { BACKGROUND_VIDEOS, ORBIT_RADIUS } from "./constants";

export type Phase = "idle" | "spinning" | "picked" | "video_playing";

export interface OrbitalMember {
  id: string;
  name: string;
  image: string;
}

export interface HeroOrbitalSpinnerProps {
  animationPhase: Phase;
  finalMembers: OrbitalMember[];
  winnerId: string;
  avatarPositions: { x: number; y: number; scale: number; opacity: number }[];
  orbitAngle: number;
  highlightedIndex: number;
  angleStep: number;
  activeIdx: number;
  desktopVideoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  mobileVideoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  onSpinClick: () => void;
}

function shineBorderStyle(
  isWinner: boolean,
  isHighlighted: boolean
): React.CSSProperties {
  if (isWinner) {
    return {
      background:
        "conic-gradient(from 200deg, #ffb87a 0deg, #e07c30 60deg, #b85c1a 120deg, #7a3a08 180deg, #b85c1a 240deg, #e07c30 300deg, #ffb87a 360deg)",
      padding: "2.5px",
      borderRadius: "50%",
      boxShadow:
        "0 0 0 1px rgba(0,0,0,0.65), 0 0 32px rgba(224,124,48,0.6), 0 0 72px rgba(224,124,48,0.22), inset 0 1px 0 rgba(255,255,255,0.4)",
    };
  }
  if (isHighlighted) {
    return {
      background:
        "conic-gradient(from 200deg, rgba(255,200,120,0.95) 0deg, rgba(224,124,48,0.85) 60deg, rgba(150,80,20,0.7) 130deg, rgba(60,30,5,0.55) 190deg, rgba(150,80,20,0.7) 250deg, rgba(224,124,48,0.85) 310deg, rgba(255,200,120,0.95) 360deg)",
      padding: "2px",
      borderRadius: "50%",
      boxShadow:
        "0 0 0 1px rgba(0,0,0,0.5), 0 0 18px rgba(224,124,48,0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
    };
  }
  return {
    background:
      "conic-gradient(from 200deg, rgba(255,255,255,0.32) 0deg, rgba(255,255,255,0.12) 70deg, rgba(0,0,0,0.20) 140deg, rgba(0,0,0,0.38) 200deg, rgba(0,0,0,0.20) 265deg, rgba(255,255,255,0.16) 310deg, rgba(255,255,255,0.32) 360deg)",
    padding: "1.5px",
    borderRadius: "50%",
    boxShadow:
      "0 0 0 1px rgba(0,0,0,0.52), 0 6px 22px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.16)",
  };
}

function avatarTransition(phase: Phase): any {
  if (phase === "idle")
    return { type: "spring", stiffness: 22, damping: 9 };
  if (phase === "picked")
    return { type: "spring", stiffness: 100, damping: 15 };
  if (phase === "video_playing") {
    return {
      scale: { type: "spring", stiffness: 80, damping: 20 },
      opacity: { type: "tween", ease: "easeInOut", duration: 0.5 },
      x: { type: "spring", stiffness: 80, damping: 20 },
      y: { type: "spring", stiffness: 80, damping: 20 },
    };
  }
  return { type: "spring", stiffness: 70, damping: 12 };
}

export function HeroOrbitalSpinner({
  animationPhase,
  finalMembers,
  winnerId,
  avatarPositions,
  orbitAngle,
  highlightedIndex,
  angleStep,
  activeIdx,
  desktopVideoRefs,
  mobileVideoRefs,
  onSpinClick,
}: HeroOrbitalSpinnerProps) {
  const isSpinning = animationPhase === "spinning";
  const count = finalMembers.length;
  const itemTransition = avatarTransition(animationPhase);

  return (
    <div
      className={`origin-center relative flex flex-col items-center transition-all duration-500 ${
        animationPhase === "video_playing"
          ? "w-full h-full scale-100 px-6"
          : "scale-[0.7] min-[400px]:scale-[0.82] sm:scale-100 w-[400px] h-[580px]"
      }`}
    >
      {/* Mobile Video Card Component */}
      <AnimatePresence>
        {animationPhase === "video_playing" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 lg:hidden flex flex-col items-center justify-center z-10 pt-24 pb-8"
          >
            <div className="flex-1 relative flex items-center justify-center w-full min-h-0 pt-4">
              <div className="relative w-full h-full flex items-center justify-center">
                <div
                  className="relative w-full max-w-[400px] aspect-[3/4] rounded-[28px] overflow-hidden flex flex-col p-3 shadow-2xl mx-auto"
                  style={glassStyle(0.04, 24, 0.1)}
                >
                  <div className="flex items-center gap-2 px-2 pb-2.5 pt-1">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs">🏠</div>
                    <span className="text-white text-sm font-bold truncate">The Apartment</span>
                  </div>
                  <div className="relative flex-1 rounded-[20px] overflow-hidden bg-black/40 border border-white/5">
                    {BACKGROUND_VIDEOS.map((src, idx) => (
                      <motion.div
                        key={src}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: activeIdx === idx ? 1 : 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <video
                          ref={(el) => {
                            mobileVideoRefs.current[idx] = el;
                          }}
                          src={src}
                          muted
                          playsInline
                          loop
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex gap-1.5 z-10">
                      {["😮", "😂", "❤️"].map((e, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xs border border-white/10">{e}</div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2.5 mt-2.5 h-[48px] flex-shrink-0">
                    <div className="flex-1 rounded-[16px] px-2.5 py-2 flex items-center gap-2.5 overflow-hidden" style={glassStyle(0.04, 12, 0.1)}>
                      <img src="/profile.jpg" className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt="" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-[11px] font-bold truncate">Emir</span>
                        <span className="text-[#e07c30] text-[9px] truncate">3 day streak</span>
                      </div>
                    </div>
                    <div className="flex-1 rounded-[16px] px-2.5 py-2 flex flex-col justify-center items-center" style={glassStyle(0.04, 12, 0.1)}>
                      <span className="text-white font-bold text-xs tracking-widest">08:44:05</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dotted Orbit and Wheel (Pre-revealed stages) */}
      <AnimatePresence>
        {(animationPhase === "idle" || animationPhase === "spinning") && (
          <motion.div
            key="reveal-wheel-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(15px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" as const }}
            className="absolute inset-0 w-[400px] h-[400px]"
          >
            {/* Dotted orbit ring */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
              <circle
                cx="200"
                cy="200"
                r={ORBIT_RADIUS}
                fill="none"
                stroke="#e07c30"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                opacity="0.5"
              />
              {isSpinning &&
                finalMembers.map((_, i) => (
                  <circle
                    key={`trail-${i}`}
                    cx="200"
                    cy="200"
                    r={ORBIT_RADIUS}
                    fill="none"
                    stroke="#e07c30"
                    strokeWidth="2.5"
                    strokeDasharray="30 1000"
                    strokeLinecap="round"
                    style={{
                      transform: `rotate(${i * angleStep + 90 + orbitAngle}deg)`,
                      transformOrigin: "200px 200px",
                      willChange: "transform",
                      opacity: 0.9,
                    }}
                  />
                ))}
            </svg>

            {/* Triangle pointer */}
            <div
              className="absolute z-20 left-1/2 -translate-x-1/2"
              style={{
                top: "50%",
                marginTop: 116,
              }}
            >
              <svg width="16" height="14" viewBox="0 0 14 12" fill="none">
                <path d="M0 0H14L7 12L0 0Z" fill="#e07c30" />
              </svg>
            </div>

            {/* Center '?' reveal button */}
            {animationPhase === "idle" && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <button
                  onClick={onSpinClick}
                  className="w-[130px] h-[130px] rounded-full flex items-center justify-center text-[#e07c30] font-bold text-[64px] hover:bg-[#e07c30]/10 transition-colors shadow-[0_0_40px_rgba(224,124,48,0.15)] border-solid cursor-pointer"
                  style={{
                    ...glassStyle(0.06, 20, 0.15),
                    borderWidth: "3px",
                    borderColor: "#e07c30",
                  }}
                >
                  ?
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatars rendering layer */}
      {finalMembers.map((member, i) => {
        const isWinner = member.id === winnerId;

        let zIndexValue = 10;

        let rawX: number, rawY: number, currentScale: number, currentOpacity: number;

        if (isSpinning) {
          const a =
            (i * angleStep + 90) * (Math.PI / 180) +
            (orbitAngle * Math.PI) / 180;
          const isHi = highlightedIndex === i;
          rawX = Math.cos(a) * ORBIT_RADIUS;
          rawY = Math.sin(a) * ORBIT_RADIUS;
          currentScale = isHi ? 1.15 : 1.0;
          currentOpacity = isHi ? 1 : 0.6;
          zIndexValue = isHi ? 15 : zIndexValue;
        } else {
          const pos = avatarPositions[i] ?? { x: 0, y: 0, scale: 1.0, opacity: 0.85 };
          rawX = pos.x;
          rawY = pos.y;
          currentScale = pos.scale;
          currentOpacity = pos.opacity;
          if ((animationPhase === "picked" || animationPhase === "video_playing") && isWinner) {
            zIndexValue = 30;
          }
        }

        const canvasX = rawX;
        const canvasY = rawY;

        const getShineStyle = (): React.CSSProperties => {
          if (isSpinning) return shineBorderStyle(false, highlightedIndex === i);
          if (isWinner && (animationPhase === "picked" || animationPhase === "video_playing")) {
            return shineBorderStyle(true, false);
          }
          return shineBorderStyle(false, false);
        };

        let nativeSize = 100;
        if (isSpinning && highlightedIndex === i) {
          nativeSize = 115;
        } else if ((animationPhase === "picked" || animationPhase === "video_playing") && isWinner) {
          nativeSize = 130;
        }

        return (
          <motion.div
            key={`member-${member.id}`}
            initial={{
              x: canvasX,
              y: canvasY,
              scale: currentScale,
              opacity: currentOpacity,
            }}
            animate={{
              x: canvasX,
              y: canvasY,
              scale: currentScale,
              opacity: currentOpacity,
            }}
            transition={
              (isSpinning
                ? {
                    x: { duration: 0 },
                    y: { duration: 0 },
                    scale: { duration: 0.05, ease: "linear" },
                    opacity: { duration: 0.1, ease: "easeOut" },
                  }
                : itemTransition) as any
            }
            style={{
              position: "absolute",
              left: "50%",
              top: "200px",
              translateX: "-50%",
              translateY: "-50%",
              zIndex: zIndexValue,
              borderRadius: "50%",
              willChange: "transform, opacity",
            }}
          >
            <div style={getShineStyle()}>
              <div className="rounded-full overflow-hidden bg-neutral-900">
                <Avatar src={member.image} name={member.name} size={nativeSize} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
