# PWA Implementation Plan

I'm using the writing-plans skill to create the implementation plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Flux platform into a Progressive Web App with offline browsing, push notifications, home screen installation, and silent background sync.

**Architecture:** Next.js 16 app with a custom Express server. PWA implemented via a standalone `public/sw.js` service worker + IndexedDB for offline data. Push via `web-push` with auto-generated VAPID keys. The SW is registered client-side via `lib/pwa/sw-register.ts`. No PWA frameworks used — hand-rolled for precise control.

**Tech Stack:** `web-push`, `sharp` (for icon generation), native Service Worker API, IndexedDB, Next.js 16 App Router.

---

## File Structure

```
public/
  manifest.json                          # PWA manifest
  sw.js                                  # Service worker
  icons/
    icon-192.png                         # 192x192 app icon
    icon-512.png                         # 512x512 app icon
    icon-maskable.png                    # Maskable icon for iOS

lib/pwa/
  sw-register.ts                         # Client-side SW registration + update handling
  indexeddb.ts                           # IndexedDB helpers (boards, tasks, user, subscriptions)
  push-manager.ts                       # Push subscription create/delete helpers

scripts/
  generate-vapid-keys.ts                 # One-time script to generate VAPID keys

app/api/notifications/
  subscribe/route.ts                     # POST: save push subscription for user
  unsubscribe/route.ts                  # DELETE: remove push subscription
  send/route.ts                          # POST: trigger a push notification (internal)
  vapid-keys/route.ts                    # GET: return VAPID public key to client

app/layout.tsx                           # Register SW, add manifest <link>
app/[slug]/settings/page.tsx            # Per-workspace notification toggle
```

---

## Dependency Installation

```bash
npm install web-push sharp
npm install -D @types/web-push
```

---

## Task 1: Install Dependencies and Generate VAPID Keys

**Files:**
- Modify: `package.json` (adds `web-push`, `sharp`)
- Create: `scripts/generate-vapid-keys.ts`
- Create: `.env` (adds VAPID keys)

- [ ] **Step 1: Run npm install**

Run: `npm install web-push sharp && npm install -D @types/web-push`
Expected: Both packages installed, no errors.

- [ ] **Step 2: Create VAPID key generation script**

Create: `scripts/generate-vapid-keys.ts`

```typescript
import { generateVAPIDKeys } from 'web-push';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const keys = generateVAPIDKeys();

const envPath = path.resolve(process.cwd(), '.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

// Update or add VAPID keys
const vapidLines = [
  `VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  `VAPID_SUBJECT=mailto:notifications@flux.com`,
];

// Remove existing VAPID lines
envContent = envContent
  .split('\n')
  .filter(line => !line.startsWith('VAPID_'))
  .join('\n')
  .trim();

envContent += '\n' + vapidLines.join('\n') + '\n';

fs.writeFileSync(envPath, envContent);
console.log('VAPID keys generated and saved to .env');
```

- [ ] **Step 3: Run the script**

Run: `npx tsx scripts/generate-vapid-keys.ts`
Expected: Output "VAPID keys generated and saved to .env". Check `.env` contains `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/generate-vapid-keys.ts .env
git commit -m "feat(pwa): add web-push, sharp, and VAPID key generation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 2: Create PWA Manifest

**Files:**
- Create: `public/manifest.json`
- Modify: `app/layout.tsx` (add `<link rel="manifest">` in metadata)

- [ ] **Step 1: Create manifest.json**

Create: `public/manifest.json`

```json
{
  "name": "Flux | Modern Project Management",
  "short_name": "Flux",
  "description": "Cutting-edge project management SaaS with real-time collaboration.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "orientation": "portrait-primary",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View your workspaces",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

- [ ] **Step 2: Update layout.tsx metadata**

Modify: `app/layout.tsx` — add `manifest: "/manifest.json"` to the `metadata` export:

```typescript
export const metadata: Metadata = {
  title: "Flux | Modern Project Management",
  description: "A cutting-edge project management SaaS with real-time collaboration.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/icon.svg" },
  },
  // ... rest of existing metadata
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json app/layout.tsx
git commit -m "feat(pwa): add manifest.json

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 3: Generate App Icons (PNG)

