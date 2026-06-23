"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import LinkNext from "next/link";

export interface WaitlistFooterProps {
  footerInputRef: React.RefObject<HTMLInputElement | null>;
  waitlistEmail: string;
  waitlistStatus: "idle" | "loading" | "success" | "error";
  waitlistMessage: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function WaitlistFooter({
  footerInputRef,
  waitlistEmail,
  waitlistStatus,
  waitlistMessage,
  onEmailChange,
  onSubmit,
}: WaitlistFooterProps) {
  return (
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

          <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full max-w-[340px]">
            <div className="flex items-center gap-2 bg-white/5 rounded-full p-1.5 border border-white/10 w-full">
              <input
                ref={footerInputRef}
                type="email"
                value={waitlistEmail}
                onChange={(e) => onEmailChange(e.target.value)}
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
          © {new Date().getFullYear()} MyTurn Inc. All rights reserved. • developed with love by{" "}
          <a href="https://emirozdis.tr" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2 transition-colors cursor-pointer">@emirozdis</a>
        </p>
        <div className="flex items-center gap-6">
          <a href="https://github.com/emirozdis" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors cursor-pointer">
            <span className="sr-only">GitHub</span>
            GitHub
          </a>
          <LinkNext href="/hero" className="text-white/30 hover:text-white transition-colors cursor-pointer">
            <span className="sr-only">Instagram</span>
            📷
          </LinkNext>
        </div>
      </div>
    </footer>
  );
}
