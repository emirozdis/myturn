"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";

export type Step = "intro1" | "intro2" | "intro3" | "installPwa" | "signin" | "signup" | "permissions" | "customizeProfile" | "join";

export const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.142 2.97c-.984 1.22-2.392 2.003-3.834 1.954-.216-1.41.455-2.85 1.4-3.778 1.002-1.002 2.45-1.636 3.794-1.558.232 1.44-.396 2.846-1.36 3.382zm1.666 10.428c-.035-2.58 2.073-3.837 2.167-3.896-1.182-1.748-3.033-1.988-3.712-2.016-1.576-.162-3.084.938-3.896.938-.813 0-2.05-.888-3.344-.863-1.688.026-3.242.99-4.116 2.525-1.782 3.106-.456 7.708 1.282 10.237.854 1.238 1.866 2.624 3.167 2.573 1.25-.05 1.74-.814 3.256-.814 1.516 0 1.954.814 3.28.79 1.352-.026 2.223-1.264 3.078-2.522 1.002-1.464 1.41-2.885 1.432-2.96-.03-.016-2.56-1.01-2.594-3.992z" />
  </svg>
);

export const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 8,
            backgroundColor: i === current ? ACCENT : "rgba(255,255,255,0.2)",
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

export function InputField({ label, type = "text", placeholder, icon: Icon, isPassword, value, onChange }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={glassStyle(0.04, 16, 0.08)}
          className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            {show ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
        {Icon && !isPassword && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
