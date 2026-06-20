// ./components/shared/use-hls.ts
"use client";

import { useEffect } from "react";
import Hls from "hls.js";

/**
 * A robust wrapper hook that attaches `hls.js` to a provided video element.
 * Configured with cross-origin credentials to pass Edge-authorized Signed Cookies.
 */
export function useHls(
  videoRef: React.RefObject<HTMLVideoElement | null>, 
  src: string | null, 
  autoplay: boolean = true
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    if (src.includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 10,       
          capLevelToPlayerSize: false,  
          // Critical: Allow cross-domain requests to attach the 'media_session' HttpOnly cookie
          xhrSetup: (xhr) => {
            xhr.withCredentials = true; 
          }
        });
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native fallback (iOS Safari handles cross-origin cookies natively if SameSite=None is set)
        video.src = src;
        if (autoplay) video.play().catch(() => {});
      }
    } else {
      video.src = src;
      if (autoplay) video.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, videoRef, autoplay]);
}