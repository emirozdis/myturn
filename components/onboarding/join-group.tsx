"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { useRouter } from "next/navigation";
import { joinGroup, createGroup } from "@/actions/group";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { InputField } from "@/components/onboarding/shared";
import type { Step } from "@/components/onboarding/shared";

export function JoinGroup({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");
    if (!code) {
      setError(t("onboarding.enterInviteCodeError"));
      return;
    }

    setLoading(true);
    const res = await joinGroup(code);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/today");
    }
  };

  const handleCreateGroup = async () => {
    setError("");
    if (!groupName) {
      setError(t("onboarding.enterGroupNameError"));
      return;
    }

    setLoading(true);
    const res = await createGroup(groupName);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/today");
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <button onClick={() => onNavigate("customizeProfile")} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white mb-2 -ml-3 rounded-full hover:bg-white/10 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">{t("onboarding.joinGroup")}</h1>
        <p className="text-white/60 text-[15px] sm:text-base">{t("onboarding.joinGroupSubtitle")}</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center py-4 mb-6 relative min-h-[160px]">
          <div className="relative h-full aspect-square max-h-[200px] w-full max-w-[200px] mx-auto">
            <svg className="absolute inset-0 w-full h-full text-white/15" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              <line x1="50" y1="50" x2="50" y2="15" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="20" y2="45" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="80" y2="45" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="30" y2="80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="70" y2="80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
            </svg>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] aspect-square rounded-full bg-[#111] border-[3px] border-[#e07c30] z-10 flex items-center justify-center overflow-hidden shadow-xl">
              <User size={24} className="text-[#e07c30]" />
            </div>

            <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[45%] left-[20%] -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/image1.png" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[45%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[80%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/image1.png" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute top-[80%] left-[70%] -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square rounded-full overflow-hidden border-2 border-white/20 bg-black">
              <img src="/profile.jpg" className="w-full h-full object-cover" alt="" />
            </div>

            <div className="absolute top-[15%] right-[15%] text-[#e07c30]/50 animate-pulse">✨</div>
            <div className="absolute bottom-[20%] left-[10%] text-[#e07c30]/50 animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
          </div>
        </div>

        <div className="w-full flex-shrink-0 mt-auto">
          <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1 block mb-1.5">{t("onboarding.enterInviteCode")}</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("onboarding.inviteCodePlaceholder")}
            style={glassStyle(0.04, 16, 0.08)}
            className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30 text-center uppercase tracking-widest font-mono mb-4"
          />

          <button
            onClick={handleJoin}
            disabled={code.length < 4 || loading}
            className={`w-full py-4 rounded-[18px] font-bold text-[16px] transition-all mb-4 flex items-center justify-center gap-2 ${code.length >= 4
              ? "bg-[#e07c30] text-black active:scale-[0.98] shadow-lg"
              : "bg-white/5 text-white/30 border border-white/5"
              }`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? t("onboarding.joiningGroup") : t("onboarding.joinGroupButton")}
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-white/40 text-[13px]">{t("onboarding.orCreateInstead")}</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          <InputField label={t("onboarding.groupNameLabel")} placeholder={t("onboarding.groupNamePlaceholderJoin")} value={groupName} onChange={(e: any) => setGroupName(e.target.value)} />

          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || loading}
            style={glassStyle(0.02, 16, 0.1)}
            className="w-full py-4 rounded-[18px] font-bold text-[16px] transition-transform active:scale-[0.98] border border-[#e07c30]/50 text-[#e07c30] hover:bg-[#e07c30]/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {t("onboarding.createNewGroup")}
          </button>
        </div>
      </div>
    </div>
  );
}
