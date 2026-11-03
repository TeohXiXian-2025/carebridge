/* Background push notifications (Firebase Cloud Messaging). The web config arrives in the query string. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = JSON.parse(decodeURIComponent(new URL(self.location.href).searchParams.get('config') || '{}'));
if (config.apiKey) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((m) => {
    const d = m.data || {};
    const n = m.notification || {};
    return self.registration.showNotification(d.title || n.title || 'CareBridge', {
      body: d.body || n.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: (d.title || 'carebridge') + ':' + (d.body || ''),
      data: { url: d.url || '/' },
    });
  });
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) { c.navigate(url); return c.focus(); }
      return clients.openWindow(url);
    }),
  );
});
