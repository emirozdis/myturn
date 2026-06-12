"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { getVibeArchetype } from "@/lib/vibe";

export async function getUserPublicProfile(userId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        handle: true,
        image: true,
        bio: true,
        location: true,
        createdAt: true,
        _count: { select: { clips: true, groupMembers: true } },
      },
    });

    if (!user) return { error: "User not found" };

    const highestMemberXp = await db.groupMember.findFirst({
      where: { userId: user.id },
      orderBy: { xp: "desc" },
    });
    const totalXp = highestMemberXp?.xp || 0;
    const archetype = getVibeArchetype(totalXp);

    let avatarUrl = user.image;
    if (user.image && !user.image.startsWith("http") && !user.image.startsWith("data:") && !user.image.startsWith("/")) {
      try {
        const { data: signedData } = await supabaseServer.storage.from("avatars").createSignedUrl(user.image, 3600);
        if (signedData) avatarUrl = signedData.signedUrl;
      } catch {}
    }

    return {
      success: true,
      user: { ...user, image: avatarUrl, xp: totalXp, archetype },
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to fetch profile." };
  }
}

export async function uploadAvatar(base64Data: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    const userId = session.user.id;
    const path = `avatars/${userId}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabaseServer.storage
      .from("avatars")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });

    if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

    await db.user.update({
      where: { id: userId },
      data: { image: path },
    });

    const { data: signedData } = await supabaseServer.storage
      .from("avatars")
      .createSignedUrl(path, 3600);

    return { success: true, imagePath: path, imageUrl: signedData?.signedUrl };
  } catch (error: any) {
    return { error: error?.message || "Failed to upload avatar" };
  }
}

export async function getProfileData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: { select: { clips: true, groupMembers: true } },
      },
    });

    if (!user) return { error: "User not found" };

    if (!user.handle) {
      const generatedHandle = user.name
        ? user.name.toLowerCase().replace(/\s+/g, "") + Math.floor(100 + Math.random() * 900)
        : `user${Math.floor(1000 + Math.random() * 9000)}`;
      
      await db.user.update({
        where: { id: user.id },
        data: { handle: generatedHandle },
      });
      user.handle = generatedHandle;
    }

    const userGroupIds = await db.groupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    });

    const targetGroupIds = userGroupIds.map((ug) => ug.groupId);

    const friendsCount = await db.groupMember.count({
      where: {
        groupId: { in: targetGroupIds },
        userId: { not: user.id },
      },
    });

    const rawClips = await db.clip.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: "desc" },
      take: 6,
    });

    const clips = await Promise.all(
      rawClips.map(async (clip) => {
        try {
          const { data: videoData } = await supabaseServer.storage.from("vlogs").createSignedUrl(clip.videoUrl, 3600);
          const { data: thumbData } = await supabaseServer.storage.from("vlogs").createSignedUrl(clip.thumbnailUrl, 3600);
          
          return {
            ...clip,
            videoUrl: videoData?.signedUrl || clip.videoUrl,
            thumbnailUrl: thumbData?.signedUrl || clip.thumbnailUrl,
          };
        } catch {
          return clip;
        }
      })
    );

    let avatarUrl = user.image;
    if (user.image && !user.image.startsWith("http") && !user.image.startsWith("data:") && !user.image.startsWith("/")) {
      try {
        const { data: signedData } = await supabaseServer.storage.from("avatars").createSignedUrl(user.image, 3600);
        if (signedData) avatarUrl = signedData.signedUrl;
      } catch {}
    }

    const highestMemberXp = await db.groupMember.findFirst({
      where: { userId: user.id },
      orderBy: { xp: "desc" },
    });
    const totalXp = highestMemberXp?.xp || 0;
    const archetype = getVibeArchetype(totalXp);

    const unlocked = await db.unlockedAchievement.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    });
    const unlockedIds = unlocked.map((u) => u.achievementId);

    const userWithSignedImage = {
      ...user,
      image: avatarUrl,
      xp: totalXp,
      archetype,
      unlockedIds,
    };

    // Calculate calendar days properly mapping exact current month timeline offsets
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNum = i + 1;
      const vloggedOnDay = clips.some(
        (clip) => {
          const d = new Date(clip.recordedAt);
          return d.getDate() === dayNum && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
      );
      return { d: dayNum, type: vloggedOnDay ? "vlogged" : "empty" };
    });

    return {
      success: true,
      user: userWithSignedImage,
      totalVlogs: user._count.clips,
      groupsCount: user._count.groupMembers,
      friendsCount,
      clips,
      calendarDays,
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to retrieve profile insights." };
  }
}

export async function updateProfile(data: {
  name: string;
  handle: string;
  bio: string;
  location: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const formattedHandle = data.handle.toLowerCase().trim().replace(/\s+/g, "");

    const existing = await db.user.findFirst({
      where: {
        handle: formattedHandle,
        id: { not: session.user.id },
      },
    });

    if (existing) return { error: "Username/handle is already taken by another user." };

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        handle: formattedHandle,
        bio: data.bio,
        location: data.location,
      },
    });

    return { success: true, user: updated };
  } catch (error: any) {
    return { error: error?.message || "Failed to update profile changes." };
  }
}