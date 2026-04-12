import { NextRequest, NextResponse } from 'next/server';
import { getPushSubscriptions } from '@/lib/pwa/indexeddb';
import { sendPushNotification } from '@/lib/pwa/vapid';

export async function POST(request: NextRequest) {
  // Internal API — called from server-side action code
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, body, url = '/dashboard', workspaceId } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
  }

  const subscriptions = await getPushSubscriptions();
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
