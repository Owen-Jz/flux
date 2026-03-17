import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { disableSubscription } from '@/lib/paystack';

// Cancel subscription
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.subscriptionId || user.subscriptionStatus !== 'active') {
            return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
        }

        // Disable subscription on Paystack
        if (user.subscriptionId && !user.subscriptionId.startsWith('sub_')) {
            await disableSubscription(user.subscriptionId);
        }

        // Downgrade user
        user.plan = 'free';
        user.subscriptionStatus = 'cancelled';
        user.subscriptionId = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
