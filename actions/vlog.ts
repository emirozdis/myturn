"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { sendPushToUser } from "@/actions/push";

export async function getLocalDateInTimezone(timezone: string): Promise<Date> {
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

/**
 * Sweeps and transitions stale active assignments into missed status,
 * resetting the associated user's streak in that group.
 */
export async function processGroupDayTransition(groupId: string, localDate: Date) {
  const missedAssignments = await db.dailyAssignment.findMany({
    where: {
      groupId,
      status: "active",
      date: {
        lt: localDate,
      },
    },
  });

  for (const asg of missedAssignments) {
    await db.dailyAssignment.update({
      where: { id: asg.id },
      data: { status: "missed" },
    });

    await db.groupMember.updateMany({
      where: {
        groupId,
        userId: asg.userId,
      },
      data: { streak: 0 },
    });
  }
}

/**
 * Shared logic to handle day transitions and roll today's assignment cleanly.
 */
export async function rollGroupAssignmentForDate(groupId: string, localDate: Date) {
  // 1. Process any outstanding past day transitions/missed assignments
  await processGroupDayTransition(groupId, localDate);

  // 2. Check if today's assignment already exists
  const existingAssignment = await db.dailyAssignment.findFirst({
    where: {
      groupId,
      date: localDate,
    },
  });

  if (existingAssignment) {
    return existingAssignment;
  }

  // 3. Roll a new assignment
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: true,
    },
  });

  if (!group || group.members.length === 0) {
    return null;
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

  const assignment = await db.dailyAssignment.create({
    data: {
      groupId,
      userId: chosenMember.userId,
      date: localDate,
      status: "active",
    },
  });

  // Notify group participants of the assignment roll
  try {
    const groupMembers = await db.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, handle: true } },
      },
    });

    const chosenUser = groupMembers.find((m) => m.userId === chosenMember.userId)?.user;
    const vloggerName = chosenUser?.name || `@${chosenUser?.handle}` || "A group friend";

    for (const member of groupMembers) {
      if (member.userId === chosenMember.userId) {
        await sendPushToUser(member.userId, {
          title: "It's Your Turn! 🎥",
          body: `You've been selected to vlog for "${group.name}" today! Tap to start recording.`,
          url: "/record",
        });
      } else {
        await sendPushToUser(member.userId, {
          title: "Today's Vlogger Selected! 🍿",
          body: `${vloggerName} has been chosen to vlog for "${group.name}" today. Stay tuned!`,
          url: "/today",
        });
      }
    }
  } catch (pushErr) {
    console.error("Failed to broadcast assignment roll notifications:", pushErr);
  }

  return assignment;
}

export async function getOrCreateTodayAssignment(groupId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { error: "Group not found" };
    }

    const localDate = await getLocalDateInTimezone(group.timezone);

    // Roll or retrieve today's assignment
    const assignment = await rollGroupAssignmentForDate(groupId, localDate);

    if (!assignment) {
      return { error: "No members in group to assign" };
    }

    // Fetch fully populated assignment context with group timezone and user handles
    const fullyPopulatedAssignment = await db.dailyAssignment.findFirst({
      where: { id: assignment.id },
      include: {
        group: {
          select: {
            timezone: true,
          },
        },
        user: {
          select: { id: true, name: true, image: true, handle: true },
        },
        clips: {
          orderBy: { recordedAt: "asc" },
          include: {
            reactions: true,
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: { id: true, name: true, image: true, handle: true },
                },
              },
            },
            views: {
              include: {
                user: {
                  select: { id: true, name: true, image: true, handle: true },
                },
              },
            },
          },
        },
      },
    });

    return { success: true, assignment: fullyPopulatedAssignment };
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

    const isFirstClip = assignment.status === "active";

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

    if (isFirstClip) {
      // Update daily assignment status to completed if successfully posted
      await db.dailyAssignment.update({
        where: { id: data.assignmentId },
        data: { status: "completed" },
      });

      // Increment user's streak in the group
      await db.groupMember.updateMany({
        where: {
          groupId: data.groupId,
          userId: session.user.id,
        },
        data: {
          streak: {
            increment: 1,
          },
        },
      });
    }

    // Notify other group members about the new post
    try {
      const poster = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, handle: true },
      });
      const posterName = poster?.name || `@${poster?.handle}` || "A friend";

      const groupInfo = await db.group.findUnique({
        where: { id: data.groupId },
        select: { name: true },
      });

      const otherMembers = await db.groupMember.findMany({
        where: {
          groupId: data.groupId,
          userId: { not: session.user.id },
        },
      });

      for (const member of otherMembers) {
        await sendPushToUser(member.userId, {
          title: "New Vlog Post! 🎥",
          body: `${posterName} posted a new moment in "${groupInfo?.name || "your group"}"!`,
          url: "/today",
        });
      }
    } catch (pushErr) {
      console.error("Failed to send clip upload push alert:", pushErr);
    }

    return { success: true, clip };
  } catch (error: any) {
    return { error: error?.message || "Failed to save clip details." };
  }
}

export async function getSignedReadUrl(bucket: "vlogs" | "thumbnails" | "avatars", path: string) {
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

    // Notify the clip author about the reaction
    try {
      const targetClip = await db.clip.findUnique({
        where: { id: clipId },
        include: {
          group: { select: { name: true } },
        },
      });

      if (targetClip && targetClip.userId !== session.user.id) {
        const reactor = await db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        });

        await sendPushToUser(targetClip.userId, {
          title: "New Reaction! ❤️",
          body: `${reactor?.name || "A friend"} reacted with ${emoji} to your vlog in "${targetClip.group.name}".`,
          url: "/today",
        });
      }
    } catch (pushErr) {
      console.error("Failed to send reaction push alerts:", pushErr);
    }

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
          select: { id: true, name: true, image: true, handle: true },
        },
      },
    });

    // Notify the clip author of the new comment
    try {
      const targetClip = await db.clip.findUnique({
        where: { id: clipId },
        include: {
          group: { select: { name: true } },
        },
      });

      if (targetClip && targetClip.userId !== session.user.id) {
        const commenter = await db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        });

        const truncatedText = text.length > 60 ? `${text.substring(0, 57)}...` : text;

        await sendPushToUser(targetClip.userId, {
          title: "New Comment! 💬",
          body: `${commenter?.name || "A friend"} commented: "${truncatedText}"`,
          url: "/today",
        });
      }
    } catch (pushErr) {
      console.error("Failed to send comment push alerts:", pushErr);
    }

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