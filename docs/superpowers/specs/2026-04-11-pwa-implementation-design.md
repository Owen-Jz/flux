# PWA Implementation Design

**Date:** 2026-04-11
**Status:** Draft
**Author:** Claude

---

## Overview

Convert the Flux platform (Next.js 16 + Express + MongoDB + Socket.IO) into a Progressive Web App with offline browsing, push notifications, and home screen installation support.

**Scope:** Full PWA implementation including manifest, service worker, offline caching strategy, push notification infrastructure, and icon generation.

---

## 1. Platform Profile

| Property | Value |
|---|---|
| Framework | Next.js 16.1.6, React 19.2.3 |
| Server | Custom Express (`tsx server.ts`) |
| Auth | NextAuth v5 (beta) — session-based, MongoDB |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Styling | Tailwind CSS v4 + CSS variables |
| Animations | Framer Motion + GSAP |
| Icons | Existing: `favicon.ico`, `icon.svg`, `logo.svg`, `flux-logo.png` in `/public` |

**PWA Readiness — Current State:**
- No `manifest.json` — needs creation
- No service worker — needs creation
- Icons: partial (SVG exists, missing 192x192/512x512 PNG)
- Next.js 16: no built-in PWA support, manual setup required

---

## 2. PWA Manifest

**File:** `public/manifest.json`

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
  "screenshots": [],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View your workspaces",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

**Key decisions:**
- `display: standalone` — app runs in its own window
- `background_color: #ffffff` — white splash on iOS/Android
- `theme_color: #7c3aed` — brand purple, status bar color
- Shortcut to `/dashboard` for home screen quick access

---

## 3. Icon Generation

**Output directory:** `public/icons/`

### Icon Set

| File | Size | Purpose |
|---|---|---|
| `icon-192.png` | 192x192 | Android Chrome, smaller screens |
| `icon-512.png` | 512x512 | Android Play Store, larger screens |
| `icon-maskable.png` | 512x512 | iOS Safari — safe zone, centered F |

### Design Spec

- **Symbol:** Bold geometric "F" letterform
- **Background:** Solid white `#ffffff`
- **Foreground color:** Brand purple `#7c3aed`
- **Shape:** Full-bleed square, F fills the frame with padding
- **iOS maskable:** 80% center safe zone, outer 10% transparent

**Generation approach:** Use `sharp` or `canvas` npm package to generate PNGs from an SVG source at build time. SVG source created manually or via Figma export.

---

## 4. Service Worker Architecture

**File:** `public/sw.js` (registered in `app/layout.tsx`)

### Scope & Strategy

| Route Pattern | Strategy | Cache Duration |
|---|---|---|
| `/` (landing page) | Stale-while-revalidate | 7 days |
| `/dashboard` | Stale-while-revalidate | 7 days |
| `/[slug]` (workspace boards) | Stale-while-revalidate | 7 days |
| Static assets (JS/CSS/fonts) | Cache-first | 30 days |
| Icons/images | Cache-first | 30 days |
| Auth API routes | Network-only | No cache |
| Billing API routes | Network-only | No cache |
| Socket.IO | Network-only | No cache |

### Cache Structure

```javascript
// Cache names
const STATIC_CACHE = 'flux-static-v1';     // JS, CSS, fonts, icons
const PAGES_CACHE = 'flux-pages-v1';       // HTML pages
const DATA_CACHE = 'flux-data-v1';         // Board/task data (IndexedDB supplement)

// Storage limit: 50MB total
// On overflow: LRU eviction of oldest DATA_CACHE entries
```

### Offline Data Storage (IndexedDB)

Used for board/task data to supplement the service worker cache.

**Database:** `flux-pwa-db`

**Stores:**
- `boards` — last 10 accessed boards (id, name, slug, lastAccessed)
- `tasks` — tasks for cached boards (id, title, status, column, boardId)
- `user` — lightweight session info (name, email, avatar, activeWorkspaceId)
- `subscriptions` — push subscription endpoints

**Expiration:** 7-day TTL per entry. Stale-while-revalidate on reconnect.

### Update Flow (Option A)

1. New SW installs in background (`install` event)
2. Old SW remains active until all tabs closed
3. On next visit, banner appears: "Update available — refresh to use latest version"
4. User clicks refresh → new SW activates → page reloads

---

## 5. Push Notification Infrastructure

### Stack

- **Package:** `web-push` npm
- **Transport:** Browser push service (FCM-compatible)
- **Auth:** VAPID key pair (auto-generated on first deploy)

### VAPID Key Management

**Generation:** On first server start, generate VAPID keys if not present in `.env`

```typescript
// In server startup or a dedicated setup script
import { generateVAPIDKeys } from 'web-push';

const keys = generateVAPIDKeys();
// Save to .env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// VAPID_SUBJECT = "mailto:notifications@flux.com"
```

