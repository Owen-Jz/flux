import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { disableSubscription, getSubscription } from '@/lib/paystack';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rate-limit';

// Cancel subscription
export async function POST(request: NextRequest) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const ip = getClientIp(request);
        const limit = rateLimit(`billing-cancel:${ip}`, 5, 60);
        if (!limit.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

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

        // Try to cancel the subscription on Paystack
        try {
            const subscription = await getSubscription(user.subscriptionId);
            if (subscription && subscription.email_token) {
                await disableSubscription(subscription.subscription_code, subscription.email_token);
            }
        } catch (paystackError) {
            console.error('Failed to cancel subscription on Paystack:', paystackError);
            // Continue with local cancellation even if Paystack call fails
        }

        // Downgrade user (keep subscriptionId for reconciliation)
        user.plan = 'free';
        user.subscriptionStatus = 'cancelled';
        await user.save();

        return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
