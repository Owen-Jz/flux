import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVapidPublicKey } from '@/lib/pwa/vapid';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch (error) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 });
  }
}
