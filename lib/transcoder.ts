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
  /** True average FPS from the container (safe for VFR sources like iOS). */
  fps: number;
  /** Duration in seconds. Used to compute a safe encode timeout. */
  durationSecs: number;
}

/**
 * Reads avg_frame_rate (not r_frame_rate) and duration from the first video stream.
 *
 * r_frame_rate reflects the stream's time-base and returns absurd values like
 * "1000/1" for VFR recordings from iOS. avg_frame_rate is the actual mean FPS
 * and is always a sane number (e.g. "29.97" or "30").
 */
async function probeVideo(inputPath: string): Promise<VideoProbe> {
  const defaults: VideoProbe = { fps: 30, durationSecs: 300 };
  try {
    // Read avg_frame_rate and duration in one ffprobe call
    const out = await runCommand(
      `ffprobe -v error -select_streams v:0 \
        -show_entries stream=avg_frame_rate,duration \
        -of csv=p=0 "${inputPath}"`,
      10_000
    );

    // Output is two lines: "avg_frame_rate\nduration"
    const lines = out.trim().split("\n");

    let fps = defaults.fps;
    let durationSecs = defaults.durationSecs;

    if (lines[0]) {
      const [num, den] = lines[0].trim().split("/").map(Number);
      const parsed = den ? num / den : num;
      if (Number.isFinite(parsed) && parsed > 0 && parsed < 300) {
        fps = parsed;
      }
    }

    if (lines[1]) {
      const parsed = parseFloat(lines[1].trim());
      if (Number.isFinite(parsed) && parsed > 0) {
        durationSecs = parsed;
      }
    }

    return { fps, durationSecs };
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
 *
 * Returns the R2 path to the generated master.m3u8.
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

  // ── Probe ─────────────────────────────────────────────────────────────────
  const [hasAudio, { fps, durationSecs }] = await Promise.all([
    probeHasAudio(inputPath),
    probeVideo(inputPath),
  ]);

  console.log(
    `[Transcoder] clip=${clipId} hasAudio=${hasAudio} fps=${fps.toFixed(2)} duration=${durationSecs.toFixed(1)}s`
  );

  // Keyframe every 2 seconds, aligned to HLS segment boundary (hls_time=4 → 2× GOP).
  const gopSize = Math.round(fps * 2);

  // ── Encode timeout ────────────────────────────────────────────────────────
  // This VPS encodes at roughly 0.1× realtime. We budget at 0.05× (20× realtime)
  // to give a generous ceiling, with a minimum of 5 minutes for very short clips.
  const ENCODE_SPEED_FLOOR = 0.05; // assume worst-case 5% realtime
  const encodeTimeoutMs = Math.max(
    5 * 60 * 1000,
    Math.ceil((durationSecs / ENCODE_SPEED_FLOOR) * 1000)
  );

  console.log(
    `[Transcoder] clip=${clipId} encode timeout=${Math.round(encodeTimeoutMs / 60000)}m`
  );

  // ── FFmpeg config ─────────────────────────────────────────────────────────
  // Constrain CPU to half of available cores to avoid starving other processes.
  const targetCpuCores = Math.max(1, Math.floor(os.cpus().length / 2));

  // Linux VPS: run at lowest I/O and CPU scheduling priority.
  const priorityPrefix =
    process.platform === "linux" ? "nice -n 19 ionice -c 3 " : "";

  const segmentPattern = path.join(workDir, "output_%v_%03d.ts");
  const playlistPattern = path.join(workDir, "output_%v.m3u8");

  // Video encoding flags:
  // -pix_fmt yuv420p        → output TV-range YUV (Safari / MSE compat)
  // -color_range tv         → explicitly declare TV range so swscaler
  //                           correctly maps yuvj420p (full-range) input
  // -vf scale flags         → force output color range in the filtergraph
  //                           (belt-and-suspenders for the swscaler warning)
  // -profile:v main         → broad device support
  // -preset veryfast        → low CPU cost on ARM VPS
  // -sc_threshold 0         → no scene-cut keyframes; rely solely on -g
  const commonVideoOpts = [
    `-preset veryfast`,
    `-pix_fmt yuv420p`,
    `-color_range tv`,
    `-profile:v main`,
    `-g ${gopSize}`,
    `-keyint_min ${gopSize}`,
    `-sc_threshold 0`,
  ].join(" ");

  // Force stereo 44.1 kHz on output to handle mono / 48 kHz / ambiguous
  // channel-layout inputs from iOS Core Media Audio.
  const commonAudioOpts = `-ar 44100 -ac 2`;

  // Add :out_range=tv to each scale filter to suppress the swscaler
  // "deprecated pixel format" warning from yuvj420p full-range sources.
  const scaleFilter = [
    `[0:v]split=3[v1][v2][v3]`,
    `[v1]scale=w=-2:h=480:out_range=tv[v480]`,
    `[v2]scale=w=-2:h=720:out_range=tv[v720]`,
    `[v3]scale=w=-2:h=1080:out_range=tv[v1080]`,
  ].join(";");

  const audioMaps = hasAudio
    ? [
        `-map 0:a -c:a:0 aac ${commonAudioOpts} -b:a:0 128k`,
        `-map 0:a -c:a:1 aac ${commonAudioOpts} -b:a:1 128k`,
        `-map 0:a -c:a:2 aac ${commonAudioOpts} -b:a:2 128k`,
      ].join(" \\\n    ")
    : "";

  const varStreamMap = hasAudio
    ? `"v:0,a:0 v:1,a:1 v:2,a:2"`
    : `"v:0 v:1 v:2"`;

  const ffmpegCmd = [
    `${priorityPrefix}ffmpeg`,
    `-y`,
    `-threads ${targetCpuCores}`,
    `-i "${inputPath}"`,
    `-filter_complex "${scaleFilter}"`,
    `-map "[v480]"  -c:v:0 libx264 ${commonVideoOpts} -b:v:0 800k  -maxrate:v:0 850k  -bufsize:v:0 1200k`,
    `-map "[v720]"  -c:v:1 libx264 ${commonVideoOpts} -b:v:1 2800k -maxrate:v:1 2900k -bufsize:v:1 3500k`,
    `-map "[v1080]" -c:v:2 libx264 ${commonVideoOpts} -b:v:2 5000k -maxrate:v:2 5500k -bufsize:v:2 6000k`,
    audioMaps,
    `-f hls`,
    `-hls_time 4`,
    `-hls_playlist_type vod`,
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

    try {
      if (needsThumb) {
        const thumbLocalPath = path.join(workDir, "thumb.jpg");

        await runCommand(
          `ffmpeg -y -ss 0.5 -i "${inputPath}" -vframes 1 -q:v 2 "${thumbLocalPath}"`,
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

        // 80×142 at q:v 15 → lightweight LQIP placeholder
        await runCommand(
          `ffmpeg -y -ss 0.5 -i "${inputPath}" -vf "scale=80:142" -vframes 1 -q:v 15 "${blurLocalPath}"`,
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