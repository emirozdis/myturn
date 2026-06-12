"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, ChevronLeft, Share } from "lucide-react";
import { getGroupDetails } from "@/actions/group";
import { Avatar } from "@/components/shared/avatar";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";

interface VloggerRevealModalProps {
  groupId: string;
  assignment: any;
  onClose: () => void;
}

type Phase = "idle" | "spinning" | "syncing" | "converging" | "revealed";

const ORBIT_RADIUS = 160;

// The orbit canvas is 400×400 with centre at (200,200).
// The card sits BELOW the canvas, overlapping by CARD_OVERLAP px.
// Avatars use the canvas centre as their (0,0), so a positive y
// of (200 + CARD_OVERLAP + n) places them inside the card area.
const CARD_OVERLAP = 28; // how many px the mini-avatars dip into the card

export function VloggerRevealModal({
  groupId,
  assignment,
  onClose,
}: VloggerRevealModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [animationPhase, setPhase] = useState<Phase>("idle");
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [highlightedIndex, setHighlighted] = useState(-1);

  const [avatarPositions, setPositions] = useState<
    { x: number; y: number; scale: number; opacity: number }[]
  >([]);

  const [driftOffsets, setDriftOffsets] = useState<{ x: number; y: number }[]>([]);

  const orbitAngleRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const speedRef = useRef(0);

  const isSpinning = animationPhase === "spinning";

  const handleClose = () => {
    const dateStr = assignment?.date
      ? new Date(assignment.date).toISOString().split("T")[0]
      : "";
    localStorage.setItem(`revealed_vlogger_${groupId}_${dateStr}`, "true");
    onClose();
  };

  useEffect(() => {
    const fetch = async () => {
      const res = await getGroupDetails(groupId);
      if (res.success && res.group) {
        setGroupName(res.group.name);
        if (res.group.members) {
          setMembers(res.group.members.map((m: any) => m.user));
        }
      }
    };
    fetch();
  }, [groupId]);

  const finalMembers = useMemo(() => {
    return members.length > 0
      ? members
      : assignment?.user
      ? [assignment.user]
      : [{ id: "fallback", name: "User", image: null }];
  }, [members, assignment]);

  const count = finalMembers.length;
  const angleStep = 360 / count;

  useEffect(() => {
    if (count === 0) return;
    setPositions(
      Array.from({ length: count }).map((_, i) => {
        const a = ((i * angleStep + 90) * Math.PI) / 180;
        return {
          x: Math.cos(a) * ORBIT_RADIUS,
          y: Math.sin(a) * ORBIT_RADIUS,
          scale: 1.0, // 100% of base 100px size
          opacity: 0.85,
        };
      })
    );
    setDriftOffsets(Array.from({ length: count }).map(() => ({ x: 0, y: 0 })));
  }, [count, angleStep]);

  useEffect(() => {
    if (animationPhase !== "idle" || count === 0) return;
    const id = setInterval(() => {
      setDriftOffsets(
        Array.from({ length: count }).map(() => ({
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, [animationPhase, count]);

  useEffect(() => {
    if (animationPhase !== "idle" || count === 0) return;
    setPositions(
      Array.from({ length: count }).map((_, i) => {
        const a = ((i * angleStep + 90) * Math.PI) / 180;
        const drift = driftOffsets[i] || { x: 0, y: 0 };
        return {
          x: Math.cos(a) * ORBIT_RADIUS + drift.x,
          y: Math.sin(a) * ORBIT_RADIUS + drift.y,
          scale: 1.0, // 100% of base 100px size
          opacity: 0.85,
        };
      })
    );
  }, [driftOffsets, animationPhase, count, angleStep]);

  useEffect(() => {
    if (animationPhase !== "spinning" || count === 0) return;

    speedRef.current = 1.2;
    const MAX_SPEED = 18;
    const ACCEL = 1.08;
    const DECEL = 0.982;
    let accelerating = true;
    let accelFrames = 0;
    const ACCEL_FRAMES = 55;

    const tick = () => {
      if (accelerating) {
        speedRef.current = Math.min(speedRef.current * ACCEL, MAX_SPEED);
        accelFrames++;
        if (accelFrames >= ACCEL_FRAMES) accelerating = false;
      } else {
        speedRef.current *= DECEL;
      }

      orbitAngleRef.current += speedRef.current;
      setOrbitAngle(orbitAngleRef.current);

      const norm = ((-orbitAngleRef.current % 360) + 360) % 360;
      setHighlighted(Math.round(norm / angleStep) % count);

      if (speedRef.current > 0.25) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        const finalNorm = ((-orbitAngleRef.current % 360) + 360) % 360;
        const hl = Math.round(finalNorm / angleStep) % count;
        setPositions(
          Array.from({ length: count }).map((_, i) => {
            const a =
              (i * angleStep + 90) * (Math.PI / 180) +
              (orbitAngleRef.current * Math.PI) / 180;
            return {
              x: Math.cos(a) * ORBIT_RADIUS,
              y: Math.sin(a) * ORBIT_RADIUS,
              scale: hl === i ? 1.15 : 1.0,
              opacity: hl === i ? 1 : 0.6,
            };
          })
        );
        setPhase("syncing");
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animationPhase, angleStep, count]);

  useEffect(() => {
    if (animationPhase !== "syncing") return;
    const t = setTimeout(() => {
      setHighlighted(-1);
      setPhase("converging");
    }, 50);
    return () => clearTimeout(t);
  }, [animationPhase]);

  useEffect(() => {
    if (animationPhase !== "converging" || count === 0) return;
    setPositions(
      Array.from({ length: count }).map(() => ({
        x: 0,
        y: 0,
        scale: 0.15, // shrunk to 15px
        opacity: 0.8,
      }))
    );
    const t = setTimeout(() => setPhase("revealed"), 300);
    return () => clearTimeout(t);
  }, [animationPhase, count]);

  // ── Revealed positions ────────────────────────────────────────────────────
  // The orbit canvas is 400 tall; its centre is the (0,0) origin for avatars.
  // The card is rendered via absolute positioning, its top edge sitting at
  // y = 200 (bottom of canvas) - CARD_OVERLAP inside the shared container.
  // So to sit CARD_OVERLAP px inside the card we target y = 200 - CARD_OVERLAP/2.
  // Concretely: card top = canvas bottom - CARD_OVERLAP = 200 - 28 = ~172 from centre
  // We want mini avatars centred at ~card_top, so y ≈ 200 - CARD_OVERLAP = 172.
  const OTHER_Y = 200 - CARD_OVERLAP; // 172 — straddles the card top edge

  useEffect(() => {
    if (animationPhase !== "revealed") return;
    const winnerId = assignment?.user?.id;

    const realOthers = finalMembers.filter(
      (m) =>
        m.id !== winnerId &&
        !String(m.id).startsWith("duplicate-") &&
        !String(m.id).startsWith("fallback")
    );
    const othersCount = realOthers.length;
    const maxVisibleOthers = 3;

    let otherIndex = 0;

    setPositions(
      finalMembers.map((member) => {
        if (member.id === winnerId) {
          return { x: 0, y: -20, scale: 1.0, opacity: 1 }; // Scale 1.0 with a native 250px size
        }

        if (
          String(member.id).startsWith("duplicate-") ||
          String(member.id).startsWith("fallback")
        ) {
          return { x: 0, y: OTHER_Y, scale: 0, opacity: 0 };
        }

        const isVisibleOther = realOthers
          .slice(0, maxVisibleOthers)
          .some((o) => o.id === member.id);

        if (!isVisibleOther) {
          return { x: 0, y: OTHER_Y, scale: 0, opacity: 0 };
        }

        const offset =
          otherIndex - (Math.min(othersCount, maxVisibleOthers) - 1) / 2;
        otherIndex++;

        return {
          x: offset * 18 - 8,
          y: OTHER_Y,
          scale: 1.0, // Scale 1.0 with a native 45px size
          opacity: 0.9,
        };
      })
    );
  }, [animationPhase, assignment, finalMembers, OTHER_Y]);

  const avatarTransition = (phase: Phase) => {
    if (phase === "idle" || phase === "syncing")
      return { type: "spring" as const, stiffness: 22, damping: 9 };
    if (phase === "converging")
      return { type: "spring" as const, stiffness: 450, damping: 32 };
    if (phase === "revealed")
      return { type: "spring" as const, stiffness: 100, damping: 16 };
    return { type: "spring" as const, stiffness: 70, damping: 12 };
  };

  const baseGlass = glassStyle(0.08, 20, 0.15);
  const winnerId = assignment?.user?.id;
  const remainingOthers = Math.max(0, finalMembers.length - 4);

  // ── 3D shine border helpers ───────────────────────────────────────────────
  const shineBorderStyle = (
    isWinner: boolean,
    isHighlighted: boolean
  ): React.CSSProperties => {
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
  };

  // Monochromatic, shining glass-like effect for the mini-avatars
  const shineOtherBorderStyle = (): React.CSSProperties => ({
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.55) 100%)",
    padding: "2.5px",
    borderRadius: "50%",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.18), 0 8px 18px rgba(0,0,0,0.5), inset 0 1.5px 3px rgba(255,255,255,0.45)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  });

  // Card height constant so we can size the shared container correctly
  const CARD_H = 220;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none bg-[#0a0a0a]"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 100%)",
        }}
      />

      {/* ── Top Header Navigation (Revealed) ──────────────────────────────── */}
      <AnimatePresence>
        {animationPhase === "revealed" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute top-0 inset-x-0 px-6 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] flex items-center justify-between z-30"
          >
            <button
              onClick={handleClose}
              style={glassStyle(0.04, 16, 0.08)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/20 transition-all border border-white/5"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            <div className="flex flex-col items-center text-center">
              <span className="text-white text-[13px] font-extrabold tracking-tight flex items-center gap-1.5 leading-none">
                🏠 {groupName || "Love of the Game"}
              </span>
              <div className="flex items-center gap-1 mt-1 leading-none">
                <span className="w-1.5 h-1.5 bg-[#30D158] rounded-full" />
                <span className="text-white/50 text-[10px] font-medium">
                  {finalMembers.length} members
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: "MyTurn Vlog Reveal",
                      text: `${assignment.user?.name} is today's vlogger in ${
                        groupName || "our group"
                      }!`,
                      url: window.location.href,
                    })
                    .catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied!");
                }
              }}
              style={glassStyle(0.04, 16, 0.08)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/20 transition-all border border-white/5"
            >
              <Share size={16} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Close Button (Pre-reveal) ─────────────────────────────────── */}
      <AnimatePresence>
        {animationPhase === "idle" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="absolute right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{
              top: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
              ...glassStyle(0.04, 16, 0.08),
            }}
          >
            <X size={18} className="text-white/60" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-[420px] h-full flex flex-col items-center z-10 px-4 pt-12 pb-8 mb-6">

        {/* ── Header Area ───────────────────────────────────────────────────── */}
        <div className="relative w-full h-[220px] flex-shrink-0 mt-2 mb-2">
          <AnimatePresence>
            {animationPhase !== "revealed" ? (
              <motion.div
                key="header-picking"
                initial={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)", scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center z-20"
              >
                <div className="relative mb-5 mt-2">
                  <div className="absolute inset-0 bg-[#e07c30]/30 blur-2xl rounded-full" />
                  <img
                    src="/assets/icons/fire.png"
                    alt="Fire"
                    className="w-16 h-16 object-contain relative z-10 drop-shadow-[0_4px_16px_rgba(224,124,48,0.5)]"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  <Flame className="hidden w-12 h-12 text-[#e07c30] fill-[#e07c30] relative z-10" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <h1 className="font-bold text-[30px] sm:text-[34px] tracking-tight leading-tight flex items-center gap-2">
                    <span className="text-white">Who's vlogging</span>
                    <span className="text-[#e07c30]">today?</span>
                  </h1>
                  <p className="text-white/50 text-[14px] sm:text-[15px] font-medium leading-relaxed">
                    We pick one person at random each day.
                    <br />
                    Let's find out...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="header-revealed"
                initial={{ opacity: 0, y: 20, filter: "blur(8px)", scale: 0.95 }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center justify-start text-center z-20 pt-[84px]"
              >
                <div className="mb-4">
                  <span
                    style={glassStyle(0.04, 16, 0.08)}
                    className="px-4 py-1.5 rounded-full text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md"
                  >
                    🔥 TODAY'S VLOGGER
                  </span>
                </div>
                <h1 className="text-[38px] font-black text-white mb-1 leading-none tracking-tight drop-shadow-md">
                  {assignment.user?.name}
                </h1>
                <p className="text-white/60 font-semibold text-[14px] flex items-center justify-center gap-1">
                  @{assignment.user?.handle}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Shared canvas: orbit + card in one coordinate space ───────────
            The orbit div is 400×400; the card is absolutely positioned so its
            top edge overlaps the orbit div by CARD_OVERLAP px.
            Avatars are positioned relative to the orbit centre (200,200), so
            y = OTHER_Y (172) places them right at the card's top edge.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          className="relative w-full my-auto"
          style={{
            // Total height = orbit canvas (400) + card that extends below - overlap
            height: 400 + CARD_H - CARD_OVERLAP,
          }}
        >
          {/* Orbit canvas — absolutely centred horizontally */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0"
            style={{ width: 400, height: 400 }}
          >
            {/* Dotted orbit ring */}
            <AnimatePresence>
              {animationPhase !== "revealed" && (
                <motion.svg
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 400"
                >
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
                </motion.svg>
              )}
            </AnimatePresence>

            {/* Triangle pointer — downward, at orbit bottom */}
            <AnimatePresence>
              {(isSpinning ||
                animationPhase === "idle" ||
                animationPhase === "syncing" ||
                animationPhase === "converging") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                  transition={{ duration: 0.4 }}
                  className="absolute z-20 left-1/2 -translate-x-1/2"
                  style={{
                    top: "50%",
                    marginTop: 116,
                    willChange: "transform, opacity",
                  }}
                >
                  <svg width="16" height="14" viewBox="0 0 14 12" fill="none">
                    <path d="M0 0H14L7 12L0 0Z" fill="#e07c30" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center '?' reveal button (Idle) - Fixed wrapping to avoid Framer transform clash */}
            <AnimatePresence>
              {animationPhase === "idle" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                  <motion.button
                    key="reveal-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                    transition={{ duration: 0.4 }}
                    onClick={() => setPhase("spinning")}
                    className="w-[130px] h-[130px] rounded-full flex items-center justify-center text-[#e07c30] font-bold text-[64px] hover:bg-[#e07c30]/10 transition-colors shadow-[0_0_40px_rgba(224,124,48,0.15)] border-solid"
                    style={{
                      ...glassStyle(0.06, 20, 0.15),
                      borderWidth: "3px",
                      borderColor: "#e07c30",
                    }}
                  >
                    ?
                  </motion.button>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Card — Rendered BEFORE Avatars in DOM order to guarantee proper layering ── */}
          <AnimatePresence>
            {animationPhase === "revealed" && (
              <motion.div
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 22,
                  delay: 0.4,
                }}
                className="absolute inset-x-0 rounded-3xl p-6 pb-6 flex flex-col items-center text-center shadow-2xl"
                style={{
                  top: 400 - CARD_OVERLAP,
                  zIndex: 10, // Placed on base card layer
                  ...glassStyle(0.04, 20, 0.08),
                }}
              >
                <div className="text-3xl mb-2 mt-6">🎉</div>
                <h2 className="text-white text-[20px] font-bold mb-1.5 tracking-tight leading-none">
                  Ready for action!
                </h2>
                <p className="text-white/50 text-[13px] leading-relaxed max-w-[260px] mb-5">
                  Check back throughout the day to see all their captured moments.
                </p>
                <button
                  onClick={handleClose}
                  style={{ background: `${ACCENT}` }}
                  className="w-full py-3.5 rounded-[20px] text-black font-black text-[16px] active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  Awesome!
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Avatars — Rendered AFTER Card in DOM to guarantee they render on top ── */}
          {finalMembers.map((member, i) => {
            const isWinner = member.id === winnerId;
            const showWinnerState = isWinner && animationPhase === "revealed";
            const isRevealedOther = animationPhase === "revealed" && !isWinner;

            const offset = i - (count - 1) / 2;
            
            // Set Z-indexes explicitly higher than the card's base layer
            let zIndexValue = showWinnerState
              ? 60
              : animationPhase === "revealed"
              ? 50 - Math.abs(offset)
              : 10;

            const itemTransition = {
              ...(animationPhase === "revealed"
                ? {
                    type: "spring" as const,
                    stiffness: isWinner ? 90 : 110,
                    damping: isWinner ? 15 : 11,
                    mass: isWinner ? 1 : 0.7,
                    delay: isWinner ? 0.1 : Math.abs(offset) * 0.06,
                  }
                : avatarTransition(animationPhase)),
            };

            let rawX: number, rawY: number, currentScale: number, currentOpacity: number;

            if (isSpinning) {
              const a =
                (i * angleStep + 90) * (Math.PI / 180) +
                (orbitAngle * Math.PI) / 180;
              const isHi = highlightedIndex === i;
              const spd = Math.min(speedRef.current / 16, 1);
              rawX = Math.cos(a) * ORBIT_RADIUS;
              rawY = Math.sin(a) * ORBIT_RADIUS;
              currentScale = isHi ? 1.15 : 1.0;
              currentOpacity = isHi ? 1 : 0.6 + (1 - spd) * 0.4;
              zIndexValue = isHi ? 15 : zIndexValue;
            } else {
              const pos = avatarPositions[i] ?? { x: 0, y: 0, scale: 1.0, opacity: 0.85 };
              rawX = pos.x;
              rawY = pos.y;
              currentScale = pos.scale;
              currentOpacity = pos.opacity;
            }

            // Convert from orbit-centre-relative to canvas-top-left-relative
            const canvasX = 200 + rawX;
            const canvasY = 200 + rawY;

            const getShineStyle = (): React.CSSProperties => {
              if (isSpinning) return shineBorderStyle(false, highlightedIndex === i);
              if (showWinnerState) return shineBorderStyle(true, false);
              if (isRevealedOther) return shineOtherBorderStyle();
              return shineBorderStyle(false, false);
            };

            // Dynamically set native requested size to prevent both upscaling and downscaling blur/artifacts
            let nativeSize = 100;
            if (showWinnerState) {
              nativeSize = 250;
            } else if (isRevealedOther) {
              nativeSize = 45;
            } else if (isSpinning && highlightedIndex === i) {
              nativeSize = 115;
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
                  isSpinning
                    ? {
                        x: { duration: 0 },
                        y: { duration: 0 },
                        scale: { duration: 0.05, ease: "linear" },
                        opacity: { duration: 0.1, ease: "easeOut" },
                      }
                    : itemTransition
                }
                style={{
                  position: "absolute",
                  // -50% -50% so the avatar is centred on the (canvasX, canvasY) point
                  left: 0,
                  top: 0,
                  translateX: "-50%",
                  translateY: "-50%",
                  zIndex: zIndexValue,
                  borderRadius: "50%",
                  willChange: "transform, opacity",
                }}
              >
                <div style={getShineStyle()}>
                  <div
                    className="rounded-full overflow-hidden bg-neutral-900"
                    style={{
                      boxShadow: showWinnerState
                        ? "inset 0 2px 8px rgba(0,0,0,0.4)"
                        : "inset 0 4px 10px rgba(0,0,0,0.6)",
                    }}
                  >
                    <Avatar src={member.image} name={member.name} size={nativeSize} />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* +N remaining pill — Positioned after Card so it sits on top */}
          <AnimatePresence>
            {animationPhase === "revealed" && remainingOthers > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 15,
                  delay: 0.4,
                }}
                className="absolute z-50 text-white/70 text-[10px] font-extrabold bg-[#111111]/85 border border-white/10 px-2.5 py-1 rounded-full shadow-lg"
                style={{
                  left: "50%",
                  top: 200 + OTHER_Y,
                  transform: "translate(20px, -50%)",
                }}
              >
                +{remainingOthers}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dots indicator */}
        <AnimatePresence>
          {animationPhase === "revealed" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="flex items-center gap-1.5 mt-4"
            >
              <div className="w-4 h-1 rounded-full bg-[#e07c30]" />
              <div className="w-1.5 h-1 rounded-full bg-white/20" />
              <div className="w-1.5 h-1 rounded-full bg-white/20" />
              <div className="w-1.5 h-1 rounded-full bg-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}