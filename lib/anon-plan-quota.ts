import { AnonPlanUsage } from '@/models/AnonPlanUsage';

// Per-IP daily allowance and the global daily budget ceiling. Both are tunable
// via env so the budget guard can be tightened without a deploy. Defaults are
// conservative — raise them once you've watched real usage.
const IP_CAP = Number(process.env.ANON_PLAN_IP_CAP) || 3;
const GLOBAL_CAP = Number(process.env.ANON_PLAN_DAILY_CAP) || 100;

// Keep counters ~1.5 days so the TTL sweep removes them shortly after the UTC
// day they belong to has fully passed.
const COUNTER_TTL_MS = 36 * 60 * 60 * 1000;

function dayKey(now: number): string {
    return new Date(now).toISOString().slice(0, 10); // UTC YYYY-MM-DD
}

async function bump(key: string, now: number): Promise<number> {
    const doc = await AnonPlanUsage.findOneAndUpdate(
        { key },
        { $inc: { count: 1 }, $setOnInsert: { key, expiresAt: new Date(now + COUNTER_TTL_MS) } },
        { upsert: true, new: true }
    );
    return doc?.count ?? 1;
}

export interface AnonQuotaResult {
    allowed: boolean;
    reason?: 'ip' | 'global';
}

/**
 * Atomically consume one anonymous-plan credit for this IP. Checks the per-IP
 * cap first (so an abusive IP doesn't inflate the global counter), then the
 * global circuit breaker. Both increments are atomic ($inc), so concurrent
 * requests across instances can't race past the cap.
 */
export async function consumeAnonPlanQuota(ip: string, now: number = Date.now()): Promise<AnonQuotaResult> {
    const day = dayKey(now);

    const ipCount = await bump(`ip:${ip}:${day}`, now);
    if (ipCount > IP_CAP) return { allowed: false, reason: 'ip' };

    const globalCount = await bump(`global:${day}`, now);
    if (globalCount > GLOBAL_CAP) return { allowed: false, reason: 'global' };

    return { allowed: true };
}
