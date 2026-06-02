import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type PushSubscriptionJson = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token as PushSubscriptionJson | undefined;

    if (!token?.endpoint || !token.keys?.p256dh || !token.keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid push subscription (missing endpoint or keys)" },
        { status: 400 }
      );
    }

    console.log("\n-------------------------------------------");
    console.log("🔥 NEW PUSH TOKEN RECEIVED 🔥");
    console.log("User:", body.username || "Anonymous");
    console.log("Token Payload:", JSON.stringify(token, null, 2));
    console.log("-------------------------------------------\n");

    const filePath = path.join(process.cwd(), "tokens.txt");
    const timestamp = new Date().toISOString();
    const dataToSave = `[${timestamp}] User: ${body.username || "Anonymous"} | Token: ${JSON.stringify(token)}\n`;

    await fs.appendFile(filePath, dataToSave, "utf8");

    return NextResponse.json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    console.error("Error handling push token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse and save push token" },
      { status: 500 }
    );
  }
}