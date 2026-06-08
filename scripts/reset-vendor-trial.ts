import mongoose from 'mongoose';
import { User } from '../models/User';

async function resetVendor() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const result = await User.updateOne(
    { email: 'sabiva6484@ellbit.com' },
    {
      $set: {
        plan: 'free',
        trialEndsAt: null,
        hasUsedTrial: false,
        trialPromptDismissedAt: null,
        trialWarningSent: false
      }
    }
  );

  console.log('Modified:', result.modifiedCount);

  // Verify the update
  const user = await User.findOne({ email: 'sabiva6484@ellbit.com' }).lean();
  console.log('User after update:', {
    plan: user?.plan,
    hasUsedTrial: user?.hasUsedTrial,
    trialEndsAt: user?.trialEndsAt
  });

  await mongoose.disconnect();
  process.exit(0);
}

resetVendor().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});