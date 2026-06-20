// ./actions/vlog.ts
"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { sendPushToUser } from "@/actions/push";
import { calculateGroupLevel, getVibeArchetype } from "@/lib/vibe";
import { generateEdgeUrl } from "@/lib/media-signing";
import { generateMissingThumbnails } from "@/lib/transcoder";

function getVlogCircadianState(timezone: string) {
  const now = new Date();
  let hour = 0, minute = 0, second = 0;
  let year = "", month = "", day = "";

  try {
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
    year = parts.find((p) => p.type === "year")?.value || "";
    month = parts.find((p) => p.type === "month")?.value || "";
    day = parts.find((p) => p.type === "day")?.value || "";
    hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    second = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);
  } catch (e) {
    year = String(now.getUTCFullYear());
    month = String(now.getUTCMonth() + 1).padStart(2, "0");
    day = String(now.getUTCDate()).padStart(2, "0");
    hour = now.getUTCHours();
    minute = now.getUTCMinutes();
    second = now.getUTCSeconds();
  }

  const localDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
  const currentSeconds = hour * 3600 + minute * 60 + second;

  const isSleepMode = hour >= 0 && hour < 9;

  let businessDate = new Date(localDate);
  if (isSleepMode) {
    businessDate.setDate(businessDate.getDate() - 1);
  }

  const sleepTimeLeftSeconds = isSleepMode ? (9 * 3600 - currentSeconds) : 0;
  const wakingTimeLeftSeconds = isSleepMode ? 0 : (24 * 3600 - currentSeconds);

  return {
    localDate,
    businessDate,
    isSleepMode,
    sleepTimeLeftSeconds,
    wakingTimeLeftSeconds,
    currentHour: hour,
  };
}

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
      return true;
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

export async function getLocalDateInTimezone(timezone: string): Promise<Date> {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const month = parts.find((p: Intl.DateTimeFormatPart) => p.type === "month")?.value;
  const day = parts.find((p: Intl.DateTimeFormatPart) => p.type === "day")?.value;
  const year = parts.find((p: Intl.DateTimeFormatPart) => p.type === "year")?.value;

  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

export async function processGroupDayTransition(groupId: string, localDate: Date) {
  const missedAssignments = await db.dailyAssignment.findMany({
    where: {
      groupId,
      status: "active",
      date: { lt: localDate },
    },
  });

  for (const asg of missedAssignments) {
    await db.dailyAssignment.update({
      where: { id: asg.id },
      data: { status: "missed" },
    });

    await db.groupMember.updateMany({
      where: { groupId, userId: asg.userId },
      data: { streak: 0 },
    });

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: asg.userId } },
    });

    if (member) {
      const newXp = Math.max(0, member.xp - 150);
      await db.groupMember.update({
        where: { id: member.id },
        data: { xp: newXp },
      });
    }
  }

  const completedAssignments = await db.dailyAssignment.findMany({
    where: {
      groupId,
      status: "completed",
      date: { lt: localDate },
      recapNotified: false
    },
    include: { user: true, group: true }
  });

  for (const assignment of completedAssignments) {
    await db.dailyAssignment.update({
      where: { id: assignment.id },
      data: { recapNotified: true }
    });

    const members = await db.groupMember.findMany({ where: { groupId } });
    for (const member of members) {
      if (member.userId !== assignment.userId) {
        await sendPushToUser(member.userId, {
          title: "Daily Recap Ready! 🍿",
          body: `@${assignment.user.handle || assignment.user.name}'s vlog from yesterday in "${assignment.group.name}" is ready to watch!`,
          url: "/streaks",
        });
      } else {
        await sendPushToUser(member.userId, {
          title: "Your Day is Ready! 🎉",
          body: `Your vlog from yesterday in "${assignment.group.name}" has been compiled and is ready to share.`,
          url: "/streaks",
        });
      }
    }
  }

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const inactiveMembers = await db.groupMember.findMany({
    where: { groupId, lastActiveAt: { lt: fiveDaysAgo } },
  });

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  for (const member of inactiveMembers) {
    let decayAmount = 20;
    const lastActiveTime = new Date(member.lastActiveAt).getTime();
    if (lastActiveTime < fourteenDaysAgo.getTime()) {
      decayAmount += 50; 
    }

    const newXp = Math.max(0, member.xp - decayAmount);
    await db.groupMember.update({
      where: { id: member.id },
      data: { xp: newXp },
    });
  }
}

