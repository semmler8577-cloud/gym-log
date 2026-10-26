/* Voccola Gym Log – Service Worker (v1.7.0: Duoball LWS in 2 Phasen) */
const CACHE = 'vgl-v1.7.1';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './mobility.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-maskable-512.png', './assets/dumbbell.webp', './assets/keepawake.mp4',
  './assets/ex/bauch-crunch-maschine.webp', './assets/ex/r-facepull.webp', './assets/ex/r-revfly.webp', './assets/ex/s-presse-kabel-liegend.webp', './assets/ex/s-seitheben-kabel-einarm.webp', './assets/ex/s-seitheben-vorgebeugt.webp', './assets/ex/x1.webp', './assets/ex/x10.webp', './assets/ex/x11.webp', './assets/ex/x12.webp', './assets/ex/x13.webp', './assets/ex/x14.webp', './assets/ex/x15.webp', './assets/ex/x16.webp', './assets/ex/x17.webp', './assets/ex/x18.webp', './assets/ex/x19.webp', './assets/ex/x2.webp', './assets/ex/x20.webp', './assets/ex/x21.webp', './assets/ex/x22.webp', './assets/ex/x23.webp', './assets/ex/x24.webp', './assets/ex/x25.webp', './assets/ex/x26.webp', './assets/ex/x27.webp', './assets/ex/x28.webp', './assets/ex/x3.webp', './assets/ex/x4.webp', './assets/ex/x5.webp', './assets/ex/x6.webp', './assets/ex/x7.webp', './assets/ex/x8.webp', './assets/ex/x9.webp', 
  './assets/mob/catcow.webp', './assets/mob/hipflex.webp', './assets/mob/wgs.webp', './assets/mob/n9090.webp', './assets/mob/bridge.webp', './assets/mob/birddog.webp', './assets/mob/deadbug.webp', './assets/mob/tuer.webp', './assets/mob/kneel.webp', './assets/mob/pigeon.webp', './assets/mob/turtle.webp', './assets/mob/froll_g.webp', './assets/mob/froll_t.webp', './assets/mob/ballpir.webp', './assets/mob/duoball.webp', './assets/mob/shakti.webp', './assets/mob/pigeonq.webp', './assets/mob/rollbecken.webp', './assets/mob/rollschien.webp', './assets/mob/rollknie.webp',
  './assets/mob/seq_catcow.webp', './assets/mob/seq_hipflex.webp', './assets/mob/seq_wgs.webp', './assets/mob/seq_n9090.webp', './assets/mob/seq_bridge.webp', './assets/mob/seq_birddog.webp', './assets/mob/seq_deadbug.webp', './assets/mob/seq_tuer.webp', './assets/mob/seq_kneel.webp', './assets/mob/seq_pigeon.webp', './assets/mob/seq_turtle.webp', './assets/mob/seq_froll_g.webp', './assets/mob/seq_froll_t.webp', './assets/mob/seq_ballpir.webp', './assets/mob/seq_duoball.webp', './assets/mob/seq_shakti.webp', './assets/mob/seq_pigeonq.webp', './assets/mob/seq_rollbecken.webp', './assets/mob/seq_rollschien.webp', './assets/mob/seq_rollknie.webp'];
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
