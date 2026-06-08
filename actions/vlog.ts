"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { sendPushToUser } from "@/actions/push";
import { calculateGroupLevel, getVibeArchetype } from "@/lib/vibe";

function getSecondsUntilMidnightInTz(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const second = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);
    const currentSeconds = hour * 3600 + minute * 60 + second;
    return Math.max(0, 24 * 3600 - currentSeconds);
  } catch (e) {
    const now = new Date();
    const currentSeconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    return Math.max(0, 24 * 3600 - currentSeconds);
  }
}

export async function checkAndUnlockAchievement(userId: string, achievementId: string, groupId: string = "global"): Promise<boolean> {
  try {
    const existing = await db.unlockedAchievement.findUnique({
      where: {
        userId_achievementId_groupId: {
          userId,
          achievementId,
          groupId,
        },
      },
    });

    if (!existing) {
      await db.unlockedAchievement.create({
        data: {
          userId,
          achievementId,
          groupId,
        },
      });
      return true; // Newly unlocked!
    }
    return false;
  } catch (err) {
    console.error("Failed to unlock achievement:", err);
    return false;
  }
}

export async function getUnlockedAchievements() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const unlocked = await db.unlockedAchievement.findMany({
      where: { userId: session.user.id },
    });

    return { success: true, unlocked };
  } catch (error: any) {
    return { error: error?.message || "Failed to query unlocked achievements." };
  }
}