**Files:**
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable.png`
- Create: `scripts/generate-icons.ts`

**Note:** This task uses `sharp` to generate PNGs from an SVG F letterform created inline. The F is bold geometric, white background, brand purple `#7c3aed`.

- [ ] **Step 1: Create icon generation script**

Create: `scripts/generate-icons.ts`

```typescript
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Bold geometric F - SVG source
function createFSvg(size: number, bgColor: string, fgColor: string): Buffer {
  // The F letterform centered in the square, with padding
  const padding = Math.round(size * 0.15);
  const fWidth = size - padding * 2;
  const fHeight = size - padding * 2;
  const barHeight = Math.round(fHeight * 0.25);
  const barWidth = Math.round(fWidth * 0.45);
  const midBarWidth = Math.round(fWidth * 0.60);
  const stemWidth = Math.round(fWidth * 0.22);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <g transform="translate(${padding}, ${padding})">
    <!-- Vertical stem of F -->
    <rect x="0" y="0" width="${stemWidth}" height="${fHeight}" fill="${fgColor}"/>
    <!-- Top horizontal bar -->
    <rect x="${stemWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${fgColor}"/>
    <!-- Middle horizontal bar -->
    <rect x="${stemWidth}" y="${barHeight + 10}" width="${midBarWidth}" height="${barHeight}" fill="${fgColor}"/>
  </g>
</svg>`;
  return Buffer.from(svg);
}

