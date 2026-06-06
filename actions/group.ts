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

export async function createGroup(name: string, timezone: string = "UTC") {
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
      emoji: "🏠",
      memberCount: m.group._count.members,
      role: m.role,
    }));

    return { success: true, groups };
  } catch (error: any) {
    return { error: error?.message };
  }
}