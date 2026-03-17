import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyWebhookSignature } from '@/lib/paystack';

// Paystack webhook handler
export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook signature
        if (!verifyWebhookSignature(payload, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(payload);

        await connectDB();

        switch (event.event) {
            case 'subscription.created': {
                const { customer, subscription } = event.data;
                const user = await User.findOne({ paystackCustomerCode: customer });

                if (user) {
                    user.subscriptionId = subscription.subscription_code;
                    user.subscriptionStatus = 'active';
                    await user.save();
                }
                break;
            }

            case 'subscription.not_renewed': {
                const { subscription } = event.data;
                const user = await User.findOne({ subscriptionId: subscription.subscription_code });

                if (user) {
                    user.subscriptionStatus = 'cancelled';
                    await user.save();
                }
                break;
            }

            case 'subscription.disabled': {
                const { subscription } = event.data;
                const user = await User.findOne({ subscriptionId: subscription.subscription_code });

                if (user) {
                    user.subscriptionStatus = 'inactive';
                    user.plan = 'free';
                    await user.save();
                }
                break;
            }

            case 'charge.success': {
                const { customer, amount, reference } = event.data;
                const user = await User.findOne({ paystackCustomerCode: customer });

                if (user) {
                    // Payment successful - ensure subscription is active
                    if (user.subscriptionStatus !== 'active') {
                        user.subscriptionStatus = 'active';
                    }
                    user.subscriptionId = reference;
                    await user.save();
                }
                break;
            }

            case 'invoice.payment_failed': {
                const { customer } = event.data;
                const user = await User.findOne({ paystackCustomerCode: customer });

                if (user) {
                    user.subscriptionStatus = 'past_due';
                    await user.save();
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${event.event}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
