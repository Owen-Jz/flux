export interface SubscribeResult {
  ok: boolean;
  reason?: 'unsupported' | 'permission-denied' | 'ios-not-installed' | 'sw-missing' | 'vapid-missing' | 'server-rejected' | 'error';
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.ready;
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac but exposes touch
    (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints !== undefined && (navigator as Navigator & { maxTouchPoints: number }).maxTouchPoints > 1);
  return isIOS;
}

function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari exposes its own non-standard flag
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/**
 * iOS Safari only delivers Web Push to PWAs added to the Home Screen (iOS 16.4+).
 * Returns true if the user is on iOS but the page is running in a normal Safari tab.
 */
export function requiresPWAInstallForPush(): boolean {
  return isIOSSafari() && !isStandalonePWA();
}

export async function subscribeToPush(workspaceId?: string): Promise<SubscribeResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  if (requiresPWAInstallForPush()) {
    return { ok: false, reason: 'ios-not-installed' };
  }

  const registration = await getSWRegistration();
  if (!registration) return { ok: false, reason: 'sw-missing' };

  const keyRes = await fetch('/api/notifications/vapid-keys');
  if (!keyRes.ok) return { ok: false, reason: 'vapid-missing' };
  const { publicKey } = (await keyRes.json()) as { publicKey?: string };
  if (!publicKey) return { ok: false, reason: 'vapid-missing' };

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      applicationServerKey: publicKey,
      userVisibleOnly: true,
    });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === 'NotAllowedError') return { ok: false, reason: 'permission-denied' };
    return { ok: false, reason: 'error' };
  }

  const subJson = subscription.toJSON();
  const keys = subJson.keys;
  if (!subJson.endpoint || !keys?.p256dh || !keys?.auth) {
    return { ok: false, reason: 'error' };
  }

  const saveRes = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      workspaceId,
    }),
  });

  if (!saveRes.ok) {
    // Roll the device-side subscription back so we don't leave an orphan that
    // the server doesn't know about.
    await subscription.unsubscribe().catch(() => undefined);
    return { ok: false, reason: 'server-rejected' };
  }

  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await getSWRegistration();
  if (!registration) return;

  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch(`/api/notifications/unsubscribe?endpoint=${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
  }).catch(() => undefined);
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const registration = await getSWRegistration();
  if (!registration) return false;
  const sub = await registration.pushManager.getSubscription();
  return !!sub;
}

export function canRequestPushPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'denied') return false;
  // On iOS Safari the API exists but throws unless the PWA is installed.
  if (requiresPWAInstallForPush()) return false;
  return true;
}