// Maskable icon has extra safe zone - F centered in inner 80%
function createMaskableSvg(size: number, bgColor: string, fgColor: string): Buffer {
  const padding = Math.round(size * 0.1); // outer 10% safe zone
  const innerSize = size - padding * 2;
  const stemWidth = Math.round(innerSize * 0.22);
  const barHeight = Math.round(innerSize * 0.22);
  const barWidth = Math.round(innerSize * 0.40);
  const midBarWidth = Math.round(innerSize * 0.55);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <g transform="translate(${padding}, ${padding})">
    <rect x="0" y="0" width="${stemWidth}" height="${innerSize}" fill="${fgColor}"/>
    <rect x="${stemWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${fgColor}"/>
    <rect x="${stemWidth}" y="${barHeight + 8}" width="${midBarWidth}" height="${barHeight}" fill="${fgColor}"/>
  </g>
</svg>`;
  return Buffer.from(svg);
}

const BG = '#ffffff';
const FG = '#7c3aed';

async function generate() {
  // 192x192 - standard icon
  await sharp(createFSvg(192, BG, FG)).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 512x512 - large icon
  await sharp(createFSvg(512, BG, FG)).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // Maskable - 512x512 with safe zone
  await sharp(createMaskableSvg(512, BG, FG)).png().toFile(path.join(iconsDir, 'icon-maskable.png'));
  console.log('Generated icon-maskable.png');
}

generate().catch(console.error);
```

- [ ] **Step 2: Run the icon generation script**

Run: `npx tsx scripts/generate-icons.ts`
Expected: Three PNG files appear in `public/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable.png`.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-icons.ts public/icons/
git commit -m "feat(pwa): generate app icons from F letterform SVG

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 4: Create IndexedDB Helper

**Files:**
- Create: `lib/pwa/indexeddb.ts`

**Schema:**
- DB name: `flux-pwa-db`
- Version: 1
- Object stores: `boards`, `tasks`, `user`, `subscriptions`

```typescript
// lib/pwa/indexeddb.ts

const DB_NAME = 'flux-pwa-db';
const DB_VERSION = 1;

export interface CachedBoard {
  id: string;
  name: string;
  slug: string;
  lastAccessed: number; // Unix timestamp ms
}

export interface CachedTask {
  id: string;
  title: string;
  status: string;
  columnId: string;
  boardId: string;
  updatedAt: number;
}

export interface CachedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  activeWorkspaceId?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  workspaceId?: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('boards')) {
        db.createObjectStore('boards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('boardId', 'boardId', { unique: false });
      }
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('subscriptions')) {
        db.createObjectStore('subscriptions', { keyPath: 'endpoint' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Boards
export async function cacheBoard(board: CachedBoard): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('boards', 'readwrite');
    const store = tx.objectStore('boards');
    board.lastAccessed = Date.now();
    store.put(board);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedBoards(limit = 10): Promise<CachedBoard[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('boards', 'readonly');
    const store = tx.objectStore('boards');
    const request = store.getAll();
    request.onsuccess = () => {
      const boards = request.result as CachedBoard[];
      // Sort by lastAccessed descending, return top N
      boards.sort((a, b) => b.lastAccessed - a.lastAccessed);
      resolve(boards.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// Tasks
export async function cacheTasks(tasks: CachedTask[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    tasks.forEach(task => { store.put(task); });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTasksByBoardId(boardId: string): Promise<CachedTask[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const index = store.index('boardId');
    const request = index.getAll(boardId);
    request.onsuccess = () => resolve(request.result as CachedTask[]);
    request.onerror = () => reject(request.error);
  });
}

// User
export async function cacheUser(user: CachedUser): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user', 'readwrite');
    tx.objectStore('user').put(user);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedUser(): Promise<CachedUser | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user', 'readonly');
    const store = tx.objectStore('user');
    const request = store.getAll();
    request.onsuccess = () => {
      const users = request.result as CachedUser[];
      resolve(users[0]);
    };
    request.onerror = () => reject(request.error);
  });
}

// Push Subscriptions
export async function savePushSubscription(sub: PushSubscription): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('subscriptions', 'readwrite');
    tx.objectStore('subscriptions').put(sub);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPushSubscriptions(): Promise<PushSubscription[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('subscriptions', 'readonly');
    const request = tx.objectStore('subscriptions').getAll();
    request.onsuccess = () => resolve(request.result as PushSubscription[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('subscriptions', 'readwrite');
    tx.objectStore('subscriptions').delete(endpoint);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// LRU eviction — called when storage is near capacity
export async function evictOldestBoards(keepCount = 10): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('boards', 'readwrite');
    const store = tx.objectStore('boards');
    const request = store.getAll();
    request.onsuccess = () => {
      const boards = request.result as CachedBoard[];
      boards.sort((a, b) => b.lastAccessed - a.lastAccessed);
      const toDelete = boards.slice(keepCount);
      toDelete.forEach(board => store.delete(board.id));
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Storage quota check — warn if approaching 50MB
export async function checkStorageQuota(): Promise<boolean> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const usedMB = usage / (1024 * 1024);
    const quotaMB = quota / (1024 * 1024);
    if (usedMB > quotaMB * 0.9) {
      console.warn(`[PWA] Storage at ${usedMB.toFixed(1)}MB / ${quotaMB.toFixed(1)}MB — evicting oldest boards`);
      await evictOldestBoards(5);
      return true;
    }
  }
  return false;
}
```

- [ ] **Step 1: Commit**

```bash
git add lib/pwa/indexeddb.ts
git commit -m "feat(pwa): add IndexedDB helpers for offline data storage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 5: Service Worker

**Files:**
- Create: `public/sw.js`

```javascript
// public/sw.js

const STATIC_CACHE = 'flux-static-v1';
const PAGES_CACHE = 'flux-pages-v1';
const DATA_CACHE = 'flux-data-v1';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
];

const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000,    // 30 days
  PAGES: 7 * 24 * 60 * 60 * 1000,       // 7 days
};

