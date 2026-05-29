import webPush, { WebPushError } from 'web-push';

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

export interface SendResult {
  ok: boolean;
  statusCode?: number;
  expired: boolean;
  error?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function sendPushNotification(
  subscription: PushTarget,
  payload: PushPayload
): Promise<SendResult> {
  if (!initialized) initVapid();
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true, expired: false };
  } catch (err) {
    if (err instanceof WebPushError) {
      const expired = err.statusCode === 404 || err.statusCode === 410;
      return { ok: false, statusCode: err.statusCode, expired, error: err.message };
    }
    return { ok: false, expired: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
