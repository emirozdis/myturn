// ./app/(app)/layout.tsx
"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { NEUTRAL_PAGE_BG } from "../../lib/theme";
import { AppHeader } from "@/components/app-header";
import { GroupSwipePager } from "@/components/group-swipe-pager";
import { BottomNavRouter } from "@/components/bottom-nav-router";
import { getUserGroups, leaveGroup } from "@/actions/group";
import { addComment, getOrCreateTodayAssignment, getLatestCompilation } from "@/actions/vlog";
import { VloggerRevealModal } from "@/components/vlogger-reveal-modal";
import { AchievementOverlay } from "@/components/achievements/achievement-overlay";
import { CompilationReadyModal } from "@/components/compilation-ready-modal";
import { ACHIEVEMENT_MOCKS } from "@/components/achievements/achievement-data";
import {
  registerPushServiceWorker,
  subscribeToPush,
  getVapidPublicKey,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import posthog from "posthog-js";
import { saveSubscription, deleteSubscription } from "@/actions/push";
import { signOut, useSession } from "next-auth/react";
import { LogoutConfirmSheet } from "@/components/profile/logout-confirm-sheet";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// Imports for Optimistic Tab rendering
import { TodaySkeleton } from "@/components/today/today-skeleton";
import { StreaksSkeleton } from "@/components/streaks/streaks-skeleton";
import { SocialSkeleton } from "@/components/social/social-skeleton";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { RecordLoadingState } from "@/components/record/record-loading-state";

// Custom Changelog release overlay
import { NewFeaturesModal } from "@/components/new-features-modal";

// Extracted layout components
import { NotificationEnforcer } from "@/components/layout/notification-enforcer";
import { NoGroupsScreen } from "@/components/layout/no-groups-screen";
import { GroupSheetContent } from "@/components/layout/group-sheets";
import { LeaveGroupSheet } from "@/components/layout/leave-group-sheet";

const APP_VERSION = "2.2.2";

export interface GroupConfig {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  members?: { id: string; name: string | null; image: string | null }[];
}

type ModalTask = 
  | { type: "compilation"; groupId: string; assignment: any }
  | { type: "reveal"; groupId: string; assignment: any }
  | { type: "achievement"; config: any }
  | { type: "levelUp"; config: any };

const cleanupStaleStorageKeys = (type: "reveal" | "recap", groupId: string, currentDateStr: string) => {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    const prefix = type === "reveal" ? `revealed_vlogger_${groupId}_` : `seen_recap_${groupId}_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const keyDate = key.replace(prefix, "");
        if (keyDate && keyDate !== currentDateStr) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error("Failed to clean up stale localStorage keys:", e);
  }
};

const getAssignmentDateStr = (asg: any) => {
  if (!asg?.date) return "";
  try {
    return new Date(asg.date).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Identify returning authenticated users in PostHog
  useEffect(() => {
    if (session?.user?.id) {
      posthog.identify(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Handle immediate visual UI handoff for BottomNav router intercept
  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

  // Release feature spotlight state
  const [showNewFeatures, setShowNewFeatures] = useState(false);

  const [groupsLoading, setGroupsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("cached_groups");
    }
    return true;
  });

  const [groups, setGroups] = useState<GroupConfig[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_groups");
        if (cached) return JSON.parse(cached) as GroupConfig[];
      } catch { }
    }
    return [];
  });

  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("active_group_id");
        const cached = localStorage.getItem("cached_groups");
        if (stored && cached) {
          const parsed = JSON.parse(cached) as GroupConfig[];
          const idx = parsed.findIndex((g) => g.id === stored);
          if (idx !== -1) return idx;
        }
      } catch { }
    }
    return 0;
  });

  const [refreshing, setRefreshing] = useState(false);
  const [recordStep, setRecordStep] = useState<"CAMERA" | "PREVIEW">("CAMERA");

  const [activeSheet, setActiveSheet] = useState<"views" | "comments" | "group-info" | "user-profile" | null>(null);
  const [sheetData, setSheetData] = useState<any>(null);

  const [commentInput, setCommentInput] = useState("");
  const [commentError, setCreateError] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [modalQueue, setModalQueue] = useState<ModalTask[]>([]);
  
  const enqueueModal = useCallback((task: ModalTask) => {
    setModalQueue((prev) => {
      const isDuplicate = prev.some((existing) => {
        if (existing.type !== task.type) return false;
        
        if (("groupId" in existing) && ("groupId" in task)) {
          if (existing.groupId !== task.groupId) return false;
          if (getAssignmentDateStr(existing.assignment) !== getAssignmentDateStr(task.assignment)) return false;
          return true;
        }
        
        if (("config" in existing) && ("config" in task)) {
          if (existing.config.id !== task.config.id) return false;
          return true;
        }

        return false;
      });

      if (isDuplicate) return prev;
      return [...prev, task];
    });
  }, []);
  
  const dequeueModal = useCallback(() => {
    setModalQueue((prev) => prev.slice(1));
  }, []);
  
  const activeModal = modalQueue[0] || null;

  const handleCloseModal = useCallback(() => {
    if (activeModal) {
      if (activeModal.type === "compilation") {
        const dateStr = getAssignmentDateStr(activeModal.assignment);
        localStorage.setItem(`seen_recap_${activeModal.groupId}_${dateStr}`, "true");
      } else if (activeModal.type === "reveal") {
        const dateStr = getAssignmentDateStr(activeModal.assignment);
        localStorage.setItem(`revealed_vlogger_${activeModal.groupId}_${dateStr}`, "true");
      }
    }
    dequeueModal();
  }, [activeModal, dequeueModal]);

  const checkRevealStatus = useCallback(async (groupId: string) => {
    try {
      const res = await getOrCreateTodayAssignment(groupId);
      if (res.success && res.assignment) {
        if (typeof window !== "undefined") {
          try {
            const existing = localStorage.getItem(`cached_streaks_${groupId}`);
            const parsed = existing ? JSON.parse(existing) : {};
            localStorage.setItem(
              `cached_streaks_${groupId}`,
              JSON.stringify({ ...parsed, assignment: res.assignment })
            );
          } catch { }
        }

        const dateStr = getAssignmentDateStr(res.assignment);
        if (dateStr) {
          cleanupStaleStorageKeys("reveal", groupId, dateStr);
          const storageKey = `revealed_vlogger_${groupId}_${dateStr}`;
          if (!localStorage.getItem(storageKey)) {
            enqueueModal({ type: "reveal", groupId, assignment: res.assignment });
          }
        }
      }
    } catch (e) {
      console.error("Failed to check vlogger reveal status:", e);
    }
  }, [enqueueModal]);

  const checkGlobalCompilation = useCallback(async (groupId: string) => {
    try {
      const res = await getLatestCompilation(groupId);
      if (res.success && res.assignment) {
        const dateStr = getAssignmentDateStr(res.assignment);
        if (dateStr) {
          cleanupStaleStorageKeys("recap", groupId, dateStr);
          const seenKey = `seen_recap_${groupId}_${dateStr}`;
          if (!localStorage.getItem(seenKey)) {
             enqueueModal({ type: "compilation", groupId, assignment: res.assignment });
          }
        }
      }
    } catch (e) {
      console.error("Failed to check compilation recap status:", e);
    }
  }, [enqueueModal]);

  const loadGroups = useCallback(async () => {
    setRefreshing(true);
    const res = await getUserGroups();
    setRefreshing(false);
    setGroupsLoading(false);

    if (res.success && res.groups && res.groups.length > 0) {
      setGroups(res.groups);
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_groups", JSON.stringify(res.groups));
        const stored = localStorage.getItem("active_group_id");
        const foundIndex = res.groups.findIndex((g) => g.id === stored);
        if (foundIndex !== -1) {
          setActiveGroupIndex(foundIndex);
          checkRevealStatus(res.groups[foundIndex].id);
          checkGlobalCompilation(res.groups[foundIndex].id);
        } else {
          localStorage.setItem("active_group_id", res.groups[0].id);
          setActiveGroupIndex(0);
          checkRevealStatus(res.groups[0].id);
          checkGlobalCompilation(res.groups[0].id);
        }
      }
    } else {
      setGroups([]);
    }
  }, [checkRevealStatus, checkGlobalCompilation]);

  // Strictly initialize groups once on layout mount, breaking any loop cascades
  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the route actually transitions server-side, remove the optimistic override flag entirely
  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const handleGroupIndexChange = useCallback(
    (index: number) => {
      setActiveGroupIndex(index);
      if (typeof window !== "undefined" && groups[index]) {
        const groupId = groups[index].id;
        localStorage.setItem("active_group_id", groupId);
        window.dispatchEvent(new CustomEvent("group-changed", { detail: groupId }));
        checkRevealStatus(groupId);
        checkGlobalCompilation(groupId);
      }
    },
    [groups, checkRevealStatus, checkGlobalCompilation]
  );

  const handleNav = (id: string, href: string) => {
    const activeRouteTab = pathname.split("/").pop() || "today";
    if (activeRouteTab === id) return;
    
    // Instantly intercept UI for lighting fast response while router works in background
    setOptimisticTab(id);
    router.push(href);
  };

  useEffect(() => {
    // Check local storage for version updates
    if (typeof window !== "undefined") {
      const seenVersion = localStorage.getItem("myturn_seen_version");
      if (seenVersion !== APP_VERSION) {
        setShowNewFeatures(true);
      }
    }

    const handleOpenSheet = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, data } = customEvent.detail;
      setActiveSheet(type);
      setSheetData(data);
      if (type === "comments" && data?.comments) {
        setCommentsList(data.comments);
      }
    };

    const handleRecordStep = (e: Event) => {
      const customEvent = e as CustomEvent<"CAMERA" | "PREVIEW">;
      setRecordStep(customEvent.detail);
    };

    const handleShowAchievement = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const found = ACHIEVEMENT_MOCKS.find((a) => a.id === customEvent.detail);
      if (found) {
        posthog.capture("achievement_unlocked", { achievement_id: found.id, achievement_title: found.topContent?.title });
        enqueueModal({ type: "achievement", config: found });
      }
    };

    const handleShowLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const detail = customEvent.detail;
      const isIndiv = detail.type === "individual";
      const activeLevelUpConfig = {
        id: `level-up-${Date.now()}`,
        particles: "confetti" as const,
        topContent: {
          title: isIndiv ? t("levelUp.indivTitle") : t("levelUp.groupTitle"),
          highlight: isIndiv ? t("levelUp.unlocked") : t("levelUp.levelUp"),
        },
        image: {
          src: isIndiv ? "/assets/icons/crown.png" : "/assets/icons/fire.png",
          value: isIndiv ? String(detail.to).charAt(0) : String(detail.to),
        },
        mainContent: {
          title: isIndiv ? String(detail.to) : t("levelUp.levelReached", { to: detail.to }),
          subtitle: isIndiv ? t("levelUp.rankPromoted") : `Group: ${detail.name}`,
          description: isIndiv
            ? t("levelUp.indivDesc", { from: detail.from, to: detail.to })
            : t("levelUp.groupDesc", { to: detail.to }),
        },
        primaryAction: {
          label: t("levelUp.claimGlory"),
        },
      };
      enqueueModal({ type: "levelUp", config: activeLevelUpConfig });
    };

    const handleOpenLogout = () => {
      setShowLogoutConfirm(true);
    };

    window.addEventListener("open-bottom-sheet" as any, handleOpenSheet);
    window.addEventListener("reload-groups", loadGroups);
    window.addEventListener("record-step-changed" as any, handleRecordStep);
    window.addEventListener("show-achievement" as any, handleShowAchievement);
    window.addEventListener("show-level-up" as any, handleShowLevelUp);
    window.addEventListener("open-logout-confirm", handleOpenLogout);

    return () => {
      window.removeEventListener("open-bottom-sheet" as any, handleOpenSheet);
      window.removeEventListener("reload-groups", loadGroups);
      window.removeEventListener("record-step-changed" as any, handleRecordStep);
      window.removeEventListener("show-achievement" as any, handleShowAchievement);
      window.removeEventListener("show-level-up" as any, handleShowLevelUp);
      window.removeEventListener("open-logout-confirm", handleOpenLogout);
    };
  }, [loadGroups, enqueueModal, t]);

  const handleCloseNewFeatures = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("myturn_seen_version", APP_VERSION);
    }
    setShowNewFeatures(false);
  };

  useEffect(() => {
    async function initializePush() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        return;
      }
      try {
        const registration = await registerPushServiceWorker();
        if (
          typeof window.Notification !== "undefined" &&
          window.Notification.permission === "granted"
        ) {
          const key = getVapidPublicKey();
          const convertedKey = urlBase64ToUint8Array(key);
          const subscription = await subscribeToPush(registration, convertedKey);
          await saveSubscription(subscription.toJSON() as any);
        }
      } catch (err) {
        console.warn("Silent push initialization bypassed:", err);
      }
    }
    initializePush();
  }, []);

  const postNewComment = async () => {
    if (!commentInput.trim() || !sheetData?.clipId) return;
    if (commentInput.length > 30) {
      setCreateError(t("sheets.maxChars"));
      return;
    }
    setSubmittingComment(true);
    const res = await addComment(sheetData.clipId, commentInput);
    setSubmittingComment(false);
    if (res.success && res.comment) {
      posthog.capture("comment_posted", { clip_id: sheetData?.clipId, comment_length: commentInput.trim().length });
      setCommentsList((prev) => [...prev, res.comment]);
      setCommentInput("");
      setCreateError("");
      window.dispatchEvent(new CustomEvent("vlogs-refreshed"));

      if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
        res.newlyUnlocked.forEach((id: string) => {
          window.dispatchEvent(new CustomEvent("show-achievement", { detail: id }));
        });
      }
    } else if (res.error) {
      setCreateError(res.error);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLeaveGroup = () => {
    if (!sheetData?.groupId) return;
    setShowLeaveConfirm(true);
  };

  const confirmLeaveGroup = async () => {
    if (!sheetData?.groupId) return;
    setLeavingGroup(true);
    const res = await leaveGroup(sheetData.groupId);
    setLeavingGroup(false);
    setShowLeaveConfirm(false);

    if (res.success) {
      setActiveSheet(null);
      loadGroups();
      router.push("/social");
    } else {
      alert(res.error || "Failed to leave group.");
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await deleteSubscription(subscription.endpoint);
              await subscription.unsubscribe();
            }
          }
        }
      } catch (err) {
        console.warn("Silent push unsubscription during logout bypassed:", err);
      }

      localStorage.clear();
      sessionStorage.clear();
    }
    posthog.reset();
    signOut({ callbackUrl: "/" });
  };

  const activeRouteTab = pathname.split("/").pop() || "today";
  const currentViewTab = optimisticTab || activeRouteTab;

  const isRecordPreview = currentViewTab === "record" && recordStep === "PREVIEW";
  const showMainChrome = currentViewTab !== "streaks" && !isRecordPreview;
  const isTodayTab = currentViewTab === "today";
  const isStreaksTab = currentViewTab === "streaks";
  const showGroupHeader = groups.length > 1 && (isStreaksTab || isTodayTab);
  const showBottomNav = currentViewTab !== "record" || recordStep === "CAMERA";
  
  // Guard evaluation prevents showing "No Groups" screen immediately if data hasn't processed
  const hasNoGroups = groups.length === 0 && !groupsLoading;

  const isBypassPage = 
    currentViewTab === "social" || 
    currentViewTab === "profile" || 
    pathname.startsWith("/social") || 
    pathname.startsWith("/profile");

  const showNoGroupsScreen = hasNoGroups && !isBypassPage;

  if (typeof window !== "undefined" && groups[activeGroupIndex]) {
    localStorage.setItem("active_group_id", groups[activeGroupIndex].id);
  }

  const isSwipeableTab = isTodayTab || isStreaksTab;

  const renderOptimisticSkeleton = () => {
    switch (optimisticTab) {
      case "today": return <TodaySkeleton />;
      case "streaks": return <StreaksSkeleton />;
      case "social": return <SocialSkeleton />;
      case "profile": return <ProfileSkeleton />;
      case "record": return <RecordLoadingState />;
      default: return null;
    }
  };

  // Instant UI handoff logic
  const activeContentLayer = optimisticTab ? renderOptimisticSkeleton() : children;

  const pageContent = (
    <div
      className={`relative flex-1 min-h-0 flex flex-col transition-all duration-300 ease-out ${
        showMainChrome ? "px-4" : "p-0"
      }`}
      style={{
        paddingTop: showGroupHeader
          ? "1rem"
          : isRecordPreview
            ? "0px"
            : "max(16px, env(safe-area-inset-top, 0px))",
        paddingBottom: "0px",
      }}
    >
      <div 
        className="flex-1 w-full h-full flex flex-col min-h-0 relative overflow-hidden overflow-x-hidden scrollbar-hide"
        style={{
          paddingBottom: showBottomNav ? "80px" : "24px",
        }}
      >
        {activeContentLayer}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 sm:relative sm:min-h-screen bg-black flex sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden select-none">
      {/* Scope background overrides for native child navbar components dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-blur-container > div, 
        .navbar-blur-container > nav {
          background: transparent !important;
          background-color: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
      `}} />

      <div
        className="absolute inset-0 sm:relative sm:w-[393px] sm:h-[812px] sm:rounded-[48px] sm:p-[8px] flex flex-col justify-between transition-all duration-300 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #4f4f52 0%, #161618 25%, #000000 100%)",
          boxShadow:
            "inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.8), 0 30px 60px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        <NotificationEnforcer>
          <div className="relative w-full h-full sm:rounded-[40px] rounded-none overflow-hidden flex flex-col bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, ${NEUTRAL_PAGE_BG.light}, ${NEUTRAL_PAGE_BG.dark})`,
                }}
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col h-full justify-between overflow-hidden">
              {showNoGroupsScreen ? (
                <NoGroupsScreen onNavigate={handleNav} />
              ) : (
                <>
                  {showGroupHeader && (
                    <AppHeader
                      groups={groups}
                      activeIndex={activeGroupIndex}
                      onSelectIndex={handleGroupIndexChange}
                    />
                  )}

                  {isSwipeableTab ? (
                    <GroupSwipePager
                      groups={groups}
                      activeIndex={activeGroupIndex}
                      onIndexChange={handleGroupIndexChange}
                      disabled={false}
                    >
                      {pageContent}
                    </GroupSwipePager>
                  ) : (
                    pageContent
                  )}
                </>
              )}

              <div
                className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
                  showBottomNav ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
                }`}
              >
                {/* Advanced Multi-Layer Progressive Gradient Blur Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[110px] pointer-events-none overflow-hidden select-none">
                  {/* Layer 1: ultra-subtle blur starting at the very top */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: "blur(2px)",
                      WebkitBackdropFilter: "blur(2px)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 45%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 45%)",
                    }}
                  />
                  {/* Layer 2: soft blur transitioning through the upper-mid segment */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 75%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 75%)",
                    }}
                  />
                  {/* Layer 3: medium blur across the mid-to-lower segment */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 90%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 90%)",
                    }}
                  />
                  {/* Layer 4: deep blur intensifying near the bottom */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,1) 100%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,1) 100%)",
                    }}
                  />
                  {/* Layer 5: maximum blur concentrated at the absolute bottom edge */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 80%, rgba(0,0,0,1) 100%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 80%, rgba(0,0,0,1) 100%)",
                    }}
                  />
                  {/* Darkening gradient overlay for optimal legibility of navbar icons */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.92) 100%)",
                    }}
                  />
                </div>

                {/* Interactive Navbar Element */}
                <div className="relative z-10 w-full navbar-blur-container">
                  <BottomNavRouter optimisticTab={optimisticTab} onNavigate={handleNav} />
                </div>
              </div>
            </div>

            <GroupSheetContent
              activeSheet={activeSheet}
              sheetData={sheetData}
              commentsList={commentsList}
              commentInput={commentInput}
              commentError={commentError}
              submittingComment={submittingComment}
              copySuccess={copySuccess}
              onCommentInputChange={(value) => {
                setCommentInput(value);
                if (value.length > 30) {
                  setCreateError(t("sheets.maxChars"));
                } else {
                  setCreateError("");
                }
              }}
              onSubmitComment={postNewComment}
              onCopyInviteCode={copyInviteCode}
              onLeaveGroup={handleLeaveGroup}
              onCloseSheet={() => {
                setActiveSheet(null);
                setCommentInput("");
                setCreateError("");
              }}
            />

            <LeaveGroupSheet
              isOpen={showLeaveConfirm}
              onClose={() => setShowLeaveConfirm(false)}
              onConfirm={confirmLeaveGroup}
              leavingGroup={leavingGroup}
            />

            <LogoutConfirmSheet
              isOpen={showLogoutConfirm}
              onCancel={() => setShowLogoutConfirm(false)}
              onConfirm={handleLogout}
            />

            <AnimatePresence mode="wait">
              {showNewFeatures && (
                <NewFeaturesModal 
                  key="new-features-overlay"
                  isOpen={showNewFeatures}
                  onClose={handleCloseNewFeatures}
                />
              )}
              {activeModal?.type === "compilation" && (
                <CompilationReadyModal 
                  key={`compilation-${activeModal.assignment.id}`}
                  assignment={activeModal.assignment}
                  onClose={handleCloseModal}
                  isArchive={false}
                />
              )}
              {activeModal?.type === "reveal" && (
                <VloggerRevealModal
                  key={`reveal-${activeModal.assignment.id}`}
                  groupId={activeModal.groupId}
                  assignment={activeModal.assignment}
                  onClose={handleCloseModal}
                />
              )}
              {activeModal?.type === "achievement" && (
                <AchievementOverlay
                  key={`achievement-${activeModal.config.id}`}
                  config={activeModal.config}
                  onClose={handleCloseModal}
                />
              )}
              {activeModal?.type === "levelUp" && (
                <AchievementOverlay
                  key={`levelup-${activeModal.config.id}`}
                  config={activeModal.config}
                  onClose={handleCloseModal}
                />
              )}
            </AnimatePresence>

          </div>
        </NotificationEnforcer>
      </div>
    </div>
  );
}