import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/actions/push";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || request.headers.get("Authorization")?.replace("Bearer ", "");
    
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Identify active daily assignments that have not uploaded yet (status is active)
    const activeAssignments = await db.dailyAssignment.findMany({
      where: { status: "active" },
      include: {
        group: { select: { name: true } },
        user: { select: { name: true } },
      },
    });

    let count = 0;
    for (const assignment of activeAssignments) {
      await sendPushToUser(assignment.userId, {
        title: "Friendly Reminder! 🕒",
        body: `It's your day to record for "${assignment.group.name}"! Your friends are waiting to see your updates.`,
        url: "/record",
      });
      count++;
    }

    return NextResponse.json({
      success: true,
      remindedCount: count,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Vlogger nudge batch job failed.",
      },
      { status: 500 }
    );
  }
}