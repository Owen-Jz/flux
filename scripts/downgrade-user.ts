import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';

async function downgradeUser(email: string) {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const user = await User.findOne({ email });

  if (!user) {
    console.log(`User not found: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Before downgrade:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);
  console.log(`  subscriptionId: ${user.subscriptionId}`);
  console.log(`  subscriptionPlanId: ${user.subscriptionPlanId}`);
  console.log(`  paystackCustomerCode: ${user.paystackCustomerCode}`);

  // Clear all Paystack-related fields
  user.plan = 'free';
  user.subscriptionStatus = 'inactive';
  user.subscriptionId = undefined;
  user.subscriptionPlanId = undefined;
  user.paystackCustomerCode = undefined;
  user.hasUsedTrial = false;
  await user.save();

  console.log(`\nAfter downgrade:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);
  console.log(`  subscriptionId: ${user.subscriptionId}`);
  console.log(`  subscriptionPlanId: ${user.subscriptionPlanId}`);
  console.log(`  paystackCustomerCode: ${user.paystackCustomerCode}`);

  await mongoose.disconnect();
  console.log(`\nUser ${email} has been downgraded to free plan and Paystack data cleared!`);
  process.exit(0);
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/downgrade-user.ts <email>');
  console.log('Example: npx tsx scripts/downgrade-user.ts sabiva6484@ellbit.com');
  process.exit(1);
}

downgradeUser(email).catch(e => {
  console.error(e);
  process.exit(1);
});