export async function rollGroupAssignmentForDate(groupId: string, localDate: Date) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group || group.members.length === 0) {
    return null;
  }

  const circadian = getVlogCircadianState(group.timezone);
  if (circadian.isSleepMode) {
    return await db.dailyAssignment.findFirst({
      where: { groupId, date: circadian.businessDate }
    });
  }

  await processGroupDayTransition(groupId, localDate);

  const existingAssignment = await db.dailyAssignment.findFirst({
    where: { groupId, date: localDate },
  });

  if (existingAssignment) {
    return existingAssignment;
  }

  const yesterdayDate = new Date(localDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterdayAssignment = await db.dailyAssignment.findFirst({
    where: { groupId, date: yesterdayDate },
  });

  const recentAssignments = await db.dailyAssignment.findMany({
    where: { groupId, date: { lt: localDate } },
    orderBy: { date: "desc" },
    take: group.members.length * 2, 
  });

  const currentMemberIds = new Set(group.members.map((m) => m.userId));
  const seenInCycle = new Set<string>();

  for (const asg of recentAssignments) {
    if (!currentMemberIds.has(asg.userId)) continue;
    if (seenInCycle.has(asg.userId)) break;
    seenInCycle.add(asg.userId);
    if (seenInCycle.size === currentMemberIds.size) break;
  }

  let pool = group.members.filter((m) => !seenInCycle.has(m.userId));

  if (pool.length === 0) {
    pool = [...group.members];
  }

  if (pool.length > 1 && yesterdayAssignment) {
    pool = pool.filter((m) => m.userId !== yesterdayAssignment.userId);
  }

  if (pool.length === 0 && group.members.length > 0) {
    pool = [...group.members];
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
    if (!session?.user?.id) return { error: "Unauthorized" };

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return { error: "Group not found" };

    const circadian = getVlogCircadianState(group.timezone);

    let assignment;
    if (circadian.isSleepMode) {
      assignment = await db.dailyAssignment.findFirst({
        where: { groupId, date: circadian.businessDate },
      });
    } else {
      assignment = await rollGroupAssignmentForDate(groupId, circadian.businessDate);
    }

    if (!assignment) {
      return { 
        success: true, 
        assignment: null, 
        isSleepMode: circadian.isSleepMode,
        sleepTimeLeftSeconds: circadian.sleepTimeLeftSeconds,
        wakingTimeLeftSeconds: circadian.wakingTimeLeftSeconds,
      };
    }

    const fullyPopulatedAssignment = await db.dailyAssignment.findFirst({
      where: { id: assignment.id },
      include: {
        group: { 
          select: { 
            timezone: true, xp: true, level: true, name: true,
            members: {
              include: {
                user: { select: { id: true, name: true, handle: true, image: true } }
              }
            }
          } 
        },
        user: { select: { id: true, name: true, image: true, handle: true, bio: true, location: true } },
        pokes: {
          where: { pokerId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 1
        },
        clips: {
          orderBy: { recordedAt: "asc" },
          include: {
            reactions: true,
            photoResponses: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { id: true, name: true, image: true, handle: true } } },
            },
            comments: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { id: true, name: true, image: true, handle: true } } },
            },
            views: {
              include: { user: { select: { id: true, name: true, image: true, handle: true } } },
            },
          },
        },
      },
    });

    if (fullyPopulatedAssignment && fullyPopulatedAssignment.clips) {
      for (const clip of fullyPopulatedAssignment.clips) {
        if (!clip.thumbnailUrl || !clip.thumbnailBlurUrl) {
          const updated = await generateMissingThumbnails(clip.id);
          if (updated) {
            clip.thumbnailUrl = updated.thumbnailUrl;
            clip.thumbnailBlurUrl = updated.thumbnailBlurUrl;
          }
        }
      }
    }

    return { 
      success: true, 
      assignment: fullyPopulatedAssignment,
      isSleepMode: circadian.isSleepMode,
      sleepTimeLeftSeconds: circadian.sleepTimeLeftSeconds,
      wakingTimeLeftSeconds: circadian.wakingTimeLeftSeconds,
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to retrieve or roll daily assignment." };
  }
}

