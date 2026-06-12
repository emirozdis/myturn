"use client";

import { motion } from "framer-motion";
import { ChevronRight, Heart, Users, Sparkles } from "lucide-react";
import LinkNext from "next/link";
import { glassStyle } from "@/components/shared/glass-style";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-[#F58220]/30">
      
      {/* --- NAVIGATION --- */}
      <nav className="relative z-20 max-w-[1760px] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkNext href="/hero" className="flex items-center gap-2 focus:outline-none">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black border border-white/10">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MyTurn</span>
          </LinkNext>
        </div>
        <div className="hidden lg:flex items-center gap-10 text-[15px] font-medium text-white/80">
          <LinkNext href="/features" className="hover:text-white transition-colors">Features</LinkNext>
          <LinkNext href="/testimonials" className="hover:text-white transition-colors">Testimonials</LinkNext>
          <LinkNext href="/pricing" className="hover:text-white transition-colors">Pricing</LinkNext>
          <LinkNext href="/changelog" className="hover:text-white transition-colors">Changelog</LinkNext>
        </div>
        <LinkNext href="/" className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-2.5 rounded-full font-semibold transition-all">
          Join Beta
          <ChevronRight size={16} />
        </LinkNext>
      </nav>

      {/* --- CONTENT HERO --- */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Our <span className="text-[#F58220]">Mission & Story</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Reclaiming digital space for the people who matter most. Authentic, beautiful, and completely free from algorithmic optimization.
          </p>
        </motion.div>

        {/* --- STORY BLOCK --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-24 text-left">
          <div style={glassStyle(0.03, 16, 0.08)} className="p-8 rounded-[28px] border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Heart size={18} className="text-[#F58220]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Reclaiming Reality</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Social networks became digital optimization machines engineered to sell advertising. MyTurn strips away public validation indices, and replaces them with dedicated private spaces designed to build closer relationships with up to 12 friends.
            </p>
          </div>

          <div style={glassStyle(0.03, 16, 0.08)} className="p-8 rounded-[28px] border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Users size={18} className="text-[#F58220]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Close-Friend Circles</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Friendships exist in moments, not public profiles. By selecting a single daily vlogger at random, MyTurn lowers the pressure of updating constantly, keeping sharing effortless, raw, and pure.
            </p>
          </div>
        </div>

        {/* --- BIO HIGHLIGHT --- */}
        <div style={glassStyle(0.05, 20, 0.1)} className="p-8 md:p-12 rounded-[36px] border border-white/10 text-left mb-32 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-white/20 bg-neutral-900 flex-shrink-0">
            <img src="/profile.jpg" alt="Emir" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#F58220]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#F58220]">Solo Developer Project</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Created by @emirozdis</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              I built MyTurn to bring my personal circle closer together after relocating. As a solo creator, my mission is to deliver fully functional, private, and secure spaces completely free of bloated store boundaries or aggressive advertising.
            </p>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#050505] pt-20 pb-10 border-t border-white/5 text-center lg:text-left relative z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2 flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#222] border border-white/5">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <span className="text-xl font-bold tracking-tight">MyTurn</span>
            </div>
            <p className="text-white/40 text-sm max-w-sm mb-8 leading-relaxed">
              Bringing friends closer, one day at a time. Join the private vlogging revolution.
            </p>
          </div>
          <div className="flex flex-col items-center lg:items-start gap-4">
            <h4 className="font-semibold text-white">Product</h4>
            <LinkNext href="/features" className="text-white/50 text-sm hover:text-white transition-colors">Features</LinkNext>
            <LinkNext href="/testimonials" className="text-white/50 text-sm hover:text-white transition-colors">Testimonials</LinkNext>
            <LinkNext href="/pricing" className="text-white/50 text-sm hover:text-white transition-colors">Pricing</LinkNext>
            <LinkNext href="/changelog" className="text-white/50 text-sm hover:text-white transition-colors">Changelog</LinkNext>
          </div>
          <div className="flex flex-col items-center lg:items-start gap-4">
            <h4 className="font-semibold text-white">Company</h4>
            <LinkNext href="/about" className="text-white/50 text-sm hover:text-white transition-colors">About Us</LinkNext>
            <LinkNext href="/privacy" className="text-white/50 text-sm hover:text-white transition-colors">Privacy Policy</LinkNext>
            <LinkNext href="/terms" className="text-white/50 text-sm hover:text-white transition-colors">Terms of Service</LinkNext>
            <LinkNext href="/contact" className="text-white/50 text-sm hover:text-white transition-colors">Contact</LinkNext>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} MyTurn Inc. All rights reserved. • developed with love by <a href="https://emirozdis.tr" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2 transition-colors">@emirozdis</a>
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/emirozdis" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              GitHub
            </a>
            <LinkNext href="/hero" className="text-white/30 hover:text-white transition-colors"><span className="sr-only">Instagram</span>📷</LinkNext>
          </div>
        </div>
      </footer>
    </div>
  );
}