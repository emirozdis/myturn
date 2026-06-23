import posthog from "posthog-js";

const isDev = process.env.NODE_ENV === "development";

if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: isDev,
    // Safely blocks network calls/event sending in local dev, leaving the API functional but silent
    opt_out_capturing_by_default: isDev, 
  });
}