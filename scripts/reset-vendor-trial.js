const { connectDB } = require('./lib/db');
const { User } = require('./models/User');

async function resetVendor() {
    await connectDB();

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
        plan: user.plan,
        hasUsedTrial: user.hasUsedTrial,
        trialEndsAt: user.trialEndsAt
    });

    process.exit(0);
}

resetVendor().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});