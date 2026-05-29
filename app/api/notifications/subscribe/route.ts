import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PushSubscription } from '@/models/PushSubscription';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys, workspaceId } = body ?? {};

  if (typeof endpoint !== 'string' || !endpoint ||
      typeof keys?.p256dh !== 'string' || !keys.p256dh ||
      typeof keys?.auth !== 'string' || !keys.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await connectDB();

  const userObjectId = new Types.ObjectId(session.user.id);
  const userAgent = request.headers.get('user-agent')?.slice(0, 500);

  // Upsert by endpoint — a single device should only have one row.
  // The unique index on `endpoint` prevents duplicates across users.
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      $set: {
        userId: userObjectId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        workspaceId: typeof workspaceId === 'string' ? workspaceId : undefined,
        userAgent,
        lastUsedAt: new Date(),
      },
      $setOnInsert: { endpoint },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}

export async function GET() {
  // Backward-compatible alias of /api/notifications/vapid-keys.
  try {
    const { getVapidPublicKey } = await import('@/lib/pwa/vapid');
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
}
