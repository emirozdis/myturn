"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { sendPushToUser } from "@/actions/push";

export async function getSocialData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    const userId = session.user.id;

    const memberships = await db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            clips: { orderBy: { recordedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    const activeGroups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      members: m.group._count.members,
      lastVlog: m.group.clips[0] ? "Active updates today" : "No recent uploads",
      inviteCode: m.group.inviteCode,
    }));

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: "accepted",
      },
      include: {
        requester: { select: { id: true, name: true, handle: true, image: true } },
        addressee: { select: { id: true, name: true, handle: true, image: true } },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        id: friend.id,
        name: friend.name || "User",
        handle: friend.handle || "handle",
        image: friend.image,
        status: "Friend",
        online: Math.random() > 0.5,
        hasStory: Math.random() > 0.3,
      };
    });

    const pendingRaw = await db.friendship.findMany({
      where: { addresseeId: userId, status: "pending" },
      include: { requester: { select: { id: true, name: true, handle: true, image: true } } },
    });

    const pendingRequests = pendingRaw.map((p) => ({
      id: p.id,
      user: p.requester,
    }));

    const sentRequests = await db.friendship.findMany({
      where: { requesterId: userId },
    });

    const excludeIds = [
      userId,
      ...friends.map((f) => f.id),
      ...pendingRaw.map((p) => p.requesterId),
      ...sentRequests.map((s) => s.addresseeId),
    ];

    const suggestionsRaw = await db.user.findMany({
      where: { id: { notIn: excludeIds } },
      take: 8,
    });

    const suggestions = suggestionsRaw.map((u) => ({
      id: u.id,
      name: u.name || "User",
      image: u.image,
      mutual: Math.floor(Math.random() * 4),
      requested: false,
    }));

    const targetGroupIds = memberships.map((m) => m.groupId);
    const trendingRaw = await db.group.findMany({
      where: { id: { notIn: targetGroupIds } },
      include: { _count: { select: { members: true } } },
      take: 5,
    });

    const trending = trendingRaw.map((tg) => ({
      id: tg.id,
      name: tg.name,
      members: tg._count.members,
      active: "Active now",
    }));

    return {
      success: true,
      friends,
      pendingRequests,
      suggestions,
      groups: activeGroups,
      trending,
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to load social relationships." };
  }
}

export async function sendFriendRequest(targetUserId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    if (session.user.id === targetUserId) return { error: "Cannot send request to yourself." };

    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: session.user.id },
        ]
      }
    });

    if (existing) return { error: "Friendship or pending request already exists." };

    await db.friendship.create({
      data: {
        requesterId: session.user.id,
        addresseeId: targetUserId,
        status: "pending"
      }
    });

    const requester = await db.user.findUnique({ where: { id: session.user.id }});
    await sendPushToUser(targetUserId, {
      title: "New Friend Request! 👤",
      body: `${requester?.name || 'Someone'} sent you a friend request.`,
      url: "/social"
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function respondFriendRequest(requestId: string, accept: boolean) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const request = await db.friendship.findUnique({
      where: { id: requestId }
    });

    if (!request || request.addresseeId !== session.user.id) {
      return { error: "Request not found or unauthorized." };
    }

    if (accept) {
      await db.friendship.update({
        where: { id: requestId },
        data: { status: "accepted" }
      });
      const addressee = await db.user.findUnique({ where: { id: session.user.id }});
      await sendPushToUser(request.requesterId, {
        title: "Friend Request Accepted! 🎉",
        body: `${addressee?.name || 'Someone'} accepted your friend request.`,
        url: "/social"
      });
    } else {
      await db.friendship.delete({
        where: { id: requestId }
      });
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}