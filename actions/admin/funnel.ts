'use server';

import { connectDB } from '@/lib/db';
import { ProductEvent, ProductEventName } from '@/models/ProductEvent';
import { User } from '@/models/User';
import { requireAdminPermission } from '@/lib/admin-auth';
import { Types } from 'mongoose';

export interface FunnelStep {
    key: string;
    label: string;
    /** Distinct users who reached this step. */
    users: number;
    /** Percentage of the first step (signup). 0 when there is no signup baseline yet. */
    conversion: number;
}

export interface RecentEvent {
    id: string;
    event: ProductEventName;
    userName: string | null;
    userEmail: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string; // ISO
}

export interface FunnelMetrics {
    steps: FunnelStep[];
    totalEvents: number;
    recent: RecentEvent[];
}

async function distinctUsersForEvent(event: ProductEventName): Promise<number> {
    const ids = await ProductEvent.distinct('userId', { event, userId: { $ne: null } });
    return ids.length;
}

/**
 * Early-adoption funnel: distinct users at each step plus a live event feed.
 * Admin-gated (analytics permission), read-only.
 *
 * Note: users created BEFORE tracking went live have no `signup` event, so a
 * later step can briefly exceed signup (>100% conversion) during the transition.
 * For the 20-user push — all of whom sign up after this ships — the baseline is
 * clean. The UI surfaces this caveat.
 */
export async function getFunnelMetrics(): Promise<FunnelMetrics> {
    await requireAdminPermission('analytics');
    await connectDB();

    const [signup, boardCreated, aiPlanUsed, taskCreated, invited, totalEvents] = await Promise.all([
        distinctUsersForEvent('signup'),
        distinctUsersForEvent('board_created'),
        distinctUsersForEvent('ai_plan_used'),
        distinctUsersForEvent('task_created'),
        distinctUsersForEvent('member_invited'),
        ProductEvent.countDocuments({}),
    ]);

    // "Returned" = users with app_opened on 2+ distinct days.
    const returnedAgg = await ProductEvent.aggregate<{ count: number }>([
        { $match: { event: 'app_opened', userId: { $ne: null } } },
        { $group: { _id: { userId: '$userId', day: '$day' } } },
        { $group: { _id: '$_id.userId', days: { $sum: 1 } } },
        { $match: { days: { $gte: 2 } } },
        { $count: 'count' },
    ]);
    const returned = returnedAgg[0]?.count ?? 0;

    const base = signup;
    const step = (key: string, label: string, users: number): FunnelStep => ({
        key,
        label,
        users,
        conversion: base > 0 ? Math.round((users / base) * 100) : 0,
    });

    const steps: FunnelStep[] = [
        step('signup', 'Signed up', signup),
        step('board_created', 'Created a board', boardCreated),
        step('ai_plan_used', 'Used AI plan', aiPlanUsed),
        step('task_created', 'Created a task (manual)', taskCreated),
        step('returned', 'Returned (2+ days)', returned),
        step('member_invited', 'Invited a teammate', invited),
    ];

    // Live event feed — the qualitative gold for watching ~20 real users.
    const recentDocs = await ProductEvent.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .lean<
            {
                _id: Types.ObjectId;
                userId: Types.ObjectId | null;
                event: ProductEventName;
                metadata?: Record<string, unknown>;
                createdAt: Date;
            }[]
        >();

    const userIds = Array.from(
        new Set(recentDocs.map((d) => d.userId?.toString()).filter((id): id is string => Boolean(id)))
    );

    const users = await User.find({ _id: { $in: userIds } })
        .select('name email')
        .lean<{ _id: Types.ObjectId; name: string; email: string }[]>();

    const userMap = new Map(users.map((u) => [u._id.toString(), { name: u.name, email: u.email }]));

    const recent: RecentEvent[] = recentDocs.map((d) => {
        const u = d.userId ? userMap.get(d.userId.toString()) : undefined;
        return {
            id: d._id.toString(),
            event: d.event,
            userName: u?.name ?? null,
            userEmail: u?.email ?? null,
            metadata: d.metadata ?? null,
            createdAt: d.createdAt.toISOString(),
        };
    });

    return { steps, totalEvents, recent };
}
