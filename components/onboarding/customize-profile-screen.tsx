"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { updateProfile, uploadAvatar } from "@/actions/profile";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { InputField } from "@/components/onboarding/shared";
import type { Step } from "@/components/onboarding/shared";

export function CustomizeProfileScreen({ onNavigate, signUpName }: { onNavigate: (step: Step) => void; signUpName: string }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(signUpName || "");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Phuket, Thailand");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (signUpName) {
      const generated = signUpName.toLowerCase().replace(/[^a-z0-9_]/g, "") + Math.floor(100 + Math.random() * 900);
      setHandle(generated);
    }
  }, [signUpName]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 256;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);

          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarBase64(base64);
          setAvatarPreview(base64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setError("");
    if (!name.trim() || !handle.trim()) {
      setError(t("onboarding.nameUsernameRequired"));
      return;
    }

    setLoading(true);

    try {
      if (avatarBase64) {
        const avatarRes = await uploadAvatar(avatarBase64);
        if (avatarRes.error) {
          setError(t("onboarding.avatarUploadFailed", { error: avatarRes.error }));
          setLoading(false);
          return;
        }
      }

      const profileRes = await updateProfile({
        name: name.trim(),
        handle: handle.toLowerCase().trim().replace(/\s+/g, ""),
        bio: bio.trim() || t("onboarding.defaultBio"),
        location: location.trim() || "Phuket, Thailand",
      });

      if (profileRes.error) {
        setError(profileRes.error);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cached_profile");
        }
        onNavigate("join");
      }
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">{t("onboarding.createProfile")}</h1>
        <p className="text-white/60 text-xs sm:text-sm">{t("onboarding.createProfileSubtitle")}</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 flex-shrink-0">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-2.5 mb-6 flex-shrink-0">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-white/[0.05] border-[2.5px]"
              style={{ borderColor: ACCENT }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/50 text-2xl font-extrabold">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#161618] shadow-md transition-all active:scale-95"
              style={{ background: ACCENT }}
            >
              <Camera size={14} color="#000" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{t("onboarding.selectProfilePhoto")}</span>
        </div>

        <div className="flex flex-col gap-1">
          <InputField
            label={t("onboarding.displayNameLabel")}
            placeholder={t("onboarding.displayNamePlaceholder")}
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />
          <InputField
            label={t("onboarding.usernameLabel")}
            placeholder={t("onboarding.usernamePlaceholder")}
            value={handle}
            onChange={(e: any) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          />
          <InputField
            label={t("onboarding.locationLabel")}
            placeholder={t("onboarding.locationPlaceholder")}
            value={location}
            onChange={(e: any) => setLocation(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">{t("onboarding.bioLabel")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("onboarding.bioPlaceholder")}
              rows={3}
              style={glassStyle(0.04, 16, 0.08)}
              className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30 resize-none leading-relaxed"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading || !name.trim() || !handle.trim()}
          style={{ background: ACCENT }}
          className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 mt-auto flex-shrink-0 disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin text-black" />}
          <span>{loading ? t("onboarding.savingProfile") : t("onboarding.saveContinue")}</span>
        </button>
      </div>
    </div>
  );
}
