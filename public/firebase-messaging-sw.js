/* Background push notifications (Firebase Cloud Messaging).
   We read the push ourselves instead of loading the Firebase SDK here, so the real title and text
   are always shown straight away (otherwise Android may show only "CareBridge" with no details). */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function readPush(e) {
  let raw = {};
  try { raw = e.data ? e.data.json() : {}; } catch (_) { raw = { data: { body: e.data ? e.data.text() : '' } }; }
  const d = raw.data || {};
  const n = raw.notification || {};
  return {
    title: d.title || n.title || 'CareBridge',
    body: d.body || n.body || '',
    url: d.url || (raw.fcmOptions && raw.fcmOptions.link) || '/',
  };
}

self.addEventListener('push', (e) => {
  const m = readPush(e);
  e.waitUntil(
    self.registration.showNotification(m.title, {
      body: m.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: m.title + ':' + m.body,
      renotify: false,
      data: { url: m.url },
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) { c.navigate(url); return c.focus(); }
      return clients.openWindow(url);
    }),
  );
});
