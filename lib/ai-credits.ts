import { User } from '@/models/User';
import { getAiCreditLimit, getEffectivePlan } from '@/lib/plan-limits';
import type { PlanType } from '@/lib/types/billing';

// "Plan with AI" allowance refreshes on a rolling 30-day window. The window is anchored at
// each user's first consume (or first read) and rolls forward whenever it lapses, so usage
// resets ~monthly without a global reset spike.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface AiCreditStatus {
    plan: PlanType;
    limit: number | 'unlimited';
    used: number;
    remaining: number | 'unlimited';
    resetAt: Date | null;
    /** Whether at least one credit is available right now. */
    allowed: boolean;
}

interface UserPlanFields {
    plan?: PlanType;
    subscriptionStatus?: string;
    trialEndsAt?: Date | null;
    aiCreditsUsed?: number;
    aiCreditsResetAt?: Date | null;
}

function remainingOf(limit: number | 'unlimited', used: number): number | 'unlimited' {
    if (limit === 'unlimited') return 'unlimited';
    return Math.max(0, limit - used);
}

function planOf(user: UserPlanFields): PlanType {
    return getEffectivePlan({
        plan: (user.plan || 'free') as PlanType,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt ?? null,
    });
}

/**
 * Roll the window over if it has lapsed. Idempotent and concurrency-safe: the conditional
 * filter only matches when the stored reset instant is missing or already past, and MongoDB
 * serialises per-document updates, so two racing callers can't double-reset within one window.
 */
async function rolloverIfDue(userId: string, now: Date): Promise<void> {
    await User.updateOne(
        {
            _id: userId,
            $or: [
                { aiCreditsResetAt: { $exists: false } },
                { aiCreditsResetAt: null },
                { aiCreditsResetAt: { $lte: now } },
            ],
        },
        { $set: { aiCreditsUsed: 0, aiCreditsResetAt: new Date(now.getTime() + WINDOW_MS) } }
    );
}

/**
 * Atomically consume one AI credit for this user. Resets the window first if due, then
 * increments `aiCreditsUsed` only when it's strictly below the plan limit (the `$lt` guard
 * makes the check-and-increment a single atomic op, safe across concurrent requests and
 * instances). Returns the post-consume status; `allowed` is false when the user was already
 * at their limit (nothing consumed). Unlimited plans are tracked but never blocked.
 */
export async function consumeAiCredit(userId: string): Promise<AiCreditStatus> {
    const now = new Date();
    await rolloverIfDue(userId, now);

    const user = await User.findById(userId)
        .select('plan subscriptionStatus trialEndsAt aiCreditsUsed aiCreditsResetAt')
        .lean<UserPlanFields | null>();

    if (!user) {
        const limit = getAiCreditLimit('free');
        return { plan: 'free', limit, used: 0, remaining: 0, resetAt: null, allowed: false };
    }

    const plan = planOf(user);
    const limit = getAiCreditLimit(plan);
    const resetAt = user.aiCreditsResetAt ?? null;

    if (limit === 'unlimited') {
        const updated = await User.findByIdAndUpdate(userId, { $inc: { aiCreditsUsed: 1 } }, { new: true })
            .select('aiCreditsUsed')
            .lean<{ aiCreditsUsed?: number } | null>();
        const used = updated?.aiCreditsUsed ?? (user.aiCreditsUsed ?? 0) + 1;
        return { plan, limit, used, remaining: 'unlimited', resetAt, allowed: true };
    }

    const consumed = await User.findOneAndUpdate(
        { _id: userId, aiCreditsUsed: { $lt: limit } },
        { $inc: { aiCreditsUsed: 1 } },
        { new: true }
    )
        .select('aiCreditsUsed aiCreditsResetAt')
        .lean<{ aiCreditsUsed?: number; aiCreditsResetAt?: Date | null } | null>();

    if (!consumed) {
        return { plan, limit, used: limit, remaining: 0, resetAt, allowed: false };
    }

    const used = consumed.aiCreditsUsed ?? limit;
    return {
        plan,
        limit,
        used,
        remaining: remainingOf(limit, used),
        resetAt: consumed.aiCreditsResetAt ?? resetAt,
        allowed: true,
    };
}

/**
 * Refund one AI credit (floored at 0). Call this when a generation fails on OUR side
 * (LLM/server error) after a credit was consumed, so a Flux-side fault never costs the user.
 */
export async function refundAiCredit(userId: string): Promise<void> {
    await User.updateOne({ _id: userId, aiCreditsUsed: { $gt: 0 } }, { $inc: { aiCreditsUsed: -1 } });
}

/**
 * Read-only AI credit status for display. Applies a due rollover first so the numbers shown
 * to the user reflect the current window.
 */
export async function getAiCreditStatus(userId: string): Promise<AiCreditStatus> {
    const now = new Date();
    await rolloverIfDue(userId, now);

    const user = await User.findById(userId)
        .select('plan subscriptionStatus trialEndsAt aiCreditsUsed aiCreditsResetAt')
        .lean<UserPlanFields | null>();

    if (!user) {
        const limit = getAiCreditLimit('free');
        return { plan: 'free', limit, used: 0, remaining: limit, resetAt: null, allowed: true };
    }

    const plan = planOf(user);
    const limit = getAiCreditLimit(plan);
    const used = user.aiCreditsUsed ?? 0;
    return {
        plan,
        limit,
        used,
        remaining: remainingOf(limit, used),
        resetAt: user.aiCreditsResetAt ?? null,
        allowed: limit === 'unlimited' || used < limit,
    };
}
