"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { getGroupDetails } from "@/actions/group";
import { Avatar } from "@/components/shared/avatar";

interface VloggerRevealModalProps {
  groupId: string;
  assignment: any;
  onClose: () => void;
}

const FALLBACK_PROFILES = [
  { name: "Sarah", image: null },
  { name: "John", image: null },
  { name: "Emma", image: null },
  { name: "Michael", image: null },
  { name: "Sophia", image: null },
];

type Phase = "idle" | "spinning" | "converging" | "landed" | "revealed";

const ORBIT_RADIUS = 112;
const MEMBER_COUNT = 5;

export function VloggerRevealModal({
  groupId,
  assignment,
  onClose,
}: VloggerRevealModalProps) {
  const [members, setMembers]           = useState<any[]>([]);
  const [groupName, setGroupName]       = useState<string>("");
  const [animationPhase, setPhase]      = useState<Phase>("idle");
  const [orbitAngle, setOrbitAngle]     = useState(0);
  const [highlightedIndex, setHighlighted] = useState(-1);
  const [avatarPositions, setPositions] = useState<
    { x: number; y: number; scale: number; opacity: number }[]
  >(
    Array.from({ length: MEMBER_COUNT }).map((_, i) => {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      return { x: Math.cos(a) * ORBIT_RADIUS, y: Math.sin(a) * ORBIT_RADIUS, scale: 1, opacity: 0.35 };
    })
  );
  const [driftOffsets, setDriftOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: MEMBER_COUNT }).map(() => ({ x: 0, y: 0 }))
  );

  const orbitAngleRef = useRef(0);
  const rafRef        = useRef<number | null>(null);
  const speedRef      = useRef(0);

  // ── Fetch members ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const res = await getGroupDetails(groupId);
      if (res.success && res.group) {
        if (res.group.name) {
          setGroupName(res.group.name);
        }
        if (res.group.members) {
          setMembers(
            res.group.members
              .filter((m: any) => m.userId !== assignment.userId)
              .map((m: any) => m.user)
          );
        }
      }
    };
    fetch();
  }, [groupId, assignment.userId]);

  // ── Idle drift ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "idle") return;
    const id = setInterval(() => {
      setDriftOffsets(
        Array.from({ length: MEMBER_COUNT }).map(() => ({
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
        }))
      );
    }, 2800);
    return () => clearInterval(id);
  }, [animationPhase]);

  useEffect(() => {
    if (animationPhase !== "idle") return;
    setPositions(
      Array.from({ length: MEMBER_COUNT }).map((_, i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return {
          x: Math.cos(a) * ORBIT_RADIUS + driftOffsets[i].x,
          y: Math.sin(a) * ORBIT_RADIUS + driftOffsets[i].y,
          scale: 1,
          opacity: 0.35,
        };
      })
    );
  }, [driftOffsets, animationPhase]);

  // ── Spinning rAF ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "spinning") return;

    speedRef.current = 1.2;
    const MAX_SPEED   = 16;
    const ACCEL       = 1.08;
    const DECEL       = 0.982;
    let accelerating  = true;
    let accelFrames   = 0;
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

      const norm    = ((orbitAngleRef.current % 360) + 360) % 360;
      const topDeg  = ((-90 - norm) % 360 + 360) % 360;
      setHighlighted(Math.round(topDeg / 72) % MEMBER_COUNT);

      if (speedRef.current > 0.25) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setPhase("converging");
        setHighlighted(-1);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [animationPhase]);

  // ── Converging ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "converging") return;
    setPositions(Array.from({ length: MEMBER_COUNT }).map(() => ({
      x: 0, y: 0, scale: 0.3, opacity: 0,
    })));
    const t = setTimeout(() => setPhase("landed"), 700);
    return () => clearTimeout(t);
  }, [animationPhase]);

  // ── Landed → scatter ──────────────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase !== "landed") return;
    const R = 210;
    setPositions(
      Array.from({ length: MEMBER_COUNT }).map((_, i) => {
        const a = (i * 72 - 90) * (Math.PI / 180) + (orbitAngleRef.current * Math.PI) / 180;
        return { x: Math.cos(a) * R, y: Math.sin(a) * R, scale: 0.5, opacity: 0 };
      })
    );
    const t = setTimeout(() => setPhase("revealed"), 800);
    return () => clearTimeout(t);
  }, [animationPhase]);

  const handleClose = () => {
    localStorage.setItem(`revealed_vlogger_${assignment.id}`, "true");
    onClose();
  };

  // Fill to 5
  const displayMembers = [...members];
  while (displayMembers.length < MEMBER_COUNT) {
    const fb = FALLBACK_PROFILES[displayMembers.length % FALLBACK_PROFILES.length];
    displayMembers.push({ id: `fallback-${displayMembers.length}`, ...fb });
  }
  const finalMembers = displayMembers.slice(0, MEMBER_COUNT);

  const isSpinning = animationPhase === "spinning";

  const avatarTransition = (phase: Phase) => {
    if (phase === "idle")       return { type: "spring" as const, stiffness: 22, damping: 9 };
    if (phase === "converging") return { type: "spring" as const, stiffness: 260, damping: 28 };
    if (phase === "landed")     return { type: "spring" as const, stiffness: 50,  damping: 10 };
    return                             { type: "spring" as const, stiffness: 70,  damping: 12 };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1c1108 0%, #0d0d0f 50%, #080809 100%)" }}
    >
      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* Close */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <X size={16} className="text-white/50" />
      </button>

      <motion.div 
        layout
        className="relative w-full max-w-[390px] h-full max-h-[812px] flex flex-col items-center justify-center z-10 px-6 py-10"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {animationPhase !== "revealed" && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, height: 0, overflow: "hidden", marginBottom: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-center mb-auto"
            >
              <motion.img
                src="/assets/icons/camera.png"
                alt="camera"
                className="w-24 h-24 object-contain"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <div className="mt-1 flex flex-col gap-1">
                <h1 style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: -0.5, color: "#fff" }}>
                  {animationPhase === "idle"
                    ? <>Who&apos;s today&apos;s <span style={{ color: "#e08040" }}>vlogger?</span></>
                    : <>Finding today&apos;s <span style={{ color: "#e08040" }}>vlogger…</span></>
                  }
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", fontWeight: 500, letterSpacing: 0.1 }}>
                  {animationPhase === "idle" ? "One person. Chosen at random." : "Choosing someone at random"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Center Area / Transition Layout ────────────────────────────── */}
        <motion.div
          layout="position"
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="relative flex items-center justify-center w-full my-auto"
        >
          <AnimatePresence mode="wait">
            {animationPhase !== "revealed" ? (
              <motion.div
                key="orbit-wheel"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="relative flex items-center justify-center"
                style={{ width: 280, height: 280 }}
              >
                {/* Thin orbit ring */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: ORBIT_RADIUS * 2, height: ORBIT_RADIUS * 2, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "50%" }}
                />

                {/* Spinning sweep line */}
                <AnimatePresence>
                  {(isSpinning || animationPhase === "converging") && (
                    <motion.div
                      className="absolute pointer-events-none"
                      style={{ width: ORBIT_RADIUS * 2 + 2, height: ORBIT_RADIUS * 2 + 2 }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 230 230" fill="none">
                        <defs>
                          <linearGradient id="sweep" x1="115" y1="0" x2="230" y2="115" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#e08040" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#e08040" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M115,2 A113,113 0 0,1 228,115"
                          stroke="url(#sweep)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Orbit Avatars */}
                {finalMembers.map((member, i) => {
                  if (isSpinning) {
                    const a    = (i * 72 - 90) * (Math.PI / 180) + (orbitAngle * Math.PI) / 180;
                    const isHi = highlightedIndex === i;
                    const spd  = Math.min(speedRef.current / 16, 1);
                    const op   = isHi ? 1 : 0.18 + (1 - spd) * 0.32;

                    return (
                      <div
                        key={member.id}
                        style={{
                          position: "absolute",
                          transform: `translate(${Math.cos(a) * ORBIT_RADIUS}px, ${Math.sin(a) * ORBIT_RADIUS}px) scale(${isHi ? 1.15 : 1})`,
                          opacity: op,
                          transition: "opacity 0.12s ease, transform 0.06s linear",
                          zIndex: isHi ? 15 : 10,
                        }}
                      >
                        <div
                          style={{
                            borderRadius: "50%",
                            boxShadow: isHi ? "0 0 0 2px rgba(224,128,64,0.9), 0 0 16px rgba(224,128,64,0.4)" : "none",
                            transition: "box-shadow 0.15s ease",
                          }}
                        >
                          <Avatar src={member.image} name={member.name} size={44} />
                        </div>
                      </div>
                    );
                  }

                  const pos = avatarPositions[i] ?? { x: 0, y: 0, scale: 1, opacity: 0.35 };
                  return (
                    <motion.div
                      key={member.id}
                      initial={false}
                      animate={{ x: pos.x, y: pos.y, scale: pos.scale, opacity: pos.opacity }}
                      transition={avatarTransition(animationPhase)}
                      style={{ position: "absolute", zIndex: 10, borderRadius: "50%" }}
                    >
                      <Avatar src={member.image} name={member.name} size={44} />
                    </motion.div>
                  );
                })}

                {/* Winner Avatar (Landed Phase) */}
                <AnimatePresence>
                  {animationPhase === "landed" && (
                    <motion.div
                      layoutId="winner-avatar"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 22, mass: 1.1 }}
                      style={{ position: "absolute", zIndex: 20 }}
                      className="flex flex-col items-center justify-center"
                    >
                      <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
                      <div className="p-1 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 shadow-xl">
                        <div className="rounded-full overflow-hidden bg-neutral-900 p-1">
                          <Avatar src={assignment.user?.image} name={assignment.user?.name} size={128} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Premium Reveal Button (Idle Phase) */}
                <AnimatePresence>
                  {animationPhase === "idle" && (
                    <motion.div
                      key="tap-btn-wrapper"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 20 }}
                      style={{ position: "absolute", zIndex: 20 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPhase("spinning")}
                        className="relative group overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      >
                        {/* Shimmer glowing backdrop */}
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-[2px] opacity-75 group-hover:opacity-100 transition-opacity blur-sm" />
                        
                        <div className="relative px-7 py-3 rounded-full bg-neutral-950/90 text-white font-semibold text-sm transition-colors group-hover:bg-neutral-950/80 flex items-center gap-2.5 shadow-xl">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                          </motion.div>
                          <span className="tracking-wide bg-gradient-to-r from-white via-neutral-100 to-neutral-200 bg-clip-text text-transparent">
                            Reveal Vlogger
                          </span>
                        </div>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Profile Card & Bottom details (Revealed Phase) */
              <motion.div
                key="profile-card"
                initial={{ opacity: 0, scale: 0.93, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className="w-full bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl rounded-[32px] p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
              >
                {/* Embedded dynamic light glows inside card */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Winner Avatar with layout id matching orbit center */}
                <motion.div
                  layoutId="winner-avatar"
                  className="relative mb-5"
                >
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-xl animate-pulse" />
                  
                  <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 shadow-xl">
                    <div className="rounded-full overflow-hidden bg-neutral-900 p-[2px]">
                      <Avatar src={assignment.user?.image} name={assignment.user?.name} size={128} />
                    </div>
                  </div>

                  <div className="absolute bottom-0 right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-1.5 rounded-full border-2 border-neutral-950 shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </motion.div>

                {/* Badge */}
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase mb-3">
                  Today&apos;s Vlogger
                </span>

                {/* Name */}
                <h2 className="text-2xl font-bold text-white tracking-tight leading-none mb-1.5">
                  {assignment.user?.name || "Alex Rivera"}
                </h2>

                {/* Username */}
                <p className="text-sm text-neutral-400 font-medium mb-4">
                  @{assignment.user?.username || assignment.user?.name?.toLowerCase().replace(/\s+/g, '') || "alex_vlogs"}
                </p>

                {/* Group Context */}
                {groupName && (
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[11px] text-neutral-400 mb-6 flex items-center gap-1.5 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Selected from <span className="text-neutral-200 font-semibold">{groupName}</span>
                  </div>
                )}

                {/* Divider */}
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-5" />

                {/* Bottom Card text context */}
                <div className="flex flex-col items-center text-center">
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-[240px]">
                    Check back throughout the day to see their moments.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </motion.div>
    </div>
  );
}