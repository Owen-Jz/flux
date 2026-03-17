import { PLAN_LIMITS } from './paystack';

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

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
            return `Upgrade to Starter to create more ${limitType}. Starter plan allows up to ${PLAN_LIMITS.starter[limitType]} ${limitType}.`;
        case 'starter':
            return `Upgrade to Pro to create more ${limitType}. Pro plan allows up to ${PLAN_LIMITS.pro[limitType]} ${limitType}.`;
        case 'pro':
            return `Contact sales for Enterprise to create unlimited ${limitType}.`;
        default:
            return '';
    }
}
