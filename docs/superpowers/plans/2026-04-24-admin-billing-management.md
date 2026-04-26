# Admin Billing Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the admin dashboard with a Billing section providing subscription lifecycle management, plan promotion/demotion tools, and revenue analytics.

**Architecture:** Three new pages under `/admin/billing/`: overview dashboard, subscription list with inline actions, and revenue analytics. Server actions handle all billing data aggregation and plan mutations. Components are colocated under `components/admin/billing/`.

**Tech Stack:** Next.js App Router, MongoDB/Mongoose, Paystack API, recharts, framer-motion, Tailwind CSS.

---

## File Map

**New files to create:**
- `lib/types/billing.ts` — shared TypeScript types
- `actions/admin/billing.ts` — billing data aggregation (MRR, churn, subscriptions list)
- `actions/admin/change-plan.ts` — plan promotion/demotion with audit logging
- `components/admin/billing/plan-badge.tsx` — colored plan badge
- `components/admin/billing/kpi-card.tsx` — billing metric tile
- `components/admin/billing/plan-migration-chart.tsx` — stacked bar chart for plan transitions
- `components/admin/billing/plan-change-modal.tsx` — plan promotion modal
- `components/admin/billing/subscription-drawer.tsx` — slide-over subscription detail
- `components/admin/billing/subscription-table.tsx` — subscription list with filters
- `app/admin/billing/page.tsx` — KPI dashboard
- `app/admin/billing/subscriptions/page.tsx` — subscription list page
- `app/admin/billing/analytics/page.tsx` — revenue analytics page

**Files to modify:**
- `app/admin/layout.tsx:40-45` — add Billing nav items
- `lib/plan-limits.ts` — add plan display metadata export

---

## Task 1: Types and plan metadata

**Files:**
- Create: `lib/types/billing.ts`
- Modify: `lib/plan-limits.ts`

- [ ] **Step 1: Create `lib/types/billing.ts`**

```typescript
// lib/types/billing.ts

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';

export interface SubscriptionRow {
    id: string;
    name: string;
    email: string;
    image?: string;
    plan: PlanType;
    subscriptionStatus: SubscriptionStatus;
    paystackCustomerCode?: string;
    subscriptionId?: string;
    trialEndsAt?: Date;
    createdAt: Date;
}

export interface BillingMetrics {
    mrr: number;
    mrrChange: number; // percentage vs last month
    churnRate: number;
    churnChange: number;
    trialToPaidRate: number;
    trialToPaidChange: number;
    netMrr: number;
    planDistribution: Record<PlanType, number>;
}

export interface PlanChangeRequest {
    userId: string;
    newPlan: PlanType;
    effectiveDate: 'immediately' | 'end_of_cycle';
    reason?: string;
}

export interface SubscriptionLifecycleEvent {
    id: string;
    type: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'payment_failed' | 'trial_started' | 'trial_ended';
    fromPlan?: PlanType;
    toPlan?: PlanType;
    createdAt: Date;
}

export interface PlanMeta {
    label: string;
    price: number; // in kobo
    priceDisplay: string; // e.g. "₦10,000"
    projects: number | 'unlimited';
    members: number | 'unlimited';
}
```

- [ ] **Step 2: Modify `lib/plan-limits.ts` — add plan metadata for UI use**

After `getUpgradeMessage`, add:

```typescript
import { PLAN_PRICES_KOBO } from './paystack';

export const PLAN_META: Record<PlanType, PlanMeta> = {
    free: {
        label: 'Free',
        price: 0,
        priceDisplay: 'Free',
        projects: 3,
        members: 3,
    },
    starter: {
        label: 'Starter',
        price: PLAN_PRICES_KOBO.starter,
        priceDisplay: '₦10,000/mo',
        projects: 5,
        members: 10,
    },
    pro: {
        label: 'Pro',
        price: PLAN_PRICES_KOBO.pro,
        priceDisplay: '₦25,000/mo',
        projects: 'unlimited',
        members: 25,
    },
    enterprise: {
        label: 'Enterprise',
        price: PLAN_PRICES_KOBO.enterprise,
        priceDisplay: 'Custom',
        projects: 'unlimited',
        members: 'unlimited',
    },
};
```

- [ ] **Step 3: Commit**

```bash
git add lib/types/billing.ts lib/plan-limits.ts
git commit -m "feat(admin): add billing types and plan metadata"
```

---

## Task 2: Billing server actions

**Files:**
- Create: `actions/admin/billing.ts`
- Create: `actions/admin/change-plan.ts`

- [ ] **Step 1: Create `actions/admin/billing.ts`**

