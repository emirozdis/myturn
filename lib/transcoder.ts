// ./lib/transcoder.ts
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { supabaseServer } from "./supabase";
import { db } from "./db";

/**
 * Executes a shell command with strict timeouts to prevent server hangs.
 */
function runCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Rigid 2 minute (120,000ms) execution limit per file transcode
    exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Downloads a raw video clip, uses local FFmpeg to generate 480p, 720p, and 1080p 
 * adaptive bitrate HLS streams, and uploads the chunks back to Supabase.
 */
export async function processClipHls(clipId: string, bucket: string, rawPath: string): Promise<string> {
  const { data, error } = await supabaseServer.storage.from(bucket).download(rawPath);
  if (error || !data) {
    throw new Error(`Failed to download source video for clip ${clipId}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const workDir = path.join(os.tmpdir(), `myturn_hls_${clipId}`);
  
  // Ensure a clean working directory
  await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(workDir, { recursive: true });

  const inputPath = path.join(workDir, "input.mp4");
  await fs.writeFile(inputPath, buffer);

  // Dynamic Resource Boundary: Constrain CPU allocation to half of available cores
  const totalCores = os.cpus().length;
  const targetCpuCores = Math.max(1, Math.floor(totalCores / 2));

  // Platform Check: Linux VPS supports standard low-priority scheduling wrappers.
  // macOS / Windows local environments will fallback to standard direct command invocation.
  const isLinux = process.platform === "linux";
  const priorityPrefix = isLinux ? "nice -n 19 ionice -c 3 " : "";

  // Explicitly template the HLS segment output names so the Service Worker can parse quality levels easily
  const outputSegmentFormat = path.join(workDir, "output_%v_%03d.ts");

  // Standardize video encoding arguments to fix Safari/Chrome MSE compatibility:
  // 1. Force 8-bit SDR (yuv420p) to prevent 10-bit HDR iOS uploads from causing black screens.
  // 2. Enforce strict IDR keyframes every 2s (-g 60) for perfect HLS chunk slicing.
  const commonVideoOpts = "-preset veryfast -pix_fmt yuv420p -profile:v main -g 60 -keyint_min 60 -sc_threshold 0";

  // PRIMARY COMMAND (With Audio Multiplexing)
  // Maps the input audio stream to separate unique HLS variants to prevent A/V stream collisions and audio loss.
  const cmdWithAudio = `${priorityPrefix}ffmpeg -y -i "${inputPath}" \
    -filter_complex "[0:v]split=3[v1][v2][v3];[v1]scale=w=-2:h=480[v480];[v2]scale=w=-2:h=720[v720];[v3]scale=w=-2:h=1080[v1080]" \
    -map "[v480]" -c:v:0 libx264 ${commonVideoOpts} -b:v:0 800k -maxrate:v:0 850k -bufsize:v:0 1200k \
    -map "[v720]" -c:v:1 libx264 ${commonVideoOpts} -b:v:1 2800k -maxrate:v:1 2900k -bufsize:v:1 3500k \
    -map "[v1080]" -c:v:2 libx264 ${commonVideoOpts} -b:v:2 5000k -maxrate:v:2 5500k -bufsize:v:2 6000k \
    -map 0:a -c:a:0 aac -b:a:0 128k \
    -map 0:a -c:a:1 aac -b:a:1 128k \
    -map 0:a -c:a:2 aac -b:a:2 128k \
    -f hls -hls_time 4 -hls_playlist_type vod \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
    -hls_segment_filename "${outputSegmentFormat}" \
    -threads ${targetCpuCores} \
    "${path.join(workDir, 'output_%v.m3u8')}"`;

  // FALLBACK COMMAND (Video Only)
  const cmdNoAudio = `${priorityPrefix}ffmpeg -y -i "${inputPath}" \
    -filter_complex "[0:v]split=3[v1][v2][v3];[v1]scale=w=-2:h=480[v480];[v2]scale=w=-2:h=720[v720];[v3]scale=w=-2:h=1080[v1080]" \
    -map "[v480]" -c:v:0 libx264 ${commonVideoOpts} -b:v:0 800k -maxrate:v:0 850k -bufsize:v:0 1200k \
    -map "[v720]" -c:v:1 libx264 ${commonVideoOpts} -b:v:1 2800k -maxrate:v:1 2900k -bufsize:v:1 3500k \
    -map "[v1080]" -c:v:2 libx264 ${commonVideoOpts} -b:v:2 5000k -maxrate:v:2 5500k -bufsize:v:2 6000k \
    -f hls -hls_time 4 -hls_playlist_type vod \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0 v:1 v:2" \
    -hls_segment_filename "${outputSegmentFormat}" \
    -threads ${targetCpuCores} \
    "${path.join(workDir, 'output_%v.m3u8')}"`;

  try {
    // Attempt standard audio-grouped conversion
    await runCommand(cmdWithAudio);
  } catch (err: any) {
    console.warn(`[Transcoder] Audio-map failed for ${clipId}. Assuming no audio track. Falling back to video-only conversion...`);
    // Fallback if missing audio streams
    await runCommand(cmdNoAudio);
  }

  const files = await fs.readdir(workDir);
  
  // Extract the parent directory of the original mp4 so we can put the HLS folder right next to it
  const dirName = rawPath.substring(0, rawPath.lastIndexOf("/"));
  const hlsDir = dirName ? `${dirName}/${clipId}_hls` : `${clipId}_hls`;
  
  let masterUrl = "";

  for (const file of files) {
    if (file === "input.mp4") continue;

    const filePath = path.join(workDir, file);
    const fileBuf = await fs.readFile(filePath);
    const dest = `${hlsDir}/${file}`;
    
    // Explicit content-type mapping required for HLS on web
    const contentType = file.endsWith(".m3u8") 
      ? "application/vnd.apple.mpegurl" 
      : file.endsWith(".ts") 
        ? "video/MP2T" 
        : "application/octet-stream";
    
    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(dest, fileBuf, { contentType, upsert: true });

    if (uploadError) {
      console.error(`[Transcoder] Failed to upload chunk ${file} for ${clipId}:`, uploadError.message);
    }

    if (file === "master.m3u8") {
      masterUrl = dest;
    }
  }

  // Cleanup local disk footprint to prevent memory leaks on the single server
  await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  
  if (!masterUrl) {
    throw new Error(`Master playlist was not generated for clip ${clipId}`);
  }

  return masterUrl;
}

/**
 * Inspects database records for a given clip. If the regular thumbnail or blur placeholder
 * is absent, it executes local FFmpeg extraction on the source video, uploads the assets,
 * and updates the database records cleanly.
 */
export async function generateMissingThumbnails(clipId: string): Promise<{ thumbnailUrl: string; thumbnailBlurUrl: string } | null> {
  try {
    const clip = await db.clip.findUnique({ where: { id: clipId } });
    if (!clip) return null;

    let updated = false;
    let currentThumb = clip.thumbnailUrl;
    let currentBlur = clip.thumbnailBlurUrl;

    const needsThumb = !currentThumb || currentThumb === "" || currentThumb.includes("fallback");
    const needsBlur = !currentBlur || currentBlur === "";

    if (!needsThumb && !needsBlur) {
      return { thumbnailUrl: currentThumb, thumbnailBlurUrl: currentBlur || "" };
    }

    console.log(`[Transcoder] Generating missing thumbnails for clip: ${clipId}`);

    // Download raw video directly from secure storage
    const { data, error } = await supabaseServer.storage.from("vlogs").download(clip.videoUrl);
    if (error || !data) {
      throw new Error(`Failed to download source video for clip ${clipId}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const workDir = path.join(os.tmpdir(), `myturn_thumb_${clipId}`);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, "input.mp4");
    await fs.writeFile(inputPath, buffer);

    const dirName = clip.videoUrl.substring(0, clip.videoUrl.lastIndexOf("/"));
    const timestamp = Date.now();

    if (needsThumb) {
      const thumbFile = "thumb.jpg";
      const thumbLocalPath = path.join(workDir, thumbFile);
      
      // Extract frame at 0.5s with standard high-quality compression scale
      await runCommand(`ffmpeg -y -ss 0.5 -i "${inputPath}" -vframes 1 -q:v 2 "${thumbLocalPath}"`);
      
      const thumbBuf = await fs.readFile(thumbLocalPath);
      const thumbDest = dirName ? `${dirName}/${timestamp}-thumb.jpg` : `${timestamp}-thumb.jpg`;
      
      await supabaseServer.storage.from("vlogs").upload(thumbDest, thumbBuf, {
        contentType: "image/jpeg",
        upsert: true,
      });

      currentThumb = thumbDest;
      updated = true;
    }

    if (needsBlur) {
      const blurFile = "thumb-blur.jpg";
      const blurLocalPath = path.join(workDir, blurFile);
      
      // Extract a low-resolution LQIP frame (80x142) mapped to a lightweight 35% quality ratio
      await runCommand(`ffmpeg -y -ss 0.5 -i "${inputPath}" -vf "scale=80:142" -vframes 1 -q:v 15 "${blurLocalPath}"`);
      
      const blurBuf = await fs.readFile(blurLocalPath);
      const blurDest = dirName ? `${dirName}/${timestamp}-thumb-blur.jpg` : `${timestamp}-thumb-blur.jpg`;
      
      await supabaseServer.storage.from("vlogs").upload(blurDest, blurBuf, {
        contentType: "image/jpeg",
        upsert: true,
      });

      currentBlur = blurDest;
      updated = true;
    }

    // Cleanup local temp directories
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});

    if (updated) {
      await db.clip.update({
        where: { id: clipId },
        data: {
          thumbnailUrl: currentThumb,
          thumbnailBlurUrl: currentBlur,
        },
      });
      console.log(`[Transcoder] Successfully updated thumbnails in DB for clip: ${clipId}`);
    }

    return { thumbnailUrl: currentThumb, thumbnailBlurUrl: currentBlur || "" };
  } catch (err) {
    console.error(`[Transcoder] Failed to generate missing thumbnails for ${clipId}:`, err);
    return null;
  }
}