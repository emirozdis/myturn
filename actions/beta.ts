"use server";

import { db } from "@/lib/db";

/**
 * Registers an email address to join the closed beta waitlist.
 * Ensures the email is normalized, verified, and not duplicated.
 */
export async function registerBetaApply(email: string) {
  try {
    if (!email) {
      return { error: "Email address is required." };
    }

    const emailNormalized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return { error: "Please enter a valid email address." };
    }

    const existing = await db.betaApplication.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      return { success: true, message: "You are already registered on the waitlist! 🎉" };
    }

    await db.betaApplication.create({
      data: { email: emailNormalized },
    });

    return { success: true, message: "Successfully joined the waitlist! 🎉" };
  } catch (error: any) {
    console.error("Failed to register beta application:", error);
    return { error: error?.message || "Something went wrong. Please try again." };
  }
}