// Install — pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only: auth, billing, API calls
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/billing') ||
    url.pathname.startsWith('/api/v1') ||
    url.pathname.includes('.sock') ||
    url.pathname.startsWith('/_next/static')
  ) {
    return; // Let network handle it, no caching
  }

  // Cache-first: static assets, images, fonts
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate: pages (landing, dashboard, workspace boards)
  if (
    url.pathname === '/' ||
    url.pathname === '/dashboard' ||
    url.pathname.match(/^\/[^/]+$/) ||  // workspace slug root
    url.pathname.match(/^\/[^/]+\/board\/[^/]+$/)  // board pages
  ) {
    event.respondWith(
      caches.open(PAGES_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => null);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Network-only for everything else
});

// Message handler — handle cache updates from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_BOARD_DATA') {
    // Message from client with board/task data to cache
    const { board, tasks } = event.data;
    caches.open(DATA_CACHE).then((cache) => {
      const boardData = new Response(JSON.stringify({ board, tasks }), {
        headers: { 'Content-Type': 'application/json' },
      });
      cache.put(`/data/board/${board.id}`, boardData);
    });
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon = '/icons/icon-192.png', url = '/dashboard' } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon-192.png',
      data: { url },
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
```

- [ ] **Step 1: Commit**

```bash
git add public/sw.js
git commit -m "feat(pwa): add service worker with caching strategies

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 6: Service Worker Registration & Update Flow

**Files:**
- Create: `lib/pwa/sw-register.ts`
- Create: `components/pwa/update-banner.tsx`
- Modify: `app/layout.tsx`

```typescript
// lib/pwa/sw-register.ts

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing;
      if (!newSW) return;

      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW available — show update banner
          broadcastUpdateAvailable();
        }
      });
    });

    console.log('[PWA] Service worker registered:', registration.scope);
  } catch (error) {
    console.error('[PWA] SW registration failed:', error);
  }
}

function broadcastUpdateAvailable(): void {
  // Dispatch custom event that UI components can listen to
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

export function onUpdateAvailable(callback: () => void): () => void {
  const handler = () => { callback(); };
  window.addEventListener('pwa-update-available', handler);
  return () => window.removeEventListener('pwa-update-available', handler);
}

export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.installing) return;

  registration.installing.postMessage({ type: 'SKIP_WAITING' });

  // Reload after SW activates
  registration.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
```

- [ ] **Step 1: Create sw-register.ts**

```typescript
// lib/pwa/sw-register.ts

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing;
      if (!newSW) return;

      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          broadcastUpdateAvailable();
        }
      });
    });

    console.log('[PWA] Service worker registered:', registration.scope);
  } catch (error) {
    console.error('[PWA] SW registration failed:', error);
  }
}

function broadcastUpdateAvailable(): void {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

export function onUpdateAvailable(callback: () => void): () => void {
  window.addEventListener('pwa-update-available', callback);
  return () => window.removeEventListener('pwa-update-available', callback);
}

export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.installing) return;
  registration.installing.postMessage({ type: 'SKIP_WAITING' });
  registration.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
```

- [ ] **Step 2: Create Update Banner component**

Create: `components/pwa/update-banner.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { onUpdateAvailable } from '@/lib/pwa/sw-register';
import { X, RefreshCw } from 'lucide-react';

export function PWAUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cleanup = onUpdateAvailable(() => setVisible(true));
    return cleanup;
  }, []);

  if (!visible) return null;

  const handleRefresh = async () => {
    const { applyUpdate } = await import('@/lib/pwa/sw-register');
    await applyUpdate();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--surface)] border border-[var(--border-default)] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
      <RefreshCw className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
      <p className="text-sm text-[var(--text-primary)]">
        A new version is available.{' '}
        <button
          onClick={handleRefresh}
          className="font-medium text-[var(--brand-primary)] hover:underline"
        >
          Refresh
        </button>{' '}
        to update.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Register SW in layout**

Modify: `app/layout.tsx` — add SW registration after the ThemeScript, inside the `<head>`:

Add before the closing `</head>`:
```tsx
</head>
<body>
```

Actually add inside `<head>` at the end:
```tsx
<head>
  <ThemeScript />
  <script dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
        });
      }
    `,
  }} />
</head>
```

