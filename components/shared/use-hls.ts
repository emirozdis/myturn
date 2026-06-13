"use client";

import { useEffect } from "react";
import Hls from "hls.js";

/**
 * A robust wrapper hook that attaches `hls.js` to a provided video element 
 * if the source URL is an `.m3u8` playlist. If the device supports HLS natively 
 * (iOS Safari) or if the URL is standard MP4/WebM, it gracefully defaults to native playback.
 * 
 * Note: Requires `npm install hls.js` installed in the project.
 */
export function useHls(videoRef: React.RefObject<HTMLVideoElement | null>, src: string | null) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    if (src.includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 10,       // Maximize efficiency: Limit 10s pre-buffer
          capLevelToPlayerSize: true,   // Protect limits: Prevents pulling 1080p chunks for small screens
        });
        hls.loadSource(src);
        hls.attachMedia(video);

        // Explicitly trigger play on manifest parsed to bypass iOS/Chrome WebKit autoplay thread locks
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            // Safe fallback if autoplay gets completely blocked by browser policy
          });
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native fallback execution (specifically targets iOS devices that enforce native players)
        video.src = src;
        video.play().catch(() => {});
      }
    } else {
      // Standard video Blob or MP4/WebM
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, videoRef]);
}