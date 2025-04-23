const CACHE_NAME = 'zollege-cache-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve cached assets, then network fallback
self.addEventListener('fetch', event => {
  // Only handle same-origin navigation and asset requests
  const requestURL = new URL(event.request.url);
  if (requestURL.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse ||
               fetch(event.request).then(networkResponse => {
                 // update cache
                 return caches.open(CACHE_NAME).then(cache => {
                   cache.put(event.request, networkResponse.clone());
                   return networkResponse;
                 });
               });
      }).catch(() => {
        // if both fail (e.g., offline HTML)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
    );
  }
});
