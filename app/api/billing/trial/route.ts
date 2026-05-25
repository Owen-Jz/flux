import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sendTrialStartedEmail } from '@/lib/email/subscription-notifications';

const TRIAL_DAYS = 14;

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan = 'pro' } = await request.json();

        if (!['starter', 'pro'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan. Must be starter or pro.' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.hasUsedTrial) {
            return NextResponse.json({ error: 'You have already used your free trial' }, { status: 400 });
        }

        if (user.trialEndsAt && user.trialEndsAt > new Date()) {
            return NextResponse.json({ error: 'You already have an active trial' }, { status: 400 });
        }

        if (user.subscriptionStatus === 'active') {
            return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
        }

        const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

        user.plan = plan as 'starter' | 'pro';
        user.trialEndsAt = trialEndsAt;
        user.hasUsedTrial = true;
        user.subscriptionStatus = 'inactive';

        await user.save();

        await sendTrialStartedEmail(
            { email: user.email, name: user.name || 'there' },
            plan as 'starter' | 'pro',
            trialEndsAt
        );

        return NextResponse.json({
            success: true,
            message: 'Trial activated successfully',
            trialEndsAt: trialEndsAt.toISOString(),
            plan: user.plan,
        });
    } catch (error) {
        console.error('Trial activation error:', error);
        return NextResponse.json({ error: 'Failed to activate trial' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}