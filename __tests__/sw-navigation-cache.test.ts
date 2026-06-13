import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Regression test for the landing-page "Something went wrong" crash.
 *
 * Root cause: the service worker served public-page HTML (`/`, `/login`, …) with
 * a stale-while-revalidate strategy. After a deploy, the cached HTML shell still
 * referenced build-hashed JS chunks from the previous build. Those chunks 404 on
 * the new deployment -> ChunkLoadError -> the app error boundary.
 *
 * The fix makes public-page navigations network-first: the shell is always
 * fetched fresh (so its chunk references match the live build) and cache is only
 * a fallback when the network is unreachable.
 *
 * This test loads the real `public/sw.js` into a simulated ServiceWorker scope
 * and drives its `fetch` handler. It fails against the old SWR implementation
 * (which returns the stale cached shell first) and passes with network-first.
 */

type FetchHandler = (event: unknown) => void;

interface LoadedSW {
  fetchHandler: FetchHandler;
}

function loadServiceWorker(deps: {
  caches: unknown;
  fetch: unknown;
}): LoadedSW {
  const swSource = readFileSync(
    path.join(__dirname, '..', 'public', 'sw.js'),
    'utf8',
  );

  const listeners: Record<string, FetchHandler> = {};
  const self = {
    addEventListener: (type: string, handler: FetchHandler) => {
      listeners[type] = handler;
    },
    skipWaiting: () => {},
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([]) },
    registration: { update: () => Promise.resolve() },
  };

  // Run the SW source with worker globals shadowed by our test doubles. The
  // module body only registers listeners at load time, so this is safe.
  const run = new Function(
    'self',
    'caches',
    'fetch',
    'navigator',
    'console',
    swSource,
  );
  run(self, deps.caches, deps.fetch, { serviceWorker: {} }, console);

  if (!listeners.fetch) {
    throw new Error('sw.js did not register a fetch listener');
  }
  return { fetchHandler: listeners.fetch };
}

function makeFetchEvent(url: string) {
  let responsePromise: Promise<Response> | undefined;
  return {
    request: { url, mode: 'navigate' as const },
    respondWith(p: Promise<Response>) {
      responsePromise = p;
    },
    get response() {
      return responsePromise;
    },
  };
}

describe('service worker — public page navigations are network-first', () => {
  let cachePut: ReturnType<typeof vi.fn>;
  let cacheStore: Map<string, Response>;
  let caches: { open: ReturnType<typeof vi.fn>; match: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    cachePut = vi.fn();
    cacheStore = new Map();
    caches = {
      open: vi.fn().mockResolvedValue({ put: cachePut }),
      // Default: a STALE shell is sitting in the cache (the dangerous case).
      match: vi.fn(async (req: { url: string } | string) => {
        const key = typeof req === 'string' ? req : req.url;
        return cacheStore.get(key);
      }),
    };
  });

  it('serves the fresh network shell for "/" even when a stale shell is cached', async () => {
    // A poisoned stale shell exists in cache — the old SWR code would return it.
    cacheStore.set('https://www.fluxboard.site/', new Response('STALE_SHELL'));

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('FRESH_SHELL', { status: 200 }));

    const { fetchHandler } = loadServiceWorker({ caches, fetch: fetchMock });
    const event = makeFetchEvent('https://www.fluxboard.site/');
    fetchHandler(event);

    expect(event.response).toBeDefined();
    const res = await event.response!;
    const body = await res.text();

    // Network-first: the live build's shell is served, never the stale one.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body).toBe('FRESH_SHELL');
  });

  it('falls back to the cached shell when the network is unreachable (offline)', async () => {
    cacheStore.set('https://www.fluxboard.site/login', new Response('CACHED_LOGIN'));

    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { fetchHandler } = loadServiceWorker({ caches, fetch: fetchMock });
    const event = makeFetchEvent('https://www.fluxboard.site/login');
    fetchHandler(event);

    const res = await event.response!;
    expect(await res.text()).toBe('CACHED_LOGIN');
  });

  it('caches the fresh shell on a successful network response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('FRESH_SHELL', { status: 200 }));

    const { fetchHandler } = loadServiceWorker({ caches, fetch: fetchMock });
    const event = makeFetchEvent('https://www.fluxboard.site/');
    fetchHandler(event);

    await event.response!;
    // Allow the fire-and-forget caches.open(...).then(put) microtasks to settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(caches.open).toHaveBeenCalledWith('flux-pages-v4');
    expect(cachePut).toHaveBeenCalledTimes(1);
  });
});
