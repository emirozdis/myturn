// ./app/(app)/social/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import posthog from "posthog-js";
import { getSocialData, sendFriendRequest, respondFriendRequest, cancelFriendRequest } from "@/actions/social";
import { joinGroup, createGroup, getGroupDetails } from "@/actions/group";
import { RefreshingBadge } from "@/components/shared/refreshing-badge";
import { ToastBanner } from "@/components/shared/toast-banner";
import { SocialSkeleton } from "@/components/social/social-skeleton";
import { SocialTabBar } from "@/components/social/social-tab-bar";
import { FriendsTab } from "@/components/social/friends-tab";
import { GroupsTab } from "@/components/social/groups-tab";
import { RequestsTab } from "@/components/social/requests-tab";
import { DiscoverTab } from "@/components/social/discover-tab";
import { CreateGroupModal } from "@/components/social/create-group-modal";

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("Friends");
  const [joinCode, setJoinCode] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [enrollMsg, setEnrollMsg] = useState("");
  const [joining, setJoining] = useState(false);

  const [socialData, setSocialData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_social");
        if (cached) return JSON.parse(cached);
      } catch { }
    }
    return null;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("🏠");
  const [newGroupTimezone, setNewGroupTimezone] = useState(() => {
    return typeof window !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      : "UTC";
  });
  const [createdGroupCode, setCreatedGroupCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const isFetchingRef = useRef(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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

    setRefreshing(false);
    setInitialLoad(false);
    isFetchingRef.current = false;
  };

  useEffect(() => {
    loadSocial();
  }, []);

  const triggerActiveGroupChange = (id: string) => {
    localStorage.setItem("active_group_id", id);
    window.dispatchEvent(new CustomEvent("reload-groups"));
    window.dispatchEvent(new CustomEvent("group-changed", { detail: id }));
  };

  const handleJoinCode = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    const res = await joinGroup(joinCode);
    setJoining(false);

    if (res.error) {
      setEnrollMsg(res.error);
    } else {
      posthog.capture("group_joined", { group_id: res.group?.id, group_name: res.group?.name });
      setEnrollMsg("Joined successfully! 🎉");
      setJoinCode("");
      loadSocial();
      if (res.group) triggerActiveGroupChange(res.group.id);
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
    const res = await createGroup(newGroupName, newGroupTimezone, newGroupEmoji);
    setCreating(false);

    if (res.error) {
      setCreateError(res.error);
    } else if (res.group) {
      posthog.capture("group_created", { group_id: res.group.id, group_name: newGroupName, timezone: newGroupTimezone });
      setCreatedGroupCode(res.group.inviteCode);
      triggerActiveGroupChange(res.group.id);
    }
  };

  const handleViewGroup = async (groupId: string) => {
    setLoadingDetailsId(groupId);
    const res = await getGroupDetails(groupId);
    setLoadingDetailsId(null);

    if (res.success && res.group) {
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
      showToast(res.error, "error");
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
    showToast(`Code "${code}" copied to clipboard!`);
  };

  const closeCreateFlow = () => {
    setShowCreateModal(false);
    setNewGroupName("");
    setNewGroupEmoji("🏠");
    setNewGroupTimezone(
      typeof window !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        : "UTC"
    );
    setCreatedGroupCode("");
    setCreateError("");
    loadSocial();
  };

  const handleSendRequest = async (userId: string) => {
    setSocialData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggestions: prev.suggestions.map((s: any) => s.id === userId ? { ...s, requested: true } : s),
      };
    });
    const res = await sendFriendRequest(userId);
    if (res.success) {
      posthog.capture("friend_request_sent", { target_user_id: userId });
      showToast("Friend request sent!", "success");
      loadSocial();
    } else {
      showToast(res.error || "Failed to send request.", "error");
      setSocialData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          suggestions: prev.suggestions.map((s: any) => s.id === userId ? { ...s, requested: false } : s),
        };
      });
    }
  };

  const handleRespondRequest = async (requestId: string, accept: boolean) => {
    setSocialData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingRequests: prev.pendingRequests.filter((r: any) => r.id !== requestId),
      };
    });

    const res = await respondFriendRequest(requestId, accept);
    if (res.success) {
      if (accept) posthog.capture("friend_request_accepted", { request_id: requestId });
      showToast(accept ? "Friend request accepted!" : "Friend request declined.", "success");
      loadSocial();
    } else {
      showToast(res.error || "Failed to respond.", "error");
      loadSocial();
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setSocialData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        sentRequests: prev.sentRequests.filter((r: any) => r.id !== requestId),
      };
    });

    const res = await cancelFriendRequest(requestId);
    if (res.success) {
      showToast("Friend request withdrawn.", "success");
      loadSocial();
    } else {
      showToast(res.error || "Failed to withdraw request.", "error");
      loadSocial();
    }
  };

  if (initialLoad && !socialData) {
    return <SocialSkeleton />;
  }

  const { friends = [], groups = [], suggestions = [], trending = [], pendingRequests = [], sentRequests = [] } = socialData;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Friends":
        return (
          <FriendsTab
            friends={friends}
            suggestions={suggestions}
            onFindFriends={() => setActiveTab("Discover")}
            onSendRequest={handleSendRequest}
          />
        );
      case "Groups":
        return (
          <GroupsTab
            joinCode={joinCode}
            onJoinCodeChange={setJoinCode}
            onJoin={handleJoinCode}
            joining={joining}
            enrollMsg={enrollMsg}
            groups={groups}
            loadingDetailsId={loadingDetailsId}
            onCreateGroup={() => setShowCreateModal(true)}
            onViewGroup={handleViewGroup}
            onCopyCode={copyExistingCode}
          />
        );
      case "Requests":
        return (
          <RequestsTab
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
            onRespond={handleRespondRequest}
            onCancelRequest={handleCancelRequest}
          />
        );
      case "Discover":
        return <DiscoverTab trending={trending} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <AnimatePresence>
        {toast && <ToastBanner message={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {refreshing && <RefreshingBadge className="absolute top-4 right-0 z-20" />}

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

        <SocialTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </motion.div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={closeCreateFlow}
        newGroupName={newGroupName}
        onNameChange={setNewGroupName}
        newGroupEmoji={newGroupEmoji}
        onEmojiChange={setNewGroupEmoji}
        newGroupTimezone={newGroupTimezone}
        onTimezoneChange={setNewGroupTimezone}
        createdGroupCode={createdGroupCode}
        copySuccess={copySuccess}
        createError={createError}
        creating={creating}
        onCreate={handleCreateGroup}
        onCopyCode={copyCodeToClipboard}
      />
    </div>
  );
}