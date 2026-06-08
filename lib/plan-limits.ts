import { PLAN_LIMITS, PLAN_PRICES_USD } from './paystack';
import type { PlanMeta, PlanType } from './types/billing';

export interface PlanLimits {
    projects: number | 'unlimited';
    members: number | 'unlimited';
    tasks: number | 'unlimited';
    features: string[];
}

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

export function hasFeature(plan: PlanType, feature: string): boolean {
    const features = getPlanLimits(plan).features;
    return features.includes(feature);
}

export function getUpgradeMessage(plan: PlanType, limitType: 'projects' | 'members'): string {
    switch (plan) {
        case 'free':
            return `Upgrade to Individual to create more ${limitType}. Individual plan allows up to ${PLAN_LIMITS.starter[limitType]} ${limitType}.`;
        case 'starter':
            return `Upgrade to Entrepreneur to create more ${limitType}. Entrepreneur plan allows up to ${PLAN_LIMITS.pro[limitType]} ${limitType}.`;
        case 'pro':
            return `Contact sales for Business to create unlimited ${limitType}.`;
        default:
            return '';
    }
}

export const PLAN_META: Record<PlanType, PlanMeta> = {
    free: {
        label: 'Free',
        price: 0,
        priceDisplay: 'Free',
        projects: 3,
        members: 3,
    },
    starter: {
        label: 'Individual',
        price: PLAN_PRICES_USD.starter,
        priceDisplay: '$10/mo',
        projects: 5,
        members: 10,
    },
    pro: {
        label: 'Entrepreneur',
        price: PLAN_PRICES_USD.pro,
        priceDisplay: '$25/mo',
        projects: 'unlimited',
        members: 25,
    },
    enterprise: {
        label: 'Business',
        price: PLAN_PRICES_USD.enterprise,
        priceDisplay: 'Custom',
        projects: 'unlimited',
        members: 'unlimited',
    },
};
