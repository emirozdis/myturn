"use client";

import { motion } from "framer-motion";
import { Flame, Clock, Users, Trophy } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";

const scrollUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function FeaturesBanner() {
  return (
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
  );
}
