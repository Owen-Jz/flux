/* Flux PWA Service Worker */
var STATIC_CACHE = 'flux-static-v1';
var PAGES_CACHE = 'flux-pages-v1';
var DATA_CACHE = 'flux-data-v1';

var STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
];

function isAuthApi(url) {
  return url.pathname.startsWith('/api/auth');
}

function isBillingApi(url) {
  return url.pathname.startsWith('/api/billing');
}

function isSocketIO(url) {
  return url.pathname.startsWith('/socket.io');
}

function isNextStatic(url) {
  return url.pathname.startsWith('/_next/static');
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|woff2?|ttf|eot|image|png|jpg|jpeg|svg|ico|webp)$/);
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
  // /[slug]/board/[boardSlug]
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

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Network-only: Auth API, Billing API, Socket.IO, Next.js static
  if (isAuthApi(url) || isBillingApi(url) || isSocketIO(url) || isNextStatic(url)) {
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

self.addEventListener('message', function(event) {
  var data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CACHE_BOARD_DATA') {
    var board = data.board;
    var tasks = data.tasks;
    if (board) {
      caches.open(DATA_CACHE).then(function(cache) {
        var url = new URL('/api/boards/' + board.id, self.location.origin);
        cache.put(url, new Response(JSON.stringify({ board: board, tasks: tasks })));
      });
    }
  }
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