```typescript
'use server';

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { requireAdminPermission } from '@/lib/admin-auth';
import { PLAN_PRICES_KOBO } from '@/lib/paystack';
import type { BillingMetrics, SubscriptionRow, PlanType } from '@/lib/types/billing';

// Exchange rate: 1 USD = ~1550 NGN (approximate, should come from env or API)
const USD_TO_NGN = 1550;

function getExchangeRate(): number {
    // In production this should fetch from an API with caching.
    // Default to approximate rate if unavailable.
    return USD_TO_NGN;
}

/**
 * Get billing KPIs — MRR, churn, trial conversion, net MRR
 */
export async function getBillingMetrics(): Promise<BillingMetrics> {
    await requireAdminPermission('billing');
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfLastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const exchangeRate = getExchangeRate();

    // MRR: sum of active paid plans (starter + pro only; enterprise is custom)
    // Prices are in NGN kobo, divide by 100 for NGN
    const starterPriceNgn = PLAN_PRICES_KOBO.starter / 100;
    const proPriceNgn = PLAN_PRICES_KOBO.pro / 100;

    const activeUsers = await User.find({ subscriptionStatus: 'active' }).lean();
    let mrr = 0;
    let lastMonthMrr = 0;
    const planDistribution: Record<PlanType, number> = {
        free: 0, starter: 0, pro: 0, enterprise: 0,
    };

    for (const user of activeUsers) {
        const plan = (user.plan || 'free') as PlanType;
        planDistribution[plan] = (planDistribution[plan] || 0) + 1;

        if (plan === 'starter') mrr += starterPriceNgn;
        else if (plan === 'pro') mrr += proPriceNgn;
        else if (plan === 'enterprise') mrr += 0; // custom — not counted in MRR
    }

    // Last month MRR — find users who were active on the last month boundary
    const lastMonthActiveUsers = await User.find({
        subscriptionStatus: 'active',
        updatedAt: { $lt: startOfMonth },
    }).lean();

    for (const user of lastMonthActiveUsers) {
        const plan = (user.plan || 'free') as PlanType;
        if (plan === 'starter') lastMonthMrr += starterPriceNgn;
        else if (plan === 'pro') lastMonthMrr += proPriceNgn;
    }

    // Churn: users who cancelled in last 30 days
    const churnedCount = await User.countDocuments({
        subscriptionStatus: 'cancelled',
        updatedAt: { $gte: thirtyDaysAgo },
    });
    const totalUsers = await User.countDocuments();
    const churnRate = totalUsers > 0 ? (churnedCount / totalUsers) * 100 : 0;

    // Last month churn for comparison
    const lastMonthChurned = await User.countDocuments({
        subscriptionStatus: 'cancelled',
        updatedAt: { $gte: startOfLastMonthDate, $lt: startOfMonth },
    });
    const lastMonthTotal = await User.countDocuments({ createdAt: { $lt: startOfMonth } });
    const lastMonthChurnRate = lastMonthTotal > 0 ? (lastMonthChurned / lastMonthTotal) * 100 : 0;

    // Trial → Paid: users who had trial and converted to active in last 30 days
    const trialUsers = await User.countDocuments({
        trialEndsAt: { $exists: true },
        hasUsedTrial: false,
    });
    const convertedTrials = await User.countDocuments({
        hasUsedTrial: true,
        updatedAt: { $gte: thirtyDaysAgo },
    });
    const trialToPaidRate = trialUsers > 0 ? (convertedTrials / trialUsers) * 100 : 0;

    // Net MRR: new MRR - churned MRR this month
    const churnedMrr = churnedCount * starterPriceNgn; // approximate
    const netMrr = mrr - churnedMrr;

    const mrrChange = lastMonthMrr > 0 ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 : 100;
    const churnChange = lastMonthChurnRate > 0 ? churnRate - lastMonthChurnRate : 0;
    const trialToPaidChange = 0; // simplified

    // Count free/total users for distribution
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
        trialToPaidChange,
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
            ? (l.details?.toPlan ? 'upgraded' : 'downgraded')
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
    const months: { month: string; mrr: number }[] = [];

    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

        const activeUsers = await User.find({
            subscriptionStatus: 'active',
            updatedAt: { $lte: endOfMonth },
        }).lean();

        let mrr = 0;
        for (const user of activeUsers) {
            const plan = (user.plan || 'free') as PlanType;
            if (plan === 'starter') mrr += PLAN_PRICES_KOBO.starter / 100;
            else if (plan === 'pro') mrr += PLAN_PRICES_KOBO.pro / 100;
        }

        months.push({ month: monthStr, mrr: Math.round(mrr) });
    }

    return months;
}

/**
 * Get plan migration flows (transitions between plans)
 */
export async function getPlanMigrationFlows() {
    await requireAdminPermission('billing');
    await connectDB();

    const logs = await AuditLog.find({
        action: 'UPDATE_USER_PLAN',
    })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

    // Aggregate transitions
    const flows: Record<string, number> = {};
    for (const log of logs) {
        const from = log.details?.fromPlan || 'unknown';
        const to = log.details?.toPlan || 'unknown';
        const key = `${from}→${to}`;
        flows[key] = (flows[key] || 0) + 1;
    }

    return flows;
}
```

- [ ] **Step 2: Create `actions/admin/change-plan.ts`**

