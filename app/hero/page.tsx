"use client";

import { useState, useEffect, useRef } from "react";
import { motion, Variants, animate } from "framer-motion";
import { ChevronRight, Star, LogIn } from "lucide-react";
import LinkNext from "next/link";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { registerBetaApply } from "@/actions/beta";

import { BACKGROUND_VIDEOS, PARTICIPANTS, ORBIT_RADIUS, CARD_OVERLAP } from "@/components/hero/constants";
import type { Phase } from "@/components/hero/hero-orbital-spinner";
import { HeroOrbitalSpinner } from "@/components/hero/hero-orbital-spinner";
import { FeaturesBanner } from "@/components/hero/features-banner";
import { HowItWorksSection } from "@/components/hero/how-it-works-section";
import { TestimonialsSection } from "@/components/hero/testimonials-section";
import { FaqSection } from "@/components/hero/faq-section";
import { WaitlistFooter } from "@/components/hero/waitlist-footer";

const OTHER_Y = 200 - CARD_OVERLAP; // 172

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
          return { x: 0, y: 0, scale: 1.3, opacity: 1 };
        }
        return { x: 0, y: 0, scale: 0.5, opacity: 0 };
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
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

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
                  style={{ background: ACCENT }}
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
              <HeroOrbitalSpinner
                animationPhase={animationPhase}
                finalMembers={finalMembers}
                winnerId={winnerId}
                avatarPositions={avatarPositions}
                orbitAngle={orbitAngle}
                highlightedIndex={highlightedIndex}
                angleStep={angleStep}
                activeIdx={activeIdx}
                desktopVideoRefs={desktopVideoRefs}
                mobileVideoRefs={mobileVideoRefs}
                onSpinClick={() => setPhase("spinning")}
              />
            </div>
          </div>
        </main>
      </div>

      <FeaturesBanner />
      <HowItWorksSection />
      <TestimonialsSection />
      <FaqSection />
      <WaitlistFooter
        footerInputRef={footerInputRef}
        waitlistEmail={waitlistEmail}
        waitlistStatus={waitlistStatus}
        waitlistMessage={waitlistMessage}
        onEmailChange={setWaitlistEmail}
        onSubmit={handleJoinWaitlist}
      />

    </div>
  );
}
