/* Glass Pattern Studio service worker — versioned offline shell. */
const CACHE = 'glass-studio-v0-2';
const SHELL = ['./', 'index.html', 'styles.css', 'manifest.json', 'pdf.js', 'glass.js', 'tracer.js', 'tracer-worker.js', 'db.js', 'materials.js', 'print.js', 'guide.js', 'app.js',
  'samples/bird.jpg', 'samples/house.jpg', 'samples/cat.jpg', 'samples/tulip.jpg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('glass-studio-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(new URL('./', location.href).pathname)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => { if (r.ok && r.type === 'basic') { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(e.request, c)); } return r; }).catch(() => e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
