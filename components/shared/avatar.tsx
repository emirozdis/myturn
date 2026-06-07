"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { getSignedReadUrl } from "@/actions/vlog";

interface CacheEntry {
  url: string;
  expiresAt: number;
}

// Global memory cache to prevent repeated signed URL requests across renders
const avatarCache = new Map<string, CacheEntry>();
// Global tracker for in-flight requests to deduplicate concurrent renders of the same avatar
const pendingRequests = new Map<string, Promise<string | null>>();

async function resolveAvatarUrl(src: string): Promise<string | null> {
  const now = Date.now();
  const cached = avatarCache.get(src);

  // Return cached URL if it exists and has more than 5 minutes until expiration
  if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
    return cached.url;
  }

  // If a request for this exact avatar is already in flight, wait for it instead of starting a new one
  if (pendingRequests.has(src)) {
    return pendingRequests.get(src)!;
  }

  const promise = getSignedReadUrl("avatars", src)
    .then((res) => {
      if (res.success && res.url) {
        avatarCache.set(src, {
          url: res.url,
          expiresAt: Date.now() + 3600 * 1000, // Matches the 1 hour expiry from the backend
        });
        return res.url;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      // Clean up the pending request tracker once complete
      pendingRequests.delete(src);
    });

  pendingRequests.set(src, promise);
  return promise;
}

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
    let isMounted = true;
    
    async function loadSource() {
      if (!src) {
        if (isMounted) setResolvedSrc(null);
        return;
      }
      
      // If it is a relative Supabase storage path (pointing to our avatars bucket)
      if (!src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("/")) {
        const url = await resolveAvatarUrl(src);
        if (isMounted) setResolvedSrc(url);
      } else {
        if (isMounted) setResolvedSrc(src);
      }
    }

    loadSource();

    return () => {
      isMounted = false;
    };
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