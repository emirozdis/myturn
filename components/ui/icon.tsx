"use client";

import type { LucideIcon } from "lucide-react";

export function AppIcon({
  icon: Icon,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
}: {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return <Icon size={size} color={color} strokeWidth={strokeWidth} aria-hidden />;
}
