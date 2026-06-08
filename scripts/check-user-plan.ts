import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';

async function checkUser() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const user = await User.findOne({ email: 'sabiva6484@ellbit.com' }).lean();

  if (user) {
    console.log('User found: sabiva6484@ellbit.com');
    console.log('  Plan:', user.plan);
    console.log('  Subscription Status:', user.subscriptionStatus);
    console.log('  Subscription ID:', user.subscriptionId);
    console.log('  Has Used Trial:', user.hasUsedTrial);
    console.log('  Trial Ends At:', user.trialEndsAt);
    console.log('  Paystack Customer Code:', user.paystackCustomerCode);
    console.log('  subscriptionPlanId:', user.subscriptionPlanId);
  } else {
    console.log('User not found');
  }

  await mongoose.disconnect();
  process.exit(0);
}

checkUser().catch(e => {
  console.error(e);
  process.exit(1);
});