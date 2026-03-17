import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { createCustomer, getCustomer, initializeSubscription, PLAN_CODES, PLAN_PRICES_USD, getNairaPrice, getExchangeRate } from '@/lib/paystack';

// Initialize subscription checkout
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan } = await request.json();

        if (!plan || !['starter', 'pro'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
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

        // Initialize the subscription
        const planCode = PLAN_CODES[plan as keyof typeof PLAN_CODES];
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // For test mode, we'll use the one-time payment approach
        const reference = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const transaction = await initializeSubscription(
            user.email,
            planCode,
            `${baseUrl}/${user.email.split('@')[0]}/settings?billing=success&reference=${reference}`
        );

        // Store reference temporarily for verification
        user.subscriptionPlanId = plan;
        user.subscriptionId = reference;
        await user.save();

        // Get pricing info for display
        const usdPrice = PLAN_PRICES_USD[plan as keyof typeof PLAN_PRICES_USD];
        const nairaPrice = await getNairaPrice(usdPrice);
        const exchangeRate = await getExchangeRate();

        return NextResponse.json({
            authorizationUrl: transaction.data.authorization_url,
            reference: transaction.data.reference,
            pricing: {
                USD: usdPrice,
                NGN: nairaPrice,
                exchangeRate: exchangeRate,
                display: `$${usdPrice}/month (≈₦${nairaPrice.toLocaleString()})`
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
