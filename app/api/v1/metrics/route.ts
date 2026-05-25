import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';
import { verifyApiKey } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await verifyApiKey(request);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
