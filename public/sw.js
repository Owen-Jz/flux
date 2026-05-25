/* Flux PWA Service Worker */
var STATIC_CACHE = 'flux-static-v2';
var PAGES_CACHE = 'flux-pages-v2';
var DATA_CACHE = 'flux-data-v2';

var STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
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
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
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

  // Stale-while-revalidate: Pages
  if (url.pathname === '/' || url.pathname === '/dashboard' || url.pathname.match(/^\/[^/]+$/) || isBoardPage(url)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var networkFetch = fetch(event.request).then(function(response) {
          if (response.ok) {
            caches.open(PAGES_CACHE).then(function(cache) {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        }).catch(function() {
          return cached;
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

  var data = event.data.json() || {};

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
