import type { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

// Constant-time string comparison. Returns false on length mismatch (which
// timingSafeEqual would otherwise throw on) so callers never need a try/catch.
function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}

/**
 * Validate that an incoming cron request is authorized against CRON_SECRET.
 *
 * Accepts either:
 *   - `Authorization: Bearer <CRON_SECRET>` — sent automatically by Vercel Cron
 *     Jobs (the scheduler does NOT send custom headers, so this is required for
 *     vercel.json-scheduled crons to work at all).
 *   - `x-cron-secret: <CRON_SECRET>` — for external schedulers or manual triggers.
 *
 * Fails closed when CRON_SECRET is unset, so an unconfigured deployment can
 * never execute cron side effects unauthenticated.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
    const expected = process.env.CRON_SECRET;
    if (!expected) return false;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length);
        if (safeEqual(token, expected)) return true;
    }

    const headerSecret = request.headers.get('x-cron-secret');
    if (headerSecret && safeEqual(headerSecret, expected)) return true;

    return false;
}
