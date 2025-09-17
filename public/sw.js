// Service Worker com atualização confiável para SPA
const CACHE_VERSION = 'v4';
const CACHE_NAME = `gestor-abaixo-assinado-${CACHE_VERSION}`;
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icon-192x192.svg', '/icon-512x512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(APP_SHELL); } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener('message', (event) => {
  if (event?.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// Navegações: network-first; assets: cache-first; demais: network com fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/index.html')) || (await cache.match('/')) || new Response('', { status: 504 });
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  event.respondWith((async () => {
    try { return await fetch(req); } 
    catch (_) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(req)) || new Response('', { status: 504 });
    }
  })());
});
