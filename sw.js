/* ===== NOUGHT SERVICE WORKER =====
   Makes the site installable and usable with no network at all.

   Two tiers, on purpose:
     PRECACHE  — the shell and all 19 pages. Small (fonts + css + js ≈ 200 KB),
                 so it is worth paying for at install time and every tool page
                 then opens offline on a cold start.
     RUNTIME   — the vendored PDF/zip/QR libraries, 2 MB between them. Cached the
                 first time a tool actually pulls one in, rather than making
                 every visitor download a PDF engine they may never open.

   Bump CACHE_VERSION whenever anything in PRECACHE changes, otherwise returning
   visitors keep the old copy until their browser evicts it. */
const CACHE_VERSION = 'nought-v1';
const RUNTIME_CACHE = 'nought-runtime-v1';

const PRECACHE = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'css/style.css',
  'js/theme.js',
  'js/tools-core.js',
  'js/main.js',
  'js/image-batch.js',
  'assets/favicon.svg',
  'assets/logo-icon.svg',
  'assets/fonts/bricolage.woff2',
  'assets/fonts/publicsans.woff2',
  'assets/fonts/jetbrainsmono.woff2',
  'image/compress/', 'image/resize/', 'image/convert/', 'image/bg-remove/',
  'pdf/compress/', 'pdf/merge/',
  'text/word-counter/', 'text/case-converter/', 'text/lorem-ipsum/', 'text/diff/',
  'calculators/emi/', 'calculators/gst/', 'calculators/age/', 'calculators/percentage/',
  'developer/json-formatter/', 'developer/base64/', 'developer/password/', 'developer/qr-code/'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // addAll() is all-or-nothing: one 404 would leave the site with no cache at
    // all. Cache what resolves and let the rest fall through to the network.
    await Promise.all(PRECACHE.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [CACHE_VERSION, RUNTIME_CACHE];
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // nothing third-party is loaded anyway
  if (req.headers.has('range')) return;              // let the browser handle partial content

  // Navigations: serve the cached page instantly, refresh it in the background,
  // and fall back to the offline page only when both cache and network fail.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) caches.open(CACHE_VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => null);
      return cached || (await fresh) || (await caches.match('offline.html')) ||
        new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })());
    return;
  }

  // Assets: cache-first, then network, storing whatever the network gave us.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      return new Response('', { status: 504 });
    }
  })());
});
