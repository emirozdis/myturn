"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ACCENT } from "@/lib/theme";

type ParticleType = "confetti" | "sparks" | "none";

interface ParticleEffectProps {
  type?: ParticleType;
}

export function ParticleEffect({ type = "none" }: ParticleEffectProps) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (type === "none") return;

    const isConfetti = type === "confetti";
    const colors = isConfetti
      ? [ACCENT, "#ffcc00", "#30D158", "#0A84FF", "#ffffff"]
      : [ACCENT, "#ffb880", "#ffffff"];
      
    const count = isConfetti ? 60 : 40;

    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // random start X (%)
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * (isConfetti ? 8 : 4) + 4,
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 2,
      rotate: Math.random() * 360,
    }));

    setParticles(newParticles);
  }, [type]);

  if (type === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: "-10vh",
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            y: "110vh",
            x: `${p.x + (Math.random() * 20 - 10)}vw`,
            rotate: p.rotate + 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: type === "sparks" ? "50%" : "2px",
            boxShadow: type === "sparks" ? `0 0 10px ${p.color}` : "none",
          }}
        />
      ))}
    </div>
  );
}