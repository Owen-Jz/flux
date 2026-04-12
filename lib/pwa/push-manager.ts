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
  const res = await fetch('/api/notifications/subscribe');
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