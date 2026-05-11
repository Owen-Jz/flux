import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    await connectDB();

    const user = await User.findById(session.user.id).lean();

    if (!user) {
        redirect('/login');
    }

    return (
        <SettingsClient
            user={{
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                image: user.image || null,
                plan: user.plan,
                subscriptionStatus: user.subscriptionStatus || null,
                trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : null,
                hasUsedTrial: user.hasUsedTrial || false,
            }}
        />
    );
}