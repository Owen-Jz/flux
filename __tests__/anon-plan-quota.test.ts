import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared in-memory store standing in for the AnonPlanUsage collection's atomic
// $inc counters, so we can assert the cap logic without a real database.
const store = new Map<string, number>();

vi.mock('@/models/AnonPlanUsage', () => ({
    AnonPlanUsage: {
        findOneAndUpdate: vi.fn(async (filter: { key: string }) => {
            const k = filter.key;
            const next = (store.get(k) ?? 0) + 1;
            store.set(k, next);
            return { key: k, count: next };
        }),
    },
}));

import { consumeAnonPlanQuota } from '@/lib/anon-plan-quota';

// Fixed timestamp → deterministic UTC day bucket of 2026-06-03.
const NOW = Date.parse('2026-06-03T12:00:00Z');
const GLOBAL_KEY = 'global:2026-06-03';

describe('consumeAnonPlanQuota', () => {
    beforeEach(() => store.clear());

    it('allows calls up to the per-IP cap, then blocks', async () => {
        const ip = '1.2.3.4';
        expect((await consumeAnonPlanQuota(ip, NOW)).allowed).toBe(true);
        expect((await consumeAnonPlanQuota(ip, NOW)).allowed).toBe(true);
        expect((await consumeAnonPlanQuota(ip, NOW)).allowed).toBe(true);
        const blocked = await consumeAnonPlanQuota(ip, NOW);
        expect(blocked.allowed).toBe(false);
        expect(blocked.reason).toBe('ip');
    });

    it('does not charge the global counter once an IP is blocked', async () => {
        const ip = '5.6.7.8';
        for (let i = 0; i < 3; i++) await consumeAnonPlanQuota(ip, NOW);
        await consumeAnonPlanQuota(ip, NOW); // 4th: blocked on IP before global bump
        expect(store.get(GLOBAL_KEY) ?? 0).toBe(3); // only the 3 allowed calls hit global
    });

    it('blocks via the global circuit breaker at the daily cap', async () => {
        store.set(GLOBAL_KEY, 100); // already at GLOBAL_CAP default
        const res = await consumeAnonPlanQuota('9.9.9.9', NOW); // IP ok (1), global -> 101
        expect(res.allowed).toBe(false);
        expect(res.reason).toBe('global');
    });

    it('buckets IPs independently', async () => {
        for (let i = 0; i < 3; i++) await consumeAnonPlanQuota('a.a.a.a', NOW);
        const other = await consumeAnonPlanQuota('b.b.b.b', NOW);
        expect(other.allowed).toBe(true);
    });

    it('uses a separate bucket on a different day', async () => {
        const ip = 'c.c.c.c';
        for (let i = 0; i < 3; i++) await consumeAnonPlanQuota(ip, NOW);
        const nextDay = Date.parse('2026-06-04T12:00:00Z');
        expect((await consumeAnonPlanQuota(ip, nextDay)).allowed).toBe(true);
    });
});
