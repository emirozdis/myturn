export const ACCENT = "#e07c30";

/** Neutral shell background for non-Today tabs (Tailwind neutral-700 → neutral-900) */
export const NEUTRAL_PAGE_BG = {
  light: "#171717",
  dark: "#0a0a0a",
} as const;

export const PAGE_BG_TRANSITION_MS = 280;

export const PROMPTS = [
  "Show the best view around you.",
  "Show what you are listening to.",
  "Introduce your daily partner.",
  "What is your mood in 5 seconds?",
  "Capture a cozy corner near you.",
  "Your favorite snack of the hour.",
];

export const TIMELINE_POINTS = [
  { label: "9AM", key: 0 },
  { label: "12PM", key: 1 },
  { label: "3PM", key: 2 },
  { label: "6PM", key: 3 },
  { label: "9PM", key: 4 },
  { label: "12AM", key: 5 },
];
