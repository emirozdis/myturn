/** Chromium install prompt (not available on iOS Safari). */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaPlatform = "ios" | "android" | "desktop" | "unknown";

export function getPwaPlatform(): PwaPlatform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Macintosh|Windows|Linux/i.test(ua)) return "desktop";
  return "unknown";
}

/** True when the app is opened from the home screen / installed PWA. */
export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

/** @deprecated Use isStandaloneMode */
export const isPwaInstalled = isStandaloneMode;

/** Fires when the user opens the installed app (display-mode becomes standalone). */
export function listenForStandaloneMode(onChange: (standalone: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const check = () => onChange(isStandaloneMode());
  check();

  const queries = [
    window.matchMedia("(display-mode: standalone)"),
    window.matchMedia("(display-mode: fullscreen)"),
  ];
  queries.forEach((mq) => mq.addEventListener("change", check));
  return () => queries.forEach((mq) => mq.removeEventListener("change", check));
}

export function listenForInstallPrompt(
  onAvailable: (event: BeforeInstallPromptEvent) => void
): () => void {
  const handler = (event: Event) => {
    event.preventDefault();
    onAvailable(event as BeforeInstallPromptEvent);
  };
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}

export function listenForAppInstalled(onInstalled: () => void): () => void {
  window.addEventListener("appinstalled", onInstalled);
  return () => window.removeEventListener("appinstalled", onInstalled);
}

export async function promptPwaInstall(
  event: BeforeInstallPromptEvent
): Promise<"accepted" | "dismissed"> {
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}
