"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfileData, uploadAvatar } from "@/actions/profile";
import { deleteClip } from "@/actions/vlog";
import { RefreshingBadge } from "@/components/shared/refreshing-badge";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileContent } from "@/components/profile/profile-content";
import { EditProfilePanel } from "@/components/profile/edit-profile-panel";
import { NotificationsPanel } from "@/components/profile/notifications-panel";
import { ClipPlaybackModal } from "@/components/profile/clip-playback-modal";
import { ActivityTab, ProfilePanel } from "@/components/profile/styles";

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);

  const [activityTab, setActivityTab] = useState<ActivityTab>("vlogs");
  const [panel, setPanel] = useState<ProfilePanel>(null);
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_profile");
        if (cached) return JSON.parse(cached);
      } catch { }
    }
    return null;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activePlaybackClip, setActivePlaybackClip] = useState<any>(null);
  const [deletingClip, setDeletingClip] = useState(false);

  const fetchProfile = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setRefreshing(true);
    const res = await getProfileData();
    if (res.success) {
      setProfile(res);
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_profile", JSON.stringify(res));
      }
    }
    setRefreshing(false);
    setInitialLoad(false);
    isFetchingRef.current = false;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const triggerAvatarSelection = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const SIZE = 256;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);

          const base64 = canvas.toDataURL("image/jpeg", 0.85);

          setUploadingAvatar(true);
          const res = await uploadAvatar(base64);
          setUploadingAvatar(false);

          if (res.success) {
            fetchProfile();
          } else if (res.error) {
            alert(res.error);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteActiveClip = async () => {
    if (!activePlaybackClip) return;
    const confirm = window.confirm("Are you sure you want to delete this vlog? This action cannot be undone.");
    if (!confirm) return;

    setDeletingClip(true);
    const res = await deleteClip(activePlaybackClip.id);
    setDeletingClip(false);

    if (res.success) {
      setActivePlaybackClip(null);
      fetchProfile();
      window.dispatchEvent(new CustomEvent("vlogs-refreshed"));
    } else {
      alert(res.error || "Failed to delete vlog.");
    }
  };

  if (initialLoad && !profile) {
    return <ProfileSkeleton />;
  }

  const { user, totalVlogs, groupsCount, friendsCount, clips, calendarDays } = profile;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex-1 flex flex-col relative overflow-hidden -mx-4 min-h-0"
    >
      {refreshing && <RefreshingBadge className="absolute top-4 right-4 z-20" />}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
        id="avatar-file-selector"
      />

      <div
        className="flex-1 overflow-y-auto flex flex-col scrollbar-hide pb-16"
        style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

        <ProfileHeader
          user={user}
          uploadingAvatar={uploadingAvatar}
          onEditProfile={() => setPanel("editProfile")}
          onAvatarClick={triggerAvatarSelection}
        />

        <ProfileContent
          user={user}
          totalVlogs={totalVlogs}
          friendsCount={friendsCount}
          groupsCount={groupsCount}
          clips={clips}
          calendarDays={calendarDays}
          activityTab={activityTab}
          onActivityTabChange={setActivityTab}
          onPanelOpen={(panelName) => {
            if (panelName === "logoutConfirm") {
              window.dispatchEvent(new CustomEvent("open-logout-confirm"));
            } else {
              setPanel(panelName);
            }
          }}
          onPlayClip={setActivePlaybackClip}
        />
      </div>

      <AnimatePresence>
        {activePlaybackClip && (
          <ClipPlaybackModal
            clip={activePlaybackClip}
            deleting={deletingClip}
            onDelete={handleDeleteActiveClip}
            onClose={() => setActivePlaybackClip(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === "editProfile" && (
          <EditProfilePanel
            key="ep"
            user={user}
            onBack={() => setPanel(null)}
            onSaveSuccess={fetchProfile}
            uploadingAvatar={uploadingAvatar}
            triggerAvatarSelection={triggerAvatarSelection}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === "notifications" && (
          <NotificationsPanel key="np" onBack={() => setPanel(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}