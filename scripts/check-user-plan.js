require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const User = require('../models/User').default;
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