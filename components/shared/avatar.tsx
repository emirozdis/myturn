"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { getSignedReadUrl } from "@/actions/vlog";

export function Avatar({
  src,
  size = 44,
  ring = false,
  name,
}: {
  src?: string | null;
  size?: number;
  ring?: boolean;
  name?: string | null;
}) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    
    async function resolveSource() {
      if (!src) {
        setResolvedSrc(null);
        return;
      }
      
      // If it is a relative Supabase storage path (pointing to our avatars bucket)
      if (!src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("/")) {
        try {
          const res = await getSignedReadUrl("avatars", src);
          if (res.success && res.url) {
            setResolvedSrc(res.url);
          } else {
            setResolvedSrc(null);
          }
        } catch {
          setResolvedSrc(null);
        }
      } else {
        setResolvedSrc(src);
      }
    }

    resolveSource();
  }, [src]);

  const hasImage = resolvedSrc && resolvedSrc.trim() !== "";

  const getInitials = () => {
    if (!name) return null;
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const initials = getInitials();

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden relative select-none"
      style={{
        width: size,
        height: size,
        border: ring ? "2.5px solid #e07c30" : "none",
        background: failed || !hasImage ? "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)" : "transparent",
      }}
    >
      {hasImage && !failed ? (
        <img
          src={resolvedSrc!}
          alt={name || "Avatar"}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span 
          style={{ fontSize: size * 0.35 }} 
          className="text-white font-extrabold tracking-tight"
        >
          {initials}
        </span>
      ) : (
        <User size={size * 0.5} className="text-white/60" />
      )}
    </div>
  );
}