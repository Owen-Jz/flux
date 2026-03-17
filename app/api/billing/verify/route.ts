import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { verifyTransaction, PLAN_PRICES_USD, getNairaPrice } from '@/lib/paystack';

// Verify payment and activate subscription
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reference, plan } = await request.json();

        if (!reference) {
            return NextResponse.json({ error: 'Reference required' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify the transaction
        const transaction = await verifyTransaction(reference);

        if (transaction.status !== 'success') {
            return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
        }

        // Get expected amount in Naira based on USD price
        const usdPrice = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD];
        if (!usdPrice) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const expectedAmountNaira = await getNairaPrice(usdPrice) * 100; // Convert to kobo

        // Verify amount matches (allow for minor variations due to exchange rate changes)
        if (transaction.amount < expectedAmountNaira * 0.95) {
            return NextResponse.json({
                error: 'Invalid amount paid',
                expected: expectedAmountNaira,
                paid: transaction.amount
            }, { status: 400 });
        }

        // Update user subscription
        user.plan = plan as 'starter' | 'pro';
        user.subscriptionStatus = 'active';
        user.subscriptionId = transaction.id.toString();
        user.hasUsedTrial = true;
        await user.save();

        return NextResponse.json({
            success: true,
            plan: user.plan,
            status: user.subscriptionStatus,
            amount: usdPrice,
            currency: 'USD'
        });
    } catch (error) {
        console.error('Verify subscription error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to verify subscription' },
            { status: 500 }
        );
    }
}

// Get current subscription status
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id).select(
            'plan subscriptionStatus subscriptionId trialEndsAt hasUsedTrial'
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            plan: user.plan,
            status: user.subscriptionStatus,
            subscriptionId: user.subscriptionId,
            trialEndsAt: user.trialEndsAt,
            hasUsedTrial: user.hasUsedTrial,
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get subscription' },
            { status: 500 }
        );
    }
}
