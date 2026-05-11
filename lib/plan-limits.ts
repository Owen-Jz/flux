import { PLAN_LIMITS, PLAN_PRICES_KOBO } from './paystack';
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
        price: PLAN_PRICES_KOBO.starter,
        priceDisplay: '₦10,000/mo',
        projects: 5,
        members: 10,
    },
    pro: {
        label: 'Entrepreneur',
        price: PLAN_PRICES_KOBO.pro,
        priceDisplay: '₦25,000/mo',
        projects: 'unlimited',
        members: 25,
    },
    enterprise: {
        label: 'Business',
        price: PLAN_PRICES_KOBO.enterprise,
        priceDisplay: 'Custom',
        projects: 'unlimited',
        members: 'unlimited',
    },
};