export async function getLatestCompilation(groupId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const assignment = await db.dailyAssignment.findFirst({
      where: { groupId, status: "completed" },
      orderBy: { date: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true, handle: true } },
        clips: { 
          orderBy: { recordedAt: "asc" },
          include: {
            photoResponses: {
              include: { user: { select: { id: true, name: true, image: true, handle: true } } },
            }
          }
        }
      }
    });

    if (!assignment || assignment.clips.length === 0) return { success: false };

    const resolvedClips: any[] = [];
    for (const clip of assignment.clips) {
      let activeClip = clip;
      if (!clip.thumbnailUrl || !clip.thumbnailBlurUrl) {
        const updated = await generateMissingThumbnails(clip.id);
        if (updated) {
          activeClip = {
            ...clip,
            thumbnailUrl: updated.thumbnailUrl,
            thumbnailBlurUrl: updated.thumbnailBlurUrl,
          };
        }
      }

      const videoUrl = activeClip.videoUrl.startsWith("http") || activeClip.videoUrl.startsWith("/") 
        ? activeClip.videoUrl 
        : generateEdgeUrl("vlogs", activeClip.videoUrl);

      const hlsUrl = activeClip.transcodeStatus === "COMPLETED" && activeClip.hlsUrl
        ? (activeClip.hlsUrl.startsWith("http") || activeClip.hlsUrl.startsWith("/") 
            ? activeClip.hlsUrl 
            : generateEdgeUrl("vlogs", activeClip.hlsUrl))
        : null;

      const thumbnailUrl = activeClip.thumbnailUrl.startsWith("http") || activeClip.thumbnailUrl.startsWith("/") 
        ? activeClip.thumbnailUrl 
        : generateEdgeUrl("vlogs", activeClip.thumbnailUrl);

      const thumbnailBlurTarget = activeClip.thumbnailBlurUrl || activeClip.thumbnailUrl;
      const thumbnailBlurUrl = thumbnailBlurTarget.startsWith("http") || thumbnailBlurTarget.startsWith("/") 
        ? thumbnailBlurTarget 
        : generateEdgeUrl("vlogs", thumbnailBlurTarget);

      if (activeClip.photoResponses) {
        for (const pr of activeClip.photoResponses) {
          pr.imageUrl = pr.imageUrl.startsWith("http") || pr.imageUrl.startsWith("/")
            ? pr.imageUrl
            : generateEdgeUrl("vlogs", pr.imageUrl);
        }
      }

      resolvedClips.push({
        ...activeClip,
        videoUrl,
        hlsUrl,
        thumbnailUrl,
        thumbnailBlurUrl,
      });
    }

    return {
      success: true,
      assignment: { ...assignment, clips: resolvedClips }
    };
  } catch (error) {
    return { error: "Failed to fetch latest compilation" };
  }
}

