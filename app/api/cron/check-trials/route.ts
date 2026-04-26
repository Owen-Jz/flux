import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { sendTrialExpiredEmail, sendTrialExpiringEmail } from '@/lib/email/subscription-notifications';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const now = new Date();

  const expiredTrials = await User.find({
    trialEndsAt: { $exists: true, $ne: null, $lt: now },
    subscriptionStatus: 'inactive',
    plan: { $ne: 'free' },
  });

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const trialWarningDue = await User.find({
    trialEndsAt: { $gte: threeDaysFromNow, $lte: fourDaysFromNow },
    hasUsedTrial: true,
    trialWarningSent: false,
  });

  for (const user of trialWarningDue) {
    user.trialWarningSent = true;
    await user.save();
    sendTrialExpiringEmail({ email: user.email, name: user.name }, 3);
  }

  for (const user of expiredTrials) {
    user.plan = 'free';
    user.subscriptionStatus = 'inactive';
    await user.save();

    sendTrialExpiredEmail({ email: user.email, name: user.name });
  }

  await mongoose.disconnect();

  return NextResponse.json({ expired: expiredTrials.length });
}
