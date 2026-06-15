// ./actions/group.ts
"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

async function generateInviteCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      if (i === 3) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await db.group.findUnique({
      where: { inviteCode: code },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

export async function createGroup(name: string, timezone: string = "UTC", emoji: string = "🏠") {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized. Please log in." };
    }

    const inviteCode = await generateInviteCode();

    const group = await db.group.create({
      data: {
        name,
        inviteCode,
        timezone,
        emoji,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
    });

    return { success: true, group };
  } catch (error: any) {
    return { error: error?.message || "Failed to create group." };
  }
}

export async function joinGroup(inviteCode: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized. Please log in." };
    }

    const formattedCode = inviteCode.trim().toUpperCase();

    const group = await db.group.findUnique({
      where: { inviteCode: formattedCode },
    });

    if (!group) {
      return { error: "Invalid invite code. Group not found." };
    }

    const existingMember = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return { success: true, group, alreadyMember: true };
    }

    await db.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "member",
      },
    });

    return { success: true, group };
  } catch (error: any) {
    return { error: error?.message || "Failed to join group." };
  }
}

export async function getUserGroups() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const memberships = await db.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      emoji: m.group.emoji || "🏠",
      inviteCode: m.group.inviteCode,
      memberCount: m.group._count.members,
      role: m.role,
      xp: m.group.xp,
      level: m.group.level,
      memberXp: m.xp,
      members: m.group.members.map((gm) => ({
        id: gm.user.id,
        name: gm.user.name,
        image: gm.user.image,
      })),
    }));

    return { success: true, groups };
  } catch (error: any) {
    return { error: error?.message };
  }
}

export async function getGroupDetails(groupId: string) {
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
              select: {
                id: true,
                name: true,
                handle: true,
                image: true,
                bio: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return { error: "Group not found." };
    }

    return { success: true, group };
  } catch (error: any) {
    return { error: error?.message || "Failed to fetch group details." };
  }
}

export async function leaveGroup(groupId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await db.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    });

    // Automatically purge group if empty
    const membersCount = await db.groupMember.count({
      where: { groupId },
    });

    if (membersCount === 0) {
      await db.group.delete({
        where: { id: groupId },
      });
    }

    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to leave the group." };
  }
}