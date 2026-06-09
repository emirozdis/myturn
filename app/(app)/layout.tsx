"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NEUTRAL_PAGE_BG } from "../../lib/theme";
import { AppHeader } from "@/components/app-header";
import { GroupSwipePager } from "@/components/group-swipe-pager";
import { BottomNavRouter } from "@/components/bottom-nav-router";
import { getUserGroups } from "@/actions/group";
import { Loader2, Plus, Users, Copy, Check, Info } from "lucide-react";
import { addComment, getOrCreateTodayAssignment } from "@/actions/vlog";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import { VloggerRevealModal } from "@/components/vlogger-reveal-modal";
import { AchievementOverlay, AchievementConfig } from "@/components/achievements/achievement-overlay";
import { ACHIEVEMENT_MOCKS } from "@/components/achievements/achievement-data";
import {
  registerPushServiceWorker,
  subscribeToPush,
  getVapidPublicKey,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import { saveSubscription } from "@/actions/push";

export interface GroupConfig {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
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

  // Synchronously initialize index to match cache and prevent mid-load remounts
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

  const [activeSheet, setActiveSheet] = useState<"views" | "comments" | "group-info" | null>(null);
  const [sheetData, setSheetData] = useState<any>(null);

  const [commentInput, setCommentInput] = useState("");
  const [commentError, setCreateError] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealAssignment, setRevealAssignment] = useState<any>(null);

  // Global Level Up and Achievement overlays triggers
  const [unlockedOverlay, setUnlockedOverlay] = useState<AchievementConfig | null>(null);
  const [levelUpOverlay, setLevelUpOverlay] = useState<{ type: "group" | "individual"; from: string | number; to: string | number; name?: string } | null>(null);

  const checkRevealStatus = useCallback(async (groupId: string) => {
    try {
      const res = await getOrCreateTodayAssignment(groupId);
      if (res.success && res.assignment) {
        setRevealAssignment(res.assignment);

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

        const storageKey = `revealed_vlogger_${res.assignment.id}`;
        if (!localStorage.getItem(storageKey)) {
          setShowRevealModal(true);
        }
      }
    } catch (e) {
      console.error("Failed to check vlogger reveal status:", e);
    }
  }, []);

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
        } else {
          localStorage.setItem("active_group_id", res.groups[0].id);
          setActiveGroupIndex(0);
          checkRevealStatus(res.groups[0].id);
        }
      }
    } else {
      setGroups([]);
    }
  }, [checkRevealStatus]);

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
      }
    },
    [groups, checkRevealStatus]
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
        setUnlockedOverlay(found);
      }
    };

    const handleShowLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      setLevelUpOverlay(customEvent.detail);
    };

    window.addEventListener("open-bottom-sheet" as any, handleOpenSheet);
    window.addEventListener("reload-groups", loadGroups);
    window.addEventListener("record-step-changed" as any, handleRecordStep);
    window.addEventListener("show-achievement" as any, handleShowAchievement);
    window.addEventListener("show-level-up" as any, handleShowLevelUp);

    return () => {
      window.removeEventListener("open-bottom-sheet" as any, handleOpenSheet);
      window.removeEventListener("reload-groups", loadGroups);
      window.removeEventListener("record-step-changed" as any, handleRecordStep);
      window.removeEventListener("show-achievement" as any, handleShowAchievement);
      window.removeEventListener("show-level-up" as any, handleShowLevelUp);
    };
  }, [loadGroups]);

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

      // Trigger achievement popup if newly unlocked
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

  const isRecordPreview = activeTab === "record" && recordStep === "PREVIEW";
  const showMainChrome = activeTab !== "streaks" && !isRecordPreview;
  const isTodayTab = activeTab === "today";
  const isStreaksTab = activeTab === "streaks";
  const showGroupHeader = groups.length > 1 && (isStreaksTab || isTodayTab);
  const showBottomNav = activeTab !== "record" || recordStep === "CAMERA";
  const hasNoGroups = groups.length === 0 && !groupsLoading;

  // Bypasses the blocker screen if they are specifically navigating to Social or Profile to onboard or adjust settings
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

  // Convert Level Up metadata structurally into high-end standard AchievementConfig on the fly
  const getLevelUpConfig = (): AchievementConfig | null => {
    if (!levelUpOverlay) return null;
    const isIndiv = levelUpOverlay.type === "individual";
    return {
      id: "level-up-overlay-id",
      particles: "confetti",
      topContent: {
        title: isIndiv ? "New Tier Unlocked! 👑" : "Group Level Up! 🌟",
        highlight: isIndiv ? "Unlocked!" : "Level Up!",
      },
      image: {
        src: isIndiv ? "/assets/icons/crown.png" : "/assets/icons/fire.png",
        value: isIndiv ? String(levelUpOverlay.to).charAt(0) : String(levelUpOverlay.to),
      },
      mainContent: {
        title: isIndiv ? String(levelUpOverlay.to) : `Level ${levelUpOverlay.to} Reached`,
        subtitle: isIndiv ? "Rank Promoted" : `Group: ${levelUpOverlay.name}`,
        description: isIndiv
          ? `You ascended from ${levelUpOverlay.from} to ${levelUpOverlay.to} in your group context! Keep up the amazing contribution!`
          : `Your co-op group has reached Level ${levelUpOverlay.to}! Continue building those daily streaks together.`,
      },
      primaryAction: {
        label: "Claim Rank Glory",
        onClick: () => setLevelUpOverlay(null),
      },
    };
  };

  const activeLevelUpConfig = getLevelUpConfig();

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
                {/* Immersive background glow */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none filter blur-[90px] opacity-20"
                  style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
                />

                <div 
                  style={glassStyle(0.04, 24, 0.08)}
                  className="relative z-10 w-full rounded-[36px] border border-white/5 p-6 flex flex-col items-center text-center shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
                >
                  {/* Glowing custom icon container */}
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

                  {/* iOS-inspired interactive step guide */}
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

                {/* Wrap layout content in the GroupSwipePager ONLY on swipeable tabs */}
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

          {/* Global Bottom Sheet */}
          <AnimatePresence>
            {activeSheet && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    setActiveSheet(null);
                    setCommentInput("");
                    setCreateError("");
                  }}
                  className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
                />

                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute bottom-0 inset-x-0 z-50 rounded-t-[32px] p-6 max-h-[80%] flex flex-col bg-neutral-950/95 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 flex-shrink-0" />

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
                                  <span className="text-white/70 text-[11px] font-medium truncate w-full text-center mt-0.5">
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
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Vlogger Selection Reveal Modal */}
          <AnimatePresence>
            {showRevealModal && revealAssignment && groups[activeGroupIndex] && (
              <VloggerRevealModal
                groupId={groups[activeGroupIndex].id}
                assignment={revealAssignment}
                onClose={() => setShowRevealModal(false)}
              />
            )}
          </AnimatePresence>

          {/* Dynamic Achievement Unlock Overlay Popup */}
          <AnimatePresence>
            {unlockedOverlay && (
              <AchievementOverlay
                config={unlockedOverlay}
                onClose={() => setUnlockedOverlay(null)}
              />
            )}
          </AnimatePresence>

          {/* Dynamic Level Up Popup Modal - Re-routed to render with exact same high-end layout matching achievements */}
          <AnimatePresence>
            {levelUpOverlay && activeLevelUpConfig && (
              <AchievementOverlay
                config={activeLevelUpConfig}
                onClose={() => setLevelUpOverlay(null)}
              />
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}