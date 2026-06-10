"use server";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { DEFAULT_VAPID_PUBLIC_KEY } from "@/lib/push-client";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || DEFAULT_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.NEXT_PUBLIC_VAPID_SUBJECT || "mailto:team@myturn.app";

console.log("[Push Config Check]");
console.log("- Subject email:", vapidSubject);
console.log("- Public VAPID Key length:", vapidPublicKey ? vapidPublicKey.length : 0);
console.log("- Private VAPID Key length:", vapidPrivateKey ? vapidPrivateKey.length : 0);

if (vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    console.log("[Push Config] VAPID details successfully configured in web-push module.");
  } catch (err) {
    console.error("[Push Config] Error setting VAPID details:", err);
  }
} else {
  console.warn("[Push Config] WARNING: VAPID_PRIVATE_KEY is missing in your .env. Push notifications will fail.");
}

export async function saveSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized. Please log in first." };
    }

    const userId = session.user.id;
    const { endpoint, keys } = subscription;
    
    const id = `${userId}_${Buffer.from(endpoint).toString("base64").substring(0, 40)}`;

    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        id,
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to register active device subscription:", error);
    return { error: error?.message || "Internal database subscription registration failure." };
  }
}

// Server action to safely delete subscription endpoints from the database
export async function deleteSubscription(endpoint: string) {
  try {
    // We use deleteMany so that it gracefully succeeds even if the record does not exist
    await db.pushSubscription.deleteMany({
      where: { endpoint }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete push subscription on logout:", error);
    return { error: error?.message || "Internal database subscription deletion failure." };
  }
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
) {
  console.log(`\n[Push Service] Attempting delivery to endpoint: ${subscription.endpoint.substring(0, 70)}...`);
  
  if (!vapidPrivateKey) {
    console.error("[Push Service] Error: VAPID_PRIVATE_KEY is not defined in your environment variables. Aborting push.");
    return { error: "VAPID private key is not configured on this server." };
  }

  try {
    const data = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: "/logo.png",
      badge: "/logo.png",
    });

    const response = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      data
    );
    
    console.log(`[Push Service] SUCCESS. Server returned status code: ${response.statusCode}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Push Service] FAILURE. Server returned status code: ${error.statusCode || "Unknown"}`);
    console.error("[Push Service] Detailed Error logs:", error.message || error);

    if (error.statusCode === 410 || error.statusCode === 404) {
      try {
        await db.pushSubscription.delete({
          where: { endpoint: subscription.endpoint }
        });
        console.log(`[Push Service] Cleaned up stale push subscription endpoint: ${subscription.endpoint}`);
      } catch (dbErr) {
        console.error("[Push Service] Database cleanup error:", dbErr);
      }
    }
    return { error: error?.message || "Transmission failure to push host." };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId }
    });

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[Push Service] User ${userId} has no registered PWA push subscriptions.`);
      return { success: true, message: "Target user has no registered active devices." };
    }

    const tasks = subscriptions.map((sub) =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      )
    );

    await Promise.allSettled(tasks);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to broadcast notification batch for user ${userId}:`, error);
    return { error: error?.message || "Failed to dispatch push notifications." };
  }
}