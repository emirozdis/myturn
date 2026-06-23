"use client";

import { useState } from "react";
import { Camera, MapPin, Check, Loader2 } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import posthog from "posthog-js";
import { updateProfile } from "@/actions/profile";
import { SlidePanel } from "./slide-panel";
import { profileStyles as s } from "./styles";

type EditProfilePanelProps = {
  user: any;
  onBack: () => void;
  onSaveSuccess: () => void;
  uploadingAvatar: boolean;
  triggerAvatarSelection: () => void;
};

export function EditProfilePanel({
  user,
  onBack,
  onSaveSuccess,
  uploadingAvatar,
  triggerAvatarSelection,
}: EditProfilePanelProps) {
  const [name, setName] = useState(user.name || "");
  const [handle, setHandle] = useState(user.handle || "");
  const [bio, setBio] = useState(user.bio || "");
  const [loc, setLoc] = useState(user.location || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const res = await updateProfile({ name, handle, bio, location: loc });
    if (res.error) {
      setError(res.error);
    } else {
      posthog.capture("profile_updated", { has_bio: bio.trim().length > 0, has_location: loc.trim().length > 0 });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaveSuccess();
        onBack();
      }, 900);
    }
  }

  return (
    <SlidePanel title="Edit Profile" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
          <div style={{ position: "relative", margin: "0 auto" }}>
            {uploadingAvatar && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-full">
                <Loader2 size={18} className="animate-spin text-[#e07c30]" />
              </div>
            )}
            <Avatar src={user.image} name={user.name} size={90} ring />
            <button
              type="button"
              onClick={triggerAvatarSelection}
              style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center" as const, justifyContent: "center" as const, border: "2px solid #111", cursor: "pointer" }}
            >
              <Camera size={12} color="#000" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, padding: "0 16px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Display Name</p>
            <input value={name} onChange={e => setName(e.target.value)} style={s.input as any} placeholder="Your name" />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Username</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.40)", fontSize: 14 }}>@</span>
              <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} style={{ ...s.input, paddingLeft: 28 } as any} placeholder="handle" />
            </div>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Bio</p>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              style={{ ...s.input, resize: "none", lineHeight: 1.5 } as any} placeholder="Tell your story…" />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Location</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><MapPin size={14} color="rgba(255,255,255,0.40)" /></span>
              <input value={loc} onChange={e => setLoc(e.target.value)} style={{ ...s.input, paddingLeft: 34 } as any} placeholder="City, Country" />
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <button type="button" onClick={save} style={{ width: "100%", background: saved ? "#22c55e" : ACCENT, border: "none", borderRadius: 14, color: "#000", fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer", display: "flex", alignItems: "center" as const, justifyContent: "center" as const, gap: 8, transition: "background 0.2s" }}>
            {saved ? <><Check size={16} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}
