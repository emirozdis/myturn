"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";

export function TestimonialsSection() {
  return (
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
              text: "Finally, a social app that doesn't feel like a competition for likes. It's just me and my best friends sharing real life.",
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
                &ldquo;{review.text}&rdquo;
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
  );
}
