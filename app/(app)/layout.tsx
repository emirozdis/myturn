// ./app/(app)/layout.tsx
"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NEUTRAL_PAGE_BG } from "../../lib/theme";
import { AppHeader } from "@/components/app-header";
import { GroupSwipePager } from "@/components/group-swipe-pager";
import { BottomNavRouter } from "@/components/bottom-nav-router";
import { getUserGroups, leaveGroup } from "@/actions/group";
import { Loader2, Plus, Users, Copy, Check, Info, LogOut, Settings, Bell, Camera, MapPin } from "lucide-react";
import { addComment, getOrCreateTodayAssignment, getLatestCompilation } from "@/actions/vlog";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import { VloggerRevealModal } from "@/components/vlogger-reveal-modal";
import { AchievementOverlay, AchievementConfig } from "@/components/achievements/achievement-overlay";
import { CompilationReadyModal } from "@/components/compilation-ready-modal";
import { ACHIEVEMENT_MOCKS } from "@/components/achievements/achievement-data";
import { UserProfileSheetContent } from "@/components/profile/user-profile-sheet-content";
import {
  registerPushServiceWorker,
  subscribeToPush,
  getVapidPublicKey,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import { saveSubscription, deleteSubscription } from "@/actions/push";
import { signOut } from "next-auth/react";
import { LogoutConfirmSheet } from "@/components/profile/logout-confirm-sheet";
import { BottomSheet } from "@/components/shared/bottom-sheet";

// Imports for Optimistic Tab rendering
import { TodaySkeleton } from "@/components/today/today-skeleton";
import { StreaksSkeleton } from "@/components/streaks/streaks-skeleton";
import { SocialSkeleton } from "@/components/social/social-skeleton";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { RecordLoadingState } from "@/components/record/record-loading-state";

// Custom Changelog release overlay
import { NewFeaturesModal } from "@/components/new-features-modal";

const APP_VERSION = "2.1.0";

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

function NotificationEnforcer({ children }: { children: ReactNode }) {
  // Initialize states with a default optimistic assumptions to allow immediate first-paint SSR and avoid spinners
  const [permission, setPermission] = useState<PermissionState | "default">("granted");
  const [isSupported, setIsSupported] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [subscribingNotifications, setSubscribingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setIsSupported(false);
      } else {
        setPermission(window.Notification.permission);
      }
      setInitialized(true);
    }
  }, []);

  const handleRequestNotifications = async () => {
    setSubscribingNotifications(true);
    setNotificationsError("");
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const registration = await registerPushServiceWorker();
        const key = getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(key);
        const subscription = await subscribeToPush(registration, convertedKey);
        await saveSubscription(subscription.toJSON() as any);
      } else if (result === "denied") {
        setNotificationsError("Blocked. Please manually enable notifications in your browser's site settings.");
      }
    } catch (err: any) {
      let msg = err?.message || "Failed to configure push alerts.";
      if (msg.includes("Registration failed - push service error") || msg.includes("push service error")) {
        msg = "Push service error. Please enable 'Use Google services for push messaging' if on Brave.";
      }
      setNotificationsError(msg);
    } finally {
      setSubscribingNotifications(false);
    }
  };

  const isNotificationsGranted = permission === "granted";

  if (initialized && isSupported && !isNotificationsGranted) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col pt-8 min-h-0 px-6 pb-6 bg-[#161618] sm:rounded-[40px] animate-fade-in select-none">
        <div className="mb-4 flex-shrink-0 mt-4 text-center">
          <div className="flex justify-center mb-6">
            <motion.img
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: [0.95, 1.05, 0.95], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              src="/assets/icons/notification.png"
              alt="Notifications Required"
              className="w-28 h-28 object-contain relative z-10 drop-shadow-2xl mb-4"
            />
          </div>
          <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Enable Notifications</h1>
          <p className="text-white/60 text-[13px] leading-relaxed max-w-[280px] mx-auto">
            MyTurn requires notifications to alert you when it's your turn, friends post, and when daily recaps are ready.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-start max-w-sm mx-auto w-full gap-4">
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="p-4 rounded-[22px] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: isNotificationsGranted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <Bell size={20} className={isNotificationsGranted ? "text-emerald-400" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[14px]">Push Notifications</h4>
                <p className="text-white/40 text-[10.5px] leading-tight mt-0.5">
                  Alerts you when it's your turn, friends post, and when recaps are ready.
                </p>
              </div>
            </div>
            {notificationsError && <p className="text-red-500 text-[10.5px] font-semibold leading-relaxed whitespace-pre-line">{notificationsError}</p>}
            <button
              onClick={handleRequestNotifications}
              disabled={isNotificationsGranted || subscribingNotifications}
              style={{
                background: isNotificationsGranted ? "rgba(34,197,94,0.15)" : ACCENT,
                color: isNotificationsGranted ? "#22c55e" : "#000",
                border: isNotificationsGranted ? "1px solid rgba(34,197,94,0.3)" : "none"
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {subscribingNotifications ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : isNotificationsGranted ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Alerts Activated</span>
                </>
              ) : (
                "Enable Notifications"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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
          title: isIndiv ? "New Tier Unlocked! 👑" : "Group Level Up! 🌟",
          highlight: isIndiv ? "Unlocked!" : "Level Up!",
        },
        image: {
          src: isIndiv ? "/assets/icons/crown.png" : "/assets/icons/fire.png",
          value: isIndiv ? String(detail.to).charAt(0) : String(detail.to),
        },
        mainContent: {
          title: isIndiv ? String(detail.to) : `Level ${detail.to} Reached`,
          subtitle: isIndiv ? "Rank Promoted" : `Group: ${detail.name}`,
          description: isIndiv
            ? `You ascended from ${detail.from} to ${detail.to} in your group context! Keep up the amazing contribution!`
            : `Your co-op group has reached Level ${detail.to}! Continue building those daily streaks together.`,
        },
        primaryAction: {
          label: "Claim Rank Glory",
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
  }, [loadGroups, enqueueModal]);

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
      setCreateError("Maximum 30 characters.");
      return;
    }
    setSubmittingComment(true);
    const res = await addComment(sheetData.clipId, commentInput);
    setSubmittingComment(false);
    if (res.success && res.comment) {
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
        className="flex-1 w-full h-full flex flex-col min-h-0 relative overflow-y-auto overflow-x-hidden scrollbar-hide"
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
                <div className="flex-1 flex flex-col justify-center px-6 py-8 relative overflow-hidden animate-fade-in">
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none filter blur-[90px] opacity-20"
                    style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
                  />

                  <div 
                    style={glassStyle(0.04, 24, 0.08)}
                    className="relative z-10 w-full rounded-[36px] border border-white/5 p-6 flex flex-col items-center text-center shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
                  >
                    <div className="relative mb-6">
                      <div 
                        className="absolute inset-0 rounded-full blur-xl scale-125 opacity-30"
                        style={{ background: ACCENT }}
                      />
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative z-10 bg-white/[0.03] backdrop-blur-md"
                      >
                        <Users size={32} style={{ color: ACCENT }} className="animate-pulse" />
                      </div>
                    </div>

                    <h3 className="text-white font-extrabold text-xl tracking-tight mb-2">
                      Create or Join a Group
                    </h3>
                    
                    <p className="text-white/50 text-[13px] leading-relaxed max-w-[250px] mb-6">
                      MyTurn is built for close friends. Share raw, daily moments and grow your streaks!
                    </p>

                    <div className="w-full flex flex-col gap-3 text-left mb-6">
                      {[
                        { step: "1", title: "Join with Invite Code", desc: "Use a shared code from your friends or create your own." },
                        { step: "2", title: "Wait for Your Turn", desc: "A random daily vlogger is automatically rolled each morning." },
                        { step: "3", title: "Vlog Your Day", desc: "Upload raw snippets of your day to keep the group streak alive." }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3.5 items-start p-3 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                            style={{ background: `${ACCENT}15`, color: ACCENT }}
                          >
                            {item.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-xs leading-none mb-1">{item.title}</h4>
                            <p className="text-white/40 text-[10px] leading-normal">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleNav("social", "/social")}
                      style={{ 
                        background: `linear-gradient(135deg, ${ACCENT}, #ff9a44)`,
                        boxShadow: "0 6px 24px rgba(224,124,48,0.3)"
                      }}
                      className="w-full py-4 rounded-2xl text-black font-extrabold text-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-2"
                    >
                      <span>Get Started</span>
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
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
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 90%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 90%)",
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

            <BottomSheet
              isOpen={activeSheet !== null}
              onClose={() => {
                setActiveSheet(null);
                setCommentInput("");
                setCreateError("");
              }}
              zIndex={40}
              className="p-6 max-h-[80%]"
            >
              <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide flex flex-col gap-4">
                {activeSheet === "views" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                      <Info size={16} className="text-[#e07c30]" />
                      <h3 className="text-white text-base font-bold">
                        Seen by ({sheetData?.views?.length || 0})
                      </h3>
                    </div>
                    {sheetData?.views && sheetData.views.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {sheetData.views.map((view: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                          >
                            <Avatar src={view.user?.image} name={view.user?.name} size={40} />
                            <span className="text-white text-sm font-bold">
                              {view.user?.name || "Group Friend"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/40 text-xs">No views registered yet.</p>
                    )}
                  </div>
                )}

                {activeSheet === "comments" && (
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <h3 className="text-white text-base font-bold flex-shrink-0">
                        Comments ({commentsList.length})
                      </h3>
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                        {commentsList.map((comm: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                          >
                            <Avatar src={comm.user?.image} name={comm.user?.name} size={32} />
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-white text-xs font-bold">
                                {comm.user?.name || "Friend"}
                              </span>
                              <span className="text-white/70 text-[11px] font-medium truncate w-full mt-0.5">
                                {comm.text}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2 flex-shrink-0">
                      {commentError && (
                        <p className="text-red-500 text-[10px] font-semibold">{commentError}</p>
                      )}
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          maxLength={30}
                          value={commentInput}
                          onChange={(e) => {
                            setCommentInput(e.target.value);
                            if (e.target.value.length > 30) {
                              setCreateError("Maximum 30 characters.");
                            } else {
                              setCreateError("");
                            }
                          }}
                          placeholder="Write a comment... (Max 30 chars)"
                          className="w-full rounded-full py-3.5 pl-4 pr-12 text-white text-xs outline-none bg-white/5 border border-white/10 focus:border-[#e07c30]/50 placeholder:text-white/30"
                        />
                        <button
                          onClick={postNewComment}
                          disabled={submittingComment || !commentInput.trim()}
                          style={{ background: ACCENT }}
                          className="absolute right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-black font-bold disabled:opacity-50"
                        >
                          {submittingComment ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSheet === "group-info" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-white text-lg font-bold">{sheetData?.groupName}</h3>
                      <span className="text-white/45 text-xs font-medium">
                        Group Details Inspector
                      </span>
                    </div>

                    <div
                      style={glassStyle(0.04, 16, 0.08)}
                      className="rounded-2xl p-4 flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">
                          Invite Code
                        </span>
                        <span className="text-white font-mono text-xl font-extrabold tracking-widest">
                          {sheetData?.inviteCode}
                        </span>
                      </div>
                      <button
                        onClick={() => copyInviteCode(sheetData?.inviteCode)}
                        style={{ background: copySuccess ? "#22c55e" : ACCENT }}
                        className="px-4 py-2 rounded-xl text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {copySuccess ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                        {copySuccess ? "Copy Code" : "Copy Code"}
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                        Group Directory ({sheetData?.members?.length || 0})
                      </h4>
                      <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                        {sheetData?.members?.map((member: any) => (
                          <div
                            key={member.user.id}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                          >
                            <Avatar
                              src={member.user.image}
                              name={member.user.name}
                              size={40}
                            />
                            <div className="flex flex-col">
                              <span className="text-white text-sm font-bold">
                                {member.user.name}
                              </span>
                              <span className="text-white/45 text-xs">
                                @{member.user.handle}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleLeaveGroup}
                      style={glassStyle(0.04, 24, 0.08)}
                      className="w-full mt-4 py-3.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition hover:bg-red-500/20 active:scale-95"
                    >
                      <LogOut size={16} />
                      Leave Group
                    </button>
                  </div>
                )}

                {activeSheet === "user-profile" && (
                  <UserProfileSheetContent userId={sheetData?.userId} />
                )}
              </div>
            </BottomSheet>

            <BottomSheet
              isOpen={showLeaveConfirm}
              onClose={() => setShowLeaveConfirm(false)}
              zIndex={60}
              className="p-6"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border border-red-500/20 shadow-sm"
                  style={{ background: `rgba(239,68,68,0.15)` }}
                >
                  <LogOut size={24} className="text-red-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-white text-lg font-bold">Leave Group?</h3>
                  <p className="text-white/50 text-xs leading-relaxed max-w-[280px]">
                    You will lose access to all its content and your streaks will be reset.
                  </p>
                </div>
                <div className="w-full flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-white/[0.06] border border-white/10 border-b-[4px] border-white/5 hover:bg-white/[0.1] active:translate-y-[2px] active:border-b-[2px] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmLeaveGroup}
                    disabled={leavingGroup}
                    className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-gradient-to-b from-red-500 to-red-600 border-b-[4px] border-red-800 hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] active:brightness-100 transition-all flex justify-center items-center gap-2 shadow-[0_4px_12px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:translate-y-0 disabled:border-b-[4px]"
                  >
                    {leavingGroup ? <Loader2 size={16} className="animate-spin" /> : "Leave"}
                  </button>
                </div>
              </div>
            </BottomSheet>

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