"use client";

import { useState } from "react";
import { User } from "lucide-react";

export function Avatar({
  src,
  size = 44,
  ring = false,
}: {
  src: string;
  size?: number;
  ring?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden relative"
      style={{
        width: size,
        height: size,
        border: ring ? "2.5px solid #e07c30" : "none",
        background: failed ? "rgba(224,124,48,0.18)" : "transparent",
      }}
    >
      {!failed ? (
        <img
          src={src}
          alt="Avatar"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <User size={size * 0.5} className="text-white/60" />
      )}
    </div>
  );
}
