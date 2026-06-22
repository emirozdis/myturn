// ./lib/transcoder.ts
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { r2 } from "./r2";
import { db } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Shell helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes a shell command with an explicit timeout.
 * Rejects with the full FFmpeg stderr so callers can log the real error.
 */
function runCommand(cmd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr?.trim() || err.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ffprobe helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns whether the file has at least one audio stream.
 */
async function probeHasAudio(inputPath: string): Promise<boolean> {
  try {
    const out = await runCommand(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "${inputPath}"`,
      10_000
    );
    return out.trim() === "audio";
  } catch {
    return false;
  }
}

interface VideoProbe {
  /** Duration in seconds. Used to compute a safe encode timeout. */
  durationSecs: number;
}

/**
 * Reads duration from the container. 
 * (FPS is no longer probed since we force a strict 30 FPS timeline).
 */
async function probeVideo(inputPath: string): Promise<VideoProbe> {
  const defaults: VideoProbe = { durationSecs: 300 };
  try {
    const out = await runCommand(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
      10_000
    );

    const parsed = parseFloat(out.trim());
    if (Number.isFinite(parsed) && parsed > 0) {
      defaults.durationSecs = parsed;
    }

    return defaults;
  } catch {
    return defaults;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HLS transcoding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Downloads a raw video clip, uses local FFmpeg to generate 480p, 720p, and 1080p
 * adaptive-bitrate HLS streams, and uploads the segments back to Cloudflare R2.
 */
export async function processClipHls(
  clipId: string,
  bucket: string,
  rawPath: string
): Promise<string> {
  // ── Download ──────────────────────────────────────────────────────────────
  let data: Buffer;
  try {
    data = await r2.download(bucket, rawPath);
  } catch (err: any) {
    throw new Error(
      `Failed to download source video for clip ${clipId}: ${err.message}`
    );
  }

  // ── Workspace setup ───────────────────────────────────────────────────────
  const workDir = path.join(os.tmpdir(), `myturn_hls_${clipId}`);
  await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(workDir, { recursive: true });

  const inputPath = path.join(workDir, "input.mp4");
  await fs.writeFile(inputPath, data);

  // ── Strict Timeline Settings ───────────────────────────────────────────────
  // We control the recorder (set to 30fps), so we strictly enforce 30fps decoding
  // to immune the system against any VFR or metadata corruption from the browser.
  const TARGET_FPS = 30;
  
  // Keyframe every 2 seconds, strictly aligned to the HLS segment boundary
  const gopSize = TARGET_FPS * 2;

  // ── Probe ─────────────────────────────────────────────────────────────────
  const [hasAudio, { durationSecs }] = await Promise.all([
    probeHasAudio(inputPath),
    probeVideo(inputPath),
  ]);

  // SAFEGUARD: Clamp the duration to a maximum of 5 minutes (300s) for timeout calculations.
  // This prevents TimeoutOverflowWarnings (Node.js 32-bit integer limits) on corrupted files.
  const safeDurationSecs = Math.min(300, durationSecs);

  console.log(
    `[Transcoder] clip=${clipId} hasAudio=${hasAudio} fps=${TARGET_FPS} (forced) duration=${durationSecs.toFixed(1)}s`
  );

  // ── Encode timeout ────────────────────────────────────────────────────────
  const ENCODE_SPEED_FLOOR = 0.05; 
  const encodeTimeoutMs = Math.max(
    5 * 60 * 1000,
    Math.ceil((safeDurationSecs / ENCODE_SPEED_FLOOR) * 1000)
  );

  console.log(
    `[Transcoder] clip=${clipId} encode timeout=${Math.round(encodeTimeoutMs / 60000)}m`
  );

  // ── FFmpeg config ─────────────────────────────────────────────────────────
  const targetCpuCores = Math.max(1, Math.floor(os.cpus().length / 2));
  const priorityPrefix = process.platform === "linux" ? "nice -n 19 ionice -c 3 " : "";

  const segmentPattern = path.join(workDir, "output_%v_%03d.ts");
  const playlistPattern = path.join(workDir, "output_%v.m3u8");

  const commonVideoOpts = [
    `-preset veryfast`,
    `-pix_fmt yuv420p`,
    `-color_range tv`,
    `-profile:v main`,
    `-g ${gopSize}`,
    `-keyint_min ${gopSize}`,
    `-sc_threshold 0`,
  ].join(" ");

  const commonAudioOpts = `-ar 44100 -ac 2`;

  // 1. Unified Filter Complex: Split the video and reset the audio timeline to 0
  const scaleFilter = [
    `[0:v]split=3[v1][v2][v3]`,
    `[v1]scale=w=-2:h=480:out_range=tv[v480]`,
    `[v2]scale=w=-2:h=720:out_range=tv[v720]`,
    `[v3]scale=w=-2:h=1080:out_range=tv[v1080]`,
    hasAudio ? `[0:a:0]asetpts=N/SR/TB,asplit=3[a1][a2][a3]` : ""
  ]
    .filter(Boolean)
    .join(";");

  // 2. Map the cleaned audio outputs (a1, a2, a3)
  const audioMaps = hasAudio
    ? [
        `-map "[a1]" -c:a:0 aac ${commonAudioOpts} -b:a:0 128k`,
        `-map "[a2]" -c:a:1 aac ${commonAudioOpts} -b:a:1 128k`,
        `-map "[a3]" -c:a:2 aac ${commonAudioOpts} -b:a:2 128k`,
      ].join(" \\\n    ")
    : "";

  const varStreamMap = hasAudio
    ? `"v:0,a:0 v:1,a:1 v:2,a:2"`
    : `"v:0 v:1 v:2"`;

  const ffmpegCmd = [
    `${priorityPrefix}ffmpeg`,
    `-y`,
    `-threads ${targetCpuCores}`,
    `-fflags +igndts`,          // Ignore corrupted container timestamps
    `-r ${TARGET_FPS}`,         // Force constant frame rate at input
    `-i "${inputPath}"`,
    `-filter_complex "${scaleFilter}"`,
    `-map "[v480]"  -c:v:0 libx264 ${commonVideoOpts} -b:v:0 800k  -maxrate:v:0 850k  -bufsize:v:0 1200k`,
    `-map "[v720]"  -c:v:1 libx264 ${commonVideoOpts} -b:v:1 2800k -maxrate:v:1 2900k -bufsize:v:1 3500k`,
    `-map "[v1080]" -c:v:2 libx264 ${commonVideoOpts} -b:v:2 5000k -maxrate:v:2 5500k -bufsize:v:2 6000k`,
    audioMaps,
    `-f hls`,
    `-hls_time 4`,
    `-hls_playlist_type vod`,
    `-hls_flags independent_segments`, // Force Apple compatibility
    `-master_pl_name master.m3u8`,
    `-var_stream_map ${varStreamMap}`,
    `-hls_segment_filename "${segmentPattern}"`,
    `"${playlistPattern}"`,
  ]
    .filter(Boolean)
    .join(" \\\n    ");

  // ── Encode ────────────────────────────────────────────────────────────────
  try {
    await runCommand(ffmpegCmd, encodeTimeoutMs);
  } catch (err: any) {
    console.error(
      `[Transcoder] FFmpeg failed for clip ${clipId}:\n${err.message}`
    );
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`FFmpeg encode failed for clip ${clipId}: ${err.message}`);
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  const files = await fs.readdir(workDir);

  const dirName = rawPath.substring(0, rawPath.lastIndexOf("/"));
  const hlsDir = dirName ? `${dirName}/${clipId}_hls` : `${clipId}_hls`;

  let masterUrl = "";

  await Promise.all(
    files
      .filter((f) => f !== "input.mp4")
      .map(async (file) => {
        const fileBuf = await fs.readFile(path.join(workDir, file));
        const dest = `${hlsDir}/${file}`;

        const contentType = file.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : file.endsWith(".ts")
          ? "video/MP2T"
          : "application/octet-stream";

        try {
          await r2.upload(bucket, dest, fileBuf, contentType);
        } catch (err: any) {
          console.error(
            `[Transcoder] Failed to upload ${file} for clip ${clipId}: ${err.message}`
          );
        }

        if (file === "master.m3u8") {
          masterUrl = dest;
        }
      })
  );

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});

  if (!masterUrl) {
    throw new Error(`Master playlist was not generated for clip ${clipId}`);
  }

  return masterUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Thumbnail generation
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMissingThumbnails(
  clipId: string
): Promise<{ thumbnailUrl: string; thumbnailBlurUrl: string } | null> {
  try {
    const clip = await db.clip.findUnique({ where: { id: clipId } });
    if (!clip) return null;

    const needsThumb =
      !clip.thumbnailUrl ||
      clip.thumbnailUrl === "" ||
      clip.thumbnailUrl.includes("fallback");
    const needsBlur = !clip.thumbnailBlurUrl || clip.thumbnailBlurUrl === "";

    if (!needsThumb && !needsBlur) {
      return {
        thumbnailUrl: clip.thumbnailUrl,
        thumbnailBlurUrl: clip.thumbnailBlurUrl || "",
      };
    }

    console.log(
      `[Transcoder] Generating missing thumbnails for clip: ${clipId}`
    );

    // ── Download ────────────────────────────────────────────────────────────
    let buffer: Buffer;
    try {
      buffer = await r2.download("vlogs", clip.videoUrl);
    } catch (err: any) {
      throw new Error(
        `Failed to download source video for clip ${clipId}: ${err.message}`
      );
    }

    // ── Workspace setup ─────────────────────────────────────────────────────
    const workDir = path.join(os.tmpdir(), `myturn_thumb_${clipId}`);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, "input.mp4");
    await fs.writeFile(inputPath, buffer);

    const dirName = clip.videoUrl.substring(0, clip.videoUrl.lastIndexOf("/"));
    const timestamp = Date.now();

    let currentThumb = clip.thumbnailUrl;
    let currentBlur = clip.thumbnailBlurUrl;
    let updated = false;

    // Apply the same front-door IGNDTS safety protocols to thumbnail generation
    try {
      if (needsThumb) {
        const thumbLocalPath = path.join(workDir, "thumb.jpg");

        await runCommand(
          `ffmpeg -y -fflags +igndts -r 30 -i "${inputPath}" -ss 0.5 -vframes 1 -q:v 2 "${thumbLocalPath}"`,
          30_000
        );

        const thumbBuf = await fs.readFile(thumbLocalPath);
        const thumbDest = dirName
          ? `${dirName}/${timestamp}-thumb.jpg`
          : `${timestamp}-thumb.jpg`;

        await r2.upload("vlogs", thumbDest, thumbBuf, "image/jpeg");
        currentThumb = thumbDest;
        updated = true;
      }

      if (needsBlur) {
        const blurLocalPath = path.join(workDir, "thumb-blur.jpg");

        await runCommand(
          `ffmpeg -y -fflags +igndts -r 30 -i "${inputPath}" -ss 0.5 -vf "scale=80:142" -vframes 1 -q:v 15 "${blurLocalPath}"`,
          30_000
        );

        const blurBuf = await fs.readFile(blurLocalPath);
        const blurDest = dirName
          ? `${dirName}/${timestamp}-thumb-blur.jpg`
          : `${timestamp}-thumb-blur.jpg`;

        await r2.upload("vlogs", blurDest, blurBuf, "image/jpeg");
        currentBlur = blurDest;
        updated = true;
      }
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }

    if (updated) {
      await db.clip.update({
        where: { id: clipId },
        data: {
          thumbnailUrl: currentThumb,
          thumbnailBlurUrl: currentBlur,
        },
      });
      console.log(
        `[Transcoder] Successfully updated thumbnails in DB for clip: ${clipId}`
      );
    }

    return {
      thumbnailUrl: currentThumb,
      thumbnailBlurUrl: currentBlur || "",
    };
  } catch (err) {
    console.error(
      `[Transcoder] Failed to generate missing thumbnails for ${clipId}:`,
      err
    );
    return null;
  }
}