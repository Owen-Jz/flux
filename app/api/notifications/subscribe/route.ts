import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription } from '@/lib/pwa/indexeddb';

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
    const { getVapidPublicKey } = await import('@/lib/pwa/vapid');
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
}
