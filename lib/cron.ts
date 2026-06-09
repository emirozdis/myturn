import cron from "node-cron";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/actions/push";
import { rollGroupAssignmentForDate, getLocalDateInTimezone } from "@/actions/vlog";

export function startCronJobs() {
  // Prevent multiple overlapping instances during development Fast Refresh
  if ((globalThis as any).__cron_initialized) return;
  (globalThis as any).__cron_initialized = true;

  console.log("[Cron] Initializing internal background jobs...");

  // 1. Roll Assignments
  // Schedule: Runs at minute 0 past every hour.
  // Logic: Since groups exist in different global timezones, we run this hourly to catch midnight local times.
  // Note: `rollGroupAssignmentForDate` is idempotent and safe to run repetitively.
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running daily assignment rolls...");
    try {
      const groups = await db.group.findMany();
      for (const group of groups) {
        const localDate = await getLocalDateInTimezone(group.timezone);
        await rollGroupAssignmentForDate(group.id, localDate);
      }
      console.log(`[Cron] Processed ${groups.length} groups for assignment rolls.`);
    } catch (error) {
      console.error("[Cron] Error rolling assignments:", error);
    }
  });

  // 2. Remind Vloggers
  // Schedule: Runs at 14:00 (2 PM) and 19:00 (7 PM) system time every day.
  cron.schedule("0 14,19 * * *", async () => {
    console.log("[Cron] Running vlogger reminders...");
    try {
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
      console.log(`[Cron] Sent reminders to ${count} active vloggers.`);
    } catch (error) {
      console.error("[Cron] Error sending vlogger reminders:", error);
    }
  });
}