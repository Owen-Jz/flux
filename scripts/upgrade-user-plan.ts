import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';

async function upgradeUser(email: string, plan: 'starter' | 'pro' | 'enterprise') {
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

  console.log(`Before upgrade:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);
  console.log(`  subscriptionId: ${user.subscriptionId}`);
  console.log(`  subscriptionPlanId: ${user.subscriptionPlanId}`);

  // Update the user's plan
  user.plan = plan;
  user.subscriptionStatus = 'active';
  user.hasUsedTrial = true;
  await user.save();

  console.log(`\nAfter upgrade:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);

  await mongoose.disconnect();
  console.log(`\nUser ${email} upgraded to ${plan} plan successfully!`);
  process.exit(0);
}

// Get email and plan from command line
const email = process.argv[2];
const plan = process.argv[3] as 'starter' | 'pro' | 'enterprise';

if (!email || !plan) {
  console.log('Usage: npx tsx scripts/upgrade-user-plan.ts <email> <plan>');
  console.log('Example: npx tsx scripts/upgrade-user-plan.ts sabiva6484@ellbit.com starter');
  process.exit(1);
}

if (!['starter', 'pro', 'enterprise'].includes(plan)) {
  console.log('Plan must be: starter, pro, or enterprise');
  process.exit(1);
}

upgradeUser(email, plan).catch(e => {
  console.error(e);
  process.exit(1);
});