// Sunnah Home — Service Worker Foundation
const CACHE_VERSION = 'sunnah-home-v1';
const APP_SHELL_CACHE = `shell-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const FONTS_CACHE = `fonts-${CACHE_VERSION}`;

const CURRENT_CACHES = [APP_SHELL_CACHE, STATIC_CACHE, FONTS_CACHE];

const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/logo.gif',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/manifest.json',
  '/robots.txt',
];

// Installation: Precache the application shell and core static brand assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Precache failed for ${url}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up any old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (!CURRENT_CACHES.includes(name)) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Message listener for skipWaiting trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper: Check if request is a navigation request (HTML document)
function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Helper: Check if request is for static JS/CSS/image/font assets
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webmanifest')
  );
}

// Helper: Check if request is for Google Fonts
function isFontRequest(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

// Helper: Check if request is an external API / database sync (e.g. Supabase)
function isApiRequest(url) {
  return (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('aladhan.com') ||
    url.pathname.startsWith('/api/')
  );
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. External API / DB sync requests — Network-Only (no SW caching of user data/tokens)
  if (isApiRequest(url)) {
    return;
  }

  // 2. Navigation requests (App Shell) — Network-First with Cache Fallback
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => {
              cache.put(request, copy);
              // Also cache under root '/' as canonical app shell fallback
              cache.put('/', response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: return matching cached page or canonical root shell
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const rootFallback = await caches.match('/');
          if (rootFallback) {
            return rootFallback;
          }
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Sunnah Home</title></head><body><p>Offline — Please reload when connected.</p></body></html>',
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // 3. Google Fonts — Stale-While-Revalidate
  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Static Assets (JS, CSS, images) — Cache-First with Network Fallback
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // If cached asset exists, return it immediately (and revalidate in background if not hashed)
          if (!url.pathname.includes('/assets/')) {
            fetch(request)
              .then((fresh) => {
                if (fresh && fresh.status === 200) {
                  cache.put(request, fresh.clone());
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        // Cache miss: fetch from network and cache
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn(`[SW] Failed to fetch static asset: ${url.pathname}`, err);
            return new Response('', { status: 408, statusText: 'Request timed out or offline' });
          });
      })
    );
    return;
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Push notification hook for background notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'Sunnah Home';
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data || { url: '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Sunnah Home', {
        body: text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
    );
  }
});
