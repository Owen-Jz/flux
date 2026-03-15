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
