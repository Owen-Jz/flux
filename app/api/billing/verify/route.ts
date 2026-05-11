import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { verifyTransaction, PLAN_PRICES_USD, getNairaPrice, getSubscription } from '@/lib/paystack';

// Verify payment and activate subscription
export async function POST(request: NextRequest) {
    const mongoSession = await mongoose.startSession();

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

        mongoSession.startTransaction();

        const user = await User.findById(session.user.id).session(mongoSession);
        if (!user) {
            await mongoSession.abortTransaction();
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify the transaction
        let transactionStatus: string;
        let transactionId: string;
        let transactionAmount: number | undefined;

        if (reference.startsWith('sub_')) {
            // For subscription payments (NGN), Paystack ignores the reference param
            // We need to use getSubscription with the subscription code
            try {
                const subscription = await getSubscription(reference);
                transactionStatus = subscription.status === 'active' ? 'success' : subscription.status;
                transactionId = reference;
                transactionAmount = undefined; // Subscriptions don't return amount in same way
            } catch (error) {
                await mongoSession.abortTransaction();
                return NextResponse.json({ error: 'Failed to verify subscription' }, { status: 400 });
            }
        } else {
            // For regular transactions (USD), verify the transaction reference
            const transaction = await verifyTransaction(reference);
            if (transaction.status !== 'success') {
                await mongoSession.abortTransaction();
                return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
            }
            transactionStatus = transaction.status;
            transactionId = transaction.id.toString();
            transactionAmount = transaction.amount;
        }

        // Get expected amount in Naira based on USD price
        const usdPrice = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD];
        if (!usdPrice) {
            await mongoSession.abortTransaction();
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // For non-subscription transactions, verify amount matches
        if (transactionAmount !== undefined) {
            const expectedAmountNaira = await getNairaPrice(usdPrice) * 100; // Convert to kobo
            if (transactionAmount < expectedAmountNaira * 0.95) {
                await mongoSession.abortTransaction();
                return NextResponse.json({
                    error: 'Invalid amount paid',
                    expected: expectedAmountNaira,
                    paid: transactionAmount
                }, { status: 400 });
            }
        }

        // Update user subscription
        user.plan = plan as 'starter' | 'pro';
        user.subscriptionStatus = 'active';
        user.subscriptionId = transactionId;
        user.hasUsedTrial = true;
        await user.save({ session: mongoSession });

        await mongoSession.commitTransaction();

        return NextResponse.json({
            success: true,
            plan: user.plan,
            status: user.subscriptionStatus,
            amount: usdPrice,
            currency: 'USD'
        });
    } catch (error) {
        await mongoSession.abortTransaction();
        console.error('Verify subscription error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to verify subscription' },
            { status: 500 }
        );
    } finally {
        mongoSession.endSession();
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
