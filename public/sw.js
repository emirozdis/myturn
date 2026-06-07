self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'MyTurn';
    const options = {
      body: data.body || '',
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('Handling non-JSON push payload:', err);
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('MyTurn', {
        body: text,
        icon: '/logo.png',
        badge: '/logo.png',
        data: { url: '/' }
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          client.focus();
          if (client.navigate) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});