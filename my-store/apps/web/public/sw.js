// Service Worker for Mavryk Technology
// Tăng VERSION mỗi lần deploy nếu cần xóa sạch runtime cache cũ (ảnh/API đã put vào RUNTIME).
const VERSION = 'v10';
const CACHE_NAME = `mavryk-store-${VERSION}`;
const RUNTIME_CACHE = `mavryk-runtime-${VERSION}`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/assets/images/logo-192.jpg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clear app caches from previous deploys.
// VERSION is stamped during build, so every deploy installs a fresh SW and removes stale runtime data.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('mavryk-store-') || cacheName.startsWith('mavryk-runtime-');
            })
            .map((cacheName) => {
              console.log('[SW] Clearing deploy cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests: always use network and never cache dynamic responses after deploy.
  if (url.pathname.startsWith('/api/') || (url.hostname === 'localhost' && url.port === '4000')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Offline',
            message: 'Kh\u00f4ng c\u00f3 k\u1ebft n\u1ed1i m\u1ea1ng. Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i k\u1ebft n\u1ed1i.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }),
    );
    return;
  }

  // Always try the network first for navigations so new deploys are visible immediately.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Static assets — network first để mỗi lần có mạng luôn ưu tiên bản mới; cache chỉ khi offline/chậm.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
