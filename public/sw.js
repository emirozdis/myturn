self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
    if (event.data) {
      let data = {};
      
      try {
        data = event.data.json();
      } catch (e) {
        data = { title: "dayroll", body: event.data.text() };
      }
  
      const options = {
        body: data.body || "It's your turn today! 🎥",
        icon: data.icon || '/icon-192x192.png',
        badge: '/badge.png', // Optional monochrome icon
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 'dayroll-notif'
        }
      };
      
      event.waitUntil(self.registration.showNotification(data.title || "dayroll", options));
    }
  });