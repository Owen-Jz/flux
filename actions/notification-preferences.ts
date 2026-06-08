'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export interface NotificationPreferences {
    taskAssigned: boolean;
    comments: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    taskAssigned: true,
    comments: true,
};

/**
 * Read the authenticated user's email-notification preferences, falling back to
 * the defaults (everything on) for accounts created before the field existed.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const session = await auth();
    if (!session?.user?.id) {
        return DEFAULT_PREFERENCES;
    }

    await connectDB();

    const user = await User.findById(session.user.id)
        .select('notificationPreferences')
        .lean();

    return {
        taskAssigned: user?.notificationPreferences?.taskAssigned ?? DEFAULT_PREFERENCES.taskAssigned,
        comments: user?.notificationPreferences?.comments ?? DEFAULT_PREFERENCES.comments,
    };
}

/**
 * Update one or more of the authenticated user's email-notification preferences.
 * Returns the full, resolved set so the client can stay in sync.
 */
export async function updateNotificationPreferences(
    prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const update: Record<string, boolean> = {};
    if (typeof prefs.taskAssigned === 'boolean') {
        update['notificationPreferences.taskAssigned'] = prefs.taskAssigned;
    }
    if (typeof prefs.comments === 'boolean') {
        update['notificationPreferences.comments'] = prefs.comments;
    }

    if (Object.keys(update).length === 0) {
        return getNotificationPreferences();
    }

    const user = await User.findByIdAndUpdate(
        session.user.id,
        { $set: update },
        { new: true }
    )
        .select('notificationPreferences')
        .lean();

    revalidatePath('/settings');

    return {
        taskAssigned: user?.notificationPreferences?.taskAssigned ?? DEFAULT_PREFERENCES.taskAssigned,
        comments: user?.notificationPreferences?.comments ?? DEFAULT_PREFERENCES.comments,
    };
}
