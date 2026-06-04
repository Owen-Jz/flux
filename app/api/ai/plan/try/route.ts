// app/api/ai/plan/try/route.ts
// Public, unauthenticated "try it" planner for the marketing hero. Layered
// abuse/cost protection: same-origin only, an in-memory burst limiter, a
// durable per-IP + global daily quota (the real budget guard), bounded input,
// and a small bounded output. Generates a board-scale preview only — nothing
// is persisted.
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { createMinimaxClient } from '@/lib/llm/client';
import { getClientIp, isSameOrigin, rateLimit } from '@/lib/rate-limit';
import { consumeAnonPlanQuota } from '@/lib/anon-plan-quota';
import { normalizePriority } from '@/lib/llm/board-stream-planner';
import type { AIPlan } from '@/types/ai-plan';

const ANON_MAX_TASKS = 6;
const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 500;

export async function POST(request: NextRequest) {
    // Only our own site may call this — blocks casual cross-site API abuse.
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (process.env.ANON_PLAN_ENABLED === 'false') {
        return NextResponse.json({ error: 'Sign up to generate a plan.', signupHint: true }, { status: 403 });
    }

    const ip = getClientIp(request);

    // Cheap in-memory burst guard (1 per 20s per IP) before we touch the DB.
    const burst = rateLimit(`anon-plan-burst:${ip}`, 1, 20);
    if (!burst.success) {
        return NextResponse.json(
            { error: `Please wait ${burst.resetIn}s before generating another plan.` },
            { status: 429 }
        );
    }

    let body: { description?: unknown };
    try {
        body = (await request.json()) as { description?: unknown };
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length < MIN_DESCRIPTION) {
        return NextResponse.json(
            { error: 'Tell us a bit more about your project (at least 10 characters).' },
            { status: 400 }
        );
    }
    if (description.length > MAX_DESCRIPTION) {
        return NextResponse.json({ error: 'Keep it under 500 characters for the demo.' }, { status: 400 });
    }

    await connectDB();

    // Durable, cross-instance budget guard — the real protection.
    const quota = await consumeAnonPlanQuota(ip);
    if (!quota.allowed) {
        const error =
            quota.reason === 'global'
                ? 'Our free demo is at capacity right now. Sign up to generate your plan.'
                : "You've used your free demo plans for today. Sign up to keep planning.";
        return NextResponse.json({ error, signupHint: true }, { status: 429 });
    }

    try {
        const client = createMinimaxClient();
        const llmResult = await client.planProject({
            description,
            scale: 'board',
            maxTasksPerBoard: ANON_MAX_TASKS,
        });

        const plan: AIPlan = {
            type: 'board',
            title: llmResult.title,
            summary: llmResult.summary,
            tasks: (llmResult.tasks ?? []).slice(0, ANON_MAX_TASKS).map((t) => ({
                title: t.title,
                description: t.description,
                priority: normalizePriority(t.priority),
                estimatedHours: t.estimatedHours,
            })),
        };

        return NextResponse.json(plan);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Planning failed';
        console.error('[ai/plan/try] error:', msg);
        if (msg.includes('MINIMAX_API_KEY')) {
            return NextResponse.json({ error: 'Demo is unavailable right now.' }, { status: 503 });
        }
        if (msg.includes('timed out')) {
            return NextResponse.json({ error: 'That took too long — please try again.' }, { status: 504 });
        }
        return NextResponse.json({ error: 'Could not generate a plan. Please try again.' }, { status: 502 });
    }
}