// --- CORE VLOG FUNCTIONS ---

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
 * resetting the associated user's streak in that group and applying
 * harsh progressive deranking penalty.
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

    // HARSH DERANKING: Deduct -150 XP on turn lapses
    const member = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: asg.userId,
        },
      },
    });

    if (member) {
      const newXp = Math.max(0, member.xp - 150);
      await db.groupMember.update({
        where: { id: member.id },
        data: { xp: newXp },
      });
    }
  }

  // HARSH INACTIVITY DECAY:
  // Starts after 5 days of zero activity, -20 XP daily.
  // After 14 days of inactivity, extra -50 XP penalty applied daily (Total -70 XP/day).
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const inactiveMembers = await db.groupMember.findMany({
    where: {
      groupId,
      lastActiveAt: {
        lt: fiveDaysAgo,
      },
    },
  });

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  for (const member of inactiveMembers) {
    let decayAmount = 20;
    const lastActiveTime = new Date(member.lastActiveAt).getTime();
    if (lastActiveTime < fourteenDaysAgo.getTime()) {
      decayAmount += 50; // Heavy inactivity decay trigger
    }

    const newXp = Math.max(0, member.xp - decayAmount);
    await db.groupMember.update({
      where: { id: member.id },
      data: { xp: newXp },
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

    // Fetch fully populated assignment context with group timezone and user details
    const fullyPopulatedAssignment = await db.dailyAssignment.findFirst({
      where: { id: assignment.id },
      include: {
        group: {
          select: {
            timezone: true,
            xp: true,
            level: true,
          },
        },
        user: {
          select: { id: true, name: true, image: true, handle: true, bio: true, location: true },
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

    const group = await db.group.findUnique({
      where: { id: data.groupId },
    });

    if (!group) {
      return { error: "Group parameters unresolved" };
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

    // XP CALCULATIONS
    let individualXpGain = 100; // Duty Bonus
    let groupXpGain = 100;

    // Check First Light: Uploaded in first 2 hours of assignment selection
    const twoHours = 2 * 60 * 60 * 1000;
    if (Date.now() - new Date(assignment.createdAt).getTime() < twoHours) {
      individualXpGain += 50;
      groupXpGain += 50;
    }

    const newlyUnlocked: string[] = [];
    let groupLevelUp: { from: number; to: number } | null = null;
    let individualTierUp: { from: string; to: string } | null = null;

    // Check Savior Bonus: Uploaded in final hour of timezone countdown with active streak >= 10
    const memberRecord = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: data.groupId,
          userId: session.user.id,
        },
      },
    });
    const streakCount = memberRecord?.streak || 0;
    if (getSecondsUntilMidnightInTz(group.timezone) < 3600 && streakCount >= 10) {
      individualXpGain += 150;
      groupXpGain += 150;
      const isNew = await checkAndUnlockAchievement(session.user.id, "the-savior", data.groupId);
      if (isNew) newlyUnlocked.push("the-savior");
    }

    // Unlock zero-hour if posted within 30 minutes of assignment roll
    if (Date.now() - new Date(assignment.createdAt).getTime() < 30 * 60 * 1000) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "zero-hour", data.groupId);
      if (isNew) newlyUnlocked.push("zero-hour");
    }

    // Update dynamic statistics with newly computed XP
    if (memberRecord) {
      const nextStreakValue = isFirstClip ? streakCount + 1 : streakCount;
      const prevArchetype = getVibeArchetype(memberRecord.xp);
      const finalXp = memberRecord.xp + individualXpGain;
      const currArchetype = getVibeArchetype(finalXp);

      if (prevArchetype !== currArchetype) {
        individualTierUp = { from: prevArchetype, to: currArchetype };
      }

      await db.groupMember.update({
        where: { id: memberRecord.id },
        data: {
          xp: finalXp,
          lastActiveAt: new Date(),
          streak: nextStreakValue,
        },
      });

      // Unlock sequential streaks milestones
      if (nextStreakValue >= 5) {
        const isNew = await checkAndUnlockAchievement(session.user.id, "on-duty", data.groupId);
        if (isNew) newlyUnlocked.push("on-duty");
      }
      if (nextStreakValue >= 15) {
        const isNew = await checkAndUnlockAchievement(session.user.id, "the-guardian", data.groupId);
        if (isNew) newlyUnlocked.push("the-guardian");
      }
    }

    const updatedGroupXp = group.xp + groupXpGain;
    const calculatedLevel = calculateGroupLevel(updatedGroupXp);

    if (calculatedLevel > group.level) {
      groupLevelUp = { from: group.level, to: calculatedLevel };
    }

    await db.group.update({
      where: { id: group.id },
      data: {
        xp: updatedGroupXp,
        level: calculatedLevel,
      },
    });

    if (isFirstClip) {
      // Update daily assignment status to completed if successfully posted
      await db.dailyAssignment.update({
        where: { id: data.assignmentId },
        data: { status: "completed" },
      });
    }

    // Dynamic checks for long-term upload achievements
    const clipsCount = await db.clip.count({
      where: { userId: session.user.id },
    });
    if (clipsCount >= 50) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "silver-screen");
      if (isNew) newlyUnlocked.push("silver-screen");
    }
    if (clipsCount >= 150) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "gold-standard");
      if (isNew) newlyUnlocked.push("gold-standard");
    }

    // Night-owl: clip created between 1 AM and 5 AM local server hour
    const serverHour = new Date().getHours();
    if (serverHour >= 1 && serverHour < 5) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "night-owl", data.groupId);
      if (isNew) newlyUnlocked.push("night-owl");
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

    return {
      success: true,
      clip,
      newlyUnlocked,
      groupLevelUp,
      individualTierUp,
    };
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

    const newlyUnlocked: string[] = [];

    // Check Hype-man achievement
    const totalReactions = await db.reaction.count({
      where: { userId: session.user.id },
    });
    if (totalReactions >= 100) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "hype-man");
      if (isNew) newlyUnlocked.push("hype-man");
    }

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

    return { success: true, reaction, newlyUnlocked };
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

    const clip = await db.clip.findUnique({
      where: { id: clipId },
      select: { groupId: true },
    });

    if (!clip) {
      return { error: "Target clip parameters unresolved" };
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

    const newlyUnlocked: string[] = [];

    // SPECTATOR COMMENTARY BONUS: (Capped at 30 XP daily per user)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const commentsWrittenToday = await db.comment.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (commentsWrittenToday * 10 <= 30) {
      const groupMember = await db.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: clip.groupId,
            userId: session.user.id,
          },
        },
      });

      if (groupMember) {
        await db.groupMember.update({
          where: { id: groupMember.id },
          data: {
            xp: groupMember.xp + 10,
            lastActiveAt: new Date(),
          },
        });

        const targetGroup = await db.group.findUnique({
          where: { id: clip.groupId },
        });

        if (targetGroup) {
          const nextGroupXp = targetGroup.xp + 5;
          await db.group.update({
            where: { id: targetGroup.id },
            data: {
              xp: nextGroupXp,
              level: calculateGroupLevel(nextGroupXp),
            },
          });
        }
      }
    }

    // Trigger director's commentary achievement check
    const totalComments = await db.comment.count({
      where: { userId: session.user.id },
    });
    if (totalComments >= 50) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "directors-commentary");
      if (isNew) newlyUnlocked.push("directors-commentary");
    }

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

    return { success: true, comment, newlyUnlocked };
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

    const clip = await db.clip.findUnique({
      where: { id: clipId },
      select: { groupId: true, views: true },
    });

    if (!clip) {
      return { error: "Clip details unresolved" };
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

    const newlyUnlocked: string[] = [];

    // SPECTATOR VIEW BONUS: (Capped at 15 XP daily per user)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsRegisteredToday = await db.view.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (viewsRegisteredToday * 5 <= 15) {
      const groupMember = await db.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: clip.groupId,
            userId: session.user.id,
          },
        },
      });

      if (groupMember) {
        await db.groupMember.update({
          where: { id: groupMember.id },
          data: {
            xp: groupMember.xp + 5,
            lastActiveAt: new Date(),
          },
        });

        const targetGroup = await db.group.findUnique({
          where: { id: clip.groupId },
        });

        if (targetGroup) {
          const nextGroupXp = targetGroup.xp + 2;
          await db.group.update({
            where: { id: targetGroup.id },
            data: {
              xp: nextGroupXp,
              level: calculateGroupLevel(nextGroupXp),
            },
          });
        }
      }
    }

    // First responder trigger: Be the first to view a vlog post 10 times
    const viewsOnThisClip = await db.view.count({
      where: { clipId },
    });
    if (viewsOnThisClip === 1) {
      // Find how many times this user has been the first view
      const firstViewsCount = await db.view.count({
        where: {
          userId: session.user.id,
          clip: {
            views: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      });
      if (firstViewsCount >= 10) {
        const isNew = await checkAndUnlockAchievement(session.user.id, "first-responder", clip.groupId);
        if (isNew) newlyUnlocked.push("first-responder");
      }
    }

    return { success: true, view, newlyUnlocked };
  } catch (error: any) {
    return { error: error?.message || "Failed to track view." };
  }
}