export async function createClip(data: {
  groupId: string;
  assignmentId: string;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailBlurUrl?: string;
  location?: string;
  caption?: string;
  duration?: number;
  metadata?: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    if (data.duration === undefined || data.duration < 4 || data.duration > 120) {
      return { error: "Video clip must be between 5 and 120 seconds." };
    }

    const assignment = await db.dailyAssignment.findUnique({ where: { id: data.assignmentId } });
    if (!assignment) return { error: "Active daily assignment not found" };
    if (assignment.userId !== session.user.id) return { error: "It is not your turn to vlog today!" };

    const group = await db.group.findUnique({ where: { id: data.groupId } });
    if (!group) return { error: "Group parameters unresolved" };

    const isFirstClip = assignment.status === "active";

    const payload: any = {
      assignmentId: data.assignmentId,
      userId: session.user.id,
      groupId: data.groupId,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      location: data.location || "Earth",
      transcodeStatus: "PENDING",
    };

    if (data.thumbnailBlurUrl) payload.thumbnailBlurUrl = data.thumbnailBlurUrl;
    if (data.metadata) payload.metadata = data.metadata;

    let clip;
    try {
      clip = await db.clip.create({ data: payload });
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('Unknown arg')) {
        console.warn("[createClip] Stale Prisma client detected. Retrying with safe baseline payload.");
        delete payload.metadata;
        delete payload.thumbnailBlurUrl;
        clip = await db.clip.create({ data: payload });
      } else {
        throw dbErr;
      }
    }

    if (data.caption && data.caption.trim()) {
      await db.comment.create({
        data: {
          clipId: clip.id,
          userId: session.user.id,
          text: data.caption.trim(),
        },
      });
    }

    let individualXpGain = 100; 
    let groupXpGain = 100;
    const twoHours = 2 * 60 * 60 * 1000;
    if (Date.now() - new Date(assignment.createdAt).getTime() < twoHours) {
      individualXpGain += 50;
      groupXpGain += 50;
    }

    const newlyUnlocked: string[] = [];
    let groupLevelUp: { from: number; to: number } | null = null;
    let individualTierUp: { from: string; to: string } | null = null;

    const memberRecord = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: session.user.id } },
    });
    
    const streakCount = memberRecord?.streak || 0;
    if (getSecondsUntilMidnightInTz(group.timezone) < 3600 && streakCount >= 10) {
      individualXpGain += 150;
      groupXpGain += 150;
      const isNew = await checkAndUnlockAchievement(session.user.id, "the-savior", data.groupId);
      if (isNew) newlyUnlocked.push("the-savior");
    }

    if (Date.now() - new Date(assignment.createdAt).getTime() < 30 * 60 * 1000) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "zero-hour", data.groupId);
      if (isNew) newlyUnlocked.push("zero-hour");
    }

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
        data: { xp: finalXp, lastActiveAt: new Date(), streak: nextStreakValue },
      });

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
      data: { xp: updatedGroupXp, level: calculatedLevel },
    });

    if (isFirstClip) {
      await db.dailyAssignment.update({
        where: { id: data.assignmentId },
        data: { status: "completed" },
      });
    }

    const clipsCount = await db.clip.count({ where: { userId: session.user.id } });
    if (clipsCount >= 50) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "silver-screen");
      if (isNew) newlyUnlocked.push("silver-screen");
    }
    if (clipsCount >= 150) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "gold-standard");
      if (isNew) newlyUnlocked.push("gold-standard");
    }

    const serverHour = new Date().getHours();
    if (serverHour >= 1 && serverHour < 5) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "night-owl", data.groupId);
      if (isNew) newlyUnlocked.push("night-owl");
    }

    try {
      const poster = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, handle: true } });
      const posterName = poster?.name || `@${poster?.handle}` || "A friend";
      const groupInfo = await db.group.findUnique({ where: { id: data.groupId }, select: { name: true } });

      const otherMembers = await db.groupMember.findMany({
        where: { groupId: data.groupId, userId: { not: session.user.id } },
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

export async function addPhotoResponse(clipId: string, path: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const existing = await db.photoResponse.findFirst({
      where: { clipId, userId: session.user.id },
    });

    if (existing) {
      return { error: "You already added a photo response to this clip." };
    }

    let photoResponse;
    try {
      photoResponse = await db.photoResponse.create({
        data: {
          clipId,
          userId: session.user.id,
          imageUrl: path,
        },
        include: {
          user: { select: { id: true, name: true, image: true, handle: true } },
        },
      });
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('Unknown arg')) {
        console.warn("[addPhotoResponse] Stale Prisma client detected. Retrying safe payload.");
        photoResponse = await db.photoResponse.create({
          data: { clipId, userId: session.user.id, imageUrl: path },
          include: { user: { select: { id: true, name: true, image: true } } },
        });
      } else {
        throw dbErr;
      }
    }

    try {
      const targetClip = await db.clip.findUnique({
        where: { id: clipId },
        include: { group: { select: { name: true } }, user: { select: { id: true } } },
      });

      if (targetClip && targetClip.userId !== session.user.id) {
        const responder = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
        await sendPushToUser(targetClip.userId, {
          title: "New Photo Response! 📸",
          body: `${responder?.name || "A friend"} replied with a photo to your vlog in "${targetClip.group.name}".`,
          url: "/today",
        });
      }
    } catch (pushErr) {
      console.error("Failed to send photo response push alerts:", pushErr);
    }

    return { success: true, photoResponse };
  } catch (error: any) {
    let msg = error?.message || "Failed to add photo response.";
    if (msg.length > 150) msg = "Database validation error. Please try again.";
    return { error: msg };
  }
}

