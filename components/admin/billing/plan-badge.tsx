'use client';

import type { PlanType } from '@/lib/types/billing';
import { PLAN_META } from '@/lib/plan-limits';

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
    const label = PLAN_META[plan].label;

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
