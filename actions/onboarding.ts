'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

type OnboardingStep = 'createdFirstBoard' | 'addedFirstTeamMember' | 'createdFirstTask' | 'completedFirstDragDrop' | 'completedTutorial';

const validSteps: OnboardingStep[] = [
    'createdFirstBoard',
    'addedFirstTeamMember',
    'createdFirstTask',
    'completedFirstDragDrop',
    'completedTutorial',
];

export async function getOnboardingProgress() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('onboardingProgress').lean();

        if (!user || !user.onboardingProgress) {
            return {
                createdFirstBoard: false,
                addedFirstTeamMember: false,
                createdFirstTask: false,
                completedFirstDragDrop: false,
                completedTutorial: false,
                dismissedAt: null,
            };
        }

        return {
            createdFirstBoard: user.onboardingProgress.createdFirstBoard || false,
            addedFirstTeamMember: user.onboardingProgress.addedFirstTeamMember || false,
            createdFirstTask: user.onboardingProgress.createdFirstTask || false,
            completedFirstDragDrop: user.onboardingProgress.completedFirstDragDrop || false,
            completedTutorial: user.onboardingProgress.completedTutorial || false,
            dismissedAt: user.onboardingProgress.dismissedAt || null,
        };
    } catch (error) {
        console.error('Failed to get onboarding progress:', error);
        return null;
    }
}

export async function updateOnboardingProgress(step: OnboardingStep) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    if (!validSteps.includes(step)) {
        return { error: 'Invalid step' };
    }

    try {
        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            $set: { [`onboardingProgress.${step}`]: true },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update onboarding progress:', error);
        return { error: 'Failed to update progress' };
    }
}

export async function dismissOnboarding() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            $set: { 'onboardingProgress.dismissedAt': new Date() },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to dismiss onboarding:', error);
        return { error: 'Failed to dismiss onboarding' };
    }
}

export async function isOnboardingComplete() {
    const progress = await getOnboardingProgress();
    if (!progress) return false;

    return (
        progress.createdFirstBoard &&
        progress.addedFirstTeamMember &&
        progress.createdFirstTask &&
        progress.completedFirstDragDrop &&
        progress.completedTutorial
    );
}

// Check if user is eligible for onboarding (new user within first 7 days)
export async function isEligibleForOnboarding(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('createdAt onboardingProgress').lean();

        if (!user) return false;

        // Check if already completed or dismissed
        if (user.onboardingProgress?.dismissedAt) {
            return false;
        }

        // Check if all steps completed
        const progress = user.onboardingProgress;
        if (progress?.createdFirstBoard &&
            progress?.addedFirstTeamMember &&
            progress?.createdFirstTask &&
            progress?.completedFirstDragDrop &&
            progress?.completedTutorial) {
            return false;
        }

        // Check if user is new (created within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const userCreatedAt = user.createdAt ? new Date(user.createdAt) : null;
        if (userCreatedAt && userCreatedAt > sevenDaysAgo) {
            return true;
        }

        // Also eligible if no onboardingProgress at all (brand new user)
        if (!user.onboardingProgress) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Failed to check onboarding eligibility:', error);
        return false;
    }
}

// Check if user has completed the "aha moment" (first board + first task)
export async function hasCompletedAhaMoment(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('onboardingProgress').lean();

        if (!user?.onboardingProgress) {
            return false;
        }

        return !!(user.onboardingProgress.createdFirstBoard && user.onboardingProgress.createdFirstTask);
    } catch (error) {
        console.error('Failed to check aha moment:', error);
        return false;
    }
}

// Mark referral prompt as shown
export async function markReferralPromptShown(): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            $set: { 'onboardingProgress.referralPromptShown': true },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to mark referral prompt shown:', error);
        return { success: false, error: 'Failed to update' };
    }
}

// Check if referral prompt should be shown (aha moment complete + not yet shown)
export async function shouldShowReferralPrompt(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('onboardingProgress').lean();

        if (!user?.onboardingProgress) {
            return false;
        }

        // Must have completed aha moment
        if (!user.onboardingProgress.createdFirstBoard || !user.onboardingProgress.createdFirstTask) {
            return false;
        }

        // Must not have been shown yet
        if (user.onboardingProgress.referralPromptShown) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to check referral prompt status:', error);
        return false;
    }
}

export async function dismissTrialPrompt(): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            $set: { trialPromptDismissedAt: new Date() },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to dismiss trial prompt:', error);
        return { success: false, error: 'Failed to dismiss trial prompt' };
    }
}