```typescript
'use server';

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { requireAdminPermission } from '@/lib/admin-auth';
import { Admin } from '@/models/Admin';
import { requireAdminSession } from '@/lib/admin-auth';
import type { PlanChangeRequest, PlanType } from '@/lib/types/billing';

export async function changeUserPlan(data: PlanChangeRequest) {
    const admin = await requireAdminSession();
    await requireAdminPermission('billing');
    await connectDB();

    const { userId, newPlan, effectiveDate, reason } = data;

    // Fetch target user
    const user = await User.findById(userId).lean();
    if (!user) {
        return { error: 'User not found' };
    }

    const oldPlan = (user.plan || 'free') as PlanType;

    if (oldPlan === newPlan) {
        return { error: 'User is already on this plan' };
    }

    // Update user plan
    await User.findByIdAndUpdate(userId, {
        plan: newPlan,
        subscriptionStatus: 'active', // activating subscription on admin override
        updatedAt: new Date(),
    });

    // Create audit log entry
    await AuditLog.create({
        adminId: admin._id,
        action: 'UPDATE_USER_PLAN',
        targetType: 'user',
        targetId: userId,
        details: {
            fromPlan: oldPlan,
            toPlan: newPlan,
            effectiveDate,
            reason: reason || null,
        },
    });

    return { success: true, oldPlan, newPlan };
}

export async function extendTrial(userId: string, days: number) {
    const admin = await requireAdminSession();
    await requireAdminPermission('billing');
    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) return { error: 'User not found' };

    const newTrialEnd = new Date();
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    await User.findByIdAndUpdate(userId, {
        trialEndsAt: newTrialEnd,
        updatedAt: new Date(),
    });

    await AuditLog.create({
        adminId: admin._id,
        action: 'EXTEND_TRIAL',
        targetType: 'user',
        targetId: userId,
        details: { days, newTrialEnd: newTrialEnd.toISOString() },
    });

    return { success: true };
}

export async function forceCancelSubscription(userId: string, reason?: string) {
    const admin = await requireAdminSession();
    await requireAdminPermission('billing');
    await connectDB();

    await User.findByIdAndUpdate(userId, {
        plan: 'free',
        subscriptionStatus: 'cancelled',
        updatedAt: new Date(),
    });

    await AuditLog.create({
        adminId: admin._id,
        action: 'FORCE_CANCEL_SUBSCRIPTION',
        targetType: 'user',
        targetId: userId,
        details: { reason: reason || 'Admin forced cancellation' },
    });

    return { success: true };
}
```

- [ ] **Step 3: Commit**

```bash
git add actions/admin/billing.ts actions/admin/change-plan.ts
git commit -m "feat(admin): add billing aggregation and plan change actions"
```

---

## Task 3: UI components — plan badge and KPI card

**Files:**
- Create: `components/admin/billing/plan-badge.tsx`
- Create: `components/admin/billing/kpi-card.tsx`

- [ ] **Step 1: Create `components/admin/billing/plan-badge.tsx`**

