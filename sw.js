/* Voccola Gym Log – Service Worker (v1.6.7: Bewegungsablauf-Bilder, Taube quer) */
const CACHE = 'vgl-v1.6.7';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './mobility.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-maskable-512.png', './assets/dumbbell.webp', './assets/keepawake.mp4',
  './assets/mob/catcow.webp', './assets/mob/hipflex.webp', './assets/mob/wgs.webp', './assets/mob/n9090.webp', './assets/mob/bridge.webp', './assets/mob/birddog.webp', './assets/mob/deadbug.webp', './assets/mob/tuer.webp', './assets/mob/kneel.webp', './assets/mob/pigeon.webp', './assets/mob/turtle.webp', './assets/mob/froll_g.webp', './assets/mob/froll_t.webp', './assets/mob/ballpir.webp', './assets/mob/duoball.webp', './assets/mob/shakti.webp', './assets/mob/pigeonq.webp',
  './assets/mob/seq_catcow.webp', './assets/mob/seq_hipflex.webp', './assets/mob/seq_wgs.webp', './assets/mob/seq_n9090.webp', './assets/mob/seq_bridge.webp', './assets/mob/seq_birddog.webp', './assets/mob/seq_deadbug.webp', './assets/mob/seq_tuer.webp', './assets/mob/seq_kneel.webp', './assets/mob/seq_pigeon.webp', './assets/mob/seq_turtle.webp', './assets/mob/seq_froll_g.webp', './assets/mob/seq_froll_t.webp', './assets/mob/seq_ballpir.webp', './assets/mob/seq_duoball.webp', './assets/mob/seq_shakti.webp', './assets/mob/seq_pigeonq.webp'];
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
