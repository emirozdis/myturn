"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function uploadAvatar(base64Data: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Clean metadata prefix (e.g., "data:image/jpeg;base64,") if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    const userId = session.user.id;
    const path = `avatars/${userId}-${Date.now()}.jpg`;

    // Direct binary upload to the dedicated "avatars" Supabase bucket
    const { error: uploadError } = await supabaseServer.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` };
    }

    // Update user's image field with the Supabase path
    await db.user.update({
      where: { id: userId },
      data: { image: path },
    });

    // Generate pre-signed read URL for immediate client feedback from the avatars bucket
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
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            clips: true,
            groupMembers: true,
          },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Set fallback handle if empty
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

    // Find distinct co-members across user's active groups (friends)
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

    // Fetch user's latest clips
    const rawClips = await db.clip.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: "desc" },
      take: 6,
    });

    // Resolve pre-signed URLs for each clip so the browser can load them securely
    const clips = await Promise.all(
      rawClips.map(async (clip) => {
        try {
          const { data: videoData } = await supabaseServer.storage
            .from("vlogs")
            .createSignedUrl(clip.videoUrl, 3600);
            
          const { data: thumbData } = await supabaseServer.storage
            .from("vlogs")
            .createSignedUrl(clip.thumbnailUrl, 3600);
          
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

    // Resolve pre-signed URL for user's own avatar if it is a storage path inside the avatars bucket
    let avatarUrl = user.image;
    if (user.image && !user.image.startsWith("http") && !user.image.startsWith("data:") && !user.image.startsWith("/")) {
      try {
        const { data: signedData } = await supabaseServer.storage
          .from("avatars")
          .createSignedUrl(user.image, 3600);
        if (signedData) {
          avatarUrl = signedData.signedUrl;
        }
      } catch {
        // Fallback
      }
    }

    const userWithSignedImage = {
      ...user,
      image: avatarUrl,
    };

    // Generate monthly calendar data showing vlogged history
    const calendarDays = Array.from({ length: 30 }).map((_, i) => {
      const dayNum = i + 1;
      const vloggedOnDay = clips.some(
        (clip) => new Date(clip.recordedAt).getDate() === dayNum
      );
      return {
        d: dayNum,
        type: vloggedOnDay ? "vlogged" : "empty",
      };
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
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const formattedHandle = data.handle.toLowerCase().trim().replace(/\s+/g, "");

    // Check unique constraints on handle
    const existing = await db.user.findFirst({
      where: {
        handle: formattedHandle,
        id: { not: session.user.id },
      },
    });

    if (existing) {
      return { error: "Username/handle is already taken by another user." };
    }

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