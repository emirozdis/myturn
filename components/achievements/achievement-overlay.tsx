"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { X, Check, Lock, Share, Sparkles, Flame, Camera, Target } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { ParticleEffect } from "./particle-effect";

// --- Types ---

export type AchievementModule =
  | { type: "calendar"; days: boolean[]; title?: string; subtitle?: string }
  | { type: "stats"; items: { icon: "flame" | "camera" | "target"; label: string; value: string }[] }
  | {
      type: "rewards";
      unlocked: { title: string; desc: string };
      next?: { title: string; desc: string };
    }
  | { type: "milestones"; items: { title: string; status: "achieved" | "locked" }[] }
  | {
      type: "progress-header";
      currentStreak: string;
      bestStreak: string;
      totalVlogs: string;
    }
  | {
      type: "progress-bar";
      current: number;
      max: number;
      label: string;
      xpLabel?: string;
    };

export type AchievementConfig = {
  id: string;
  particles?: "confetti" | "sparks" | "none";
  topContent?: {
    title: string;
    highlight?: string;
    subtitle?: string;
  };
  image?: {
    src: string;
    value?: string | number;
  };
  mainContent?: {
    title?: string;
    highlight?: string;
    subtitle?: string;
    description?: string;
  };
  modules?: AchievementModule[];
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; icon?: ReactNode; onClick?: () => void };
};

// --- Animations ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2, ease: "easeOut" } 
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)", scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
      mass: 0.8,
    },
  },
};

const imageVariants: Variants = {
  hidden: { scale: 0.2, opacity: 0, y: 50, rotate: -15, filter: "blur(10px)" },
  show: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 18,
      mass: 1.2,
    },
  },
};

const numberStampVariants: Variants = {
  hidden: { scale: 2.5, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
      mass: 0.5,
      delay: 0.35, // Stamps after the main image finishes popping
    },
  },
};

// --- Subcomponents ---

function HighlightedText({ text, highlight, className }: { text: string; highlight?: string; className?: string }) {
  if (!highlight) return <span className={className}>{text}</span>;
  
  const parts = text.split(highlight);
  return (
    <span className={className}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i !== parts.length - 1 && (
            <span style={{ color: ACCENT }}>{highlight}</span>
          )}
        </span>
      ))}
    </span>
  );
}

