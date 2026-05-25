import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';
import { disableSubscription, createCustomer, getCustomer } from '../lib/paystack';

async function deactivatePaystackSubscription(email: string) {
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

  console.log(`Current user state:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);
  console.log(`  subscriptionId: ${user.subscriptionId}`);
  console.log(`  subscriptionPlanId: ${user.subscriptionPlanId}`);
  console.log(`  paystackCustomerCode: ${user.paystackCustomerCode}`);

  // Deactivate on Paystack if subscription exists
  if (user.subscriptionId) {
    console.log(`\nDeactivating subscription on Paystack: ${user.subscriptionId}`);
    try {
      const result = await disableSubscription(user.subscriptionId);
      if (result) {
        console.log(`  ✓ Subscription deactivated on Paystack`);
      } else {
        console.log(`  ✗ Failed to deactivate subscription on Paystack`);
      }
    } catch (error) {
      console.error(`  ✗ Error deactivating subscription:`, error);
    }
  } else {
    console.log(`\nNo subscription ID to deactivate on Paystack`);
  }

  // Clear all Paystack-related fields in database
  user.plan = 'free';
  user.subscriptionStatus = 'inactive';
  user.subscriptionId = undefined;
  user.subscriptionPlanId = undefined;
  user.paystackCustomerCode = undefined;
  user.hasUsedTrial = false;
  await user.save();

  console.log(`\nDatabase updated:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);

  await mongoose.disconnect();
  console.log(`\nDone! User ${email} has been fully deactivated.`);
  process.exit(0);
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/paystack-deactivate.ts <email>');
  console.log('Example: npx tsx scripts/paystack-deactivate.ts sabiva6484@ellbit.com');
  process.exit(1);
}

deactivatePaystackSubscription(email).catch(e => {
  console.error(e);
  process.exit(1);
});