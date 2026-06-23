"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

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
