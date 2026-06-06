"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { NEUTRAL_PAGE_BG } from "../../lib/theme";
import { AppHeader } from "@/components/app-header";
import { GroupSwipePager } from "@/components/group-swipe-pager";
import { BottomNavRouter } from "@/components/bottom-nav-router";
import { getUserGroups, getGroupDetails } from "@/actions/group";
import { Loader2, Plus, Users, Copy, Check, Info } from "lucide-react";
import { addComment, getOrCreateTodayAssignment } from "@/actions/vlog";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import { VloggerRevealModal } from "@/components/vlogger-reveal-modal";

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

  const [groups, setGroups] = useState<GroupConfig[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Monitor record step changes to morph container margins smoothly
  const [recordStep, setRecordStep] = useState<"CAMERA" | "PREVIEW">("CAMERA");

  // Bottom Sheet States
  const [activeSheet, setActiveSheet] = useState<"views" | "comments" | "group-info" | null>(null);
  const [sheetData, setSheetData] = useState<any>(null);
  
  // Interactive inputs inside Bottom Sheet
  const [commentInput, setCommentInput] = useState("");
  const [commentError, setCreateError] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Vlogger Reveal Overlay states
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealAssignment, setRevealAssignment] = useState<any>(null);

  const checkRevealStatus = useCallback(async (groupId: string) => {
    try {
      const res = await getOrCreateTodayAssignment(groupId);
      if (res.success && res.assignment) {
        setRevealAssignment(res.assignment);
        const storageKey = `revealed_vlogger_${res.assignment.id}`;
        const alreadyRevealed = localStorage.getItem(storageKey);
        if (!alreadyRevealed) {
          setShowRevealModal(true);
        }
      }
    } catch (e) {
      console.error("Failed to check vlogger reveal status:", e);
    }
  }, []);

  // Fetch groups dynamically without autojoining new users
  const loadGroups = async () => {
    setLoading(true);
    const res = await getUserGroups();
    if (res.success && res.groups && res.groups.length > 0) {
      setGroups(res.groups);
      if (typeof window !== "undefined") {
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
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleGroupIndexChange = useCallback((index: number) => {
    setActiveGroupIndex(index);
    if (typeof window !== "undefined" && groups[index]) {
      const groupId = groups[index].id;
      localStorage.setItem("active_group_id", groupId);
      window.dispatchEvent(new CustomEvent("group-changed", { detail: groupId }));
      checkRevealStatus(groupId);
    }
  }, [groups, checkRevealStatus]);

  // Handle slide up menu global trigger events
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

    window.addEventListener("open-bottom-sheet" as any, handleOpenSheet);
    window.addEventListener("reload-groups", loadGroups);
    window.addEventListener("record-step-changed" as any, handleRecordStep);
    
    return () => {
      window.removeEventListener("open-bottom-sheet" as any, handleOpenSheet);
      window.removeEventListener("reload-groups", loadGroups);
      window.removeEventListener("record-step-changed" as any, handleRecordStep);
    };
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
      // Refresh current page context
      window.dispatchEvent(new CustomEvent("vlogs-refreshed"));
    } else if (res.error) {
      setCreateError(res.error);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Strip margins and padding completely for streaks and recording full-bleed views
  const isRecordPreview = activeTab === "record" && recordStep === "PREVIEW";
  const showMainChrome = activeTab !== "streaks" && !isRecordPreview;
  const isTodayTab = activeTab === "today";
  const isProfileTab = activeTab === "profile";
  const isStreaksTab = activeTab === "streaks";
  const showGroupHeader = groups.length > 1 && (isStreaksTab || isTodayTab);
  const showBottomNav = activeTab !== "record" || recordStep === "CAMERA";

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/50">
        <Loader2 size={32} className="animate-spin text-[#e07c30]" />
      </div>
    );
  }

  const hasNoGroups = groups.length === 0;

  if (typeof window !== "undefined" && groups[activeGroupIndex]) {
    localStorage.setItem("active_group_id", groups[activeGroupIndex].id);
  }

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
            {hasNoGroups ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                <Users size={48} className="text-[#e07c30] animate-pulse" />
                <h3 className="text-white font-bold text-lg">No Active Groups</h3>
                <p className="text-white/50 text-xs leading-relaxed max-w-[240px]">
                  You are not currently enrolled in any groups. Join or create one in the Social tab to start your vlog journey!
                </p>
                <button
                  onClick={() => router.push("/social")}
                  style={{ background: ACCENT }}
                  className="px-6 py-2.5 rounded-full text-black font-bold text-xs"
                >
                  Join / Create Group
                </button>
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

                <GroupSwipePager
                  groups={groups}
                  activeIndex={activeGroupIndex}
                  onIndexChange={handleGroupIndexChange}
                  disabled={!isStreaksTab && !isTodayTab}
                >
                  {() => (
                    <div
                      className={`flex-1 min-h-0 flex flex-col transition-all duration-300 ease-out ${
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
                      {children}
                    </div>
                  )}
                </GroupSwipePager>
              </>
            )}

            {/* Seamless fading transitions of footer bar */}
            <div 
              className="transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0"
              style={{ 
                height: showBottomNav ? "auto" : "0px",
                opacity: showBottomNav ? 1 : 0
              }}
            >
              <BottomNavRouter />
            </div>
          </div>

          {/* Global Apple-Like Bottom Sheet Overlay Container */}
          <AnimatePresence>
            {activeSheet && (
              <>
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setActiveSheet(null); setCommentInput(""); setCreateError(""); }}
                  className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
                />

                {/* Sliding Card */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  className="absolute bottom-0 inset-x-0 z-50 rounded-t-[32px] p-6 max-h-[80%] flex flex-col bg-neutral-950/95 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                >
                  {/* Apple Handle bar indicator */}
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 flex-shrink-0" />

                  {/* Dynamic Sheets Routing */}
                  <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide flex flex-col gap-4">
                    {activeSheet === "views" && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                          <Info size={16} className="text-[#e07c30]" />
                          <h3 className="text-white text-base font-bold">Seen by ({sheetData?.views?.length || 0})</h3>
                        </div>
                        {sheetData?.views && sheetData.views.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {sheetData.views.map((view: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                <Avatar
                                  src={view.user?.image}
                                  name={view.user?.name}
                                  size={40}
                                />
                                <span className="text-white text-sm font-bold">{view.user?.name || "Group Friend"}</span>
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
                          <h3 className="text-white text-base font-bold flex-shrink-0">Comments ({commentsList.length})</h3>
                          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                            {commentsList.map((comm: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                <Avatar
                                  src={comm.user?.image}
                                  name={comm.user?.name}
                                  size={32}
                                />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-white text-xs font-bold">{comm.user?.name || "Friend"}</span>
                                  <span className="text-white/70 text-xs break-words">{comm.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive comment insert form with 30-char limit enforcement */}
                        <div className="mt-auto flex flex-col gap-2 flex-shrink-0">
                          {commentError && <p className="text-red-500 text-[10px] font-semibold">{commentError}</p>}
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
                              {submittingComment ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSheet === "group-info" && (
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-white text-lg font-bold">{sheetData?.groupName}</h3>
                          <span className="text-white/45 text-xs font-medium">Group Details Inspector</span>
                        </div>

                        <div style={glassStyle(0.04, 16, 0.08)} className="rounded-2xl p-4 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">Invite Code</span>
                            <span className="text-white font-mono text-xl font-extrabold tracking-widest">{sheetData?.inviteCode}</span>
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

                        {/* Members Directory */}
                        <div className="flex flex-col gap-3">
                          <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Group Directory ({sheetData?.members?.length || 0})</h4>
                          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                            {sheetData?.members?.map((member: any) => (
                              <div key={member.user.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                <Avatar
                                  src={member.user.image}
                                  name={member.user.name}
                                  size={40}
                                />
                                <div className="flex flex-col">
                                  <span className="text-white text-sm font-bold">{member.user.name}</span>
                                  <span className="text-white/45 text-xs">@{member.user.handle}</span>
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
        </div>
      </div>
    </div>
  );
}