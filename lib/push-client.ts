/** URL-safe base64 VAPID public key → Uint8Array for PushManager.subscribe */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function bufferEquals(a: ArrayBuffer | ArrayBufferView, b: Uint8Array): boolean {
  const view = a instanceof ArrayBuffer ? new Uint8Array(a) : new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  if (view.length !== b.length) return false;
  for (let i = 0; i < view.length; i++) {
    if (view[i] !== b[i]) return false;
  }
  return true;
}

/** Public key used when NEXT_PUBLIC_VAPID_KEY is unset (dev only — pair with VAPID_PRIVATE_KEY in .env). */
export const DEFAULT_VAPID_PUBLIC_KEY =
  "BHA39eUCFDinuejZ9_agT3CWHjSxsyKUD-ZtYpZ1vg6ynA2WVAUOMHfdGfN4-OZO6hTiEtv_P4djlGRMOCmOgBY";

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_KEY || DEFAULT_VAPID_PUBLIC_KEY;
}

/**
 * Reuse an existing subscription when the VAPID key matches.
 * Only unsubscribe when the key changed; always retry subscribe (push service flakes).
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  applicationServerKey: Uint8Array
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    const existingKey = existing.options?.applicationServerKey;
    if (existingKey && bufferEquals(existingKey, applicationServerKey)) {
      return existing;
    }
    await existing.unsubscribe();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}
