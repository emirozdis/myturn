"use client";

import { motion } from "framer-motion";
import { Shield, Smartphone, Video } from "lucide-react";

export function HowItWorksSection() {
  return (
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
  );
}
