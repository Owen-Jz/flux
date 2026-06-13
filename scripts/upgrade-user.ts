import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User, PlanType } from '../models/User';

async function upgradeUser(email: string, plan: PlanType) {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const user = await User.findOne({ email });

  if (!user) {
    console.log(`User not found: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Before upgrade:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);
  console.log(`  trialEndsAt: ${user.trialEndsAt}`);
  console.log(`  pastDueSince: ${user.pastDueSince}`);

  // Comped upgrade: mark active and clear trial/dunning fields so the
  // check-trials and check-past-due crons never downgrade this account.
  user.plan = plan;
  user.subscriptionStatus = 'active';
  user.trialEndsAt = undefined;
  user.pastDueSince = undefined;
  user.pastDueReminderSent = false;
  user.lastUpgradeAt = new Date();
  await user.save();

  console.log(`\nAfter upgrade:`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  subscriptionStatus: ${user.subscriptionStatus}`);
  console.log(`  trialEndsAt: ${user.trialEndsAt}`);
  console.log(`  pastDueSince: ${user.pastDueSince}`);

  await mongoose.disconnect();
  console.log(`\nUser ${email} has been upgraded to the ${plan} plan (comped, no Paystack subscription).`);
  process.exit(0);
}

const email = process.argv[2];
const plan = (process.argv[3] || 'enterprise') as PlanType;

if (!email || !['free', 'starter', 'pro', 'enterprise'].includes(plan)) {
  console.log('Usage: npx tsx scripts/upgrade-user.ts <email> [plan]');
  console.log('Example: npx tsx scripts/upgrade-user.ts owner@example.com enterprise');
  process.exit(1);
}

upgradeUser(email, plan).catch(e => {
  console.error(e);
  process.exit(1);
});
