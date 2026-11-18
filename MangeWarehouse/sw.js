// Network-first for app files (always fresh online), cached copy when offline. Fonts fall back to system font offline.
const CACHE = 'warecon-v7';
const SHELL = ['./', 'assets/app.css', 'assets/logic.js', 'assets/seed.js', 'assets/app.js', 'assets/forms.js', 'assets/sync.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/') && !u.pathname.startsWith('/api/photo/')) return; // live data always from the network
  e.respondWith(fetch(e.request)
    .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
