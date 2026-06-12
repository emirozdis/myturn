"use client";

import { useState, useEffect, useRef } from "react";
import { motion, Variants, AnimatePresence, animate } from "framer-motion";
import { 
  Flame, Play, Star, Clock, Users, Trophy, ChevronRight, 
  Video, Shield, Smartphone, ChevronDown, CheckCircle2, 
  LogIn, Loader2
} from "lucide-react";
import LinkNext from "next/link";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import { registerBetaApply } from "@/actions/beta";

const BACKGROUND_VIDEOS = [
  "/assets/videos/morning.mp4",
  "/assets/videos/sunset.mp4",
  "/assets/videos/night.mp4"
];

const PARTICIPANTS = [
  { id: "1", name: "Sarah", image: "/profile.jpg" },
  { id: "2", name: "Alex", image: "/profile.jpg" },
  { id: "3", name: "Emily", image: "/image1.png" }, // Selected "girl" vlogger (Winner)
  { id: "4", name: "Mert", image: "/profile.jpg" },
  { id: "5", name: "Zeynep", image: "/profile.jpg" }
];

type Phase = "idle" | "spinning" | "picked" | "video_playing";

const ORBIT_RADIUS = 160;
const CARD_OVERLAP = 28;
const OTHER_Y = 200 - CARD_OVERLAP; // 172

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      style={glassStyle(0.03, 16, 0.1)}
      className="rounded-2xl border border-white/5 overflow-hidden transition-colors hover:bg-white/[0.04]"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
      >
        <span className="text-white font-semibold pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0 text-white/50"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-white/60 leading-relaxed text-sm">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animationPhase, setPhase] = useState<Phase>("idle");
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [highlightedIndex, setHighlighted] = useState(-1);
  const [avatarPositions, setPositions] = useState<
    { x: number; y: number; scale: number; opacity: number }[]
  >([]);
  const [driftOffsets, setDriftOffsets] = useState<{ x: number; y: number }[]>([]);

  // Waitlist Application States
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistMessage, setWaitlistMessage] = useState("");

  const footerInputRef = useRef<HTMLInputElement>(null);
  const orbitAngleRef = useRef(0);
  const desktopVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const finalMembers = PARTICIPANTS;
  const count = finalMembers.length;
  const angleStep = 360 / count;
  const winnerId = "3"; // Emily (index 2)

  const avatarTransition = (phase: Phase): any => {
    if (phase === "idle")
      return { type: "spring", stiffness: 22, damping: 9 };
    if (phase === "picked")
      return { type: "spring", stiffness: 100, damping: 15 }; 
    if (phase === "video_playing") {
      // Split transition: Spring movement coordinates & scale for organic elastic feel, with a clean ease-out linear opacity transition
      return {
        scale: { type: "spring", stiffness: 80, damping: 20 },
        opacity: { type: "tween", ease: "easeInOut", duration: 0.5 },
        x: { type: "spring", stiffness: 80, damping: 20 },
        y: { type: "spring", stiffness: 80, damping: 20 }
      };
    }
    return { type: "spring", stiffness: 70, damping: 12 };
  };

  const handleRequestBetaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (footerInputRef.current) {
      footerInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      footerInputRef.current.focus();
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    setWaitlistStatus("loading");
    setWaitlistMessage("");

    const res = await registerBetaApply(waitlistEmail);
    if (res.error) {
      setWaitlistStatus("error");
      setWaitlistMessage(res.error);
    } else {
      setWaitlistStatus("success");
      setWaitlistMessage(res.message || "Successfully registered!");
      setWaitlistEmail("");
    }
  };

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

  useEffect(() => {
    if (animationPhase !== "idle" && animationPhase !== "spinning") return;
    setPositions(
      Array.from({ length: count }).map((_, i) => {
        const a = ((i * angleStep + 90) * Math.PI) / 180;
        return {
          x: Math.cos(a) * ORBIT_RADIUS,
          y: Math.sin(a) * ORBIT_RADIUS,
          scale: 1.0,
          opacity: 0.85,
        };
      })
    );
    setDriftOffsets(Array.from({ length: count }).map(() => ({ x: 0, y: 0 })));
  }, [count, angleStep, animationPhase]);

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
          scale: 1.0,
          opacity: 0.85,
        };
      })
    );
  }, [driftOffsets, animationPhase, count, angleStep]);

  useEffect(() => {
    const instantTimer = setTimeout(() => {
      setPhase("spinning");
    }, 800);
    return () => clearTimeout(instantTimer);
  }, []);

  useEffect(() => {
    if (animationPhase !== "spinning") return;

    const controls = animate(0, 1656, {
      duration: 5.2,
      ease: [0.12, 0.85, 0.18, 1],
      onUpdate: (value) => {
        orbitAngleRef.current = value;
        setOrbitAngle(value);

        const norm = ((-value % 360) + 360) % 360;
        setHighlighted(Math.round(norm / angleStep) % count);

        setPositions(
          Array.from({ length: count }).map((_, i) => {
            const a =
              (i * angleStep + 90) * (Math.PI / 180) +
              (value * Math.PI) / 180;
            return {
              x: Math.cos(a) * ORBIT_RADIUS,
              y: Math.sin(a) * ORBIT_RADIUS,
              scale: 1.0,
              opacity: 0.85,
            };
          })
        );
      },
      onComplete: () => {
        setHighlighted(2);
        setPhase("picked");
      }
    });

    return () => controls.stop();
  }, [animationPhase, count, angleStep]);

  useEffect(() => {
    if (animationPhase !== "picked") return;

    setPositions(
      finalMembers.map((member) => {
        if (member.id === winnerId) {
          return {
            x: 0,
            y: 0,
            scale: 1.3,
            opacity: 1,
          };
        }
        return {
          x: 0,
          y: 0,
          scale: 0.5,
          opacity: 0,
        };
      })
    );

    const t = setTimeout(() => {
      setPhase("video_playing");
    }, 1300);

    return () => clearTimeout(t);
  }, [animationPhase, finalMembers]);

  useEffect(() => {
    if (animationPhase !== "video_playing") return;

    setPositions(
      finalMembers.map((member) => {
        if (member.id === winnerId) {
          // Clean scale up & fade out to create a seamless depth reveal into the background videos
          return { x: 0, y: 0, scale: 2.5, opacity: 0 }; 
        }
        return { x: 0, y: OTHER_Y, scale: 0, opacity: 0 };
      })
    );
  }, [animationPhase, finalMembers]);

  useEffect(() => {
    if (animationPhase !== "video_playing") return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % BACKGROUND_VIDEOS.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [animationPhase]);

  useEffect(() => {
    if (animationPhase !== "video_playing") return;

    BACKGROUND_VIDEOS.forEach((_, idx) => {
      const desktopVideo = desktopVideoRefs.current[idx];
      const mobileVideo = mobileVideoRefs.current[idx];

      if (idx === activeIdx) {
        if (desktopVideo) {
          desktopVideo.currentTime = 0;
          desktopVideo.play().catch((err) => console.log("Video playback delayed:", err));
        }
        if (mobileVideo) {
          mobileVideo.currentTime = 0;
          mobileVideo.play().catch((err) => console.log("Video playback delayed:", err));
        }
      } else {
        const timeout = setTimeout(() => {
          if (activeIdx !== idx) {
            if (desktopVideoRefs.current[idx]) desktopVideoRefs.current[idx]?.pause();
            if (mobileVideoRefs.current[idx]) mobileVideoRefs.current[idx]?.pause();
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
    });
  }, [activeIdx, animationPhase]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 20 
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const 
      }
    }
  };

  const scrollUpVariant: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const isSpinning = animationPhase === "spinning";

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-[#F58220]/30 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative w-full">
        {/* Background Setup with Smooth Multi-Video Crossfading */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-[#050505] lg:bg-black">
          {animationPhase === "video_playing" && BACKGROUND_VIDEOS.map((src, idx) => (
            <motion.div
              key={src}
              initial={{ opacity: 0 }}
              animate={{ opacity: activeIdx === idx ? 0.95 : 0 }}
              transition={{ duration: 2, ease: "easeInOut" as const }}
              className="absolute inset-0 w-full h-full z-0 hidden lg:block"
            >
              <video
                ref={(el) => {
                  desktopVideoRefs.current[idx] = el;
                }}
                src={src}
                muted
                playsInline
                loop
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}

          {/* Masking gradients (Desktop Only) */}
          <div className="hidden lg:block absolute inset-y-0 left-0 w-full lg:w-[65%] bg-gradient-to-r from-[#050505] via-[#050505]/75 to-transparent z-10 pointer-events-none" />
          <div className="hidden lg:block absolute inset-x-0 top-0 h-[25vh] bg-gradient-to-b from-[#050505]/85 via-[#050505]/30 to-transparent z-10 pointer-events-none" />
          <div className="hidden lg:block absolute inset-x-0 bottom-0 h-[35vh] bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
        </div>

        {/* --- Navigation Bar --- */}
        <nav className="relative z-20 max-w-[1760px] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkNext href="/hero" className="flex items-center gap-2 focus:outline-none cursor-pointer">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black border border-white/10">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <span className="text-2xl font-bold tracking-tight">MyTurn</span>
            </LinkNext>
            <div className="ml-2 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/70">Beta</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[15px] font-medium text-white/80">
            <LinkNext href="/features" className="hover:text-white transition-colors cursor-pointer">Features</LinkNext>
            <LinkNext href="/testimonials" className="hover:text-white transition-colors cursor-pointer">Testimonials</LinkNext>
            <LinkNext href="/pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</LinkNext>
            <LinkNext href="/changelog" className="hover:text-white transition-colors cursor-pointer">Changelog</LinkNext>
          </div>

          <LinkNext href="/" className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-2.5 rounded-full font-semibold transition-all cursor-pointer">
            Join Beta
            <ChevronRight size={16} />
          </LinkNext>
        </nav>

        {/* --- Main Hero Content --- */}
        <main className="relative z-10 max-w-[1760px] mx-auto px-6 lg:px-12 pt-12 pb-40 lg:pt-16 lg:pb-60">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 xl:gap-32 items-center">
            
            {/* Left Column: Typography & CTAs */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-start lg:col-span-7 xl:col-span-6 w-full max-w-[580px]"
            >
              <motion.div
                variants={itemVariants}
                style={glassStyle(0.08, 16, 0.15)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 shadow-lg text-xs sm:text-sm border border-[#F58220]/30"
              >
                <div className="w-2 h-2 rounded-full bg-[#F58220] animate-pulse" />
                <span className="font-medium text-[#F58220] tracking-wide">Closed Beta is Live</span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-[42px] sm:text-[54px] lg:text-[64px] xl:text-[70px] font-extrabold leading-[1.1] tracking-tight mb-5"
              >
                One person.<br />
                One day.<br />
                <span className="text-[#F58220]">Everyone closer.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-sm sm:text-[16px] text-white/60 leading-relaxed mb-8 max-w-[460px]"
              >
                MyTurn is currently in closed beta. Join the waitlist to get early access for your group and experience daily vlogging like never before.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3.5 mb-10">
                <button 
                  onClick={handleRequestBetaClick}
                  style={{background: ACCENT}} 
                  className="flex items-center gap-2 bg-[#F58220] hover:bg-[#FF9A44] text-white px-7 py-3.5 rounded-full font-bold text-base transition-all cursor-pointer"
                >
                  Request Beta Access
                  <ChevronRight size={16} />
                </button>
                <LinkNext 
                  href="/"
                  style={glassStyle(0.04, 12, 0.2)}
                  className="flex items-center gap-3 text-white px-7 py-3.5 rounded-full font-bold text-base transition-all hover:bg-white/5 cursor-pointer"
                >
                  Login
                  <LogIn size={18} className="fill-white translate-x-[1px]" />
                </LinkNext>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  {["/profile.jpg", "/image1.png", "/profile.jpg", "/image1.png"].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Beta Tester"
                      className="w-10 h-10 rounded-full border-2 border-[#050505] object-cover relative"
                      style={{ zIndex: 4 - i }}
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-[#FBBF24] fill-[#FBBF24]" />
                    ))}
                  </div>
                  <span className="text-white/60 text-[12px] font-medium">Trusted by 500+ beta testers</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Vlogger Orbital Spinner Reveal Component */}
            <div className="relative lg:col-span-5 xl:col-span-6 w-full h-[580px] sm:h-[600px] flex items-center justify-center lg:justify-start">
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
                            onClick={() => setPhase("spinning")}
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
                  const itemTransition = avatarTransition(animationPhase);

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
            </div>
          </div>
        </main>
      </div>

      {/* --- Floating Bottom Features Banner --- */}
      <section id="features" className="relative z-30 max-w-[1760px] mx-auto px-6 lg:px-12 pb-12 mt-12 lg:mt-[-220px]">
        <motion.div
          variants={scrollUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            ...glassStyle(0.04, 30, 0.1),
            background: "linear-gradient(135deg, rgba(20,20,20,0.7) 0%, rgba(10,10,10,0.9) 100%)",
          }}
          className="rounded-[32px] p-8 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 shadow-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F58220]/10 border border-[#F58220]/20 flex items-center justify-center flex-shrink-0">
              <Flame size={24} className="text-[#F58220] fill-[#F58220]/20" />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px] mb-1.5">One turn, every day</h3>
              <p className="text-white/50 text-[13px] leading-relaxed">We randomly pick one person each day to vlog.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Clock size={24} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px] mb-1.5">Capture life in moments</h3>
              <p className="text-white/50 text-[13px] leading-relaxed">Short clips throughout the day build a timeline of memories.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Users size={24} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px] mb-1.5">Everyone follows along</h3>
              <p className="text-white/50 text-[13px] leading-relaxed">Watch the day unfold in chronological order.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Trophy size={24} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px] mb-1.5">Build streaks, unlock more</h3>
              <p className="text-white/50 text-[13px] leading-relaxed">Consistency pays off. Achievements keep it fun.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="text-center mb-16 lg:mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">How MyTurn Works</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">A seamless experience built to keep your inner circle connected without the pressure of traditional social media.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
            
            {[
              { 
                icon: Shield, 
                step: "01", 
                title: "Create Your Circle", 
                desc: "Invite up to 12 of your closest friends to a private group. No followers, no public profiles." 
              },
              { 
                icon: Smartphone, 
                step: "02", 
                title: "The Daily Spin", 
                desc: "Every morning, the wheel spins and selects one person. Today, they are the main character." 
              },
              { 
                icon: Video, 
                step: "03", 
                title: "Vlog Your Day", 
                desc: "The chosen person captures brief, authentic moments. Everyone else watches the story unfold." 
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" as const }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-[28px] bg-[#111] border border-white/10 flex items-center justify-center mb-8 relative shadow-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:border-[#F58220]/50 group-hover:shadow-[0_10px_30px_rgba(245,130,32,0.1)]">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-[11px] font-bold text-white/50">
                    {item.step}
                  </div>
                  <item.icon size={32} className="text-white/80 group-hover:text-[#F58220] transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-[260px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section id="testimonials" className="py-24 lg:py-32 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="mb-16"
          >
            <div className="flex items-center gap-2 mb-4 text-[#F58220] text-sm font-bold tracking-wider uppercase">
              <Star size={16} className="fill-[#F58220]" />
              Beta Tester Feedback
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Loved by the community.</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                text: "Since we started using MyTurn, our friend group chat has never been this active. It's so much fun seeing my friends' daily routines.",
                name: "Jason M.",
                role: "College Student",
                img: "/profile.jpg"
              },
              {
                text: "The suspense of who gets picked is the best part of my morning! It totally takes the pressure off 'performing' everyday.",
                name: "Amanda R.",
                role: "Digital Nomad",
                img: "/profile.jpg"
              },
              {
                text: "Finally, a social app that doesn't feel like a competition for likes. It’s just me and my best friends sharing real life.",
                name: "Kevin T.",
                role: "Creative Director",
                img: "/profile.jpg"
              }
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" as const }}
                style={glassStyle(0.02, 16, 0.05)}
                className="p-8 rounded-3xl border border-white/5 flex flex-col justify-between"
              >
                <div className="mb-8 text-white/70 leading-relaxed text-[15px]">
                  "{review.text}"
                </div>
                <div className="flex items-center gap-4">
                  <img src={review.img} alt={review.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                  <div>
                    <div className="font-bold text-white text-sm">{review.name}</div>
                    <div className="text-white/40 text-xs">{review.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-white/50 text-lg">Everything you need to know about the MyTurn Closed Beta.</p>
          </motion.div>

          <div className="space-y-4">
            <FaqItem 
              question="How do I get access to the Closed Beta?" 
              answer="Currently, MyTurn is invite-only. You can request access by joining our waitlist on this page. We admit new groups in rolling batches every week."
            />
            <FaqItem 
              question="Is MyTurn free?" 
              answer="Yes! During our beta phase, all features are 100% free. Our goal is to gather feedback and build the best possible experience before a public launch."
            />
            <FaqItem 
              question="How does the picking algorithm work?" 
              answer="The spin algorithm is randomized, but it utilizes a 'fairness' system to ensure everyone in your group gets a turn before the cycle completely resets."
            />
            <FaqItem 
              question="What platforms are supported?" 
              answer="Both iOS and Android mobile phones are supported from all brands."
            />
            <FaqItem 
              question="Who can see my vlogs?" 
              answer="Only the people you invite to your specific private group. There are no public profiles, no search engines, and no followers."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#050505] pt-20 pb-10 border-t border-white/5 text-center lg:text-left">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#222] border border-white/5">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <span className="text-xl font-bold tracking-tight">MyTurn</span>
            </div>
            <p className="text-white/40 text-sm max-w-sm mb-8 leading-relaxed">
              Bringing friends closer, one day at a time. Join the private vlogging revolution.
            </p>
            
            <form onSubmit={handleJoinWaitlist} className="flex flex-col gap-3 w-full max-w-[340px]">
              <div className="flex items-center gap-2 bg-white/5 rounded-full p-1.5 border border-white/10 w-full">
                <input 
                  ref={footerInputRef}
                  type="email" 
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter email for waitlist" 
                  disabled={waitlistStatus === "loading"}
                  className="bg-transparent border-none text-sm text-white placeholder:text-white/30 outline-none px-4 flex-1 min-w-0"
                />
                <button 
                  type="submit"
                  disabled={waitlistStatus === "loading" || !waitlistEmail.trim()}
                  className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  {waitlistStatus === "loading" ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <span>Join</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              </div>
              
              {waitlistStatus === "success" && (
                <p className="text-emerald-400 text-xs font-semibold mt-1 transition-all leading-normal text-left">{waitlistMessage}</p>
              )}
              {waitlistStatus === "error" && (
                <p className="text-red-400 text-xs font-semibold mt-1 transition-all leading-normal text-left">{waitlistMessage}</p>
              )}
            </form>
          </div>
          
          <div className="flex flex-col items-center lg:items-start gap-4">
            <h4 className="font-semibold text-white">Company</h4>
            <LinkNext href="/about" className="text-white/50 text-sm hover:text-white transition-colors cursor-pointer">About Us</LinkNext>
            <LinkNext href="/privacy" className="text-white/50 text-sm hover:text-white transition-colors cursor-pointer">Privacy Policy</LinkNext>
            <LinkNext href="/terms" className="text-white/50 text-sm hover:text-white transition-colors cursor-pointer">Terms of Service</LinkNext>
            <LinkNext href="/contact" className="text-white/50 text-sm hover:text-white transition-colors cursor-pointer">Contact</LinkNext>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} MyTurn Inc. All rights reserved. • developed with love by <a href="https://emirozdis.tr" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2 transition-colors cursor-pointer">@emirozdis</a>
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/emirozdis" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors cursor-pointer">
              <span className="sr-only">GitHub</span>
              GitHub
            </a>
            <LinkNext href="/hero" className="text-white/30 hover:text-white transition-colors cursor-pointer"><span className="sr-only">Instagram</span>📷</LinkNext>
          </div>
        </div>
      </footer>

    </div>
  );
}