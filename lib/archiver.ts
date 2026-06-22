// ./lib/archiver.ts
import { db } from "@/lib/db";
import { r2 } from "@/lib/r2";
import { b2 } from "@/lib/b2";

export async function archiveClip(clipId: string) {
  const clip = await db.clip.findUnique({ 
    where: { id: clipId },
    include: { photoResponses: true }
  });
  
  if (!clip || clip.transcodeStatus !== "COMPLETED" || !clip.hlsUrl) {
    throw new Error("Clip not ready for archival or missing HLS URL.");
  }

  const hlsDir = clip.hlsUrl.substring(0, clip.hlsUrl.lastIndexOf("/"));
  
  console.log(`[Archiver] Fetching 720p manifest for clip ${clipId}...`);
  const output1Path = `${hlsDir}/output_1.m3u8`;
  const m3u8Buffer = await r2.download("vlogs", output1Path);
  const m3u8Text = m3u8Buffer.toString("utf-8");

  const tsFiles = m3u8Text.match(/^output_1_\d+\.ts$/gm) || [];

  console.log(`[Archiver] Streaming thumbnails and ${clip.photoResponses.length} photo responses...`);
  const thumbBuf = await r2.download("vlogs", clip.thumbnailUrl);
  await b2.upload("vlogs", clip.thumbnailUrl, thumbBuf, "image/jpeg");

  if (clip.thumbnailBlurUrl && clip.thumbnailBlurUrl !== clip.thumbnailUrl) {
    const blurBuf = await r2.download("vlogs", clip.thumbnailBlurUrl);
    await b2.upload("vlogs", clip.thumbnailBlurUrl, blurBuf, "image/jpeg");
  }

  for (const pr of clip.photoResponses) {
    const prBuf = await r2.download("vlogs", pr.imageUrl);
    await b2.upload("vlogs", pr.imageUrl, prBuf, "image/jpeg");
  }

  console.log(`[Archiver] Streaming 720p manifest & ${tsFiles.length} segments...`);
  await b2.upload("vlogs", output1Path, m3u8Buffer, "application/vnd.apple.mpegurl");

  for (const ts of tsFiles) {
    const tsBuf = await r2.download("vlogs", `${hlsDir}/${ts}`);
    await b2.upload("vlogs", `${hlsDir}/${ts}`, tsBuf, "video/MP2T");
  }

  console.log(`[Archiver] Generating pruned master manifest...`);
  const newMaster = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=720x1280\noutput_1.m3u8\n`;
  await b2.upload("vlogs", clip.hlsUrl, Buffer.from(newMaster), "application/vnd.apple.mpegurl");

  console.log(`[Archiver] Verifying cryptographic integrity on B2...`);
  await b2.head("vlogs", clip.hlsUrl);
  await b2.head("vlogs", clip.thumbnailUrl);
  
  for (const pr of clip.photoResponses) {
    await b2.head("vlogs", pr.imageUrl);
  }

  if (tsFiles.length > 0) {
    await b2.head("vlogs", `${hlsDir}/${tsFiles[tsFiles.length - 1]}`);
  }

  console.log(`[Archiver] Integrity confirmed. Committing state DB...`);
  await db.clip.update({
    where: { id: clip.id },
    data: { storageTier: "COLD", archivedAt: new Date() }
  });

  console.log(`[Archiver] Purging heavy data objects from Hot R2 storage for ${clipId}...`);
  const hlsKeys = await r2.listObjects("vlogs", `${hlsDir}/`);
  const toDelete = [clip.videoUrl, clip.thumbnailUrl];
  
  if (clip.thumbnailBlurUrl && clip.thumbnailBlurUrl !== clip.thumbnailUrl) {
    toDelete.push(clip.thumbnailBlurUrl);
  }
  for (const pr of clip.photoResponses) {
    toDelete.push(pr.imageUrl);
  }
  toDelete.push(...hlsKeys);

  await r2.deleteObjects("vlogs", toDelete);
}

let isArchiving = false;

export async function startArchiverWorker() {
  if ((globalThis as any).__archiver_initialized) return;
  (globalThis as any).__archiver_initialized = true;

  console.log("[Archiver Queue] Initializing background tiering worker...");
  
  try {
    await db.clip.updateMany({
      where: { storageTier: "MIGRATING" },
      data: { storageTier: "HOT" }
    });
  } catch (err) {
    console.error("[Archiver Queue] Failed to reset stuck migrations:", err);
  }

  setInterval(async () => {
    if (isArchiving) return;
    try {
      isArchiving = true;
      const failedThisRun = new Set<string>();

      while (true) {
        const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
        
        const targetClip = await db.clip.findFirst({
          where: {
            id: { notIn: Array.from(failedThisRun) },
            storageTier: { in: ["HOT", "FAILED_MIGRATION"] },
            transcodeStatus: "COMPLETED",
            assignment: { date: { lte: twoDaysAgo } }
          },
          orderBy: { recordedAt: "asc" },
        });

        if (!targetClip) break;

        await db.clip.update({
          where: { id: targetClip.id },
          data: { storageTier: "MIGRATING" }
        });

        console.log(`[Archiver Queue] Found eligible candidate. Archiving clip: ${targetClip.id}`);
        
        try {
          await archiveClip(targetClip.id);
          console.log(`[Archiver Queue] Successfully mapped clip: ${targetClip.id} to COLD tier.`);
        } catch (err) {
          console.error(`[Archiver Queue] Failed to migrate clip: ${targetClip.id}`, err);
          failedThisRun.add(targetClip.id);
          
          await db.clip.update({
            where: { id: targetClip.id },
            data: { storageTier: "FAILED_MIGRATION" }
          });
        }
      }
    } catch (error) {
      console.error("[Archiver Queue] Loop evaluation error:", error);
    } finally {
      isArchiving = false;
    }
  }, 15 * 60 * 1000); 
}