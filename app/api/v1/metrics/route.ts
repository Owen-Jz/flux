import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
