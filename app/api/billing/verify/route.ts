import { NextRequest, NextResponse, after } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { verifyTransaction, PLAN_PRICES_USD, getNairaPrice, getSubscription } from '@/lib/paystack';
import { sendSubscriptionActivatedEmail } from '@/lib/email/subscription-notifications';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rate-limit';

// Verify payment and activate subscription
export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ip = getClientIp(request);
    const limit = rateLimit(`verify:${ip}`, 10, 60);
    if (!limit.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const mongoSession = await mongoose.startSession();

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reference } = await request.json();

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

        // Derive plan from server-side state, not client input
        const plan = user.subscriptionPlanId;
        if (!plan || !['starter', 'pro'].includes(plan)) {
            // Idempotent fallback: if the user is already active on a paid plan
            // (the webhook ran first), treat this as success so /billing/success
            // can still confirm the upgrade.
            if (user.subscriptionStatus === 'active' && user.plan !== 'free') {
                await mongoSession.abortTransaction();
                return NextResponse.json({
                    success: true,
                    plan: user.plan,
                    status: user.subscriptionStatus,
                    alreadyActive: true,
                });
            }
            await mongoSession.abortTransaction();
            return NextResponse.json({ error: 'No pending plan upgrade found' }, { status: 400 });
        }

        // Idempotency: if this user is already active on the requested plan,
        // skip re-verifying with Paystack and skip the activation email.
        if (user.subscriptionStatus === 'active' && user.plan === plan) {
            await mongoSession.abortTransaction();
            return NextResponse.json({
                success: true,
                plan: user.plan,
                status: user.subscriptionStatus,
                alreadyActive: true,
            });
        }

        // Verify the transaction
        let transactionId: string;
        let transactionAmount: number | undefined;
        let transactionCurrency: string | undefined;

        // For NGN payments, we use initializeSubscription which creates a transaction (not a subscription)
        // The reference returned starts with 'sub_' but is a transaction reference, NOT a subscription code
        // So we should verify the transaction, not call getSubscription
        if (reference.startsWith('sub_')) {
            // Try to verify as a transaction first (NGN flow)
            try {
                const transaction = await verifyTransaction(reference);
                if (transaction.status !== 'success') {
                    await mongoSession.abortTransaction();
                    return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
                }
                transactionId = transaction.id.toString();
                transactionAmount = transaction.amount;
                transactionCurrency = transaction.currency;
            } catch {
                // If transaction verification fails, it might be an actual subscription code (rare case)
                try {
                    const subscription = await getSubscription(reference);
                    if (subscription.status !== 'active') {
                        await mongoSession.abortTransaction();
                        return NextResponse.json({ error: 'Subscription not active' }, { status: 400 });
                    }
                    transactionId = reference;
                    transactionAmount = undefined;
                } catch {
                    await mongoSession.abortTransaction();
                    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 400 });
                }
            }
        } else {
            // For regular transactions (USD), verify the transaction reference
            const transaction = await verifyTransaction(reference);
            if (transaction.status !== 'success') {
                await mongoSession.abortTransaction();
                return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
            }
            transactionId = transaction.id.toString();
            transactionAmount = transaction.amount;
            transactionCurrency = transaction.currency;
        }

        // For non-subscription transactions, verify amount matches expected price
        if (transactionAmount !== undefined) {
            let expectedAmount: number;
            if (transactionCurrency === 'USD') {
                expectedAmount = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD] * 100; // USD cents
            } else {
                expectedAmount = await getNairaPrice(PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD]) * 100; // NGN kobo
            }
            if (transactionAmount < expectedAmount * 0.95) {
                await mongoSession.abortTransaction();
                return NextResponse.json({
                    error: 'Payment amount does not match the expected price. Please contact support.',
                }, { status: 400 });
            }
        }

        // Update user subscription
        user.plan = plan as 'starter' | 'pro';
        user.subscriptionStatus = 'active';
        user.subscriptionId = transactionId;
        user.hasUsedTrial = true;
        user.lastUpgradeAt = new Date();
        await user.save({ session: mongoSession });

        await mongoSession.commitTransaction();

        // Send upgrade confirmation email after commit.
        // Display the canonical USD price regardless of the underlying charge
        // currency (the Paystack charge is processed in NGN via the plan code,
        // but all user-facing pricing is shown in USD).
        const paidAmount = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD];
        after(() =>
            sendSubscriptionActivatedEmail(user, user.plan, paidAmount, 'USD').catch((error) => {
                console.error('Failed to send subscription activated email:', error);
            })
        );

        return NextResponse.json({
            success: true,
            plan: user.plan,
            status: user.subscriptionStatus,
            amount: PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD],
            currency: 'USD',
        });
    } catch (error) {
        await mongoSession.abortTransaction();
        console.error('Verify subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to verify subscription' },
            { status: 500 }
        );
    } finally {
        mongoSession.endSession();
    }
}

// Get current subscription status
export async function GET() {
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
            { error: 'Failed to get subscription' },
            { status: 500 }
        );
    }
}
