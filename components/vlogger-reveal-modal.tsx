"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, MapPin } from "lucide-react";
import { getGroupDetails } from "@/actions/group";
import { Avatar } from "@/components/shared/avatar";
import { glassStyle } from "@/components/shared/glass-style";

interface VloggerRevealModalProps {
  groupId: string;
  assignment: any;
  onClose: () => void;
}

// "syncing" phase ensures motion.divs mount at exact rotation coords before springing
type Phase = "idle" | "spinning" | "syncing" | "converging" | "revealed";

const ORBIT_RADIUS = 160;

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

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    const dateStr = assignment?.date ? new Date(assignment.date).toISOString().split("T")[0] : "";
    localStorage.setItem(`revealed_vlogger_${groupId}_${dateStr}`, "true");
    onClose();
  };

  // ── Fetch members ─────────────────────────────────────────────────────────
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

  // ── Map unique group members without any duplication padding ──────────────
  const finalMembers = useMemo(() => {
    return members.length > 0 
      ? members 
      : (assignment?.user ? [assignment.user] : [{ id: "fallback", name: "User", image: null }]);
  }, [members, assignment]);

  const count = finalMembers.length;
  const angleStep = 360 / count;

  // ── Synchronize dynamic avatar layout boundaries ──────────────────────────
  useEffect(() => {
    if (count === 0) return;
    setPositions(
      Array.from({ length: count }).map((_, i) => {
        const a = ((i * angleStep + 90) * Math.PI) / 180;
        return {
          x: Math.cos(a) * ORBIT_RADIUS,
          y: Math.sin(a) * ORBIT_RADIUS,
          scale: 1,
          opacity: 0.85,
        };
      })
    );
    setDriftOffsets(Array.from({ length: count }).map(() => ({ x: 0, y: 0 })));
  }, [count, angleStep]);

  // ── Idle drift ────────────────────────────────────────────────────────────
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
          scale: 1,
          opacity: 0.85,
        };
      })
    );
  }, [driftOffsets, animationPhase, count, angleStep]);

  // ── Spinning rAF ──────────────────────────────────────────────────────────
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
        
        // SYNC PHASE: Freeze exact position to avoid snap
        const finalNorm = ((-orbitAngleRef.current % 360) + 360) % 360;
        const hl = Math.round(finalNorm / angleStep) % count;

        setPositions(
          Array.from({ length: count }).map((_, i) => {
            const a = (i * angleStep + 90) * (Math.PI / 180) + (orbitAngleRef.current * Math.PI) / 180;
            return {
              x: Math.cos(a) * ORBIT_RADIUS,
              y: Math.sin(a) * ORBIT_RADIUS,
              scale: hl === i ? 1.15 : 1,
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

  // ── Smooth Handoff -> Converging ──────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "syncing") return;
    const t = setTimeout(() => {
      setHighlighted(-1);
      setPhase("converging");
    }, 50);
    return () => clearTimeout(t);
  }, [animationPhase]);

  // ── Converging (Gather Phase) ─────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "converging" || count === 0) return;
    setPositions(
      Array.from({ length: count }).map(() => ({
        x: 0,
        y: 0,
        scale: 0.15,
        opacity: 0.8,
      }))
    );
    const t = setTimeout(() => setPhase("revealed"), 300); 
    return () => clearTimeout(t);
  }, [animationPhase, count]);

  // ── Revealed → cluster smoothly ───────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "revealed") return;
    const winnerId = assignment?.user?.id;
    
    const realOthers = finalMembers.filter(
      (m) => m.id !== winnerId && !String(m.id).startsWith("duplicate-") && !String(m.id).startsWith("fallback")
    );
    const othersCount = realOthers.length;

    let otherIndex = 0;
    
    setPositions(
      finalMembers.map((member) => {
        if (member.id === winnerId) {
          return {
            x: 0,
            y: -20,
            scale: 2.0,
            opacity: 1,
          };
        }

        if (String(member.id).startsWith("duplicate-") || String(member.id).startsWith("fallback")) {
          return {
            x: 0,
            y: 155, 
            scale: 0,
            opacity: 0,
          };
        }
        
        const offset = otherIndex - (othersCount - 1) / 2;
        otherIndex++;
        const SPACING = 42;
        
        return {
          x: offset * SPACING,
          y: 155, 
          scale: 0.45,
          opacity: 0.9,
        };
      })
    );
  }, [animationPhase, assignment, finalMembers]);

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

      {/* Close Button styled with safe-area calculations and unified glass styling */}
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
              ...glassStyle(0.04, 16, 0.08)
            }}
          >
            <X size={18} className="text-white/60" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-[420px] h-full flex flex-col items-center z-10 px-4 pt-12 pb-8">
        
        {/* ── Header ─────────────────────────────────────────────────────── */}
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
                      e.currentTarget.style.display='none'; 
                      e.currentTarget.nextElementSibling?.classList.remove('hidden'); 
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
                    We pick one person at random each day.<br />
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
                className="absolute inset-0 flex flex-col items-center justify-center text-center z-20"
              >
                <div className="relative mb-4 mt-2">
                  <div className="absolute inset-0 bg-[#e07c30]/30 blur-3xl rounded-full" />
                  <img 
                    src="/assets/icons/camera.png" 
                    alt="Camera" 
                    className="w-24 h-24 object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" 
                  />
                </div>

                <span className="px-5 py-2 rounded-full bg-gradient-to-b from-[#e07c30]/90 to-[#b85b1c]/90 border border-[#ffb880]/50 shadow-[0_4px_16px_rgba(224,124,48,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] text-white text-[11px] font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2 backdrop-blur-md">
                  <Flame size={14} className="fill-white" />
                  Today's vlogger for {groupName || "your group"}
                </span>

                <h1 className="text-[34px] font-bold text-white mb-1 leading-none tracking-tight drop-shadow-md">
                  {assignment.user?.name}
                </h1>
                <p className="text-white/60 font-medium text-[15px] mb-3 tracking-wide">
                  @{assignment.user?.handle}
                </p>

                {assignment.user?.bio ? (
                  <p className="text-white/40 text-[13px] max-w-[280px] italic line-clamp-2">
                    "{assignment.user.bio}"
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 text-white/40 text-[13px]">
                    <MapPin size={12} />
                    <span>{assignment.user?.location || "Earth"}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Center Area / Transition Layout ────────────────────────────── */}
        <motion.div
          layout="position"
          className="relative flex items-center justify-center w-full my-auto z-10"
          style={{ height: 400 }}
        >
          <div className="relative flex items-center justify-center w-[400px] h-[400px]">
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
                  {/* Spinning trails */}
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

            {/* Triangle Pointer pointing DOWNwards */}
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
                  className="absolute z-20"
                  style={{ transform: "translateY(116px)", willChange: "transform, opacity" }}
                >
                  <svg width="16" height="14" viewBox="0 0 14 12" fill="none">
                    <path d="M0 0H14L7 12L0 0Z" fill="#e07c30" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orbit / Clustered Avatars - Unified Node to prevent mobile layout thrashing */}
            {finalMembers.map((member, i) => {
              const isWinner = member.id === winnerId;
              const showWinnerState = isWinner && (animationPhase === "revealed");
              
              const offset = i - (count - 1) / 2;
              let zIndexValue = showWinnerState ? 30 : (animationPhase === "revealed" ? 20 - Math.abs(offset) : 10);

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

              let currentX, currentY, currentScale, currentOpacity;
              let currentBg, currentBoxShadow, currentBorderWidth, currentBorderColor, currentPadding, currentBackdrop;
              let innerBorderWidth, innerBorderColor, innerBoxShadow;

              if (isSpinning) {
                const a = (i * angleStep + 90) * (Math.PI / 180) + (orbitAngle * Math.PI) / 180;
                const isHi = highlightedIndex === i;
                const spd = Math.min(speedRef.current / 16, 1);

                currentX = Math.cos(a) * ORBIT_RADIUS;
                currentY = Math.sin(a) * ORBIT_RADIUS;
                currentScale = isHi ? 1.15 : 1;
                currentOpacity = isHi ? 1 : 0.6 + (1 - spd) * 0.4;
                zIndexValue = isHi ? 15 : zIndexValue;

                currentBg = isHi ? "rgba(224,124,48,0.25)" : (baseGlass.background || "rgba(255,255,255,0.08)");
                currentBoxShadow = "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.4)";
                currentBorderWidth = isHi ? "2px" : "1px";
                currentBorderColor = isHi ? "#e07c30" : "rgba(255,255,255,0.1)";
                currentPadding = "4px";
                currentBackdrop = "blur(20px)";

                innerBorderWidth = "1px";
                innerBorderColor = "rgba(0,0,0,0.5)";
                innerBoxShadow = "inset 0 4px 10px rgba(0,0,0,0.6)";
              } else {
                const pos = avatarPositions[i] ?? { x: 0, y: 0, scale: 1, opacity: 0.85 };
                currentX = pos.x;
                currentY = pos.y;
                currentScale = pos.scale;
                currentOpacity = pos.opacity;

                currentBg = showWinnerState
                  ? "linear-gradient(135deg, #e07c30, #ffb880)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.08) 100%)";
                currentBoxShadow = showWinnerState
                  ? "0 0 50px rgba(224,124,48,0.5)"
                  : "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.4)";
                currentBorderWidth = showWinnerState ? "0px" : "1px";
                currentBorderColor = showWinnerState ? "transparent" : "rgba(255,255,255,0.1)";
                currentPadding = showWinnerState ? "5px" : "4px";
                currentBackdrop = showWinnerState ? "none" : "blur(20px)";

                innerBorderWidth = showWinnerState ? "6px" : "1px";
                innerBorderColor = showWinnerState ? "#0a0a0a" : "rgba(0,0,0,0.5)";
                innerBoxShadow = showWinnerState ? "none" : "inset 0 4px 10px rgba(0,0,0,0.6)";
              }

              return (
                <motion.div
                  key={`member-${member.id}`}
                  initial={{ x: currentX, y: currentY, scale: currentScale, opacity: currentOpacity }}
                  animate={{ x: currentX, y: currentY, scale: currentScale, opacity: currentOpacity }}
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
                    zIndex: zIndexValue,
                    borderRadius: "50%",
                    willChange: "transform, opacity",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      padding: currentPadding,
                      background: currentBg,
                      boxShadow: currentBoxShadow,
                      borderWidth: currentBorderWidth,
                      borderColor: currentBorderColor,
                    }}
                    transition={isSpinning ? { duration: 0.15 } : itemTransition}
                    className="rounded-full shadow-2xl border-solid"
                    style={{
                      backdropFilter: currentBackdrop,
                      WebkitBackdropFilter: currentBackdrop,
                      willChange: "background, box-shadow",
                    }}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        borderWidth: innerBorderWidth,
                        borderColor: innerBorderColor,
                        boxShadow: innerBoxShadow,
                      }}
                      transition={isSpinning ? { duration: 0.15 } : itemTransition}
                      className="rounded-full overflow-hidden bg-neutral-900 border-solid"
                    >
                      <Avatar src={member.image} name={member.name} size={84} />
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Center Reveal Button '?' (Idle) styled with glassmorphism */}
            <AnimatePresence>
              {animationPhase === "idle" && (
                <motion.button
                  key="reveal-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                  transition={{ duration: 0.4 }}
                  onClick={() => setPhase("spinning")}
                  className="absolute z-30 w-[130px] h-[130px] rounded-full flex items-center justify-center text-[#e07c30] font-bold text-[64px] hover:bg-[#e07c30]/10 transition-colors shadow-[0_0_40px_rgba(224,124,48,0.15)] border-solid"
                  style={{
                    ...glassStyle(0.06, 20, 0.15),
                    borderWidth: "3px",
                    borderColor: "#e07c30"
                  }}
                >
                  ?
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Bottom Fixed Height Wrapper ─────────────────────────────────── */}
        <div className="w-full h-[180px] mt-auto flex-shrink-0 flex items-end">
          <AnimatePresence>
            {animationPhase === "revealed" && (
              <motion.div
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 150, damping: 22, delay: 0.4 }}
                className="w-full rounded-3xl p-6 pb-8 flex flex-col items-center text-center shadow-2xl"
                style={glassStyle(0.04, 20, 0.08)}
              >
                <h2 className="text-white text-[22px] font-bold mb-2">Ready for action!</h2>
                <p className="text-white/50 text-[13px] leading-relaxed max-w-[260px] mb-6">
                  Check back throughout the day to see all their captured moments.
                </p>
                
                <button
                  onClick={handleClose}
                  className="w-full py-4 rounded-2xl bg-[#e07c30] text-black font-bold text-[16px] active:scale-[0.98] transition-all"
                >
                  Awesome!
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}