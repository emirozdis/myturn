// ./public/sw.js

const CURRENT_CACHE_VERSION = "myturn-app-v2";
const CORRUPTED_CACHES = ["myturn-vlogs-cache-v1", "myturn-vlogs-metadata-v1"];

self.addEventListener("install", (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Purge the old, manually managed video caches.
          // This permanently resolves the Chromium MSE "black screen" corruption bug.
          if (CORRUPTED_CACHES.includes(cacheName)) {
            console.log("[SW] Purging corrupted media cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // CRITICAL FIX:
  // By explicitly NOT calling event.respondWith() for media files, 
  // we force the browser's native network stack (XHR/Fetch) to handle the request.
  // This completely avoids the Chromium Service Worker ReadableStream MSE bug,
  // guaranteeing the video decoder never crashes on replay.
  return; 
});

// --- Keep-Alive Push Listeners ---
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/logo.png",
      badge: data.badge || "/logo.png",
      data: { url: data.url || "/" }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (e) {
    console.error("[SW] Push parser exception:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});