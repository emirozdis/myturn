"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { getVibeArchetype } from "@/lib/vibe";
import { generateSignedMediaUrl } from "@/lib/media-signing";

export async function getStreaksData(groupId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!group) return { error: "Group not found" };

    const friendsStreaks = group.members
      .map((member) => ({
        name: member.user.name || "User",
        streak: member.streak,
        img: member.user.image,
        isMe: member.userId === session.user.id,
        xp: member.xp,
        archetype: getVibeArchetype(member.xp),
        rank: 1,
      }))
      .sort((a, b) => b.xp - a.xp)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    const assignments = await db.dailyAssignment.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, handle: true, image: true } },
        clips: {
          orderBy: { recordedAt: "asc" },
        }
      },
      orderBy: { date: "asc" },
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays = await Promise.all(
      Array.from({ length: daysInMonth }).map(async (_, i) => {
        const dayNum = i + 1;
        const matchingAssignment = assignments.find((asg) => {
          const d = new Date(asg.date);
          return d.getDate() === dayNum && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        
        if (matchingAssignment) {
          const type = matchingAssignment.status === "completed" ? "vlogged" : matchingAssignment.status === "missed" ? "missed" : "active";
          
          let resolvedClips: any[] = [];
          if (type === "vlogged" && matchingAssignment.clips && matchingAssignment.clips.length > 0) {
            resolvedClips = matchingAssignment.clips.map((clip) => {
              const videoUrl = clip.videoUrl.startsWith("http") || clip.videoUrl.startsWith("/") 
                ? clip.videoUrl 
                : generateSignedMediaUrl("vlogs", clip.videoUrl);
              const thumbnailUrl = clip.thumbnailUrl.startsWith("http") || clip.thumbnailUrl.startsWith("/") 
                ? clip.thumbnailUrl 
                : generateSignedMediaUrl("vlogs", clip.thumbnailUrl);
              return {
                ...clip,
                videoUrl,
                thumbnailUrl,
              };
            });
          }

          return {
            d: dayNum,
            type: type === "active" ? "empty" : type,
            assignment: {
              id: matchingAssignment.id,
              user: matchingAssignment.user,
              clips: resolvedClips,
              date: matchingAssignment.date,
            }
          };
        }
        
        return {
          d: dayNum,
          type: "empty",
        };
      })
    );

    const userMembership = group.members.find((m) => m.userId === session.user.id);
    const totalClips = await db.clip.count({
      where: { groupId, userId: session.user.id },
    });

    return {
      success: true,
      currentStreak: userMembership?.streak || 0,
      bestStreak: (userMembership?.streak || 0) + 4,
      totalVlogs: totalClips,
      friendsStreaks,
      calendarDays,
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to query streaks stats." };
  }
}