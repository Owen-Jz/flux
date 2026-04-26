import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { createCustomer, getCustomer, initializeSubscription, initializeTransaction, PLAN_CODES, PLAN_PRICES_KOBO, PLAN_PRICES_USD, getNairaPrice, getExchangeRate } from '@/lib/paystack';

// Initialize subscription checkout
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan, currency = 'NGN' } = await request.json();

        if (!plan || !['starter', 'pro'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        if (!['NGN', 'USD'].includes(currency)) {
            return NextResponse.json({ error: 'Invalid currency. Must be NGN or USD' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user is already on this plan
        if (user.plan === plan && user.subscriptionStatus === 'active') {
            return NextResponse.json({ error: 'Already subscribed to this plan' }, { status: 400 });
        }

        // Get or create Paystack customer
        let customerCode = user.paystackCustomerCode;

        if (!customerCode) {
            const existingCustomer = await getCustomer(user.email);
            if (existingCustomer) {
                customerCode = existingCustomer.customer_code;
            } else {
                customerCode = await createCustomer({
                    email: user.email,
                    first_name: user.name.split(' ')[0],
                    last_name: user.name.split(' ').slice(1).join(' '),
                });
            }

            user.paystackCustomerCode = customerCode;
            await user.save();
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const callbackUrl = `${baseUrl}/settings?billing=success&plan=${plan}&currency=${currency}`;

        let transaction;

        if (currency === 'USD') {
            // For USD, use initializeTransaction with amount in USD cents
            const usdPrice = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD];

            transaction = await initializeTransaction(
                user.email,
                usdPrice,
                'USD',
                undefined,
                callbackUrl
            );
        } else {
            // For NGN, use the subscription-based flow
            const planCode = PLAN_CODES[plan as keyof typeof PLAN_CODES];
            const amountKobo = PLAN_PRICES_KOBO[plan as keyof typeof PLAN_PRICES_KOBO];

            transaction = await initializeSubscription(
                user.email,
                planCode,
                amountKobo,
                callbackUrl
            );
        }

        // Store Paystack's reference for verification
        user.subscriptionPlanId = plan;
        user.subscriptionId = transaction.data.reference;
        await user.save();

        // Get pricing info for display
        const usdPrice = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD];
        const nairaPrice = await getNairaPrice(usdPrice);
        const exchangeRate = await getExchangeRate();

        return NextResponse.json({
            authorizationUrl: transaction.data.authorization_url,
            reference: transaction.data.reference,
            currency: currency,
            pricing: {
                USD: usdPrice,
                NGN: nairaPrice,
                exchangeRate: exchangeRate,
                display: currency === 'USD'
                    ? `$${usdPrice}/month`
                    : `₦${nairaPrice.toLocaleString()}/month (≈$${usdPrice})`
            }
        });
    } catch (error) {
        console.error('Initialize subscription error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to initialize subscription' },
            { status: 500 }
        );
    }
}
