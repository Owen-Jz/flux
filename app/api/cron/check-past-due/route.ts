import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import {
    sendSubscriptionPastDueEmail,
    sendSubscriptionDisabledEmail,
} from '@/lib/email/subscription-notifications';

// Dunning windows (env-tunable). Paystack retries the card itself; this cron
// adds an app-side grace period so a past_due subscription can't linger forever.
const REMINDER_DAYS = Number(process.env.PAST_DUE_REMINDER_DAYS) || 3;
const GRACE_DAYS = Number(process.env.PAST_DUE_GRACE_DAYS) || 7;

/**
 * GET /api/cron/check-past-due
 *
 * 1. Sends a reminder to users who have been past_due for >= REMINDER_DAYS
 *    (once per dunning cycle).
 * 2. Downgrades users past_due for >= GRACE_DAYS to the free plan.
 */
export async function GET(request: NextRequest) {
    const secret = request.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = Date.now();
    const reminderCutoff = new Date(now - REMINDER_DAYS * 24 * 60 * 60 * 1000);
    const graceCutoff = new Date(now - GRACE_DAYS * 24 * 60 * 60 * 1000);

    // 1. Downgrade everyone past the grace period. Revoke access first; email is best-effort.
    const toDowngrade = await User.find({
        subscriptionStatus: 'past_due',
        pastDueSince: { $exists: true, $ne: null, $lt: graceCutoff },
    }).limit(100);

    let downgraded = 0;
    for (const user of toDowngrade) {
        user.plan = 'free';
        user.subscriptionStatus = 'inactive';
        user.pastDueSince = undefined;
        user.pastDueReminderSent = false;
        await user.save();
        downgraded++;

        try {
            await sendSubscriptionDisabledEmail(user);
        } catch (emailError) {
            console.error(`Failed to send downgrade email to ${user.email}:`, emailError);
        }
    }

    // 2. Send a one-time reminder to those in the grace window who haven't had one.
    const toRemind = await User.find({
        subscriptionStatus: 'past_due',
        pastDueReminderSent: { $ne: true },
        pastDueSince: { $exists: true, $ne: null, $lte: reminderCutoff, $gte: graceCutoff },
    }).limit(100);

    let remindersSent = 0;
    for (const user of toRemind) {
        try {
            await sendSubscriptionPastDueEmail(user);
            user.pastDueReminderSent = true;
            await user.save();
            remindersSent++;
        } catch (emailError) {
            console.error(`Failed to send past-due reminder to ${user.email}:`, emailError);
            // Leave the flag unset so it retries next run.
        }
    }

    return NextResponse.json({ downgraded, remindersSent });
}
