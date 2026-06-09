// app/api/ai/credits/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getAiCreditStatus } from '@/lib/ai-credits';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    await connectDB();
    const status = await getAiCreditStatus(session.user.id);
    return NextResponse.json({
        plan: status.plan,
        limit: status.limit,
        used: status.used,
        remaining: status.remaining,
        resetAt: status.resetAt ? status.resetAt.toISOString() : null,
        allowed: status.allowed,
    });
}
