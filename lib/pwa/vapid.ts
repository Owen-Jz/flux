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
