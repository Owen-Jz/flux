import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UserSettingsClient } from './settings-client';

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ billing?: string; action?: string; [key: string]: string | undefined }>;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    await connectDB();

    const user = await User.findById(session.user.id).lean();
    const params = await searchParams;

    if (!user) {
        redirect('/login');
    }

    return (
        <UserSettingsClient
            user={{
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                image: user.image || null,
                plan: user.plan,
                subscriptionStatus: user.subscriptionStatus || null,
                trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : null,
                hasUsedTrial: user.hasUsedTrial || false,
                notificationPreferences: {
                    taskAssigned: user.notificationPreferences?.taskAssigned ?? true,
                    comments: user.notificationPreferences?.comments ?? true,
                    taskUpdates: user.notificationPreferences?.taskUpdates ?? true,
                },
            }}
            billingParam={params.billing}
            actionParam={params.action}
        />
    );
}