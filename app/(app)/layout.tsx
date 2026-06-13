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

export interface GroupConfig {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
}

type ModalTask = 
  | { type: "compilation"; groupId: string; assignment: any }
  | { type: "reveal"; groupId: string; assignment: any }
  | { type: "achievement"; config: any }
  | { type: "levelUp"; config: any };

// Scans localStorage and deletes ONLY older modal presentation flags from previous days (retaining other groups' active flags for today)
const cleanupStaleStorageKeys = (groupId: string, currentDateStr: string) => {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Safe-check both patterns and parse the trailing date string dynamically
        if (key.startsWith("revealed_vlogger_") || key.startsWith("seen_recap_")) {
          const parts = key.split("_");
          const keyDate = parts[parts.length - 1]; // Extracts YYYY-MM-DD safely
          
          if (keyDate && keyDate !== currentDateStr) {
            keysToRemove.push(key);
          }
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
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<{
    notifications: PermissionState | "default";
    camera: PermissionState;
    microphone: PermissionState;
    location: PermissionState;
  }>({
    notifications: "default",
    camera: "prompt",
    microphone: "prompt",
    location: "prompt",
  });

  const [isSupported, setIsSupported] = useState(true);
  const [subscribingNotifications, setSubscribingNotifications] = useState(false);
  const [subscribingCameraMic, setSubscribingCameraMic] = useState(false);
  const [subscribingLocation, setSubscribingLocation] = useState(false);
  
  const [notificationsError, setNotificationsError] = useState("");
  const [cameraMicError, setCameraMicError] = useState("");
  const [locationError, setLocationError] = useState("");

  const checkPermissions = useCallback(async () => {
    const states = {
      notifications: "default" as PermissionState | "default",
      camera: "prompt" as PermissionState,
      microphone: "prompt" as PermissionState,
      location: "prompt" as PermissionState,
    };

    // 1. Notifications
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setIsSupported(false);
        states.notifications = "granted"; // bypass if unsupported
      } else {
        states.notifications = window.Notification.permission;
      }
    }

    // 2. Camera
    try {
      const res = await navigator.permissions.query({ name: "camera" as any });
      states.camera = res.state;
      res.onchange = () => {
        setPermissions((prev) => ({ ...prev, camera: res.state }));
      };
    } catch {
      states.camera = "prompt";
    }

    // 3. Microphone
    try {
      const res = await navigator.permissions.query({ name: "microphone" as any });
      states.microphone = res.state;
      res.onchange = () => {
        setPermissions((prev) => ({ ...prev, microphone: res.state }));
      };
    } catch {
      states.microphone = "prompt";
    }

    // 4. Location
    try {
      const res = await navigator.permissions.query({ name: "geolocation" as any });
      states.location = res.state;
      res.onchange = () => {
        setPermissions((prev) => ({ ...prev, location: res.state }));
      };
    } catch {
      states.location = "prompt";
    }

    setPermissions(states);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleRequestNotifications = async () => {
    setSubscribingNotifications(true);
    setNotificationsError("");
    try {
      const result = await window.Notification.requestPermission();
      setPermissions((prev) => ({ ...prev, notifications: result }));

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

  const handleRequestCameraMic = async () => {
    setSubscribingCameraMic(true);
    setCameraMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((prev) => ({ ...prev, camera: "granted", microphone: "granted" }));
    } catch (err: any) {
      console.error("Camera/Mic request failed:", err);
      setCameraMicError("Blocked. Please allow Camera & Microphone access in your browser's site settings.");
      await checkPermissions();
    } finally {
      setSubscribingCameraMic(false);
    }
  };

  const handleRequestLocation = async () => {
    setSubscribingLocation(true);
    setLocationError("");
    if (!("geolocation" in navigator)) {
      setLocationError("Location services not supported on this browser.");
      setSubscribingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermissions((prev) => ({ ...prev, location: "granted" }));
        setSubscribingLocation(false);
      },
      (err) => {
        console.error("Geolocation failed:", err);
        setLocationError("Blocked. Please allow Location access in your browser's site settings.");
        setSubscribingLocation(false);
        checkPermissions();
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
    );
  };

  const isNotificationsGranted = permissions.notifications === "granted";
  const isCameraMicGranted = permissions.camera === "granted" && permissions.microphone === "granted";
  const isLocationGranted = permissions.location === "granted";

  const allGranted = isNotificationsGranted && isCameraMicGranted && isLocationGranted;

  if (loading) {
    return (
      <div className="absolute inset-0 z-[100] bg-[#161618] sm:rounded-[32px] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#e07c30]" />
      </div>
    );
  }

  if (isSupported && !allGranted) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col pt-8 min-h-0 px-6 pb-6 bg-[#161618] sm:rounded-[40px] animate-fade-in select-none">
        <div className="mb-4 flex-shrink-0 mt-4">
          <motion.img
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: [0.95, 1.05, 0.95], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            src="/assets/icons/notification.png"
            alt="Permissions Required"
            className="w-28 h-28 object-contain relative z-10 drop-shadow-2xl mb-4"
          />
          <h1 className="text-white text-3xl sm:text-[32px] font-bold tracking-tight mb-2">Enable Permissions</h1>
          <p className="text-white/60 text-[13px] leading-relaxed">
            MyTurn requires access to notifications, your camera, microphone, and location context to enable close-friend daily vlogging.
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto scrollbar-hide pb-2 justify-start">
          {/* Card 1: Notifications */}
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
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
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

          {/* Card 2: Camera & Microphone */}
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="p-4 rounded-[22px] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: isCameraMicGranted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <Camera size={20} className={isCameraMicGranted ? "text-emerald-400" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[14px]">Camera & Microphone</h4>
                <p className="text-white/40 text-[10.5px] leading-tight mt-0.5">
                  Used to record raw audio-visual moments directly when it's your turn.
                </p>
              </div>
            </div>
            {cameraMicError && <p className="text-red-500 text-[10.5px] font-semibold leading-relaxed whitespace-pre-line">{cameraMicError}</p>}
            <button
              onClick={handleRequestCameraMic}
              disabled={isCameraMicGranted || subscribingCameraMic}
              style={{
                background: isCameraMicGranted ? "rgba(34,197,94,0.15)" : ACCENT,
                color: isCameraMicGranted ? "#22c55e" : "#000",
                border: isCameraMicGranted ? "1px solid rgba(34,197,94,0.3)" : "none"
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {subscribingCameraMic ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : isCameraMicGranted ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Access Granted</span>
                </>
              ) : (
                "Grant Camera & Mic Access"
              )}
            </button>
          </div>

          {/* Card 3: Location Services */}
          <div
            style={glassStyle(0.04, 16, 0.08)}
            className="p-4 rounded-[22px] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: isLocationGranted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <MapPin size={20} className={isLocationGranted ? "text-emerald-400" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[14px]">Location Services</h4>
                <p className="text-white/40 text-[10.5px] leading-tight mt-0.5">
                  Adds contextual city or neighborhood overlays to your daily clip uploads.
                </p>
              </div>
            </div>
            {locationError && <p className="text-red-500 text-[10.5px] font-semibold leading-relaxed whitespace-pre-line">{locationError}</p>}
            <button
              onClick={handleRequestLocation}
              disabled={isLocationGranted || subscribingLocation}
              style={{
                background: isLocationGranted ? "rgba(34,197,94,0.15)" : ACCENT,
                color: isLocationGranted ? "#22c55e" : "#000",
                border: isLocationGranted ? "1px solid rgba(34,197,94,0.3)" : "none"
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {subscribingLocation ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : isLocationGranted ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Location Allowed</span>
                </>
              ) : (
                "Allow Location Access"
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
  const activeTab = pathname.split("/").pop() || "today";

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

  // Queue Modals Configuration
  const [modalQueue, setModalQueue] = useState<ModalTask[]>([]);
  
  const enqueueModal = useCallback((task: ModalTask) => {
    setModalQueue((prev) => [...prev, task]);
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
          cleanupStaleStorageKeys(groupId, dateStr);
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
          cleanupStaleStorageKeys(groupId, dateStr);
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

  useEffect(() => {
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

  const isRecordPreview = activeTab === "record" && recordStep === "PREVIEW";
  const showMainChrome = activeTab !== "streaks" && !isRecordPreview;
  const isTodayTab = activeTab === "today";
  const isStreaksTab = activeTab === "streaks";
  const showGroupHeader = groups.length > 1 && (isStreaksTab || isTodayTab);
  const showBottomNav = activeTab !== "record" || recordStep === "CAMERA";
  const hasNoGroups = groups.length === 0 && !groupsLoading;

  const isBypassPage = pathname === "/social" || pathname === "/profile";
  const showNoGroupsScreen = hasNoGroups && !isBypassPage;

  if (typeof window !== "undefined" && groups[activeGroupIndex]) {
    localStorage.setItem("active_group_id", groups[activeGroupIndex].id);
  }

  const isSwipeableTab = isTodayTab || isStreaksTab;

  const pageContent = (
    <div
      className={`relative flex-1 min-h-0 flex flex-col transition-all duration-300 ease-out ${
        showMainChrome ? "px-4 pb-4" : "p-0"
      }`}
      style={{
        paddingTop: showGroupHeader
          ? "1rem"
          : isRecordPreview
            ? "0px"
            : "max(16px, env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="flex-1 w-full h-full flex flex-col min-h-0 relative">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 sm:relative sm:min-h-screen bg-black flex sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden select-none">
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
              {groupsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                  <Loader2 size={32} className="animate-spin text-[#e07c30]" />
                </div>
              ) : showNoGroupsScreen ? (
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
                      onClick={() => router.push("/social")}
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
                className={`transition-all duration-300 ease-in-out flex-shrink-0 z-20 relative ${
                  showBottomNav ? "overflow-visible" : "overflow-hidden"
                }`}
                style={{
                  height: showBottomNav ? "auto" : "0px",
                  opacity: showBottomNav ? 1 : 0,
                }}
              >
                <BottomNavRouter />
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
                        {copySuccess ? "Copied" : "Copy Code"}
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

            {/* Centralized Sequential UI Queuing Engine for Overlay Events */}
            <AnimatePresence mode="wait">
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