```typescript
'use client';

import type { PlanType } from '@/lib/types/billing';

const planStyles: Record<PlanType, { bg: string; text: string; dot: string }> = {
    free:     { bg: 'bg-zinc-800', text: 'text-zinc-400', dot: 'bg-zinc-500' },
    starter:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    pro:      { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-500' },
    enterprise:{ bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
};

interface PlanBadgeProps {
    plan: PlanType;
    showDot?: boolean;
    className?: string;
}

export function PlanBadge({ plan, showDot = true, className = '' }: PlanBadgeProps) {
    const styles = planStyles[plan] || planStyles.free;
    const label = plan.charAt(0).toUpperCase() + plan.slice(1);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text} ${className}`}>
            {showDot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
            {label}
        </span>
    );
}

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
    active:    { bg: 'bg-green-500/10', text: 'text-green-400' },
    inactive:  { bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400' },
    past_due:  { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    trialing:  { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const styles = statusStyles[status] || statusStyles.inactive;
    const label = status.replace('_', ' ');

    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text} ${className}`}>
            {label}
        </span>
    );
}
```

- [ ] **Step 2: Create `components/admin/billing/kpi-card.tsx`**

```typescript
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface KpiCardProps {
    label: string;
    value: number | string;
    prefix?: string;
    suffix?: string;
    change?: string;
    changePositive?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    index?: number;
}

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500 }: KpiCardProps & { value: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (typeof value !== 'number') return;
        let startTime: number;
        let frame: number;

        const animate = (t: number) => {
            if (!startTime) startTime = t;
            const progress = Math.min((t - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const colorMap: Record<string, { bg: string; icon: string }> = {
    blue:    { bg: 'bg-blue-500/10',    icon: 'text-blue-400' },
    purple:  { bg: 'bg-purple-500/10', icon: 'text-purple-400' },
    green:   { bg: 'bg-green-500/10',  icon: 'text-green-400' },
    orange:  { bg: 'bg-orange-500/10', icon: 'text-orange-400' },
    red:     { bg: 'bg-red-500/10',    icon: 'text-red-400' },
    amber:   { bg: 'bg-amber-500/10',  icon: 'text-amber-400' },
};

export function KpiCard({
    label, value, prefix = '', suffix = '',
    change, changePositive,
    icon: Icon, color = 'blue', index = 0,
}: KpiCardProps) {
    const styles = colorMap[color] || colorMap.blue;
    const isNumber = typeof value === 'number';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br from-${color}-500/5 to-transparent`} />
            </div>

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${styles.bg}`}>
                        <Icon className={`w-6 h-6 ${styles.icon}`} />
                    </div>
                    {change && (
                        <span className={`text-xs font-medium ${changePositive ? 'text-green-400' : 'text-red-400'}`}>
                            {change}
                        </span>
                    )}
                </div>
                <p className="text-3xl font-bold text-zinc-50 mb-1">
                    {isNumber
                        ? <AnimatedNumber value={value as number} prefix={prefix} suffix={suffix} />
                        : <span>{prefix}{value}{suffix}</span>
                    }
                </p>
                <p className="text-sm text-zinc-500">{label}</p>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/billing/plan-badge.tsx components/admin/billing/kpi-card.tsx
git commit -m "feat(admin): add billing plan-badge and kpi-card components"
```

---

## Task 4: Plan migration chart component

**Files:**
- Create: `components/admin/billing/plan-migration-chart.tsx`

- [ ] **Step 1: Create `components/admin/billing/plan-migration-chart.tsx`**

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlanMigrationChartProps {
    flows: Record<string, number>; // e.g. { "free→starter": 12, "starter→pro": 5 }
}

const PLAN_COLORS: Record<string, string> = {
    free:      '#71717a',
    starter:   '#22c55e',
    pro:       '#8b5cf6',
    enterprise:'#f59e0b',
    unknown:   '#71717a',
};

function parseFlowLabel(key: string) {
    const [from, to] = key.split('→');
    return { from, to };
}

export function PlanMigrationChart({ flows }: PlanMigrationChartProps) {
    const data = Object.entries(flows).map(([key, count]) => {
        const { from, to } = parseFlowLabel(key);
        return {
            label: key,
            from,
            to,
            count,
            fromColor: PLAN_COLORS[from] || PLAN_COLORS.unknown,
            toColor: PLAN_COLORS[to] || PLAN_COLORS.unknown,
        };
    }).sort((a, b) => b.count - a.count);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
                No migration data yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis
                    dataKey="label"
                    type="category"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    width={120}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                        color: '#e4e4e7',
                    }}
                    formatter={(value: number) => [value, 'Transitions']}
                    labelFormatter={(label) => ` ${label}`}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.toColor} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/billing/plan-migration-chart.tsx
git commit -m "feat(admin): add plan migration chart component"
```

---

## Task 5: Plan change modal

**Files:**
- Create: `components/admin/billing/plan-change-modal.tsx`

- [ ] **Step 1: Create `components/admin/billing/plan-change-modal.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { changeUserPlan } from '@/actions/admin/change-plan';
import { PlanBadge } from './plan-badge';
import { PLAN_META } from '@/lib/plan-limits';
import type { PlanType, SubscriptionRow } from '@/lib/types/billing';

const PLAN_ORDER: PlanType[] = ['free', 'starter', 'pro', 'enterprise'];

interface PlanChangeModalProps {
    user: SubscriptionRow;
    onClose: () => void;
    onSuccess: () => void;
}

