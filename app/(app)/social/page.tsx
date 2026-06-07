"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, ArrowRight, X, Search, Check, Flame, Compass, Loader2, Copy, Sparkles, ChevronLeft, LogOut, CheckCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { getSocialData } from "@/actions/social";
import { joinGroup, createGroup, getGroupDetails, leaveGroup } from "@/actions/group";
import { Avatar } from "@/components/shared/avatar";

const TABS = ["Friends", "Groups", "Requests", "Discover"];

export default function SocialPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Friends");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [enrollMsg, setEnrollMsg] = useState("");
  const [joining, setJoining] = useState(false);

  // Read immediately from cache to prevent skeleton flash
  const [socialData, setSocialData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_social");
        if (cached) return JSON.parse(cached);
      } catch { }
    }
    return null;
  });

  // Create Group State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [createdGroupCode, setCreatedGroupCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Group Detail State
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  // Guard to prevent concurrent duplicate fetching
  const isFetchingRef = useRef(false);

  const loadSocial = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setRefreshing(true);
    const res = await getSocialData();
    if (res.success) {
      setSocialData(res);
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_social", JSON.stringify(res));
      }
    }

    if (typeof window !== "undefined") {
      setActiveGroupId(localStorage.getItem("active_group_id"));
    }
    setRefreshing(false);
    setInitialLoad(false);
    isFetchingRef.current = false;
  };

  useEffect(() => {
    loadSocial();
  }, []);

  const handleJoinCode = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    const res = await joinGroup(joinCode);
    setJoining(false);

    if (res.error) {
      setEnrollMsg(res.error);
    } else {
      setEnrollMsg("Joined successfully! 🎉");
      setJoinCode("");
      loadSocial();

      if (res.group) {
        triggerActiveGroupChange(res.group.id);
      }
    }
    setTimeout(() => setEnrollMsg(""), 3500);
  };

  const handleCreateGroup = async () => {
    setCreateError("");
    if (!newGroupName.trim()) {
      setCreateError("Please enter a group name.");
      return;
    }

    setCreating(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const res = await createGroup(newGroupName, timezone);
    setCreating(false);

    if (res.error) {
      setCreateError(res.error);
    } else if (res.group) {
      setCreatedGroupCode(res.group.inviteCode);
      triggerActiveGroupChange(res.group.id);
    }
  };

  const triggerActiveGroupChange = (id: string) => {
    localStorage.setItem("active_group_id", id);
    setActiveGroupId(id);
    window.dispatchEvent(new CustomEvent("reload-groups"));
    window.dispatchEvent(new CustomEvent("group-changed", { detail: id }));
  };

  const handleViewGroup = async (groupId: string) => {
    setLoadingDetailsId(groupId);
    const res = await getGroupDetails(groupId);
    setLoadingDetailsId(null);

    if (res.success && res.group) {
      // Trigger the slide up Apple Sheet layout for Group Details
      window.dispatchEvent(
        new CustomEvent("open-bottom-sheet", {
          detail: {
            type: "group-info",
            data: {
              groupId: res.group.id,
              groupName: res.group.name,
              inviteCode: res.group.inviteCode,
              members: res.group.members,
            },
          },
        })
      );
    } else if (res.error) {
      alert(res.error);
    }
  };

  const copyCodeToClipboard = () => {
    if (!createdGroupCode) return;
    navigator.clipboard.writeText(createdGroupCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const copyExistingCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    alert(`Code "${code}" copied to clipboard! Share it with friends to invite them. ✨`);
  };

  const closeCreateFlow = () => {
    setShowCreateModal(false);
    setNewGroupName("");
    setCreatedGroupCode("");
    setCreateError("");
    loadSocial();
  };

  // Only show skeleton on absolute first load with no cached data
  if (initialLoad && !socialData) {
    return (
      <div className="flex-1 flex flex-col gap-4 px-0 pt-6 animate-pulse">
        <div className="h-10 rounded-full bg-white/[0.04]" />
        <div className="h-[140px] rounded-[24px] bg-white/[0.04]" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[68px] h-[90px] rounded-[20px] bg-white/[0.03] flex-shrink-0" />
          ))}
        </div>
        <div className="flex-1 rounded-[24px] bg-white/[0.03]" />
      </div>
    );
  }

  const { friends, groups, suggestions, trending } = socialData;
  const activeIndex = TABS.indexOf(activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Friends":
        return (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            <div
              className="relative rounded-[24px] overflow-hidden min-h-[140px] flex items-center"
              style={{
                background: "linear-gradient(90deg, rgba(44,44,44,0.9) 0%, rgba(26,26,26,0.95) 100%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div className="absolute inset-y-0 right-0 w-[65%] pointer-events-none mask-image-gradient">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2c2c2c] via-transparent to-transparent z-10" />
                <img
                  src="/image1.jpg"
                  alt="Friends"
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
              <div className="relative z-20 p-5 w-[70%]">
                <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5">Grow your circle</p>
                <h3 className="text-white text-[20px] font-bold leading-[1.15] mb-4 tracking-tight drop-shadow-md">
                  Add friends to<br />join the fun
                </h3>
                <button
                  onClick={() => setActiveTab("Discover")}
                  className="text-black px-5 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95"
                  style={{ background: ACCENT }}
                >
                  Find Friends
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Group Co-Members ({friends.length})</h2>
              </div>
              {friends.length > 0 ? (
                <div
                  className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 pt-1"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {friends.map((friend: any) => (
                    <div key={friend.id} className="flex flex-col items-center flex-shrink-0 w-[68px] cursor-pointer group">
                      <div className="relative w-[64px] h-[64px] mb-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                        {friend.hasStory && (
                          <div className="absolute inset-0 rounded-full border-[2.5px] border-[#0A84FF] opacity-90 scale-[1.08]" />
                        )}
                        <Avatar
                          src={friend.image}
                          name={friend.name}
                          size={64}
                          ring={friend.hasStory}
                        />
                        <div
                          className={`absolute bottom-0 right-0 w-4 h-4 border-[2.5px] border-[#111] rounded-full shadow-sm ${friend.online ? "bg-[#30D158]" : "bg-[#555]"
                            }`}
                        />
                      </div>
                      <span className="text-white text-[13px] font-semibold truncate w-full text-center tracking-tight">
                        {friend.name}
                      </span>
                      <span className="text-white/50 text-[11px] font-medium truncate w-full text-center mt-0.5">
                        {friend.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-xs">No group members found. Share your group code!</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Suggested Connections</h2>
              </div>
              <div className="flex flex-col gap-3">
                {suggestions.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-[22px] transition-all hover:bg-white/[0.06]"
                    style={glassStyle(0.03, 16, 0.06)}
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        src={user.image}
                        name={user.name}
                        size={44}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[14px] font-bold truncate leading-tight tracking-tight">
                          {user.name}
                        </div>
                        <div className="text-white/50 text-[11px] font-medium mt-0.5">{user.mutual} mutual groups</div>
                      </div>
                    </div>
                    <button
                      className="px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap"
                      style={{
                        background: "rgba(224,124,48,0.15)",
                        border: "1px solid rgba(224,124,48,0.4)",
                        color: ACCENT,
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)"
                      }}
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "Groups":
        return (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            <div className="grid grid-cols-2 gap-3.5">
              <div
                onClick={() => setShowCreateModal(true)}
                className="rounded-[24px] p-4 flex flex-col justify-between shadow-lg min-h-[140px] group cursor-pointer"
                style={glassStyle(0.04, 20, 0.08)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white text-[15px] font-bold leading-tight tracking-tight">Create a Group</h3>
                    <div className="w-8 h-8 rounded-full bg-[#e07c30]/15 flex items-center justify-center border border-[#e07c30]/30 shadow-sm group-hover:scale-110 transition-transform">
                      <Users size={15} className="text-[#e07c30]" />
                    </div>
                  </div>
                  <p className="text-white/50 text-[11px] font-medium leading-relaxed pr-2">Start a new group and invite your friends</p>
                </div>
                <button
                  className="w-full mt-4 py-2 rounded-full text-[12px] font-bold transition-all group-hover:bg-[#e07c30]/20"
                  style={{
                    background: "rgba(224,124,48,0.1)",
                    border: "1px solid rgba(224,124,48,0.3)",
                    color: ACCENT,
                  }}
                >
                  Create Group
                </button>
              </div>

              <div
                className="rounded-[24px] p-4 flex flex-col justify-between shadow-lg min-h-[140px]"
                style={glassStyle(0.04, 20, 0.08)}
              >
                <div>
                  <h3 className="text-white text-[15px] font-bold leading-tight tracking-tight mb-2">Join with Code</h3>
                  <p className="text-white/50 text-[11px] font-medium leading-relaxed">Got an invite code? Join a group</p>
                </div>
                <div className="relative mt-4">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full rounded-full py-2 pl-3.5 pr-10 text-[12px] text-white outline-none placeholder:text-white/30 transition-colors shadow-inner"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <button
                    onClick={handleJoinCode}
                    className="absolute right-1 top-1 bottom-1 w-7 h-7 rounded-full flex items-center justify-center text-black shadow-md hover:scale-105 transition-transform my-auto disabled:opacity-50"
                    style={{ background: ACCENT }}
                    disabled={!joinCode.trim() || joining}
                  >
                    {joining ? (
                      <Loader2 size={12} className="animate-spin text-black" />
                    ) : (
                      <ArrowRight size={14} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {enrollMsg && (
              <p className="text-center text-xs font-semibold text-[#e07c30]">{enrollMsg}</p>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Your Groups ({groups.length})</h2>
              </div>
              <div className="flex flex-col gap-3">
                {groups.map((group: any) => (
                  <div
                    key={group.id}
                    onClick={() => handleViewGroup(group.id)}
                    className="flex items-center justify-between p-3.5 rounded-[22px] transition-all hover:bg-white/[0.06] cursor-pointer"
                    style={glassStyle(0.03, 16, 0.06)}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <img
                        src="/image1.jpg"
                        alt={group.name}
                        className="w-14 h-14 rounded-full object-cover shadow-md border-[1.5px] border-white/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[15px] font-bold truncate tracking-tight">{group.name}</div>
                        <div className="text-white/60 text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
                          <Users size={12} className="opacity-80" />
                          <span>{group.members} members</span>
                        </div>
                        <div className="text-white/40 text-[10px] font-medium mt-1.5 tracking-wide flex items-center gap-1">
                          <Flame size={10} className="text-[#e07c30]" />
                          <span>Code: {group.inviteCode}</span>
                        </div>
                      </div>
                    </div>

                    {loadingDetailsId === group.id ? (
                      <Loader2 size={16} className="animate-spin text-[#e07c30] mr-2.5 flex-shrink-0" />
                    ) : (
                      <button
                        onClick={(e) => copyExistingCode(e, group.inviteCode)}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                        className="p-2.5 rounded-full text-white/70 hover:text-white transition-colors"
                        title="Copy invite code"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "Requests":
        return (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Check size={24} className="text-white/30" />
              </div>
              <p className="text-white/70 font-semibold text-[14px]">You&apos;re all caught up!</p>
              <p className="text-white/40 text-[12px] mt-1">No pending invitations or join requests.</p>
            </div>
          </motion.div>
        );

      case "Discover":
        return (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search groups, people, tags..."
                className="w-full rounded-[18px] py-3.5 pl-10 pr-4 text-[13px] text-white outline-none placeholder:text-white/40 shadow-inner transition-all focus:border-[#e07c30]/50"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Compass size={18} className="text-[#e07c30]" />
                <h2 className="text-white text-[17px] font-bold tracking-tight">Active Groups</h2>
              </div>
              <div className="flex flex-col gap-3">
                {trending.length > 0 ? trending.map((group: any) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3.5 rounded-[22px] transition-all hover:bg-white/[0.06]"
                    style={glassStyle(0.03, 16, 0.06)}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src="/image1.jpg"
                        alt={group.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/15 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[15px] font-bold truncate tracking-tight">
                          {group.name}
                        </div>
                        <div className="text-white/50 text-[11px] font-medium mt-0.5">{group.members} members</div>
                        <div className="text-[#e07c30] text-[10px] font-semibold mt-1">Active {group.active}</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-white/30 text-xs">No suggested groups available yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Background refresh indicator */}
      {refreshing && (
        <div className="absolute top-4 right-0 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e07c30] animate-pulse" />
          <span className="text-white/50 text-[9px] font-semibold tracking-wide">updating</span>
        </div>
      )}
      <motion.div
        key="social-tab"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide -mx-4 -mb-4 px-4 pt-6"
        style={{
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

        <div
          className="flex items-center justify-between p-1.5 rounded-full mb-8 relative z-10 shadow-lg"
          style={glassStyle(0.02, 20, 0.05)}
        >
          <motion.div
            className="absolute top-1.5 bottom-1.5 rounded-full z-0 pointer-events-none"
            animate={{
              left: `calc(${activeIndex} * (100% / ${TABS.length}) + 6px)`,
              width: `calc(100% / ${TABS.length} - 12px)`,
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            style={{
              background: ACCENT,
              boxShadow: "0 2px 8px rgba(224,124,48,0.3), inset 0 1px 1px rgba(255,255,255,0.4)",
            }}
          />
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 relative text-center py-2 text-[12px] font-bold rounded-full transition-colors duration-300 z-10 focus:outline-none"
              style={{
                color: activeTab === tab ? "#111" : "rgba(255,255,255,0.5)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </motion.div>

      {/* Slide-over Create Group Panel */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute inset-0 bg-[#111] z-50 flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={closeCreateFlow}
                className="p-1 rounded-full text-white/70 hover:text-white transition-colors hover:bg-white/5"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-white text-xl font-bold">Create a Group</h2>
            </div>

            {createdGroupCode ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <Sparkles size={48} className="text-[#e07c30] mb-4 animate-bounce" />
                <h3 className="text-white text-2xl font-bold mb-2">Group Created! 🎉</h3>
                <p className="text-white/60 text-xs leading-relaxed max-w-[280px] mb-8">
                  Invite your friends to your group using this unique code. Once they join, you can start rolling daily vlog assignments!
                </p>

                <div
                  style={glassStyle(0.04, 16, 0.08)}
                  className="rounded-2xl p-6 w-full max-w-[280px] flex flex-col items-center gap-4 mb-8"
                >
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Invite Code</span>
                  <span className="text-white font-mono text-3xl font-extrabold tracking-widest selection:bg-amber-500/30">
                    {createdGroupCode}
                  </span>

                  <button
                    onClick={copyCodeToClipboard}
                    style={{ background: copySuccess ? "#22c55e" : ACCENT }}
                    className="w-full py-2.5 rounded-xl text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {copySuccess ? (
                      <>
                        <Check size={14} strokeWidth={3} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={closeCreateFlow}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  className="w-full max-w-[280px] py-3.5 rounded-xl text-white font-bold text-sm transition-transform active:scale-[0.98]"
                >
                  Finish Setup
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  {createError && (
                    <p className="text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 mb-2">
                      {createError}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/70 text-[13px] font-semibold tracking-wide pl-1">Group Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Weekend Warriors"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      style={glassStyle(0.04, 16, 0.08)}
                      className="w-full rounded-[18px] py-3.5 px-4 text-white text-[15px] outline-none transition-colors focus:border-[#e07c30]/50 placeholder:text-white/30"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateGroup}
                  disabled={creating || !newGroupName.trim()}
                  className="w-full py-4 rounded-full text-black font-bold text-[16px] transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: ACCENT }}
                >
                  {creating && <Loader2 size={18} className="animate-spin" />}
                  {creating ? "Creating..." : "Create Group"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}