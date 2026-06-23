// ./app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ACCENT } from "@/lib/theme";
import { isStandaloneMode } from "@/lib/pwa-install";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/shared/language-toggle";

import { Dots } from "@/components/onboarding/shared";
import type { Step } from "@/components/onboarding/shared";
import { Intro1 } from "@/components/onboarding/intro-1";
import { Intro2 } from "@/components/onboarding/intro-2";
import { Intro3 } from "@/components/onboarding/intro-3";
import { InstallEnforcerScreen } from "@/components/onboarding/install-enforcer-screen";
import { SignIn } from "@/components/onboarding/sign-in";
import { SignUp } from "@/components/onboarding/sign-up";
import { PermissionsScreen } from "@/components/onboarding/permissions-screen";
import { CustomizeProfileScreen } from "@/components/onboarding/customize-profile-screen";
import { JoinGroup } from "@/components/onboarding/join-group";

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("intro1");
  const [direction, setDirection] = useState(1);
  const [signUpName, setSignUpName] = useState("");

  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== "false";

  // Prevent authenticated users from flashing the onboarding UI before server middleware can engage
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/today");
    }
  }, [status, router]);

  // Handle airtight PWA gatekeeping on mounting
  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const isStandalone = isStandaloneMode();
      const isDevBypass = process.env.NEXT_PUBLIC_ALLOW_WEB_BYPASS === "true";

      // If they are not running the installed PWA and we are not in development bypass, immediately lock them out.
      if (!isStandalone && !isDevBypass) {
        setStep("installPwa");
      }
    }
  }, []);

  const navigate = (newStep: Step) => {
    const order: Record<Step, number> = {
      intro1: 0,
      intro2: 1,
      intro3: 2,
      installPwa: 3,
      signin: 5,
      signup: 5,
      permissions: 6,
      customizeProfile: 7,
      join: 8
    };

    if (typeof window !== "undefined") {
      const isStandalone = isStandaloneMode();
      const isDevBypass = process.env.NEXT_PUBLIC_ALLOW_WEB_BYPASS === "true";

      if (!isStandalone && !isDevBypass && (newStep === "signin" || newStep === "signup")) {
        setDirection(order["installPwa"] >= order[step] ? 1 : -1);
        setStep("installPwa");
        return;
      }
    }

    setDirection(order[newStep] >= order[step] ? 1 : -1);
    setStep(newStep);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case "intro1": return <Intro1 />;
      case "intro2": return <Intro2 />;
      case "intro3": return <Intro3 />;
      case "installPwa": return <InstallEnforcerScreen />;
      case "signin": return <SignIn onNavigate={navigate} />;
      case "signup": return <SignUp onNavigate={navigate} onSignUpSuccess={setSignUpName} />;
      case "permissions": return <PermissionsScreen onNavigate={navigate} />;
      case "customizeProfile": return <CustomizeProfileScreen onNavigate={navigate} signUpName={signUpName} />;
      case "join": return <JoinGroup onNavigate={navigate} />;
      default: return null;
    }
  };

  const isIntro = step.startsWith("intro");
  const introIndex = isIntro ? parseInt(step.replace("intro", "")) - 1 : -1;

  if (!mounted || status === "loading" || status === "authenticated") {
    // Renders a completely blank background to prevent any client hydration flashes of slides or wrong state.
    return <div className="fixed inset-0 bg-[#060814]" />;
  }

  return (
    <div className="fixed inset-0 sm:relative sm:min-h-screen bg-black flex sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden select-none">
      <div
        className="absolute inset-0 sm:relative sm:w-[393px] sm:h-[812px] sm:rounded-[48px] overflow-hidden flex flex-col transition-all duration-300 bg-[#161618]"
        style={{
          boxShadow: "inset 0 2px 6px rgba(255,255,255,0.1), 0 30px 60px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex-1 relative flex flex-col overflow-hidden h-full">
          <div className="absolute top-4 right-4 z-20">
            <LanguageToggle />
          </div>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex flex-col p-6 overflow-hidden"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {isIntro && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 z-10 flex flex-col px-6 pb-8 pt-12 pointer-events-none bg-gradient-to-t from-[#161618] via-[#161618]/90 to-transparent"
              >
                <div className="flex items-center justify-between pointer-events-auto">
                  <Dots total={3} current={introIndex} />
                  <button
                    onClick={() => navigate("signin")}
                    className="text-white/60 text-[14px] font-bold tracking-tight hover:text-white transition-colors"
                  >
                    {t("onboarding.logIn")}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (step === "intro1") navigate("intro2");
                    else if (step === "intro2") navigate("intro3");
                    else navigate(allowRegistration ? "signup" : "signin");
                  }}
                  className="w-full mt-8 py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg pointer-events-auto"
                  style={{ background: ACCENT }}
                >
                  {step === "intro3" ? (allowRegistration ? t("onboarding.getStarted") : t("onboarding.logIn")) : t("common.next")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
