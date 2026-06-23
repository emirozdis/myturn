"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { signIn } from "next-auth/react";
import posthog from "posthog-js";
import { signUpUser } from "@/actions/auth";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { InputField, GoogleIcon, AppleIcon, FacebookIcon } from "@/components/onboarding/shared";
import type { Step } from "@/components/onboarding/shared";

export function SignUp({ onNavigate, onSignUpSuccess }: { onNavigate: (step: Step) => void; onSignUpSuccess: (name: string) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Evaluate config flags for social logic UI rendering
  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== "false";
  const allowSocial = process.env.NEXT_PUBLIC_ALLOW_SOCIAL_LOGIN !== "false";
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN !== "false";
  const appleEnabled = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN !== "false";
  const facebookEnabled = process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN === "true";

  const handleSignUp = async () => {
    setError("");
    if (!name || !email || !password) {
      setError(t("onboarding.errorFillAll"));
      return;
    }

    setLoading(true);
    try {
      const res = await signUpUser({ name, email, password });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        setLoading(false);
        if (loginRes?.error) {
          if (loginRes.status === 429 || loginRes.error.includes("Too many login attempts")) {
            setError(t("onboarding.errorTooManyAttempts"));
          } else {
            setError(t("onboarding.accountCreatedSignIn"));
          }
        } else {
          posthog.identify(email.toLowerCase().trim(), { name, email: email.toLowerCase().trim() });
          posthog.capture("user_signed_up", { method: "credentials" });
          onSignUpSuccess(name);
          onNavigate("permissions");
        }
      }
    } catch (err) {
      setLoading(false);
      setError(t("onboarding.errorUnexpected"));
      console.error("Sign up failed:", err);
    }
  };

  // Gracefully block rendering if manual URL states access registration while closed
  if (!allowRegistration) {
    return (
      <div className="flex-1 flex flex-col pt-4 min-h-0 items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <User className="text-white/30" size={24} />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight mb-2">{t("onboarding.registrationClosed")}</h1>
        <p className="text-white/60 text-xs sm:text-sm max-w-xs mb-6 leading-relaxed">
          {t("onboarding.registrationClosedBody")}
        </p>
        <button
          onClick={() => onNavigate("signin")}
          style={{ background: ACCENT }}
          className="w-full max-w-xs py-3.5 rounded-full text-black font-bold text-sm transition-transform active:scale-[0.98]"
        >
          {t("onboarding.goToSignIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-4 min-h-0">
      <button onClick={() => onNavigate("intro3")} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white mb-2 -ml-3 rounded-full hover:bg-white/10 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex-shrink-0">
        <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">{t("onboarding.createAccount")}</h1>
        <p className="text-white/60 text-[15px] sm:text-base">{t("onboarding.signUpSubtitle")}</p>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-8">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <InputField label={t("onboarding.fullNameLabel")} placeholder={t("onboarding.fullNamePlaceholder")} value={name} onChange={(e: any) => setName(e.target.value)} />
        <InputField label={t("onboarding.emailLabel")} placeholder={t("onboarding.emailPlaceholder")} value={email} onChange={(e: any) => setEmail(e.target.value)} />
        <InputField label={t("onboarding.passwordLabel")} placeholder={t("onboarding.createPasswordPlaceholder")} isPassword value={password} onChange={(e: any) => setPassword(e.target.value)} />

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full mt-4 py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] mb-8 shadow-lg flex-shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? t("onboarding.creatingAccount") : t("onboarding.signUpButton")}
        </button>

        {allowSocial && (googleEnabled || appleEnabled || facebookEnabled) && (
          <>
            <div className="flex items-center gap-4 mb-8 flex-shrink-0">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-white/40 text-[13px]">{t("onboarding.orContinueWith")}</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div className="flex items-center justify-center gap-4 mb-6 flex-shrink-0">
              {googleEnabled && (
                <button onClick={() => signIn("google")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <GoogleIcon />
                </button>
              )}
              {appleEnabled && (
                <button onClick={() => signIn("apple")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <AppleIcon />
                </button>
              )}
              {facebookEnabled && (
                <button onClick={() => alert("Facebook login coming soon!")} style={glassStyle(0.04, 20, 0.1)} className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <FacebookIcon />
                </button>
              )}
            </div>
          </>
        )}

        <div className="text-center mt-auto flex-shrink-0 pt-4">
          <span className="text-white/50 text-[14px]">{t("onboarding.alreadyHaveAccount")}</span>
          <button onClick={() => onNavigate("signin")} className="text-[#e07c30] text-[14px] font-bold hover:underline">{t("onboarding.signInLink")}</button>
        </div>
      </div>
    </div>
  );
}
