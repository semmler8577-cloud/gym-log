/* Voccola Gym Log – Service Worker (v1.6.2: Wake Lock Timer) */
const CACHE = 'vgl-v1.6.2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './mobility.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-maskable-512.png', './assets/dumbbell.webp', './assets/keepawake.mp4'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
const CORE = /\/(index\.html|app\.js|mobility\.js|styles\.css|sw\.js)?$/;
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  if (req.mode === 'navigate' || CORE.test(url.pathname)) {
    // Network-first für App-Code: immer die neueste Version, offline aus dem Cache
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(key, cp)); }
      return r;
    }).catch(() => caches.match(key, { ignoreSearch: true }).then(h => h || new Response('Offline', { status: 503 }))));
    return;
  }
  // Rest (Icons, Bild): Cache-first mit Hintergrund-Update
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response('Offline', { status: 503 });
  }));
});
