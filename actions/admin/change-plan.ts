'use server';

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { requireAdminPermission } from '@/lib/admin-auth';
import { requireAdmin } from '@/lib/admin-auth';
import { PLAN_PRICES_KOBO } from '@/lib/paystack';
import mongoose from 'mongoose';
import type { PlanChangeRequest, PlanType } from '@/lib/types/billing';

interface ProrationResult {
    daysRemaining: number;
    oldPlanPrice: number;
    newPlanPrice: number;
    creditAmount: number;
    chargeAmount: number;
    currency: string;
    billingCycleDays: number;
    isUpgrade: boolean;
}

async function calculateProration(userId: string, newPlan: PlanType): Promise<ProrationResult> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const oldPlan = (user.plan || 'free') as PlanType;
    if (oldPlan === newPlan) throw new Error('User is already on this plan');

    const planPricesKobo = PLAN_PRICES_KOBO as Record<string, number>;
    const oldPlanPrice = planPricesKobo[oldPlan] ?? 0;
    const newPlanPrice = planPricesKobo[newPlan] ?? 0;
    const billingCycleDays = 30;

    const now = new Date();
    const userCreatedAt = new Date(user.createdAt);
    const dayOfMonth = userCreatedAt.getDate();
    const currentDayOfMonth = now.getDate();

    const daysIntoCycle = currentDayOfMonth >= dayOfMonth
        ? currentDayOfMonth - dayOfMonth
        : currentDayOfMonth + (billingCycleDays - dayOfMonth);

    const daysRemaining = billingCycleDays - daysIntoCycle;
    const isUpgrade = newPlanPrice > oldPlanPrice;

    const priceDiffPerDay = (newPlanPrice - oldPlanPrice) / billingCycleDays;
    const chargeAmount = isUpgrade ? Math.round(priceDiffPerDay * daysRemaining) : 0;
    const creditAmount = !isUpgrade ? Math.round(Math.abs(priceDiffPerDay) * daysRemaining) : 0;

    return {
        daysRemaining,
        oldPlanPrice,
        newPlanPrice,
        creditAmount,
        chargeAmount,
        currency: 'NGN',
        billingCycleDays,
        isUpgrade,
    };
}

export async function getProrationPreview(userId: string, newPlan: PlanType) {
    await requireAdmin();
    await requireAdminPermission('billing');
    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) return { error: 'User not found' };

    const currentPlan = (user.plan || 'free') as PlanType;
    if (currentPlan === newPlan) return { error: 'User is already on this plan' };

    try {
        const proration = await calculateProration(userId, newPlan);
        return {
            success: true,
            currentPlan,
            newPlan,
            proration,
        };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to calculate proration' };
    }
}

export async function changeUserPlan(data: PlanChangeRequest, proration?: boolean) {
    const admin = await requireAdmin();
    await requireAdminPermission('billing');
    await connectDB();

    const { userId, newPlan, effectiveDate, reason } = data;

    const user = await User.findById(userId).lean();
    if (!user) return { error: 'User not found' };

    const oldPlan = (user.plan || 'free') as PlanType;
    if (oldPlan === newPlan) return { error: 'User is already on this plan' };

    let prorationDetails = undefined;
    if (proration) {
        try {
            const prorationResult = await calculateProration(userId, newPlan);
            prorationDetails = {
                credit: prorationResult.creditAmount,
                charge: prorationResult.chargeAmount,
                daysRemaining: prorationResult.daysRemaining,
                oldPlanPrice: prorationResult.oldPlanPrice,
                newPlanPrice: prorationResult.newPlanPrice,
                isUpgrade: prorationResult.isUpgrade,
            };
        } catch (err) {
            return { error: err instanceof Error ? err.message : 'Failed to calculate proration' };
        }
    }

    await User.findByIdAndUpdate(userId, {
        plan: newPlan,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
    });

    const auditDetails: Record<string, unknown> = {
        fromPlan: oldPlan,
        toPlan: newPlan,
        effectiveDate,
        reason: reason || null,
    };

    if (prorationDetails) {
        auditDetails.proration = prorationDetails;
    }

    await AuditLog.create({
        adminId: new mongoose.Types.ObjectId(admin.id),
        action: 'UPDATE_USER_PLAN',
        targetType: 'user',
        targetId: new mongoose.Types.ObjectId(userId),
        details: auditDetails,
    });

    const response: Record<string, unknown> = { success: true, oldPlan, newPlan };
    if (prorationDetails) {
        response.proration = prorationDetails;
    }
    return response;
}

export async function extendTrial(userId: string, days: number) {
    const admin = await requireAdmin();
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
        adminId: new mongoose.Types.ObjectId(admin.id),
        action: 'EXTEND_TRIAL',
        targetType: 'user',
        targetId: new mongoose.Types.ObjectId(userId),
        details: { days, newTrialEnd: newTrialEnd.toISOString() },
    });

    return { success: true };
}

export async function forceCancelSubscription(userId: string, reason?: string) {
    const admin = await requireAdmin();
    await requireAdminPermission('billing');
    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) return { error: 'User not found' };

    await User.findByIdAndUpdate(userId, {
        plan: 'free',
        subscriptionStatus: 'cancelled',
        updatedAt: new Date(),
    });

    await AuditLog.create({
        adminId: new mongoose.Types.ObjectId(admin.id),
        action: 'FORCE_CANCEL_SUBSCRIPTION',
        targetType: 'user',
        targetId: new mongoose.Types.ObjectId(userId),
        details: { reason: reason || 'Admin forced cancellation' },
    });

    return { success: true };
}
