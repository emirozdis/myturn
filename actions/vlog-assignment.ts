"use server";

import { db } from "@/lib/db";
import { sendPushToUser } from "@/actions/push";

export function getVlogCircadianState(timezone: string) {
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

export function getSecondsUntilMidnightInTz(timezone: string): number {
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

  const volunteers = await db.volunteer.findMany({
    where: { groupId, targetDate: localDate }
  });

  const volunteerIds = new Set(volunteers.map((v) => v.userId));
  let finalPool = pool;
  let isVolunteer = false;

  if (volunteerIds.size > 0) {
    const eligibleVolunteers = pool.filter((m) => volunteerIds.has(m.userId));
    if (eligibleVolunteers.length > 0) {
      finalPool = eligibleVolunteers;
      isVolunteer = true;
    }
  }

  const chosenMember = finalPool[Math.floor(Math.random() * finalPool.length)];

  const assignment = await db.dailyAssignment.create({
    data: {
      groupId,
      userId: chosenMember.userId,
      date: localDate,
      status: "active",
      isVolunteer,
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
