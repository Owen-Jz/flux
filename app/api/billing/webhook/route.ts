import { NextRequest, NextResponse, after } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { ProcessedWebhook } from '@/models/ProcessedWebhook';
import { FailedWebhook } from '@/models/FailedWebhook';
import { verifyWebhookSignature, planFromPaystackCode } from '@/lib/paystack';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import {
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionPastDueEmail,
  sendSubscriptionDisabledEmail,
} from '@/lib/email/subscription-notifications';

// Paystack webhook handler
export async function POST(request: NextRequest) {
    // Rate limit: 60 requests per minute per IP
    const ip = getClientIp(request);
    const limit = rateLimit(`webhook:${ip}`, 60, 60);
    if (!limit.success) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

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

        const eventId = `${event.event}:${event.data?.id}`;
        if (eventId) {
            try {
                const result = await ProcessedWebhook.findOneAndUpdate(
                    { eventId },
                    { $setOnInsert: { eventId, processedAt: new Date() } },
                    { upsert: true, new: false }
                );
                // If result is non-null, the doc already existed before this request
                if (result) {
                    return NextResponse.json({ received: true, duplicate: true });
                }
            } catch (err: unknown) {
                // Duplicate key error (code 11000) means a concurrent request won the race —
                // this request is the duplicate.
                const mongoErr = err as { code?: number };
                if (mongoErr.code === 11000) {
                    return NextResponse.json({ received: true, duplicate: true });
                }
                throw err;
            }
        }

        switch (event.event) {
            case 'subscription.created': {
                const subData = event.data;
                const customer = subData.customer;
                const customerCode = typeof customer === 'string' ? customer : customer.customer_code;
                const user = await User.findOne({ paystackCustomerCode: customerCode });

                if (user) {
                    const wasInactive = user.subscriptionStatus !== 'active';
                    user.subscriptionId = subData.subscription_code;
                    user.subscriptionStatus = 'active';

                    // Use plan code mapping instead of fragile regex
                    const planObj = subData.plan;
                    const planCode = typeof planObj === 'object' ? planObj?.plan_code : planObj;
                    if (planCode) {
                        const resolvedPlan = planFromPaystackCode(planCode);
                        if (resolvedPlan) {
                            user.plan = resolvedPlan;
                        }
                    }

                    // Mark the upgrade timestamp so the dashboard fallback welcome
                    // modal fires if the user never lands on /billing/success.
                    if (wasInactive) {
                        user.lastUpgradeAt = new Date();
                    }

                    await user.save();
                    after(() =>
                        sendSubscriptionActivatedEmail(user, user.plan || 'Pro').catch((error) => {
                            console.error('Failed to send subscription activated email:', error);
                        })
                    );
                }
                break;
            }

            case 'subscription.not_renewed': {
                const subData = event.data;
                const user = await User.findOne({ subscriptionId: subData.subscription_code });

                if (user) {
                    user.subscriptionStatus = 'cancelled';
                    await user.save();
                    after(() =>
                        sendSubscriptionCancelledEmail(user, subData.cancellation_reason).catch((error) => {
                            console.error('Failed to send subscription cancelled email:', error);
                        })
                    );
                }
                break;
            }

            case 'subscription.disabled': {
                const subData = event.data;
                const user = await User.findOne({ subscriptionId: subData.subscription_code });

                if (user) {
                    user.subscriptionStatus = 'inactive';
                    user.plan = 'free';
                    await user.save();
                    after(() =>
                        sendSubscriptionDisabledEmail(user).catch((error) => {
                            console.error('Failed to send subscription disabled email:', error);
                        })
                    );
                }
                break;
            }

            case 'charge.success': {
                const { customer, reference } = event.data;
                const customerCode = typeof customer === 'string' ? customer : customer.customer_code;
                const user = await User.findOne({ paystackCustomerCode: customerCode });

                if (user) {
                    const wasInactive = user.subscriptionStatus !== 'active';

                    // Update subscription status
                    user.subscriptionStatus = 'active';
                    if (!user.subscriptionId) {
                        user.subscriptionId = reference;
                    }

                    // Update plan from subscriptionPlanId if set (set during payment initialization)
                    if (user.subscriptionPlanId) {
                        user.plan = user.subscriptionPlanId as 'starter' | 'pro' | 'enterprise';
                    }

                    if (wasInactive) {
                        // Mark the upgrade timestamp so the dashboard fallback welcome
                        // modal fires if the user never lands on /billing/success.
                        user.lastUpgradeAt = new Date();
                        after(() =>
                            sendSubscriptionActivatedEmail(user, user.plan || 'Pro').catch((error) => {
                                console.error('Failed to send subscription activated email:', error);
                            })
                        );
                    }
                    await user.save();
                }
                break;
            }

            case 'invoice.payment_failed': {
                const { customer } = event.data;
                const customerCode = typeof customer === 'string' ? customer : customer.customer_code;
                const user = await User.findOne({ paystackCustomerCode: customerCode });

                if (user) {
                    user.subscriptionStatus = 'past_due';
                    await user.save();
                    after(() =>
                        sendSubscriptionPastDueEmail(user).catch((error) => {
                            console.error('Failed to send subscription past due email:', error);
                        })
                    );
                }
                break;
            }

            case 'subscription.price_changed': {
                const { subscription, price } = event.data;
                const user = await User.findOne({ subscriptionId: subscription.subscription_code });

                if (user) {
                    const oldPrice = user.subscriptionPlanId;
                    if (price?.plan) {
                        user.subscriptionPlanId = price.plan;
                    }
                    await user.save();

                    console.log(`Price changed for subscription ${subscription.subscription_code}: ${oldPrice} -> ${price?.plan}`);

                    await AuditLog.create({
                        adminId: new mongoose.Types.ObjectId('000000000000000000000000'),
                        action: 'PRICE_CHANGE',
                        targetType: 'user',
                        targetId: user._id,
                        details: {
                            subscriptionCode: subscription.subscription_code,
                            oldPrice: oldPrice,
                            newPrice: price?.plan,
                            amount: price?.amount,
                        },
                    });
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
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
