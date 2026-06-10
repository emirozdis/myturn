"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function OrientationManager() {
  const pathname = usePathname();

  useEffect(() => {
    const isRecordSection = pathname?.startsWith("/record");

    if (isRecordSection) {
      // Unblock landscape via CSS wrapper
      document.body.classList.add("allow-landscape");

      // Attempt to natively unlock orientation on supported Android/PWA contexts
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (e) {
        // Silently ignore if unsupported (e.g. iOS Safari)
      }
    } else {
      // Re-apply landscape block via CSS wrapper
      document.body.classList.remove("allow-landscape");

      // Attempt to natively re-lock orientation to portrait
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("portrait").catch(() => {});
        }
      } catch (e) {
        // Silently ignore if unsupported
      }
    }
  }, [pathname]);

  return null;
}