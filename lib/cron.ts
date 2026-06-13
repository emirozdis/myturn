import cron from "node-cron";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/actions/push";
import { rollGroupAssignmentForDate, getLocalDateInTimezone } from "@/actions/vlog";
import { processClipHls } from "@/lib/transcoder";

let isTranscoding = false;

async function startTranscoderWorker() {
  console.log("[Transcoder Queue] Initializing background polling worker...");
  
  // Recovery: Reset any clips that got stuck in "PROCESSING" if the server crashed/restarted
  try {
    await db.clip.updateMany({
      where: { transcodeStatus: "PROCESSING" },
      data: { transcodeStatus: "PENDING" }
    });
    console.log("[Transcoder Queue] Cleaned up stuck processing jobs.");
  } catch (err) {
    console.error("[Transcoder Queue] Failed to reset stuck jobs:", err);
  }
  
  setInterval(async () => {
    // Lock guard: Prevent overlapping FFmpeg processes to protect server CPU
    if (isTranscoding) return; 
    
    try {
      isTranscoding = true;
      
      // Chug through the backlog sequentially until the queue is completely empty
      while (true) {
        // 1. Prioritize fresh PENDING clips first (Immediate processing for new uploads)
        let targetClip = await db.clip.findFirst({
          where: { transcodeStatus: "PENDING" },
          orderBy: { recordedAt: "asc" },
        });
        
        // 2. If no new clips are waiting, utilize the "free time" to retry FAILED clips (Max 3 attempts)
        if (!targetClip) {
          targetClip = await db.clip.findFirst({
            where: { 
              transcodeStatus: "FAILED",
              transcodeAttempts: { lt: 3 }
            },
            orderBy: { recordedAt: "asc" },
          });
        }
        
        // Break out of the loop if absolutely nothing is left to process
        if (!targetClip) break;

        const nextAttemptCount = targetClip.transcodeAttempts + 1;

        // Lock the record and increment the attempt counter
        await db.clip.update({
          where: { id: targetClip.id },
          data: { 
            transcodeStatus: "PROCESSING",
            transcodeAttempts: nextAttemptCount
          },
        });
        
        console.log(`[Transcoder Queue] Processing clip: ${targetClip.id} (Attempt ${nextAttemptCount})`);
        
        try {
          const hlsPath = await processClipHls(targetClip.id, "vlogs", targetClip.videoUrl);
          await db.clip.update({
            where: { id: targetClip.id },
            data: { transcodeStatus: "COMPLETED", hlsUrl: hlsPath },
          });
          console.log(`[Transcoder Queue] Successfully transcoded clip: ${targetClip.id}`);
        } catch (err) {
          console.error(`[Transcoder Queue] Failed to transcode clip: ${targetClip.id}`, err);
          
          const finalStatus = nextAttemptCount >= 3 ? "FAILED_PERMANENTLY" : "FAILED";
          
          await db.clip.update({
            where: { id: targetClip.id },
            data: { transcodeStatus: finalStatus },
          });
          
          if (finalStatus === "FAILED_PERMANENTLY") {
            console.log(`[Transcoder Queue] Clip ${targetClip.id} failed 3 times. Serving original permanently.`);
          }
        }
      }
    } catch (error) {
      console.error("[Transcoder Queue] Queue evaluation error:", error);
    } finally {
      isTranscoding = false;
    }
  }, 10000); // Poll the queue every 10 seconds
}

export function startCronJobs() {
  // Prevent multiple overlapping instances during development Fast Refresh
  if ((globalThis as any).__cron_initialized) return;
  (globalThis as any).__cron_initialized = true;

  console.log("[Cron] Initializing internal background jobs...");

  startTranscoderWorker();

  // 1. Roll Assignments
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