"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function getSocialData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Fetch user's active groups
    const memberships = await db.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
            clips: {
              orderBy: { recordedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const activeGroups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      members: m.group._count.members,
      lastVlog: m.group.clips[0] ? "Active updates today" : "No recent uploads",
    }));

    // Find all distinct co-members across active groups (friends list)
    const targetGroupIds = memberships.map((m) => m.groupId);

    const coMembers = await db.groupMember.findMany({
      where: {
        groupId: { in: targetGroupIds },
        userId: { not: session.user.id },
      },
      include: {
        user: {
          select: { id: true, name: true, handle: true, image: true },
        },
      },
    });

    const friends = Array.from(new Map(coMembers.map((cm) => [cm.user.id, cm.user])).values()).map((user) => ({
      id: user.id,
      name: user.name || "User",
      handle: user.handle || "handle",
      image: user.image,
      status: "Active Member",
      online: Math.random() > 0.5, // Simulation indicator
      hasStory: Math.random() > 0.3,
    }));

    // Suggested users: anyone not sharing any groups with the current user
    const suggestionsRaw = await db.user.findMany({
      where: {
        id: { not: session.user.id },
        groupMembers: {
          none: {
            groupId: { in: targetGroupIds },
          },
        },
      },
      take: 5,
    });

    const suggestions = suggestionsRaw.map((u) => ({
      id: u.id,
      name: u.name || "Discovery User",
      image: u.image,
      mutual: Math.floor(Math.random() * 4),
    }));

    // Discoverable active groups in the app
    const trendingRaw = await db.group.findMany({
      where: {
        id: { notIn: targetGroupIds },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      take: 3,
    });

    const trending = trendingRaw.map((tg) => ({
      id: tg.id,
      name: tg.name,
      members: tg._count.members,
      active: "Just joined",
    }));

    return {
      success: true,
      friends,
      groups: activeGroups,
      suggestions,
      trending,
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to load social relationships." };
  }
}