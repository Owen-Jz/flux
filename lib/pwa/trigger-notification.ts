export interface TriggerNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  /** Workspace slug — fan out to every subscription tagged with this slug. */
  workspaceId?: string;
  /** Target one or more specific user IDs (Mongo ObjectId strings). */
  userIds?: string[];
  /** Suppress the actor's own devices (e.g. don't push the assigner who assigned themselves). */
  excludeUserId?: string;
}

export async function triggerNotification(data: TriggerNotificationPayload): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.warn('[PWA] INTERNAL_API_SECRET not set — skipping push');
    return;
  }
  // Don't fan out to nobody — caller can pass userIds:[] when filtering removed everyone.
  if (data.userIds && data.userIds.length === 0 && !data.workspaceId) {
    return;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('[PWA] Push notification timed out');
    } else {
      console.error('[PWA] Push notification failed:', err);
    }
  }
}
