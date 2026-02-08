'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function updateTutorialProgress(step: 'welcome' | 'dashboard' | 'board' | 'settings') {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        await connectDB();

        const fieldMap = {
            welcome: 'tutorialProgress.hasSeenWelcome',
            dashboard: 'tutorialProgress.hasSeenDashboard',
            board: 'tutorialProgress.hasSeenBoard',
            settings: 'tutorialProgress.hasSeenSettings',
        };

        if (!fieldMap[step]) {
            return { error: 'Invalid step' };
        }

        await User.findByIdAndUpdate(session.user.id, {
            $set: { [fieldMap[step]]: true },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update tutorial progress:', error);
        return { error: 'Failed to update progress' };
    }
}

export async function getTutorialProgress() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('tutorialProgress').lean();

        if (!user || !user.tutorialProgress) {
            // Return default
            return {
                hasSeenWelcome: false,
                hasSeenDashboard: false,
                hasSeenBoard: false,
                hasSeenSettings: false,
            };
        }

        return {
            hasSeenWelcome: user.tutorialProgress.hasSeenWelcome || false,
            hasSeenDashboard: user.tutorialProgress.hasSeenDashboard || false,
            hasSeenBoard: user.tutorialProgress.hasSeenBoard || false,
            hasSeenSettings: user.tutorialProgress.hasSeenSettings || false,
        };
    } catch (error) {
        console.error('Failed to get tutorial progress:', error);
        return null;
    }
}
