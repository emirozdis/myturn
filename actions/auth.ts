"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function signUpUser(data: { name: string; email: string; password: string }) {
  try {
    // Prevent registration if system flag is disabled
    const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== "false";
    if (!allowRegistration) {
      return { error: "User registration is currently disabled by the system administrator." };
    }

    if (!data.name || !data.email || !data.password) {
      return { error: "Name, email, and password are required." };
    }

    const emailNormalized = data.email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    const hashedPassword = await hash(data.password, 12);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: emailNormalized,
        password: hashedPassword,
      },
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    return { error: error?.message || "Something went wrong during sign up." };
  }
}