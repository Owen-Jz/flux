import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import { createCustomer, getCustomer, initializeSubscription, PLAN_CODES, PLAN_PRICES_KOBO, PLAN_PRICES_USD, getNairaPrice, getExchangeRate } from '@/lib/paystack';
import { getAppUrl } from '@/lib/port';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rate-limit';

// Initialize subscription checkout
export async function POST(request: NextRequest) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const ip = getClientIp(request);
        const limit = rateLimit(`billing-init:${ip}`, 10, 60);
        if (!limit.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

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

        // Use NEXTAUTH_URL for callbacks — it's a browser redirect, so localhost works
        // and avoids ngrok's free-tier interstitial page in development.
        // In production, NEXTAUTH_URL is the real domain (fluxboard.site).
        // Route to the dedicated /billing/success page (decoupled from any workspace slug)
        // so the post-payment onboarding always renders regardless of where the upgrade
        // was initiated from.
        const callbackBase = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || getAppUrl();
        const callbackUrl = `${callbackBase}/billing/success?plan=${plan}&currency=${currency}`;

        // Always use NGN subscription flow — Paystack handles international cards
        // in NGN and the cardholder's bank does FX conversion automatically.
        // This also gives all users recurring billing (USD one-time was a gap).
        const planCode = PLAN_CODES[plan as keyof typeof PLAN_CODES];
        const amountKobo = PLAN_PRICES_KOBO[plan as keyof typeof PLAN_PRICES_KOBO];

        const transaction = await initializeSubscription(
            user.email,
            planCode,
            amountKobo,
            callbackUrl
        );

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
            // Display currency is always USD. The underlying Paystack charge is
            // processed in NGN via the dashboard-configured plan code (amountKobo).
            currency: 'USD',
            pricing: {
                USD: usdPrice,
                NGN: nairaPrice,
                exchangeRate: exchangeRate,
                display: `$${usdPrice}/month`,
            }
        });
    } catch (error) {
        console.error('Initialize subscription error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again later.' },
            { status: 500 }
        );
    }
}
