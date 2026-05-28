/* Flux PWA Service Worker */
var STATIC_CACHE = 'flux-static-v3';
var PAGES_CACHE = 'flux-pages-v3';
var DATA_CACHE = 'flux-data-v3';
var OFFLINE_URL = '/offline';

var STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  OFFLINE_URL,
];

// Check for new SW version every 30 seconds
var SW_CHECK_INTERVAL = 30000;
var lastCheck = 0;

function isAuthApi(url) {
  return url.pathname.startsWith('/api/auth');
}

function isBillingApi(url) {
  return url.pathname.startsWith('/api/billing');
}

function isNextStatic(url) {
  return url.pathname.startsWith('/_next/static');
}

function isStaticAsset(url) {
  return url.protocol !== 'chrome-extension:' &&
         url.pathname.match(/\.(js|css|woff2?|ttf|eot|image|png|jpg|jpeg|svg|ico|webp)$/);
}

function isPagesRoute(url) {
  var pathname = url.pathname;
  return pathname === '/' ||
         pathname === '/dashboard' ||
         pathname === '/' + pathname.split('/')[1];
}

function isBoardPage(url) {
  var pathname = url.pathname;
  var parts = pathname.split('/');
  return parts.length === 4 && parts[1] && parts[2] === 'board' && parts[3];
}

self.addEventListener('install', function(event) {
  // addAll is atomic — if any asset 404s, the whole install fails.
  // Pre-cache each entry independently so a missing /offline (e.g. during
  // first dev render) does not break the entire SW install.
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return Promise.all(
        STATIC_ASSETS.map(function(asset) {
          return cache.add(asset).catch(function(err) {
            console.warn('[SW] Failed to pre-cache:', asset, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  var validCaches = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (validCaches.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Check for SW updates periodically to detect build changes
self.addEventListener('message', function(event) {
  var data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Client asking to check for updates
  if (data.type === 'CHECK_FOR_UPDATE') {
    self.registration.update().then(function() {
      // Notify client of update available
      self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'UPDATE_AVAILABLE' });
        });
      });
    }).catch(function(err) {
      console.warn('SW update check failed:', err);
    });
  }
});

// Listen for updates from the server
self.addEventListener('updatefound', function(event) {
  var newWorker = event.target.installing;
  if (!newWorker) return;

  newWorker.addEventListener('statechange', function() {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New SW available - notify all clients
      self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'UPDATE_AVAILABLE' });
        });
      });
    }
  });
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-http(s) requests (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network-only: Auth API, Billing API
  if (isAuthApi(url) || isBillingApi(url)) {
    return;
  }

  // ALWAYS fetch fresh for Next.js static chunks (build-dependent assets)
  // This prevents the "stale chunk" error - chunks are keyed by build hash
  if (isNextStatic(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first: Static assets (JS/CSS/fonts/images)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            return caches.open(STATIC_CACHE).then(function(cache) {
              cache.put(event.request, response.clone());
            }).then(function() {
              return response;
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first: Authenticated pages (dashboard, workspace routes, board pages)
  // Never serve stale cache for these — auth state changes between visits
  if (url.pathname === '/dashboard' || isBoardPage(url)) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response.ok && !response.redirected) {
          // Clone synchronously before the response body can be consumed
          // by the outer caller — clone() after an async boundary throws
          // "Response body is already used".
          var cacheable = response.clone();
          caches.open(PAGES_CACHE).then(function(cache) {
            cache.put(event.request, cacheable);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          return caches.match(OFFLINE_URL).then(function(offline) {
            return offline || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        });
      })
    );
    return;
  }

  // Stale-while-revalidate: Public pages
  if (url.pathname === '/' || url.pathname.match(/^\/[^/]+$/)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var networkFetch = fetch(event.request).then(function(response) {
          if (response.ok && !response.redirected) {
            var cacheable = response.clone();
            caches.open(PAGES_CACHE).then(function(cache) {
              cache.put(event.request, cacheable);
            });
          }
          return response;
        }).catch(function() {
          if (cached) return cached;
          return caches.match(OFFLINE_URL).then(function(offline) {
            return offline || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Everything else: Network-only
});

self.addEventListener('push', function(event) {
  if (!event.data) return;

  // Push payload may not be valid JSON — fall back to plain text so a
  // malformed push never silently kills the notification.
  var data = {};
  try {
    data = event.data.json() || {};
  } catch {
    var text = '';
    try { text = event.data.text(); } catch { text = ''; }
    data = { title: 'Flux', body: text || 'You have a new notification' };
  }

  var title = data.title || 'Flux';
  var body = data.body || '';
  var icon = data.icon || '/icons/icon-192.png';
  var badge = data.badge || '/icons/icon-192.png';
  var url = data.url || '/dashboard';
  var vibrate = data.vibrate || [100, 50, 100];

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: vibrate,
      data: { url: url }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(url) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