function CalendarModule({ data }: { data: { days: boolean[]; title?: string; subtitle?: string } }) {
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="w-full flex flex-col gap-3">
      {(data.title || data.subtitle) && (
        <div className="mb-1">
          {data.title && <h3 className="text-white text-[14px] font-bold tracking-wide">{data.title}</h3>}
          {data.subtitle && <p className="text-white/50 text-[11px]">{data.subtitle}</p>}
        </div>
      )}
      <div className="flex justify-between items-center px-1">
        {data.days.map((achieved, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-white/40">{dayLabels[i]}</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                achieved
                  ? "bg-[#e07c30] text-black shadow-[0_0_12px_rgba(224,124,48,0.4)]"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {achieved && <Check size={16} strokeWidth={3} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsModule({ data }: { data: { items: { icon: "flame" | "camera" | "target"; label: string; value: string }[] } }) {
  return (
    <div className="w-full flex flex-col gap-3">
      {data.items.map((item, i) => (
        <div key={i} style={glassStyle(0.04, 16, 0.08)} className="rounded-[20px] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            {item.icon === "flame" ? (
              <Flame size={20} className="text-[#e07c30]" />
            ) : item.icon === "camera" ? (
              <Camera size={20} className="text-white/60" />
            ) : (
              <Target size={20} className="text-[#e07c30]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white/50 text-[11px] font-medium mb-0.5">{item.label}</span>
            <span className="text-white text-[15px] font-bold">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RewardsModule({ data }: { data: { unlocked: any; next?: any } }) {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* Unlocked */}
      <div style={glassStyle(0.04, 16, 0.08)} className="rounded-[20px] p-4 flex items-start gap-3 border border-[#e07c30]/30 shadow-[inset_0_0_20px_rgba(224,124,48,0.05)]">
        <div className="mt-1">
          <Sparkles size={20} className="text-[#e07c30]" />
        </div>
        <div className="flex flex-col">
          <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">Reward Unlocked</span>
          <span className="text-white text-[14px] font-bold mb-0.5">{data.unlocked.title}</span>
          <span className="text-white/60 text-[11px] leading-snug">{data.unlocked.desc}</span>
        </div>
      </div>
      {/* Next */}
      {data.next && (
        <div style={glassStyle(0.02, 16, 0.05)} className="rounded-[20px] p-4 flex items-start gap-3">
          <div className="mt-1">
            <Flame size={20} className="text-[#e07c30]/50" />
          </div>
          <div className="flex flex-col">
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">Next Reward</span>
            <span className="text-white/80 text-[14px] font-bold mb-0.5">{data.next.title}</span>
            <span className="text-white/40 text-[11px] leading-snug">{data.next.desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestonesModule({ data }: { data: { items: { title: string; status: "achieved" | "locked" }[] } }) {
  return (
    <div className="w-full flex flex-col gap-3">
      <h3 className="text-white text-[14px] font-bold tracking-wide mb-1">Milestones</h3>
      <div className="flex flex-col gap-2">
        {data.items.map((item, i) => {
          const isAchieved = item.status === "achieved";
          return (
            <div key={i} className="flex items-center justify-between p-3 rounded-[16px] bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3">
                {isAchieved ? (
                  <Flame size={14} className="text-white/40" />
                ) : (
                  <Lock size={14} className="text-white/20" />
                )}
                <span className={`text-[13px] font-semibold ${isAchieved ? "text-white" : "text-white/40"}`}>
                  {item.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAchieved ? "text-white/60" : "text-white/30"}`}>
                  {isAchieved ? "Achieved" : "Locked"}
                </span>
                {isAchieved ? (
                  <div className="w-4 h-4 rounded-full bg-[#e07c30] flex items-center justify-center text-black">
                    <Check size={10} strokeWidth={4} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-white/30">
                    <Lock size={8} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressHeaderModule({ data }: { data: any }) {
  return (
    <div className="w-full flex flex-col gap-3 mb-2">
      <div style={glassStyle(0.04, 16, 0.08)} className="rounded-[20px] p-5 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-white/50 text-[11px] font-medium mb-1">Current Streak</span>
          <span className="text-white text-[22px] font-bold leading-none">{data.currentStreak}</span>
        </div>
        <Flame size={32} className="text-[#e07c30] fill-[#e07c30]/20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div style={glassStyle(0.02, 16, 0.05)} className="rounded-[16px] p-4 flex flex-col">
          <span className="text-white/50 text-[10px] font-medium mb-1">Best Streak</span>
          <span className="text-white text-[14px] font-bold">{data.bestStreak}</span>
        </div>
        <div style={glassStyle(0.02, 16, 0.05)} className="rounded-[16px] p-4 flex flex-col">
          <span className="text-white/50 text-[10px] font-medium mb-1">Total Vlogs</span>
          <span className="text-white text-[14px] font-bold">{data.totalVlogs}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressBarModule({ data }: { data: { current: number; max: number; label: string; xpLabel?: string } }) {
  const percentage = Math.min(100, Math.max(0, (data.current / data.max) * 100));
  return (
    <div className="w-full flex flex-col gap-2.5 bg-white/[0.03] p-4 rounded-[20px] border border-white/5">
      <div className="flex justify-between items-end">
        <span className="text-white text-[13px] font-bold">{data.label}</span>
        <span className="text-[#e07c30] text-[11px] font-bold">
          {data.current} <span className="text-white/40">/ {data.max} {data.xpLabel || ""}</span>
        </span>
      </div>
      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 bottom-0 rounded-full"
          style={{ background: "linear-gradient(90deg, #ff9a44 0%, #e07c30 100%)" }}
        />
        {/* Glow effect on the progress bar */}
        <motion.div
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: [0, 0.5, 0], x: "100%" }}
          transition={{ duration: 2, delay: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
        />
      </div>
    </div>
  );
}

// --- Main Overlay Component ---

export function AchievementOverlay({
  config,
  onClose,
}: {
  config: AchievementConfig;
  onClose: () => void;
}) {
  const hasImage = !!config.image;
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-50 bg-[#111]/95 backdrop-blur-xl overflow-y-auto overflow-x-hidden flex flex-col select-none"
    >
      <ParticleEffect type={config.particles} />

      {/* Close Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 right-6 z-20"
      >
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </motion.div>

      <div className="flex-1 flex flex-col px-6 pt-16 pb-8 relative z-10 w-full max-w-md mx-auto min-h-full">
        
        {/* Top Content */}
        {config.topContent && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-6"
          >
            <h1 className="text-white text-[28px] font-bold tracking-tight mb-2">
              <HighlightedText text={config.topContent.title} highlight={config.topContent.highlight} />
            </h1>
            {config.topContent.subtitle && (
              <p className="text-white/70 text-[15px] font-medium">
                {config.topContent.subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Main Central Image */}
        {hasImage && (
          <motion.div
            variants={imageVariants}
            className="relative w-full aspect-square max-w-[240px] mx-auto my-6 flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }} // Delay infinite float until entrance finishes
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={config.image!.src}
                alt="Achievement Graphic"
                className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(224,124,48,0.25)]"
              />
              {config.image!.value && (
                <div className="absolute inset-0 flex items-center justify-center pb-[8%]">
                  <motion.div 
                    variants={numberStampVariants}
                    className="relative font-black tracking-tighter"
                    style={{ fontSize: String(config.image!.value).length > 1 ? "90px" : "110px", lineHeight: 1 }}
                  >
                    {/* Shadow and Extrusion Layer */}
                    <span 
                      className="absolute inset-0"
                      style={{
                        color: "#a1a1aa",
                        textShadow: `
                          0px 1px 0px #d4d4d8,
                          0px 2px 0px #a1a1aa,
                          0px 3px 0px #71717a,
                          0px 4px 0px #52525b,
                          0px 10px 15px rgba(0,0,0,0.6),
                          0px 20px 30px rgba(0,0,0,0.4)
                        `,
                        WebkitTextStroke: "2px rgba(255,255,255,0.2)",
                        zIndex: 0
                      }}
                      aria-hidden="true"
                    >
                      {config.image!.value}
                    </span>
                    {/* Front Gradient Layer */}
                    <span 
                      className="relative z-10"
                      style={{
                        background: "linear-gradient(180deg, #FFFFFF 0%, #e4e4e7 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      {config.image!.value}
                    </span>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Main Content (Title/Desc below image) */}
        {config.mainContent && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-8"
          >
            {config.mainContent.title && (
              <h2 className="text-white text-[24px] font-bold tracking-tight mb-2">
                <HighlightedText text={config.mainContent.title} highlight={config.mainContent.highlight} />
              </h2>
            )}
            {config.mainContent.subtitle && (
              <p className="text-[#e07c30] text-[14px] font-bold tracking-wide mb-2 uppercase">
                {config.mainContent.subtitle}
              </p>
            )}
            {config.mainContent.description && (
              <p className="text-white/60 text-[13px] leading-relaxed max-w-[280px] whitespace-pre-line">
                {config.mainContent.description}
              </p>
            )}
          </motion.div>
        )}

        {/* Modules Rendering */}
        {config.modules && config.modules.length > 0 && (
          <div className="flex flex-col gap-6 w-full mb-8 mt-auto">
            {config.modules.map((mod, idx) => {
              return (
                <motion.div key={idx} variants={itemVariants}>
                  {mod.type === "calendar" && <CalendarModule data={mod} />}
                  {mod.type === "stats" && <StatsModule data={mod} />}
                  {mod.type === "rewards" && <RewardsModule data={mod} />}
                  {mod.type === "milestones" && <MilestonesModule data={mod} />}
                  {mod.type === "progress-header" && <ProgressHeaderModule data={mod} />}
                  {mod.type === "progress-bar" && <ProgressBarModule data={mod} />}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className={`mt-auto pt-4 flex flex-col gap-4 w-full ${!config.modules ? "pt-12" : ""}`}
        >
          {config.primaryAction && (
            <button
              onClick={() => {
                config.primaryAction?.onClick?.();
                onClose();
              }}
              className="w-full py-4 rounded-[16px] text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg"
              style={{ background: ACCENT }}
            >
              {config.primaryAction.label}
            </button>
          )}
          {config.secondaryAction && (
            <button
              onClick={() => {
                config.secondaryAction?.onClick?.();
              }}
              className="w-full py-3 flex items-center justify-center gap-2 text-[#e07c30] font-bold text-[14px] hover:bg-white/5 rounded-[16px] transition-colors"
            >
              {config.secondaryAction.icon || <Share size={16} />}
              {config.secondaryAction.label}
            </button>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}