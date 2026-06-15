"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Crown, Clapperboard, Users, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { getVibeBadgeStyle } from "@/lib/vibe";
import { glassStyle } from "@/components/shared/glass-style";
import { getUserPublicProfile } from "@/actions/profile";
import { StatPill } from "./stat-pill";

function UserProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none">
      {/* Header Area */}
      <div className="flex items-start gap-4">
        <div className="w-[72px] h-[72px] rounded-full bg-white/[0.05] flex-shrink-0" />
        <div className="flex flex-col flex-1 gap-2 pt-2">
          <div className="h-5 w-32 rounded-md bg-white/[0.05]" />
          <div className="h-3.5 w-20 rounded-md bg-white/[0.03]" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-24 rounded-full bg-white/[0.03]" />
            <div className="h-5 w-16 rounded-full bg-white/[0.03]" />
          </div>
        </div>
      </div>

      {/* Bio, Location and Date Meta */}
      <div className="flex flex-col gap-2.5">
        <div className="h-4 w-full rounded-md bg-white/[0.03]" />
        <div className="h-4 w-[85%] rounded-md bg-white/[0.03]" />
        <div className="flex gap-3 mt-1.5">
          <div className="h-3 w-20 rounded-md bg-white/[0.03]" />
          <div className="h-3 w-24 rounded-md bg-white/[0.03]" />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, height: 90 }} className="flex justify-between items-center px-6">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/[0.03]" />
          <div className="h-3 w-12 rounded-sm bg-white/[0.03]" />
        </div>
        <div className="w-[1px] h-10 bg-white/5" />
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/[0.03]" />
          <div className="h-3 w-12 rounded-sm bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

export function UserProfileSheetContent({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg(null);
    getUserPublicProfile(userId).then((res) => {
      if (res.success) {
        setProfile(res.user);
      } else {
        setErrorMsg(res.error || "User profile not found.");
      }
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (errorMsg || !profile) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center text-white/50 px-4">
        <AlertCircle size={28} className="text-red-500 mb-3" />
        <span className="text-sm font-semibold">{errorMsg || "User profile not found."}</span>
      </div>
    );
  }

  const vibeStyle = getVibeBadgeStyle(profile.archetype);
  const joinedYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : 2026;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Avatar src={profile.image} name={profile.name} size={72} ring />
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center pt-1">
          <h3 className="text-white text-xl font-bold tracking-tight truncate">{profile.name}</h3>
          <span className="text-white/50 text-xs font-medium mb-2.5">@{profile.handle}</span>

          <div className="flex gap-2 items-center flex-wrap">
            <div
              style={{
                ...vibeStyle,
                padding: "3px 8px",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                border: vibeStyle.border,
                alignSelf: "flex-start",
              }}
            >
              <Crown size={12} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-wider">{profile.archetype}</span>
            </div>

            {/* Glowing Experience Points (XP) Badge */}
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ff9a44",
                padding: "3px 8px",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                boxShadow: "0 4px 12px rgba(255, 154, 68, 0.05)",
              }}
            >
              <Sparkles size={11} className="text-[#ff9a44]" />
              <span>{profile.xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-white/80 text-[13px] leading-relaxed">
          {profile.bio || "No bio provided."}
        </p>
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <span className="flex items-center gap-1.5 text-white/40 text-[11px]">
            <MapPin size={12} /> {profile.location || "Unknown"}
          </span>
          <span className="text-white/20 text-[11px]">•</span>
          <span className="flex items-center gap-1.5 text-white/40 text-[11px]">
            <Calendar size={12} /> Joined {joinedYear}
          </span>
        </div>
      </div>

      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, display: "flex", alignItems: "stretch", marginTop: 4 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "stretch" }}>
          <StatPill icon={Clapperboard} value={profile._count?.clips || 0} label="Total Vlogs" />
          <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "14px 0" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "stretch" }}>
          <StatPill icon={Users} value={profile._count?.groupMembers || 0} label="Groups" />
        </div>
      </div>
    </div>
  );
}