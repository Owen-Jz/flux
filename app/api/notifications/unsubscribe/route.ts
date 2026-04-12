import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deletePushSubscription } from '@/lib/pwa/indexeddb';

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await deletePushSubscription(endpoint);
  return NextResponse.json({ success: true });
}
