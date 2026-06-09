import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sendTrialExpiredEmail, sendTrialExpiringEmail } from '@/lib/email/subscription-notifications';
import { isAuthorizedCron } from '@/lib/cron-auth';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();

  // Catch all expired trial users regardless of subscriptionStatus,
  // but only those who don't have an active paid subscription.
  // Batched to 100 per run to prevent memory issues — cron should run frequently.
  const expiredTrials = await User.find({
    trialEndsAt: { $exists: true, $ne: null, $lt: now },
    subscriptionStatus: { $nin: ['active'] },
    plan: { $ne: 'free' },
  }).limit(100);

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const trialWarningDue = await User.find({
    trialEndsAt: { $gte: threeDaysFromNow, $lte: fourDaysFromNow },
    hasUsedTrial: true,
    trialWarningSent: false,
  }).limit(100);

  let warningsSent = 0;
  for (const user of trialWarningDue) {
    try {
      await sendTrialExpiringEmail({ email: user.email, name: user.name }, 3);
      user.trialWarningSent = true;
      await user.save();
      warningsSent++;
    } catch (emailError) {
      console.error(`Failed to send trial warning email to ${user.email}:`, emailError);
      // Don't mark as sent so it retries on next cron run
    }
  }

  let expiredCount = 0;
  for (const user of expiredTrials) {
    // Downgrade first — access must be revoked regardless of email delivery
    user.plan = 'free';
    user.subscriptionStatus = 'inactive';
    await user.save();
    expiredCount++;

    try {
      await sendTrialExpiredEmail({ email: user.email, name: user.name });
    } catch (emailError) {
      console.error(`Failed to send trial expired email to ${user.email}:`, emailError);
    }
  }

  return NextResponse.json({
    expired: expiredCount,
    warningsSent,
    warningsPending: trialWarningDue.length - warningsSent,
  });
}
