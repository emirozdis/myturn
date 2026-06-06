import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rollGroupAssignmentForDate, getLocalDateInTimezone } from "@/actions/vlog";

export async function GET(request: Request) {
  try {
    // 1. Basic Authorization verification
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || request.headers.get("Authorization")?.replace("Bearer ", "");
    
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch all groups registered in the system
    const groups = await db.group.findMany();
    const results = [];

    // 3. Process each group sequentially to prevent concurrent connection pool spikes
    for (const group of groups) {
      const localDate = await getLocalDateInTimezone(group.timezone);
      const assignment = await rollGroupAssignmentForDate(group.id, localDate);
      
      results.push({
        groupId: group.id,
        groupName: group.name,
        localDate: localDate.toISOString().split("T")[0],
        assignmentId: assignment?.id || null,
        assignedUserId: assignment?.userId || null,
        status: assignment?.status || "none",
      });
    }

    return NextResponse.json({
      success: true,
      processedGroupsCount: groups.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An error occurred during daily assignment rolls.",
      },
      { status: 500 }
    );
  }
}