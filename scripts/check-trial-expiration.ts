import mongoose from 'mongoose';
import { User } from '../models/User';
import { sendTrialExpiredEmail } from '../lib/email/subscription-notifications';

async function checkTrialExpiration() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const now = new Date();

  const expiredTrials = await User.find({
    trialEndsAt: { $exists: true, $ne: null, $lt: now },
    subscriptionStatus: 'inactive',
    plan: { $ne: 'free' },
  });

  console.log(`Found ${expiredTrials.length} trial(s) to expire`);

  for (const user of expiredTrials) {
    user.plan = 'free';
    user.subscriptionStatus = 'inactive';
    await user.save();

    sendTrialExpiredEmail({ email: user.email, name: user.name });
  }

  console.log(`Expired ${expiredTrials.length} trial(s)`);
  console.log('Note: The signup route must reset trialWarningSent = false when assigning a new trial');

  await mongoose.disconnect();
}

checkTrialExpiration().catch((error) => {
  console.error('Trial expiration check failed:', error);
  process.exit(1);
});