- [ ] **Step 4: Add UpdateBanner to layout**

Modify: `app/layout.tsx` — add `<PWAUpdateBanner />` inside the body:

```tsx
import { PWAUpdateBanner } from '@/components/pwa/update-banner';

// In the JSX, add inside <body>:
<PWAUpdateBanner />
```

- [ ] **Step 5: Commit**

```bash
git add lib/pwa/sw-register.ts components/pwa/update-banner.tsx app/layout.tsx
git commit -m "feat(pwa): register service worker and add update banner

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 7: Push Notification API Routes

**Files:**
- Create: `app/api/notifications/vapid-keys/route.ts`
- Create: `app/api/notifications/subscribe/route.ts`
- Create: `app/api/notifications/unsubscribe/route.ts`
- Create: `app/api/notifications/send/route.ts`
- Create: `lib/pwa/vapid.ts`

**Note:** The send route is internal (called by your existing board/task action code when events fire). It is NOT exposed to the public — it should only be called from server-side code.

```typescript
// lib/pwa/vapid.ts

import * as webpush from 'web-push';

// These are set lazily — the first call to initVapid() checks .env
let initialized = false;

export function initVapid(): void {
  if (initialized) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@flux.com';

  if (!publicKey || !privateKey) {
    throw new Error('[PWA] VAPID keys not found in environment. Run: npx tsx scripts/generate-vapid-keys.ts');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export function getVapidPublicKey(): string {
  if (!initialized) initVapid();
  return process.env.VAPID_PUBLIC_KEY!;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!initialized) initVapid();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

- [ ] **Step 1: Create vapid.ts**

```typescript
// lib/pwa/vapid.ts

import * as webPush from 'web-push';

let initialized = false;

export function initVapid(): void {
  if (initialized) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@flux.com';

  if (!publicKey || !privateKey) {
    throw new Error('[PWA] VAPID keys not found. Run: npx tsx scripts/generate-vapid-keys.ts');
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export function getVapidPublicKey(): string {
  if (!initialized) initVapid();
  return process.env.VAPID_PUBLIC_KEY!;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!initialized) initVapid();
  await webPush.sendNotification(subscription, JSON.stringify(payload));
}
```

- [ ] **Step 2: Create vapid-keys route**

Create: `app/api/notifications/vapid-keys/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/pwa/vapid';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch (error) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create subscribe route**

Create: `app/api/notifications/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription } from '@/lib/pwa/indexeddb';
import { getVapidPublicKey } from '@/lib/pwa/vapid';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys, workspaceId } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await savePushSubscription({
    endpoint,
    keys,
    workspaceId,
    createdAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  // Return VAPID public key for client-side subscription
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create unsubscribe route**

Create: `app/api/notifications/unsubscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deletePushSubscription } from '@/lib/pwa/indexeddb';

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await deletePushSubscription(endpoint);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Create send notification route (internal)**

Create: `app/api/notifications/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPushSubscriptions } from '@/lib/pwa/indexeddb';
import { sendPushNotification } from '@/lib/pwa/vapid';

// Internal API — called from server-side action code, not directly from client
export async function POST(request: NextRequest) {
  // Verify this is called from internal server context
  // In production, add a secret header check: X-Internal-Secret
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, body, url = '/dashboard', workspaceId } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
  }

  const subscriptions = await getPushSubscriptions();

  // Filter by workspaceId if provided
  const relevant = workspaceId
    ? subscriptions.filter(s => s.workspaceId === workspaceId)
    : subscriptions;

  const results = await Promise.allSettled(
    relevant.map(sub =>
      sendPushNotification(sub, { title, body, url }).catch(err => {
        console.error('[PWA] Push send failed for:', sub.endpoint, err);
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: relevant.length });
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/pwa/vapid.ts app/api/notifications/vapid-keys/route.ts app/api/notifications/subscribe/route.ts app/api/notifications/unsubscribe/route.ts app/api/notifications/send/route.ts
git commit -m "feat(pwa): add push notification API routes and VAPID utilities

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 8: Push Manager Client Library

**Files:**
- Create: `lib/pwa/push-manager.ts`

```typescript
// lib/pwa/push-manager.ts

import { savePushSubscription, deletePushSubscription } from './indexeddb';

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.ready;
}

export async function subscribeToPush(workspaceId?: string): Promise<PushSubscription | null> {
  const registration = await getSWRegistration();
  if (!registration) return null;

  // Get VAPID public key from server
  const res = await fetch('/api/notifications/vapid-keys');
  if (!res.ok) throw new Error('Failed to get VAPID key');
  const { publicKey } = await res.json();

  const subscription = await registration.pushManager.subscribe({
    applicationServerKey: publicKey,
    userVisibleOnly: true,
  });

  const subJson = subscription.toJSON();
  await savePushSubscription({
    endpoint: subJson.endpoint!,
    keys: {
      p256dh: subJson.keys?.p256dh!,
      auth: subJson.keys?.auth!,
    },
    workspaceId,
    createdAt: Date.now(),
  });

  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await getSWRegistration();
  if (!registration) return;

  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    await deletePushSubscription(sub.endpoint);
    await sub.unsubscribe();
  }
}

export async function isPushSupported(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const registration = await getSWRegistration();
  if (!registration) return false;
  const sub = await registration.pushManager.getSubscription();
  return !!sub;
}

export function canRequestPushPermission(): boolean {
  return 'Notification' in window && Notification.permission !== 'denied';
}
```

- [ ] **Step 1: Commit**

```bash
git add lib/pwa/push-manager.ts
git commit -m "feat(pwa): add push manager client library

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 9: Notification Permission UI

**Files:**
- Create: `components/pwa/notification-permission-banner.tsx`
- Modify: `app/[slug]/settings/page.tsx` or `app/[slug]/settings/settings-client.tsx`

```tsx
// components/pwa/notification-permission-banner.tsx

'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPush, canRequestPushPermission } from '@/lib/pwa/push-manager';

interface Props {
  workspaceId: string;
  onEnabled?: () => void;
}

export function NotificationPermissionBanner({ workspaceId, onEnabled }: Props) {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!canRequestPushPermission()) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribeToPush(workspaceId);
      onEnabled?.();
      setVisible(false);
    } catch (err) {
      console.error('[PWA] Push subscription failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Get notified about task updates?
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Enable push notifications to receive updates even when your browser is closed.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-3 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-3 py-1.5 text-[var(--text-secondary)] text-xs font-medium rounded-md hover:bg-[var(--background-subtle)]"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 1: Create notification permission banner**

```tsx
// components/pwa/notification-permission-banner.tsx

'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPush, canRequestPushPermission } from '@/lib/pwa/push-manager';

interface Props {
  workspaceId: string;
  onEnabled?: () => void;
}

export function NotificationPermissionBanner({ workspaceId, onEnabled }: Props) {
  const [visible, setVisible] = useState(true);

  if (!canRequestPushPermission()) return null;

  const handleEnable = async () => {
    try {
      await subscribeToPush(workspaceId);
      onEnabled?.();
      setVisible(false);
    } catch (err) {
      console.error('[PWA] Push subscription failed:', err);
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Get notified about task updates?
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Enable push notifications to receive updates even when your browser is closed.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            className="px-3 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-medium rounded-md hover:opacity-90"
          >
            Enable
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-3 py-1.5 text-[var(--text-secondary)] text-xs font-medium rounded-md hover:bg-[var(--background-subtle)]"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Find settings page and add notification toggle**

Read: `app/[slug]/settings/settings-client.tsx` to understand the existing structure.

Then add a "Notifications" section with:
1. The `<NotificationPermissionBanner workspaceId={workspace.id} />` component (shown when Notification.permission === 'default')
2. A toggle to enable/disable push notifications per workspace (stored in workspace user preferences — if your existing data model has workspace-specific notification settings, use that; otherwise add it to a new `WorkspaceNotificationPreference` model)

For the per-workspace toggle, add to the settings page:
- A toggle switch: "Push notifications — [toggle]"
- On toggle ON → subscribe to push (call `subscribeToPush(workspace.id)`)
- On toggle OFF → unsubscribe (call `unsubscribeFromPush()`)

- [ ] **Step 3: Commit**

```bash
git add components/pwa/notification-permission-banner.tsx
# Also add settings changes
git commit -m "feat(pwa): add notification permission banner and per-workspace toggle

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 10: Offline Data Sync on Reconnect

**Files:**
- Modify: `lib/pwa/sw-register.ts` (add online listener)
- Create: `lib/pwa/offline-sync.ts`

```typescript
// lib/pwa/offline-sync.ts

import { getCachedBoards, checkStorageQuota } from './indexeddb';

export function setupOfflineSync(): void {
  if (!('ononline' in window)) return;

  window.addEventListener('online', async () => {
    console.log('[PWA] Back online — triggering background sync');
    await checkStorageQuota();
    // Dispatch event for components to refresh data
    window.dispatchEvent(new CustomEvent('pwa-reconnected'));
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Went offline');
    window.dispatchEvent(new CustomEvent('pwa-offline'));
  });
}

export async function refreshCachedBoards(): Promise<void> {
  // Fetch fresh data for all cached boards
  const boards = await getCachedBoards();
  await Promise.allSettled(
    boards.map(async (board) => {
      try {
        const res = await fetch(`/api/boards/${board.id}/cached-data`);
        if (res.ok) {
          const data = await res.json();
          // Update IndexedDB with fresh data
          const { cacheBoard, cacheTasks } = await import('./indexeddb');
          await cacheBoard({ ...board, lastAccessed: Date.now() });
          if (data.tasks) {
            await cacheTasks(data.tasks);
          }
        }
      } catch {
        // Silently fail — user is offline or data not available
      }
    })
  );
}
```

- [ ] **Step 1: Create offline-sync.ts**

```typescript
// lib/pwa/offline-sync.ts

import { getCachedBoards, checkStorageQuota } from './indexeddb';

export function setupOfflineSync(): void {
  window.addEventListener('online', async () => {
    console.log('[PWA] Back online — checking storage quota');
    await checkStorageQuota();
    window.dispatchEvent(new CustomEvent('pwa-reconnected'));
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Went offline');
    window.dispatchEvent(new CustomEvent('pwa-offline'));
  });
}

export async function refreshCachedBoards(): Promise<void> {
  const boards = await getCachedBoards();
  await Promise.allSettled(
    boards.map(async (board) => {
      try {
        const res = await fetch(`/api/boards/${board.id}/cached-data`);
        if (res.ok) {
          const data = await res.json();
          const { cacheBoard, cacheTasks } = await import('./indexeddb');
          await cacheBoard({ ...board, lastAccessed: Date.now() });
          if (data.tasks) {
            await cacheTasks(data.tasks);
          }
        }
      } catch {
        // Silent fail
      }
    })
  );
}
```

- [ ] **Step 2: Wire up offline sync in sw-register.ts**

Modify: `lib/pwa/sw-register.ts` — add `setupOfflineSync()` call in `registerServiceWorker()`:

```typescript
import { setupOfflineSync } from './offline-sync';

export async function registerServiceWorker(): Promise<void> {
  // ... existing code ...
  setupOfflineSync(); // Add this after SW registration
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/pwa/offline-sync.ts lib/pwa/sw-register.ts
git commit -m "feat(pwa): add offline sync and reconnection handlers

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 11: Wire Up Push Events in Existing Action Code

**Files:**
- Identify: `actions/task.ts`, `actions/board.ts`, other action files that handle the 6 push events
- Modify: Add calls to the `/api/notifications/send` route when events fire

**The 6 push events:**
1. Task assigned to you → trigger push
2. Comment added (to you) → trigger push
3. Due date approaching → trigger push
4. Task status changed (to you) → trigger push
5. Board invitation received → trigger push
6. Member joined board → trigger push

Each action that fires one of these events should make an internal POST to `/api/notifications/send`:

```typescript
// Example pattern — in actions that fire push events
async function triggerPushNotification(data: {
  title: string;
  body: string;
  url?: string;
  workspaceId?: string;
}) {
  await fetch('/api/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify(data),
  });
}
```

**Action files to check (from git status):**
- `actions/task.ts` — likely handles task assignment, status changes
- `actions/board.ts` — likely handles board invitations, member joined
- `actions/issue.ts` — may handle comments

For each event, find the action handler that processes it and add the push trigger call. This is spread across multiple files and needs per-file investigation.

- [ ] **Step 1: Investigate actions/task.ts for push trigger points**

Run: `grep -n "assign\|status\|dueDate\|comment" actions/task.ts | head -50`
Look for: task assignment, status change, due date reminders, comment creation handlers.

- [ ] **Step 2: Investigate actions/board.ts for push trigger points**

Run: `grep -n "invite\|member\|join" actions/board.ts | head -50`

- [ ] **Step 3: Add push trigger calls to each identified action**

In each action handler that fires a push event, add the `triggerPushNotification` call after the primary action completes.

- [ ] **Step 4: Commit each action file as it's modified**

```bash
git add actions/task.ts
git commit -m "feat(pwa): wire up push notifications for task events

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
"
```

---

## Task 12: Final Verification

**Files to verify:**
- `public/manifest.json` — exists and linked in layout
- `public/sw.js` — registered and active
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable.png` — all present
- `lib/pwa/sw-register.ts` — SW registered in layout
- `lib/pwa/indexeddb.ts` — all stores created
- `lib/pwa/push-manager.ts` — subscribe/unsubscribe implemented
- `lib/pwa/vapid.ts` — VAPID initialized
- `app/api/notifications/*` — all routes present
- `components/pwa/*` — update banner and permission banner present

**Verification commands:**

Run Lighthouse:
```
npx lighthouse http://localhost:3000 --only-categories=PWA
```
Expected: PWA score ≥ 90, all audits passing.

**Checks:**
- [ ] Manifest has `name`, `short_name`, `icons`, `start_url`, `display`
- [ ] Service worker controls `/` and caches it
- [ ] Icons 192x192 and 512x512 are valid PNG files
- [ ] SW responds with cached response for offline request
- [ ] Push permission triggered contextually, not on sign-in
- [ ] VAPID keys present in `.env`

---

## Plan Summary

| Task | Description |
|---|---|
| 1 | Install dependencies + generate VAPID keys |
| 2 | Create PWA manifest |
| 3 | Generate app icons (192, 512, maskable PNGs) |
| 4 | Create IndexedDB helper (boards, tasks, user, subscriptions) |
| 5 | Create service worker (`sw.js`) |
| 6 | SW registration + update banner UI |
| 7 | Push notification API routes (vapid-keys, subscribe, unsubscribe, send) |
| 8 | Push manager client library |
| 9 | Notification permission UI + per-workspace toggle |
| 10 | Offline sync + reconnect handlers |
| 11 | Wire up push events in existing action code |
| 12 | Final verification + Lighthouse audit |

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-11-pwa-implementation-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**