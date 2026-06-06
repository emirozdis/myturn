"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function signUpUser(data: { name: string; email: string; password: string }) {
  try {
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