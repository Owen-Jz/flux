import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { ProcessedWebhook } from '@/models/ProcessedWebhook';
import { FailedWebhook } from '@/models/FailedWebhook';
import { verifyWebhookSignature } from '@/lib/paystack';

// Paystack webhook handler
export async function POST(request: NextRequest) {
    let eventData: Record<string, unknown> | null = null;

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
        eventData = event;

        await connectDB();

        // Check for webhook idempotency - prevent replay attacks
        const eventId = event.data?.id;
        if (eventId) {
            const existingEvent = await ProcessedWebhook.findOne({ eventId });
            if (existingEvent) {
                // Event already processed, return success to Paystack
                return NextResponse.json({ received: true, duplicate: true });
            }
            // Mark event as processed
            await ProcessedWebhook.create({ eventId });
        }

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

        // Store failed webhook in dead letter queue
        if (eventData) {
            try {
                await FailedWebhook.create({
                    eventType: eventData.event as string || 'unknown',
                    payload: eventData,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            } catch (dlqError) {
                console.error('Failed to store webhook in dead letter queue:', dlqError);
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
