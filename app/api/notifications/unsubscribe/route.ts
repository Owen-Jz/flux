import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PushSubscription } from '@/models/PushSubscription';
import { Types } from 'mongoose';

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await connectDB();

  // Scope delete to the calling user so one account can't drop another's row.
  await PushSubscription.deleteOne({
    endpoint,
    userId: new Types.ObjectId(session.user.id),
  });

  return NextResponse.json({ success: true });
}
