export async function triggerNotification(data: {
  title: string;
  body: string;
  url?: string;
  workspaceId?: string;
}): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.warn('[PWA] INTERNAL_API_SECRET not set — skipping push');
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
