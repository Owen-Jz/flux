'use server';

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { requireAdminPermission } from '@/lib/admin-auth';
import { PLAN_PRICES_KOBO } from '@/lib/paystack';
import type { BillingMetrics, SubscriptionRow, PlanType } from '@/lib/types/billing';

const PLAN_ORDER = ['free', 'starter', 'pro', 'enterprise'] as const;
function isUpgrade(from: PlanType, to: PlanType): boolean {
    return PLAN_ORDER.indexOf(from) < PLAN_ORDER.indexOf(to);
}

/**
 * Get billing KPIs — MRR, churn, trial conversion, net MRR
 */
export async function getBillingMetrics(): Promise<BillingMetrics> {
    await requireAdminPermission('billing');
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfLastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const starterPriceNgn = PLAN_PRICES_KOBO.starter / 100;
    const proPriceNgn = PLAN_PRICES_KOBO.pro / 100;

    // MRR: sum of active paid plans
    const activeUsers = await User.find({ subscriptionStatus: 'active' }).lean();
    let mrr = 0;
    const planDistribution: Record<PlanType, number> = {
        free: 0, starter: 0, pro: 0, enterprise: 0,
    };

    for (const user of activeUsers) {
        const plan = (user.plan || 'free') as PlanType;
        planDistribution[plan] = (planDistribution[plan] || 0) + 1;
        if (plan === 'starter') mrr += starterPriceNgn;
        else if (plan === 'pro') mrr += proPriceNgn;
    }

    // Last month MRR
    const lastMonthActiveUsers = await User.find({
        subscriptionStatus: 'active',
        updatedAt: { $lt: startOfMonth },
    }).lean();
    let lastMonthMrr = 0;
    for (const user of lastMonthActiveUsers) {
        const plan = (user.plan || 'free') as PlanType;
        if (plan === 'starter') lastMonthMrr += starterPriceNgn;
        else if (plan === 'pro') lastMonthMrr += proPriceNgn;
    }

    // Churn: cancelled in last 30 days
    const churnedCount = await User.countDocuments({
        subscriptionStatus: 'cancelled',
        updatedAt: { $gte: thirtyDaysAgo },
    });
    const totalUsers = await User.countDocuments();
    const churnRate = totalUsers > 0 ? (churnedCount / totalUsers) * 100 : 0;

    // Last month churn
    const lastMonthChurned = await User.countDocuments({
        subscriptionStatus: 'cancelled',
        updatedAt: { $gte: startOfLastMonthDate, $lt: startOfMonth },
    });
    const lastMonthTotal = await User.countDocuments({ createdAt: { $lt: startOfMonth } });
    const lastMonthChurnRate = lastMonthTotal > 0 ? (lastMonthChurned / lastMonthTotal) * 100 : 0;

    // Trial → Paid
    const trialUsers = await User.countDocuments({ trialEndsAt: { $exists: true }, hasUsedTrial: false });
    const convertedTrials = await User.countDocuments({ hasUsedTrial: true, updatedAt: { $gte: thirtyDaysAgo } });
    const trialToPaidRate = trialUsers > 0 ? (convertedTrials / trialUsers) * 100 : 0;

    // Net MRR
    const churnedMrr = churnedCount * starterPriceNgn;
    const netMrr = mrr - churnedMrr;

    const mrrChange = lastMonthMrr > 0 ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 : 100;
    const churnChange = lastMonthChurnRate > 0 ? churnRate - lastMonthChurnRate : 0;

    // Plan distribution (all users)
    const allPlanDist = await User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);
    for (const p of allPlanDist) {
        if (p._id in planDistribution) {
            planDistribution[p._id as PlanType] = p.count;
        }
    }

    return {
        mrr: Math.round(mrr),
        mrrChange: Math.round(mrrChange * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
        churnChange: Math.round(churnChange * 10) / 10,
        trialToPaidRate: Math.round(trialToPaidRate * 10) / 10,
        trialToPaidChange: 0,
        netMrr: Math.round(netMrr),
        planDistribution,
    };
}

