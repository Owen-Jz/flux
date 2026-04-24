'use server';

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { requireAdminPermission } from '@/lib/admin-auth';
import { requireAdmin } from '@/lib/admin-auth';
import type { PlanChangeRequest, PlanType } from '@/lib/types/billing';

export async function changeUserPlan(data: PlanChangeRequest) {
    const admin = await requireAdmin();
    await requireAdminPermission('billing');
    await connectDB();

    const { userId, newPlan, effectiveDate, reason } = data;

    const user = await User.findById(userId).lean();
    if (!user) return { error: 'User not found' };

    const oldPlan = (user.plan || 'free') as PlanType;
    if (oldPlan === newPlan) return { error: 'User is already on this plan' };

    await User.findByIdAndUpdate(userId, {
        plan: newPlan,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
    });

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
        adminId: admin._id,
        action: 'EXTEND_TRIAL',
        targetType: 'user',
        targetId: userId,
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
        adminId: admin._id,
        action: 'FORCE_CANCEL_SUBSCRIPTION',
        targetType: 'user',
        targetId: userId,
        details: { reason: reason || 'Admin forced cancellation' },
    });

    return { success: true };
}
