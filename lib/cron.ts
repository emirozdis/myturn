// ./lib/cron.ts
import cron from "node-cron";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/actions/push";
import { rollGroupAssignmentForDate, getLocalDateInTimezone } from "@/actions/vlog";
import { processClipHls } from "@/lib/transcoder";
import { startArchiverWorker } from "./archiver";

let isTranscoding = false;

function getLocalHourAndMinute(timezone: string): { hour: number; minute: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  let hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return { hour, minute };
}

function getSlotForHour(hour: number): number | null {
  if (hour === 10) return 0; // Middle of Morning Vlog (9AM - 12PM)
  if (hour === 13) return 1; // Middle of Midday Vlog (12PM - 3PM)
  if (hour === 16) return 2; // Middle of Afternoon Vlog (3PM - 6PM)
  if (hour === 19) return 3; // Middle of Evening Vlog (6PM - 9PM)
  if (hour === 22) return 4; // Middle of Late Night Vlog (9PM - 12AM)
  return null;
}

function getSlotForClip(recordedAt: Date | string, timezone?: string): number {
  const date = new Date(recordedAt);
  let hours = date.getHours();
  
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      let hourPart = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      if (hourPart === 24) hourPart = 0;
      hours = hourPart;
    } catch (e) {
      hours = date.getHours();
    }
  }

  if (hours >= 9 && hours < 12) return 0;
  if (hours >= 12 && hours < 15) return 1;
  if (hours >= 15 && hours < 18) return 2;
  if (hours >= 18 && hours < 21) return 3;
  if (hours >= 21 && hours < 24) return 4;
  return 5;
}

async function startTranscoderWorker() {
  console.log("[Transcoder Queue] Initializing background polling worker...");
  
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
    if (isTranscoding) return; 
    
    try {
      isTranscoding = true;
      
      while (true) {
        let targetClip = await db.clip.findFirst({
          where: { transcodeStatus: "PENDING" },
          orderBy: { recordedAt: "asc" },
        });
        
        if (!targetClip) {
          targetClip = await db.clip.findFirst({
            where: { 
              transcodeStatus: "FAILED",
              transcodeAttempts: { lt: 3 }
            },
            orderBy: { recordedAt: "asc" },
          });
        }
        
        if (!targetClip) break;

        const nextAttemptCount = targetClip.transcodeAttempts + 1;

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
  }, 10000); 
}

export function startCronJobs() {
  if ((globalThis as any).__cron_initialized) return;
  (globalThis as any).__cron_initialized = true;

  console.log("[Cron] Initializing internal background jobs...");

  startTranscoderWorker();
  startArchiverWorker();

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

  cron.schedule("*/30 * * * *", async () => {
    console.log("[Cron] Running vlogger reminders check...");
    try {
      const groups = await db.group.findMany();
      let count = 0;

      for (const group of groups) {
        const { hour, minute } = getLocalHourAndMinute(group.timezone);
        const slot = getSlotForHour(hour);

        if (slot !== null && minute >= 15 && minute <= 45) {
          const localDate = await getLocalDateInTimezone(group.timezone);

          const assignment = await db.dailyAssignment.findFirst({
            where: {
              groupId: group.id,
              date: localDate,
            },
            include: {
              clips: true,
            },
          });

          if (assignment) {
            const hasClipsInSlot = assignment.clips.some(
              (clip) => getSlotForClip(clip.recordedAt, group.timezone) === slot
            );

            if (!hasClipsInSlot) {
              const slotLabels = ["Morning", "Midday", "Afternoon", "Evening", "Late Night"];
              const slotLabel = slotLabels[slot];

              await sendPushToUser(assignment.userId, {
                title: `Time for your ${slotLabel} Vlog! 🎥`,
                body: `Share a raw moment in "${group.name}" to keep the group streak alive!`,
                url: "/record",
              });
              count++;
            }
          }
        }
      }
      if (count > 0) {
        console.log(`[Cron] Sent ${count} vlogger slot-middle reminders.`);
      }
    } catch (error) {
      console.error("[Cron] Error sending vlogger reminders:", error);
    }
  });
}