export async function pokeVlogger(assignmentId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const THIRTY_MINUTES = 30 * 60 * 1000;
    
    const lastPoke = await db.poke.findFirst({
      where: { assignmentId, pokerId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    if (lastPoke) {
      const timeSince = Date.now() - new Date(lastPoke.createdAt).getTime();
      if (timeSince < THIRTY_MINUTES) {
        const minutesLeft = Math.ceil((THIRTY_MINUTES - timeSince) / 60000);
        return { error: `You can poke again in ${minutesLeft}m.` };
      }
    }

    const assignment = await db.dailyAssignment.findUnique({
      where: { id: assignmentId },
      include: { group: true }
    });
    
    if (!assignment) return { error: "Assignment not found" };

    const circadian = getVlogCircadianState(assignment.group.timezone);
    const isToday = new Date(assignment.date).getTime() === circadian.businessDate.getTime();

    if (!isToday && assignment.status !== "active") {
        return { error: "You can only poke for today's active assignments." };
    }

    await db.poke.create({
      data: {
        assignmentId,
        pokerId: session.user.id
      }
    });

    const poker = await db.user.findUnique({ where: { id: session.user.id } });
    await sendPushToUser(assignment.userId, {
      title: "You've been poked! 👀",
      body: `${poker?.name || 'Someone'} is waiting for your MyTurn update in "${assignment.group.name}".`,
      url: "/record"
    });
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteClip(clipId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    const clip = await db.clip.findUnique({ where: { id: clipId } });
    if (!clip || clip.userId !== session.user.id) return { error: "Unauthorized to delete" };
    
    await db.clip.delete({ where: { id: clipId } });
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== session.user.id) return { error: "Unauthorized to delete" };
    
    await db.comment.delete({ where: { id: commentId } });
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getSignedReadUrl(bucket: "vlogs" | "thumbnails" | "avatars", path: string) {
  try {
    const url = generateEdgeUrl(bucket, path);
    return { success: true, url };
  } catch (error: any) {
    return { error: error?.message || "Failed to generate read URL." };
  }
}

export async function toggleReaction(clipId: string, emoji: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const existing = await db.reaction.findFirst({
      where: { clipId, userId: session.user.id, emoji },
    });

    if (existing) {
      await db.reaction.delete({ where: { id: existing.id } });
      return { success: true, removed: true };
    }

    const reaction = await db.reaction.create({
      data: { clipId, userId: session.user.id, emoji },
    });

    const newlyUnlocked: string[] = [];
    const totalReactions = await db.reaction.count({ where: { userId: session.user.id } });
    if (totalReactions >= 100) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "hype-man");
      if (isNew) newlyUnlocked.push("hype-man");
    }

    try {
      const targetClip = await db.clip.findUnique({
        where: { id: clipId },
        include: { group: { select: { name: true } } },
      });

      if (targetClip && targetClip.userId !== session.user.id) {
        const reactor = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
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

export async function addComment(clipId: string, text: string, parentId?: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const clip = await db.clip.findUnique({ where: { id: clipId }, select: { groupId: true, userId: true } });
    if (!clip) return { error: "Target clip parameters unresolved" };

    let comment;
    try {
      comment = await db.comment.create({
        data: { clipId, userId: session.user.id, text, parentId: parentId || null },
        include: { user: { select: { id: true, name: true, image: true, handle: true } } },
      });
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('Unknown arg')) {
        console.warn("[addComment] Stale Prisma client detected. Retrying safe payload.");
        comment = await db.comment.create({
          data: { clipId, userId: session.user.id, text, parentId: parentId || null },
          include: { user: { select: { id: true, name: true, image: true } } },
        });
      } else {
        throw dbErr;
      }
    }

    const newlyUnlocked: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const commentsWrittenToday = await db.comment.count({
      where: { userId: session.user.id, createdAt: { gte: today } },
    });

    if (commentsWrittenToday * 10 <= 30) {
      const groupMember = await db.groupMember.findUnique({
        where: { groupId_userId: { groupId: clip.groupId, userId: session.user.id } },
      });

      if (groupMember) {
        await db.groupMember.update({
          where: { id: groupMember.id },
          data: { xp: groupMember.xp + 10, lastActiveAt: new Date() },
        });

        const targetGroup = await db.group.findUnique({ where: { id: clip.groupId } });
        if (targetGroup) {
          const nextGroupXp = targetGroup.xp + 5;
          await db.group.update({
            where: { id: targetGroup.id },
            data: { xp: nextGroupXp, level: calculateGroupLevel(nextGroupXp) },
          });
        }
      }
    }

    const totalComments = await db.comment.count({ where: { userId: session.user.id } });
    if (totalComments >= 50) {
      const isNew = await checkAndUnlockAchievement(session.user.id, "directors-commentary");
      if (isNew) newlyUnlocked.push("directors-commentary");
    }

    try {
      const commenter = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
      const commenterName = commenter?.name || "A friend";
      const truncatedText = text.length > 60 ? `${text.substring(0, 57)}...` : text;

      const mentions = text.match(/@([a-zA-Z0-9_]+)/g);
      const notifiedUserIds = new Set<string>();

      if (mentions) {
        const handles = mentions.map(m => m.substring(1).toLowerCase());
        const mentionedUsers = await db.user.findMany({
          where: { handle: { in: handles } }
        });

        for (const u of mentionedUsers) {
          if (u.id !== session.user.id) {
            notifiedUserIds.add(u.id);
            await sendPushToUser(u.id, {
              title: "You were mentioned! 💬",
              body: `${commenterName} mentioned you: "${truncatedText}"`,
              url: "/today",
            });
          }
        }
      }

      if (parentId) {
        const parentComment = await db.comment.findUnique({ where: { id: parentId } });
        if (parentComment && parentComment.userId !== session.user.id && !notifiedUserIds.has(parentComment.userId)) {
          notifiedUserIds.add(parentComment.userId);
          await sendPushToUser(parentComment.userId, {
            title: "New Reply! 💬",
            body: `${commenterName} replied to your comment: "${truncatedText}"`,
            url: "/today",
          });
        }
      }

      const targetClip = await db.clip.findUnique({
        where: { id: clipId },
        include: { group: { select: { name: true } } },
      });

      if (targetClip && targetClip.userId !== session.user.id && !notifiedUserIds.has(targetClip.userId)) {
        await sendPushToUser(targetClip.userId, {
          title: "New Comment! 💬",
          body: `${commenterName} commented: "${truncatedText}"`,
          url: "/today",
        });
      }
    } catch (pushErr) {
      console.error("Failed to send comment push alerts:", pushErr);
    }

    return { success: true, comment, newlyUnlocked };
  } catch (error: any) {
    let msg = error?.message || "Failed to publish comment.";
    if (msg.length > 150) msg = "Database validation error. Please try again.";
    return { error: msg };
  }
}

export async function trackView(clipId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const clip = await db.clip.findUnique({ where: { id: clipId }, select: { groupId: true, views: true, userId: true } });
    if (!clip) return { error: "Clip details unresolved" };

    if (clip.userId === session.user.id) {
      return { success: true, alreadyViewed: true, isOwnClip: true };
    }

    const existing = await db.view.findUnique({
      where: { clipId_userId: { clipId, userId: session.user.id } },
    });

    if (existing) return { success: true, alreadyViewed: true };

    const view = await db.view.create({
      data: { clipId, userId: session.user.id },
    });

    const newlyUnlocked: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsRegisteredToday = await db.view.count({
      where: { userId: session.user.id, createdAt: { gte: today } },
    });

    if (viewsRegisteredToday * 5 <= 15) {
      const groupMember = await db.groupMember.findUnique({
        where: { groupId_userId: { groupId: clip.groupId, userId: session.user.id } },
      });

      if (groupMember) {
        await db.groupMember.update({
          where: { id: groupMember.id },
          data: { xp: groupMember.xp + 5, lastActiveAt: new Date() },
        });

        const targetGroup = await db.group.findUnique({ where: { id: clip.groupId } });
        if (targetGroup) {
          const nextGroupXp = targetGroup.xp + 2;
          await db.group.update({
            where: { id: targetGroup.id },
            data: { xp: nextGroupXp, level: calculateGroupLevel(nextGroupXp) },
          });
        }
      }
    }

    const viewsOnThisClip = await db.view.count({ where: { clipId } });
    if (viewsOnThisClip === 1) {
      const firstViewsCount = await db.view.count({
        where: {
          userId: session.user.id,
          clip: { views: { some: { userId: session.user.id } } },
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