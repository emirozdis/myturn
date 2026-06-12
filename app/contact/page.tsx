"use client";

import { motion } from "framer-motion";
import { ChevronRight, Mail, HelpCircle, User } from "lucide-react";
import LinkNext from "next/link";
import { glassStyle } from "@/components/shared/glass-style";

export default function ContactPage() {
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
          className="mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Get in <span className="text-[#F58220]">Touch</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Have questions about group setups, browser compatibility, or notification permissions? We are happy to help.
          </p>
        </motion.div>

        {/* --- CONTACT METHODS --- */}
        <div className="grid md:grid-cols-3 gap-6 mb-32 text-left">
          <div style={glassStyle(0.03, 16, 0.08)} className="p-6 rounded-[24px] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Mail size={18} className="text-[#F58220]" />
              </div>
              <h3 className="text-base font-bold mb-1.5 text-white">General Support</h3>
              <p className="text-white/50 text-xs leading-relaxed mb-4">Questions about group codes or active devices.</p>
            </div>
            <a href="mailto:team@myturn.app" className="text-[#F58220] text-xs font-bold hover:underline">team@myturn.app</a>
          </div>

          <div style={glassStyle(0.03, 16, 0.08)} className="p-6 rounded-[24px] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <HelpCircle size={18} className="text-[#F58220]" />
              </div>
              <h3 className="text-base font-bold mb-1.5 text-white">Beta Feedback</h3>
              <p className="text-white/50 text-xs leading-relaxed mb-4">Submit bugs or cosmetic performance issues.</p>
            </div>
            <a href="mailto:beta@myturn.app" className="text-[#F58220] text-xs font-bold hover:underline">beta@myturn.app</a>
          </div>

          <div style={glassStyle(0.03, 16, 0.08)} className="p-6 rounded-[24px] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <User size={18} className="text-[#F58220]" />
              </div>
              <h3 className="text-base font-bold mb-1.5 text-white font-semibold">Solo Creator</h3>
              <p className="text-white/50 text-xs leading-relaxed mb-4">Direct message channel to the developer Emir.</p>
            </div>
            <a href="https://emirozdis.tr" target="_blank" rel="noopener noreferrer" className="text-[#F58220] text-xs font-bold hover:underline">emirozdis.tr</a>
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