"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

function getLocalDateInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const year = parts.find((p) => p.type === "year")?.value;

  // Create a Date object forced to midnight UTC for that calendar day
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

export async function getOrCreateTodayAssignment(groupId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!group) {
      return { error: "Group not found" };
    }

    const localDate = getLocalDateInTimezone(group.timezone);

    // Using findFirst instead of findUnique with compound keys to bypass Prisma Client generation bugs
    let assignment = await db.dailyAssignment.findFirst({
      where: {
        groupId,
        date: localDate,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        clips: {
          orderBy: { recordedAt: "asc" },
          include: {
            reactions: true,
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
            views: {
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
    });

    if (assignment) {
      return { success: true, assignment };
    }

    // --- Dynamic Auto-Roll Fallback ---
    if (group.members.length === 0) {
      return { error: "No members in group to assign" };
    }

    // Pick a member at random. Ensure we don't pick yesterday's if possible
    const yesterdayDate = new Date(localDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const yesterdayAssignment = await db.dailyAssignment.findFirst({
      where: {
        groupId,
        date: yesterdayDate,
      },
    });

    let pool = group.members;
    if (group.members.length > 1 && yesterdayAssignment) {
      pool = group.members.filter((m) => m.userId !== yesterdayAssignment.userId);
    }

    const chosenMember = pool[Math.floor(Math.random() * pool.length)];

    assignment = await db.dailyAssignment.create({
      data: {
        groupId,
        userId: chosenMember.userId,
        date: localDate,
        status: "active",
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        clips: {
          orderBy: { recordedAt: "asc" },
          include: {
            reactions: true,
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
            views: {
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
    });

    return { success: true, assignment };
  } catch (error: any) {
    return { error: error?.message || "Failed to retrieve or roll daily assignment." };
  }
}

export async function getSignedUploadUrls(groupId: string, assignmentId: string, ext: string = "webm") {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const timestamp = Date.now();
    const videoPath = `${groupId}/${assignmentId}/${timestamp}-vlog.${ext}`;
    const thumbPath = `${groupId}/${assignmentId}/${timestamp}-thumb.jpg`;

    // Generate signed upload URLs for vlogs and thumbnails
    const videoResponse = await supabaseServer.storage
      .from("vlogs")
      .createSignedUploadUrl(videoPath);

    const thumbResponse = await supabaseServer.storage
      .from("vlogs")
      .createSignedUploadUrl(thumbPath);

    if (videoResponse.error || thumbResponse.error) {
      throw new Error("Storage Error: Failed to generate signed URLs.");
    }

    return {
      success: true,
      video: { path: videoPath, url: videoResponse.data.signedUrl },
      thumbnail: { path: thumbPath, url: thumbResponse.data.signedUrl }
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to generate signed upload URLs." };
  }
}

export async function createClip(data: {
  groupId: string;
  assignmentId: string;
  videoUrl: string;
  thumbnailUrl: string;
  location?: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Verify user is the assigned vlogger
    const assignment = await db.dailyAssignment.findUnique({
      where: { id: data.assignmentId },
    });

    if (!assignment) {
      return { error: "Active daily assignment not found" };
    }

    if (assignment.userId !== session.user.id) {
      return { error: "It is not your turn to vlog today!" };
    }

    const clip = await db.clip.create({
      data: {
        assignmentId: data.assignmentId,
        userId: session.user.id,
        groupId: data.groupId,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        location: data.location || "Earth",
      },
    });

    // Update daily assignment status to completed if successfully posted
    await db.dailyAssignment.update({
      where: { id: data.assignmentId },
      data: { status: "completed" },
    });

    return { success: true, clip };
  } catch (error: any) {
    return { error: error?.message || "Failed to save clip details." };
  }
}

export async function getSignedReadUrl(bucket: "vlogs" | "thumbnails", path: string) {
  try {
    const response = await supabaseServer.storage.from(bucket).createSignedUrl(path, 3600); // 1 hour link
    if (response.error) {
      throw new Error(response.error.message);
    }
    return { success: true, url: response.data.signedUrl };
  } catch (error: any) {
    return { error: error?.message || "Failed to generate read URL." };
  }
}

export async function toggleReaction(clipId: string, emoji: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.reaction.findFirst({
      where: {
        clipId,
        userId: session.user.id,
        emoji,
      },
    });

    if (existing) {
      await db.reaction.delete({
        where: { id: existing.id },
      });
      return { success: true, removed: true };
    }

    const reaction = await db.reaction.create({
      data: {
        clipId,
        userId: session.user.id,
        emoji,
      },
    });

    return { success: true, reaction };
  } catch (error: any) {
    return { error: error?.message };
  }
}

/**
 * Handle dynamic commentary posts on active vlogs.
 */
export async function addComment(clipId: string, text: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const comment = await db.comment.create({
      data: {
        clipId,
        userId: session.user.id,
        text,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return { success: true, comment };
  } catch (error: any) {
    return { error: error?.message || "Failed to publish comment." };
  }
}

/**
 * Track unique vlog views natively to update active watchers indexes.
 */
export async function trackView(clipId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.view.findUnique({
      where: {
        clipId_userId: {
          clipId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return { success: true, alreadyViewed: true };
    }

    const view = await db.view.create({
      data: {
        clipId,
        userId: session.user.id,
      },
    });

    return { success: true, view };
  } catch (error: any) {
    return { error: error?.message || "Failed to track view." };
  }
}