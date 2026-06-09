import { PLAN_LIMITS, PLAN_PRICES_USD } from './paystack';
import type { PlanMeta, PlanType } from './types/billing';

export interface PlanLimits {
    projects: number | 'unlimited';
    members: number | 'unlimited';
    tasks: number | 'unlimited';
    aiCredits: number | 'unlimited';
    features: string[];
}

/** The kinds of limit a user can hit — used to pick the right upgrade message. */
export type LimitType = 'projects' | 'members' | 'tasks' | 'ai';

export function getPlanLimits(plan: PlanType): PlanLimits {
    return PLAN_LIMITS[plan] as PlanLimits;
}

export function getEffectivePlan(user: { plan: PlanType; subscriptionStatus?: string; trialEndsAt?: Date | null }): PlanType {
    if (user.plan === 'free') return 'free';
    if (user.subscriptionStatus === 'active') return user.plan;
    // Trial or inactive subscription — check if trial has expired
    if (user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) {
        return user.plan;
    }
    // Trial expired or no active subscription — effective plan is free
    return 'free';
}

export function canCreateProject(plan: PlanType, currentProjectCount: number): boolean {
    const limit = getPlanLimits(plan).projects;
    if (limit === 'unlimited') return true;
    return currentProjectCount < limit;
}

export function canAddMember(plan: PlanType, currentMemberCount: number): boolean {
    const limit = getPlanLimits(plan).members;
    if (limit === 'unlimited') return true;
    return currentMemberCount < limit;
}

export function getTaskLimit(plan: PlanType): number | 'unlimited' {
    return getPlanLimits(plan).tasks;
}

/**
 * Can the workspace hold another active (non-archived) task? `currentTaskCount` is the
 * workspace's current active-task count. Resolve `plan` from the workspace OWNER so the
 * "20 tasks" cap is a per-workspace ceiling, independent of which member is creating.
 */
export function canCreateTask(plan: PlanType, currentTaskCount: number): boolean {
    const limit = getTaskLimit(plan);
    if (limit === 'unlimited') return true;
    return currentTaskCount < limit;
}

export function getAiCreditLimit(plan: PlanType): number | 'unlimited' {
    return getPlanLimits(plan).aiCredits;
}

export function hasFeature(plan: PlanType, feature: string): boolean {
    const features = getPlanLimits(plan).features;
    return features.includes(feature);
}

export function getUpgradeMessage(plan: PlanType, limitType: LimitType): string {
    const nextLabel = plan === 'free' ? 'Individual' : plan === 'starter' ? 'Entrepreneur' : 'Business';

    switch (limitType) {
        case 'tasks': {
            const limit = getPlanLimits(plan).tasks;
            const cap = limit === 'unlimited' ? '' : `${limit} active tasks`;
            return plan === 'free'
                ? `You've reached the Free plan limit of ${cap}. Archive tasks to free up room, or upgrade to ${nextLabel} for unlimited tasks.`
                : `You've reached your plan's task limit. Upgrade to ${nextLabel} for more.`;
        }
        case 'ai': {
            const limit = getPlanLimits(plan).aiCredits;
            const cap = limit === 'unlimited' ? '' : `${limit} AI plan${limit === 1 ? '' : 's'}`;
            return plan === 'free'
                ? `You've used all ${cap} this month on the Free plan. Upgrade to ${nextLabel} for more AI planning every month.`
                : `You've used all your AI plans for this month. Upgrade to ${nextLabel} for a higher monthly allowance.`;
        }
        case 'projects':
        case 'members':
        default: {
            // `tasks` / `ai` are fully handled above, so here the key is only
            // 'projects' | 'members' — both are valid keys of every plan object.
            const key = limitType as 'projects' | 'members';
            switch (plan) {
                case 'free':
                    return `Upgrade to Individual to create more ${key}. Individual plan allows up to ${PLAN_LIMITS.starter[key]} ${key}.`;
                case 'starter':
                    return `Upgrade to Entrepreneur to create more ${key}. Entrepreneur plan allows up to ${PLAN_LIMITS.pro[key]} ${key}.`;
                case 'pro':
                    return `Contact sales for Business to create unlimited ${key}.`;
                default:
                    return '';
            }
        }
    }
}

export const PLAN_META: Record<PlanType, PlanMeta> = {
    free: {
        label: 'Free',
        price: 0,
        priceDisplay: 'Free',
        projects: 3,
        members: 3,
        tasks: 20,
        aiCredits: 3,
    },
    starter: {
        label: 'Individual',
        price: PLAN_PRICES_USD.starter,
        priceDisplay: '$10/mo',
        projects: 5,
        members: 10,
        tasks: 'unlimited',
        aiCredits: 50,
    },
    pro: {
        label: 'Entrepreneur',
        price: PLAN_PRICES_USD.pro,
        priceDisplay: '$25/mo',
        projects: 'unlimited',
        members: 25,
        tasks: 'unlimited',
        aiCredits: 200,
    },
    enterprise: {
        label: 'Business',
        price: PLAN_PRICES_USD.enterprise,
        priceDisplay: 'Custom',
        projects: 'unlimited',
        members: 'unlimited',
        tasks: 'unlimited',
        aiCredits: 'unlimited',
    },
};
