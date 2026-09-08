const CACHE_NAME = 'shanyi-shell-v5';
const APP_SHELL = ['./', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-maskable-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (key.startsWith('shanyi-shell-') || key.startsWith('shanyi-paipan-')) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/') || url.pathname.includes('/knowledge/')) return;
  const navigation = event.request.mode === 'navigate';
  if (!navigation && !url.pathname.includes('/assets/') && !APP_SHELL.some(item => item !== './' && url.pathname.endsWith(item.slice(2)))) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(event.request) || (navigation ? await cache.match('./') : undefined) || Response.error();
      }),
  );
});
