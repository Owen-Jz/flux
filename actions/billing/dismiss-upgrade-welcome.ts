'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function dismissUpgradeWelcome(): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            $set: { lastUpgradeAt: null },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to dismiss upgrade welcome:', error);
        return { success: false, error: 'Failed to dismiss upgrade welcome' };
    }
}