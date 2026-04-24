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
    mrrChange: number;
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
    price: number;
    priceDisplay: string;
    projects: number | 'unlimited';
    members: number | 'unlimited';
}
