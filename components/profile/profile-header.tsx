"use client";

import { Camera, Pencil, MapPin, Calendar, Crown, Loader2 } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import { getVibeBadgeStyle } from "@/lib/vibe";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type ProfileHeaderProps = {
  user: any;
  uploadingAvatar: boolean;
  onEditProfile: () => void;
  onAvatarClick: () => void;
};

export function ProfileHeader({ user, uploadingAvatar, onEditProfile, onAvatarClick }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const vibeStyle = getVibeBadgeStyle(user.archetype);
  const joinedYear = user.createdAt ? new Date(user.createdAt).getFullYear() : 2026;

  return (
    <div style={{ marginTop: "12px", padding: "16px 16px 0", display: "flex", alignItems: "flex-start", gap: 16, position: "relative" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        {uploadingAvatar && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-full">
            <Loader2 size={20} className="animate-spin text-[#e07c30]" />
          </div>
        )}
        <Avatar src={user.image} name={user.name} size={100} ring />
        <button
          type="button"
          onClick={onAvatarClick}
          style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center" as const, justifyContent: "center" as const, border: "2px solid #111", cursor: "pointer" }}
        >
          <Camera size={13} color="#000" />
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>{user.name || "User"}</span>
          <div style={{
            ...vibeStyle,
            padding: "3px 8px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: vibeStyle.border,
          }}>
            <Crown size={12} fill="currentColor" />
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase" }}>{user.archetype}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 500 }}>@{user.handle || "handle"}</span>
          <button type="button" onClick={onEditProfile} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: "3px 10px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Pencil size={11} /> {t("profile.editProfile")}
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, margin: "0 0 8px", lineHeight: 1.4 }}>{user.bio}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            <MapPin size={12} color="rgba(255,255,255,0.45)" /> {user.location}
          </span>
          <span style={{ color: "rgba(255,255,255,0.20)", fontSize: 11 }}>•</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            <Calendar size={12} color="rgba(255,255,255,0.45)" /> {t("profile.joined", { year: joinedYear })}
          </span>
        </div>
      </div>
    </div>
  );
}