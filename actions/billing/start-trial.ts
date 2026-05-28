'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sendTrialStartedEmail } from '@/lib/email/subscription-notifications';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

const TRIAL_DAYS = 14;

export async function startTrial(plan: 'starter' | 'pro' = 'pro'): Promise<{ success: boolean; error?: string; trialEndsAt?: string; plan?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!['starter', 'pro'].includes(plan)) {
        return { success: false, error: 'Invalid plan. Must be starter or pro.' };
    }

    try {
        await connectDB();

        // Check for prior trial from same IP (best-effort abuse prevention)
        const headersList = await headers();
        const ip =
            headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
            headersList.get('x-real-ip') ||
            'unknown';
        if (ip !== 'unknown') {
            const priorTrial = await User.findOne({
                trialIpAddress: ip,
                hasUsedTrial: true,
                _id: { $ne: session.user.id },
            });
            if (priorTrial) {
                return { success: false, error: 'A free trial has already been used from this location.' };
            }
        }

        const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

        // Atomic check-and-update to prevent race conditions
        const updatedUser = await User.findOneAndUpdate(
            {
                _id: session.user.id,
                hasUsedTrial: { $ne: true },
                subscriptionStatus: { $ne: 'active' },
            },
            {
                $set: {
                    plan: plan,
                    trialEndsAt: trialEndsAt,
                    hasUsedTrial: true,
                    trialIpAddress: ip,
                    subscriptionStatus: 'inactive',
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            // Could not activate — either user not found, already used trial, or has active subscription
            const user = await User.findById(session.user.id);
            if (!user) return { success: false, error: 'User not found' };
            if (user.hasUsedTrial) return { success: false, error: 'You have already used your free trial' };
            if (user.subscriptionStatus === 'active') return { success: false, error: 'You already have an active subscription' };
            return { success: false, error: 'Unable to activate trial' };
        }

        await sendTrialStartedEmail(
            { email: updatedUser.email, name: updatedUser.name || 'there' },
            plan,
            trialEndsAt
        );

        revalidatePath('/settings');
        revalidatePath('/dashboard');

        return {
            success: true,
            trialEndsAt: trialEndsAt.toISOString(),
            plan: updatedUser.plan,
        };
    } catch (error) {
        console.error('Trial activation error:', error);
        return { success: false, error: 'Failed to activate trial' };
    }
}