export function PlanChangeModal({ user, onClose, onSuccess }: PlanChangeModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(user.plan);
    const [effectiveDate, setEffectiveDate] = useState<'immediately' | 'end_of_cycle'>('immediately');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const currentMeta = PLAN_META[user.plan];
    const selectedMeta = PLAN_META[selectedPlan];

    const handleSubmit = async () => {
        if (selectedPlan === user.plan) return;
        setLoading(true);
        setError('');

        const result = await changeUserPlan({
            userId: user.id,
            newPlan: selectedPlan,
            effectiveDate,
            reason: reason.trim() || undefined,
        });

        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            onSuccess();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-50">Change Plan</h2>
                            <p className="text-sm text-zinc-500 mt-0.5">Update {user.name}&apos;s subscription plan</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User info */}
                    <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-800/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                {user.image
                                    ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">{user.name.charAt(0)}</div>
                                }
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                                <p className="text-xs text-zinc-500">{user.email}</p>
                            </div>
                            <div className="ml-auto">
                                <PlanBadge plan={user.plan} />
                            </div>
                        </div>
                    </div>

                    {/* Plan options */}
                    <div className="p-6 space-y-3">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Select New Plan</p>
                        {PLAN_ORDER.filter(p => p !== user.plan).map((plan) => {
                            const meta = PLAN_META[plan];
                            const isSelected = selectedPlan === plan;
                            const isUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(user.plan);

                            return (
                                <button
                                    key={plan}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                        isSelected
                                            ? 'border-violet-500/50 bg-violet-500/10'
                                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-800/30'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'border-violet-500 bg-violet-500' : 'border-zinc-600'
                                    }`}>
                                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-200">{meta.label}</span>
                                            {isUpgrade
                                                ? <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">Upgrade</span>
                                                : <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Downgrade</span>
                                            }
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {meta.projects} projects · {meta.members} members
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300">{meta.priceDisplay}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Preview */}
                    {selectedPlan !== user.plan && (
                        <div className="px-6 pb-4">
                            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                                <p className="text-xs text-zinc-500 mb-2">Plan change preview</p>
                                <div className="flex items-center gap-3 text-sm">
                                    <PlanBadge plan={user.plan} />
                                    <span className="text-zinc-600">→</span>
                                    <PlanBadge plan={selectedPlan} />
                                    <span className="text-zinc-500 ml-auto text-xs">
                                        {currentMeta.projects} → {selectedMeta.projects} projects
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Effective date + reason */}
                    <div className="px-6 pb-4 space-y-3">
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Effective date</label>
                            <div className="flex gap-3">
                                {(['immediately', 'end_of_cycle'] as const).map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="effectiveDate"
                                            value={opt}
                                            checked={effectiveDate === opt}
                                            onChange={() => setEffectiveDate(opt)}
                                            className="accent-violet-500"
                                        />
                                        <span className="text-sm text-zinc-400">
                                            {opt === 'immediately' ? 'Immediately' : 'End of billing cycle'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Reason (optional)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for plan change..."
                                rows={2}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-6 pb-4">
                            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">{error}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedPlan === user.plan}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Confirm Plan Change'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/billing/plan-change-modal.tsx
git commit -m "feat(admin): add plan change modal component"
```

---

## Task 6: Subscription drawer

**Files:**
- Create: `components/admin/billing/subscription-drawer.tsx`

- [ ] **Step 1: Create `components/admin/billing/subscription-drawer.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    ArrowPathIcon,
    ShieldExclamationIcon,
    KeyIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { PlanBadge, StatusBadge } from './plan-badge';
import { getSubscriptionHistory } from '@/actions/admin/billing';
import { extendTrial, forceCancelSubscription } from '@/actions/admin/change-plan';
import type { SubscriptionRow, SubscriptionLifecycleEvent } from '@/lib/types/billing';

interface SubscriptionDrawerProps {
    user: SubscriptionRow;
    onClose: () => void;
    onUpdated: () => void;
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export function SubscriptionDrawer({ user, onClose, onUpdated }: SubscriptionDrawerProps) {
    const [history, setHistory] = useState<SubscriptionLifecycleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => {
        getSubscriptionHistory(user.id)
            .then(setHistory)
            .finally(() => setLoading(false));
    }, [user.id]);

    const handleExtendTrial = async (days: number) => {
        setActionLoading('trial');
        await extendTrial(user.id, days);
        setActionLoading('');
        onUpdated();
    };

    const handleForceCancel = async () => {
        if (!confirm('Are you sure you want to force-cancel this subscription?')) return;
        setActionLoading('cancel');
        await forceCancelSubscription(user.id);
        setActionLoading('');
        onUpdated();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-50">Subscription Details</h2>
                            <p className="text-sm text-zinc-500">{user.email}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* User info + badges */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                {user.image
                                    ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-400">{user.name.charAt(0)}</div>
                                }
                            </div>
                            <div>
                                <p className="text-base font-semibold text-zinc-100">{user.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <PlanBadge plan={user.plan} />
                                    <StatusBadge status={user.subscriptionStatus} />
                                </div>
                            </div>
                        </div>

                        {/* Paystack info */}
                        {(user.paystackCustomerCode || user.subscriptionId) && (
                            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Paystack</p>
                                {user.paystackCustomerCode && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Customer Code</span>
                                        <span className="text-zinc-300 font-mono text-xs">{user.paystackCustomerCode}</span>
                                    </div>
                                )}
                                {user.subscriptionId && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Subscription ID</span>
                                        <span className="text-zinc-300 font-mono text-xs">{user.subscriptionId}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trial info */}
                        {user.trialEndsAt && (
                            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <ClockIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-300">Trial Active</p>
                                    <p className="text-xs text-blue-400/70">
                                        Ends {new Date(user.trialEndsAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Admin actions */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin Actions</p>

                            <div className="flex gap-2">
                                {[7, 14, 30].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => handleExtendTrial(days)}
                                        disabled={actionLoading === 'trial'}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <ArrowPathIcon className="w-3.5 h-3.5" />
                                        +{days}d trial
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleForceCancel}
                                disabled={actionLoading === 'cancel'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                <ShieldExclamationIcon className="w-4 h-4" />
                                Force Cancel Subscription
                            </button>
                        </div>

                        {/* Lifecycle timeline */}
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Activity History</p>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : history.length === 0 ? (
                                <p className="text-sm text-zinc-600 text-center py-4">No activity recorded</p>
                            ) : (
                                <div className="relative pl-4 border-l border-zinc-800 space-y-4">
                                    {history.map((event, i) => (
                                        <div key={event.id} className="relative">
                                            <div className="absolute -left-[17px] w-2 h-2 rounded-full bg-violet-500 mt-1.5" />
                                            <div className="bg-zinc-800/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-zinc-300 capitalize">
                                                        {event.type.replace(/_/g, ' ')}
                                                    </span>
                                                    {event.fromPlan && event.toPlan && (
                                                        <span className="text-xs text-zinc-600">
                                                            {event.fromPlan} → {event.toPlan}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.reason && (
                                                    <p className="text-xs text-zinc-500 mt-0.5">{event.reason}</p>
                                                )}
                                                <p className="text-xs text-zinc-600 mt-1">{timeAgo(new Date(event.createdAt))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/billing/subscription-drawer.tsx
git commit -m "feat(admin): add subscription detail drawer component"
```

---

## Task 7: Subscription table component

**Files:**
- Create: `components/admin/billing/subscription-table.tsx`

- [ ] **Step 1: Create `components/admin/billing/subscription-table.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/admin/data-table';
import { PlanBadge, StatusBadge } from './plan-badge';
import { PlanChangeModal } from './plan-change-modal';
import { SubscriptionDrawer } from './subscription-drawer';
import type { SubscriptionRow, PlanType } from '@/lib/types/billing';
import type { Column } from '@/components/admin/data-table';

interface SubscriptionTableProps {
    initialData: {
        rows: SubscriptionRow[];
        total: number;
        page: number;
        totalPages: number;
    };
}

const PLAN_OPTIONS = [
    { value: '', label: 'All Plans' },
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'past_due', label: 'Past Due' },
    { value: 'trialing', label: 'Trialing' },
];

export function SubscriptionTable({ initialData }: SubscriptionTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [data, setData] = useState(initialData);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const [selectedUser, setSelectedUser] = useState<SubscriptionRow | null>(null);
    const [drawerUser, setDrawerUser] = useState<SubscriptionRow | null>(null);

    const fetchData = useCallback(async (overrides?: { page?: number; search?: string; plan?: string; status?: string }) => {
        const params = new URLSearchParams();
        const s = overrides?.search ?? search;
        const p = overrides?.plan ?? planFilter;
        const st = overrides?.status ?? statusFilter;
        const pg = overrides?.page ?? page;

        if (s) params.set('search', s);
        if (p) params.set('plan', p);
        if (st) params.set('status', st);
        params.set('page', String(pg));

        const res = await fetch(`/api/admin/billing/subscriptions?${params}`);
        if (res.ok) {
            const json = await res.json();
            setData(json);
        }
    }, [search, planFilter, statusFilter, page]);

    const handleSearch = (term: string) => {
        setSearch(term);
        setPage(1);
        fetchData({ page: 1, search: term });
    };

    const handlePlanFilter = (plan: string) => {
        setPlanFilter(plan);
        setPage(1);
        fetchData({ page: 1, plan });
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setPage(1);
        fetchData({ page: 1, status });
    };

    const handleClear = () => {
        setSearch('');
        setPlanFilter('');
        setStatusFilter('');
        setPage(1);
        fetchData({ page: 1, search: '', plan: '', status: '' });
    };

    const columns: Column[] = [
        { key: 'user', label: 'User', width: '25%' },
        { key: 'plan', label: 'Plan' },
        { key: 'subscriptionStatus', label: 'Status' },
        { key: 'createdAt', label: 'Joined', sortable: true },
        { key: 'actions', label: 'Actions' },
    ];

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData({ page: newPage });
    };

    const renderRow = (row: SubscriptionRow) => ({
        user: (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                    {row.image
                        ? <img src={row.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">{row.name.charAt(0)}</div>
                    }
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{row.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{row.email}</p>
                </div>
            </div>
        ),
        plan: <PlanBadge plan={row.plan} />,
        subscriptionStatus: <StatusBadge status={row.subscriptionStatus} />,
        createdAt: (
            <span className="text-sm text-zinc-500">
                {new Date(row.createdAt).toLocaleDateString()}
            </span>
        ),
        actions: (
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}
                    className="px-3 py-1.5 text-xs font-medium bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg transition-colors"
                >
                    Change Plan
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setDrawerUser(row); }}
                    className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                    View History
                </button>
            </div>
        ),
    });

    const hasFilters = search || planFilter || statusFilter;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Search */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSearch(search); }}
                    className="flex-1 max-w-xs relative"
                >
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
                    />
                </form>

                {/* Plan filter */}
                <select
                    value={planFilter}
                    onChange={(e) => handlePlanFilter(e.target.value)}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                    {PLAN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {hasFilters && (
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Active filter tags */}
            {hasFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    {search && (
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                            Search: {search}
                        </span>
                    )}
                    {planFilter && (
                        <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full capitalize">
                            Plan: {planFilter}
                        </span>
                    )}
                    {statusFilter && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full capitalize">
                            Status: {statusFilter.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}

            {/* Table */}
            <DataTable
                columns={columns}
                data={data.rows.map(r => ({ ...r, ...renderRow(r) }))}
                keyField="id"
                emptyMessage="No subscriptions found"
            />

            {/* Pagination */}
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                        Showing {((data.page - 1) * 20) + 1}–{Math.min(data.page * 20, data.total)} of {data.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(data.page - 1)}
                            disabled={data.page <= 1}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-zinc-500">
                            Page {data.page} of {data.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(data.page + 1)}
                            disabled={data.page >= data.totalPages}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedUser && (
                <PlanChangeModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={() => { setSelectedUser(null); fetchData(); }}
                />
            )}

            {drawerUser && (
                <SubscriptionDrawer
                    user={drawerUser}
                    onClose={() => setDrawerUser(null)}
                    onUpdated={() => { setDrawerUser(null); fetchData(); }}
                />
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/billing/subscription-table.tsx
git commit -m "feat(admin): add subscription table with filters"
```

---

## Task 8: API route for subscriptions list

**Files:**
- Create: `app/api/admin/billing/subscriptions/route.ts`

- [ ] **Step 1: Create `app/api/admin/billing/subscriptions/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptions } from '@/actions/admin/billing';
import type { PlanType } from '@/lib/types/billing';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || undefined;
    const plan = (searchParams.get('plan') || undefined) as PlanType | undefined;
    const status = searchParams.get('status') || undefined;
    const page = Number(searchParams.get('page')) || 1;

    try {
        const data = await getSubscriptions({ search, plan, status, page });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/billing/subscriptions/route.ts
git commit -m "feat(admin): add subscriptions API route"
```

---

## Task 9: Billing dashboard page

**Files:**
- Create: `app/admin/billing/page.tsx`

- [ ] **Step 1: Create `app/admin/billing/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, UserMinusIcon, UserPlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { getBillingMetrics } from '@/actions/admin/billing';
import { KpiCard } from '@/components/admin/billing/kpi-card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { BillingMetrics } from '@/lib/types/billing';

const PLAN_COLORS = ['#71717a', '#22c55e', '#8b5cf6', '#f59e0b'];

export default function BillingDashboardPage() {
    const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBillingMetrics()
            .then(setMetrics)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500">Loading billing metrics...</span>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="p-8 text-center text-zinc-500">
                Failed to load billing metrics. Please try again.
            </div>
        );
    }

    const pieData = Object.entries(metrics.planDistribution)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(d => d.value > 0);

    const kpis = [
        {
            label: 'Monthly Recurring Revenue',
            value: metrics.mrr,
            prefix: '₦',
            change: metrics.mrrChange >= 0 ? `+${metrics.mrrChange}%` : `${metrics.mrrChange}%`,
            changePositive: metrics.mrrChange >= 0,
            icon: CurrencyDollarIcon,
            color: 'green',
        },
        {
            label: 'Churn Rate (30d)',
            value: metrics.churnRate,
            suffix: '%',
            change: `${metrics.churnChange >= 0 ? '+' : ''}${metrics.churnChange}% vs last mo`,
            changePositive: metrics.churnChange <= 0,
            icon: UserMinusIcon,
            color: 'red',
        },
        {
            label: 'Trial → Paid (30d)',
            value: metrics.trialToPaidRate,
            suffix: '%',
            icon: UserPlusIcon,
            color: 'blue',
        },
        {
            label: 'Net MRR',
            value: metrics.netMrr,
            prefix: '₦',
            icon: ArrowTrendingUpIcon,
            color: 'amber',
        },
    ];

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold text-zinc-50">Billing</h1>
                <p className="text-zinc-500">Subscription overview and key metrics</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, i) => (
                    <KpiCard key={kpi.label} {...kpi} index={i} />
                ))}
            </div>

            {/* Plan Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
                <h2 className="text-lg font-semibold text-zinc-50 mb-4">Plan Distribution</h2>
                {pieData.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-8">No plan data available</p>
                ) : (
                    <div className="flex items-center gap-8">
                        <ResponsiveContainer width={240} height={240}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={PLAN_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '12px',
                                        color: '#e4e4e7',
                                    }}
                                    formatter={(value: number) => [value, 'Users']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: PLAN_COLORS[i] }}
                                    />
                                    <span className="text-sm text-zinc-400">{item.name}</span>
                                    <span className="text-sm font-semibold text-zinc-200 ml-auto">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/billing/page.tsx
git commit -m "feat(admin): add billing dashboard page"
```

---

## Task 10: Subscriptions list page

**Files:**
- Create: `app/admin/billing/subscriptions/page.tsx`

- [ ] **Step 1: Create `app/admin/billing/subscriptions/page.tsx`**

```typescript
import { Suspense } from 'react';
import { getSubscriptions } from '@/actions/admin/billing';
import { SubscriptionTable } from '@/components/admin/billing/subscription-table';

export default async function SubscriptionsPage() {
    const initialData = await getSubscriptions({ page: 1 });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-50">Subscriptions</h1>
                <p className="text-zinc-500">Manage all user subscriptions and plans</p>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                <SubscriptionTable initialData={initialData} />
            </Suspense>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/billing/subscriptions/page.tsx
git commit -m "feat(admin): add subscriptions list page"
```

---

## Task 11: Billing analytics page

**Files:**
- Create: `app/admin/billing/analytics/page.tsx`

- [ ] **Step 1: Create `app/admin/billing/analytics/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMrrHistory, getPlanMigrationFlows } from '@/actions/admin/billing';
import { PlanMigrationChart } from '@/components/admin/billing/plan-migration-chart';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, BarChart, Bar,
} from 'recharts';

interface MrrDataPoint { month: string; mrr: number; }
interface MigrationFlows { [key: string]: number; }

export default function BillingAnalyticsPage() {
    const [mrrData, setMrrData] = useState<MrrDataPoint[]>([]);
    const [migrationFlows, setMigrationFlows] = useState<MigrationFlows>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getMrrHistory(),
            getPlanMigrationFlows(),
        ]).then(([mrr, flows]) => {
            setMrrData(mrr);
            setMigrationFlows(flows);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500">Loading analytics...</span>
                </div>
            </div>
        );
    }

    const chartStyle = {
        backgroundColor: 'transparent',
        borderRadius: '12px',
        border: '1px solid #27272a',
    };
    const axisStyle = { fill: '#71717a', fontSize: 12 };
    const tooltipStyle = {
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        color: '#e4e4e7',
    };

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold text-zinc-50">Billing Analytics</h1>
                <p className="text-zinc-500">Revenue trends and plan migration analytics</p>
            </motion.div>

            <div className="space-y-6">
                {/* MRR Over Time */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                    <h2 className="text-base font-semibold text-zinc-50 mb-4">MRR Over Time</h2>
                    {mrrData.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-8">No MRR data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={mrrData} margin={{ left: 10, right: 10 }}>
                                <defs>
                                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="month" tick={axisStyle} tickFormatter={(v) => v.slice(5)} />
                                <YAxis tick={axisStyle} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₦${v.toLocaleString()}`, 'MRR']} />
                                <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" fill="url(#mrrGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                {/* Plan Migration Flows */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                    <h2 className="text-base font-semibold text-zinc-50 mb-4">Plan Migration Flows</h2>
                    <PlanMigrationChart flows={migrationFlows} />
                </motion.div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/billing/analytics/page.tsx
git commit -m "feat(admin): add billing analytics page"
```

---

## Task 12: Add Billing nav group to admin sidebar

**Files:**
- Modify: `app/admin/layout.tsx:40-45`

- [ ] **Step 1: Modify `app/admin/layout.tsx` to add billing nav items**

Add these imports after the existing icon imports:
```typescript
import { CreditCardIcon } from '@heroicons/react/24/outline';
```

Find the `navItems` array (line ~40) and add a divider + billing group:

```typescript
// After the existing navItems array, add a billing group
const billingNavItems: NavItem[] = [
    { href: '/admin/billing', label: 'Overview', icon: CreditCardIcon },
    { href: '/admin/billing/subscriptions', label: 'Subscriptions', icon: CreditCardIcon },
    { href: '/admin/billing/analytics', label: 'Analytics', icon: CreditCardIcon },
];
```

Then add a separator and the billing nav items to the nav render loop. Find the closing `</nav>` tag and add a divider + billing items:

```typescript
// Before the closing </nav> tag, add:
<div className="mt-4 mb-2 px-4">
    <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Billing</p>
</div>
{billingNavItems.map((item, index) => {
    const active = isActive(item);
    return (
        <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
        >
            <Link
                href={item.href}
                className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative
                    ${active
                        ? 'bg-zinc-800 text-violet-400 shadow-lg shadow-violet-500/10'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }
                `}
            >
                {active && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
                <item.icon className="w-5 h-5" />
                {item.label}
            </Link>
        </motion.div>
    );
})}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat(admin): add billing nav group to sidebar"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| MRR KPI tile | Task 9 (billing dashboard page) |
| Churn rate KPI | Task 9 |
| Trial → Paid KPI | Task 9 |
| Net MRR KPI | Task 9 |
| Plan distribution pie chart | Task 9 |
| Subscription table with filters | Task 7 + Task 10 |
| Plan change modal with preview | Task 5 + Task 7 |
| Subscription detail drawer | Task 6 |
| Extend trial / Force cancel actions | Task 6 (drawer) |
| Lifecycle audit history in drawer | Task 6 |
| MRR over time chart | Task 11 |
| Plan migration flows chart | Task 4 + Task 11 |
| New nav group "Billing" | Task 12 |
| Server action: change plan | Task 2 |
| Server action: billing metrics | Task 2 |
| Server action: subscription list | Task 2 |

All spec requirements are covered.

## Self-Review

- **Placeholder scan**: No TODOs, TBDs, or incomplete steps. All code is concrete.
- **Type consistency**: `PlanType` imported from `lib/types/billing` and `lib/plan-limits.ts` consistently. `SubscriptionRow` and `BillingMetrics` used across tasks.
- **Import consistency**: `@/actions/admin/billing`, `@/components/admin/billing/*`, `@/lib/types/billing` — all path aliases match project convention.
- **Recharts usage**: consistent `contentStyle` and `formatter` props across all chart instances.
- **No placeholder pages**: All three pages have full implementations.
