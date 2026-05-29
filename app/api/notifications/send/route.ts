import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { PushSubscription } from '@/models/PushSubscription';
import { sendPushNotification } from '@/lib/pwa/vapid';

interface SendRequestBody {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  workspaceId?: string;
  userId?: string;
  userIds?: string[];
  excludeUserId?: string;
}

function toObjectIds(ids: string[]): Types.ObjectId[] {
  const out: Types.ObjectId[] = [];
  for (const id of ids) {
    if (Types.ObjectId.isValid(id)) out.push(new Types.ObjectId(id));
  }
  return out;
}

export async function POST(request: NextRequest) {
  // Internal API — called server-side from action code via lib/pwa/trigger-notification.ts
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as SendRequestBody;
  const {
    title,
    body: messageBody,
    url = '/dashboard',
    icon,
    badge,
    workspaceId,
    userId,
    userIds,
    excludeUserId,
  } = body;

  if (typeof title !== 'string' || !title || typeof messageBody !== 'string' || !messageBody) {
    return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
  }

  await connectDB();

  const query: Record<string, unknown> = {};
  if (workspaceId) query.workspaceId = workspaceId;

  // userId / userIds collapse into a single filter; userIds wins if both present.
  let userIdFilter: Record<string, unknown> | undefined;
  if (Array.isArray(userIds) && userIds.length > 0) {
    const objectIds = toObjectIds(userIds);
    if (objectIds.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, pruned: 0, total: 0 });
    }
    userIdFilter = { $in: objectIds };
  } else if (typeof userId === 'string' && Types.ObjectId.isValid(userId)) {
    userIdFilter = { $eq: new Types.ObjectId(userId) };
  }

  if (excludeUserId && Types.ObjectId.isValid(excludeUserId)) {
    userIdFilter = { ...(userIdFilter ?? {}), $ne: new Types.ObjectId(excludeUserId) };
  }
  if (userIdFilter) query.userId = userIdFilter;

  // Guard against an unscoped fanout: require at least one filter so an
  // attacker who somehow obtained the secret can't broadcast to every device.
  if (!workspaceId && !userIdFilter) {
    return NextResponse.json({ error: 'Missing target (workspaceId, userId, or userIds)' }, { status: 400 });
  }

  const subscriptions = await PushSubscription.find(query).lean();

  const expiredEndpoints: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title, body: messageBody, url, icon, badge }
      );
      if (result.ok) {
        sent++;
        return;
      }
      failed++;
      if (result.expired) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.warn('[PWA] Push send failed', sub.endpoint, result.statusCode, result.error);
      }
    })
  );

  if (expiredEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
  }

  return NextResponse.json({
    sent,
    failed,
    pruned: expiredEndpoints.length,
    total: subscriptions.length,
  });
}