/**
 * Get subscription list with optional filters and search
 */
export async function getSubscriptions(params: {
    search?: string;
    plan?: PlanType;
    status?: string;
    page?: number;
    limit?: number;
}) {
    await requireAdminPermission('billing');
    await connectDB();

    const { search, plan, status, page = 1, limit = 20 } = params;
    const query: Record<string, unknown> = {};

    if (plan) query.plan = plan;
    if (status) query.subscriptionStatus = status;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(query),
    ]);

    const rows: SubscriptionRow[] = users.map((u) => ({
        id: u._id.toString(),
        name: u.name || 'Unknown',
        email: u.email,
        image: u.image,
        plan: (u.plan || 'free') as PlanType,
        subscriptionStatus: (u.subscriptionStatus || 'inactive') as any,
        paystackCustomerCode: u.paystackCustomerCode,
        subscriptionId: u.subscriptionId,
        trialEndsAt: u.trialEndsAt,
        createdAt: u.createdAt,
    }));

    return { rows, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Get subscription lifecycle events for a user
 */
export async function getSubscriptionHistory(userId: string) {
    await requireAdminPermission('billing');
    await connectDB();

    const logs = await AuditLog.find({
        targetId: userId,
        action: { $in: ['UPDATE_USER_PLAN', 'SUSPEND_USER', 'UNSUSPEND_USER'] },
    })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    return logs.map((l) => ({
        id: l._id.toString(),
        type: l.action === 'UPDATE_USER_PLAN'
            ? (l.details?.fromPlan && l.details?.toPlan
                ? (isUpgrade(l.details.fromPlan, l.details.toPlan) ? 'upgraded' : 'downgraded')
                : 'changed')
            : (l.action as any),
        fromPlan: l.details?.fromPlan,
        toPlan: l.details?.toPlan,
        reason: l.details?.reason,
        createdAt: l.createdAt,
    }));
}

/**
 * Get MRR over time (monthly, last 12 months)
 */
export async function getMrrHistory() {
    await requireAdminPermission('billing');
    await connectDB();

    const now = new Date();
    const starterPriceNgn = PLAN_PRICES_KOBO.starter / 100;
    const proPriceNgn = PLAN_PRICES_KOBO.pro / 100;

    // Single aggregation to get counts per plan per month
    const raw = await User.aggregate([
        {
            $match: {
                subscriptionStatus: 'active',
                plan: { $in: ['starter', 'pro'] },
            },
        },
        {
            $group: {
                _id: {
                    month: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
                    plan: '$plan',
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.month': 1 } },
        {
            $group: {
                _id: '$_id.month',
                mrr: {
                    $sum: {
                        $cond: [
                            { $eq: ['$_id.plan', 'starter'] },
                            { $multiply: ['$count', starterPriceNgn] },
                            { $multiply: ['$count', proPriceNgn] },
                        ],
                    },
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Build a map of month -> mrr
    const mrrMap: Record<string, number> = {};
    for (const r of raw) {
        mrrMap[r._id] = r.mrr;
    }

    // Fill in all 12 months, including zeros for months with no data
    const months: { month: string; mrr: number }[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0, 7);
        months.push({ month: monthStr, mrr: Math.round(mrrMap[monthStr] || 0) });
    }

    return months;
}

/**
 * Get plan migration flows (transitions between plans)
 */
export async function getPlanMigrationFlows() {
    await requireAdminPermission('billing');
    await connectDB();

    const logs = await AuditLog.find({ action: 'UPDATE_USER_PLAN' })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

    const flows: Record<string, number> = {};
    for (const log of logs) {
        const from = log.details?.fromPlan || 'unknown';
        const to = log.details?.toPlan || 'unknown';
        const key = `${from}→${to}`;
        flows[key] = (flows[key] || 0) + 1;
    }

    return flows;
}