**Environment variables:**
```
VAPID_PUBLIC_KEY=<auto-generated>
VAPID_PRIVATE_KEY=<auto-generated>
VAPID_SUBJECT=mailto:notifications@flux.com
```

**Note:** Keys are per-deployment (single key pair for all environments).

### Push Trigger Events

All events are per-workspace (user opts in per workspace):

| Event | Title | Body |
|---|---|---|
| Task assigned | "Task assigned to you" | "{task.title} in {board.name}" |
| Comment added | "New comment" | "{commenter.name}: {comment.preview}" |
| Due date reminder | "Task due soon" | "{task.title} due {task.dueDate}" |
| Status changed | "Task updated" | "{task.title} → {newStatus}" |
| Board invitation | "Board invitation" | "{inviter.name} invited you to {board.name}" |
| Member joined | "New team member" | "{member.name} joined {board.name}" |

**Payload:** Max 4KB. Title + body + icon + deep link URL only.

### Notification Click Behavior

All push notifications click → `/dashboard` (dashboard as chosen landing point)

### Permission Flow (Option B)

1. User triggers a push-worthy event in a workspace (e.g., assigned a task)
2. In-app banner appears: "Get notified about task updates? Enable notifications"
3. On confirm → browser native push permission prompt
4. If denied → nudge in workspace settings later, not again immediately

**Per-workspace:** Notification permission stored in workspace user preferences. User can toggle per workspace in Settings.

---

## 6. App Installation

### "Add to Home Screen" Flow

- Trigger: Browser native prompt (auto-shown by OS after criteria met)
- No custom in-app install banner (keep it simple)
- Install criteria met by: service worker active, manifest valid, HTTPS

### Splash Screen

- **Background:** `#ffffff` (white)
- **Icon:** F letterform on white, brand purple
- **Status bar:** Purple (`#7c3aed`)

---

## 7. Implementation Order

1. **Manifest + Icons** — `public/manifest.json`, generate PNG icons
2. **Service Worker** — `public/sw.js`, caching strategies, offline fallback
3. **SW Registration** — Register in `app/layout.tsx`, update prompt UI
4. **IndexedDB Layer** — DB schema, read/write helpers for offline data
5. **Push Infrastructure** — VAPID key gen, subscription storage, notification dispatch
6. **Permission UI** — In-app banner, per-workspace toggle in settings
7. **Update Flow** — SW update detection, refresh prompt banner

---

## 8. Files to Create/Modify

### New Files

| File | Purpose |
|---|---|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `public/icons/icon-192.png` | 192x192 icon |
| `public/icons/icon-512.png` | 512x512 icon |
| `public/icons/icon-maskable.png` | Maskable icon |
| `lib/pwa/sw-register.ts` | SW registration client-side |
| `lib/pwa/indexeddb.ts` | IndexedDB helpers |
| `lib/pwa/push-manager.ts` | Push subscription management |
| `lib/pwa/vapid.ts` | VAPID key utilities |
| `scripts/generate-vapid-keys.ts` | Key generation script |

### Modified Files

| File | Change |
|---|---|
| `app/layout.tsx` | Register SW, add manifest link |
| `app/api/notifications/subscribe/route.ts` | Save push subscriptions |
| `app/api/notifications/send/route.ts` | Trigger push notification |
| `app/[slug]/settings/` | Add notification per-workspace toggle |
| `next.config.ts` | CSP updates for push (if using FCM) |

---

## 9. Dependencies to Add

```bash
npm install web-push sharp
npm install -D @types/web-push
```

**Note:** `sharp` for PNG generation at build time. Alternative: use `canvas` package.

---

## 10. Verification Checklist

- [ ] `manifest.json` valid and linked in `layout.tsx`
- [ ] 192x192 and 512x512 PNG icons present
- [ ] Maskable icon for iOS
- [ ] Service worker registered and active
- [ ] Landing page cached offline
- [ ] Dashboard cached offline
- [ ] Board pages cached offline
- [ ] Auth routes never cached
- [ ] 50MB storage limit enforced
- [ ] LRU eviction on overflow
- [ ] Silent background sync on reconnect
- [ ] Update banner appears on new SW
- [ ] VAPID keys auto-generated
- [ ] Push subscription stored per user
- [ ] Permission prompt contextually triggered (not on sign-in)
- [ ] Notification per-workspace toggle in settings
- [ ] All 6 push events wired up
- [ ] Lighthouse PWA score ≥ 90

---

## Open Questions (Deferred)

- Offline banner/indicator UI (deferred — user will revisit)
- Conflict resolution if editing offline is later enabled
- Email vs push preference mapping (can be added later)