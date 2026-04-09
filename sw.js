const CACHE = 'optimize-v1';
const ASSETS = ['/', '/index.html'];

// ── Install ──
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ── Fetch (offline support) ──
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// ── Message from app ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIF') {
    scheduleDaily(e.data.time);
  }
});

// ── Schedule daily notification ──
let notifTimer = null;
function scheduleDaily(timeStr) {
  if (notifTimer) clearTimeout(notifTimer);
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const ms = next - now;
  notifTimer = setTimeout(() => {
    fireNotification();
    scheduleDaily(timeStr); // reschedule for next day
  }, ms);
}

function fireNotification() {
  self.registration.showNotification('⚡ OPTIMIZE — Daily Check-in', {
    body: "Time to log your day. Keep the streak alive 🔥",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-log',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'log', title: '📝 Log Now' },
      { action: 'dismiss', title: 'Later' }
    ]
  });
}

// ── Notification click ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      if (cs.length > 0) { cs[0].focus(); return; }
      return clients.openWindow('/');
    })
  );
});

// ── On SW start, re-read saved time and reschedule ──
const saved = self.location.origin; // just to keep SW alive
try {
  // attempt to read from IDB or just wait for message
} catch(_) {}
