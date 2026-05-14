/**
 * Script to mark all existing users as having completed onboarding
 * Run with: npx tsx scripts/mark-existing-users-onboarded.ts
 */
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://new_owen_user:oyt09oiswTLH6XEt@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority';

async function markExistingUsersOnboarded() {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);

    console.log('Updating all users to mark hasCompletedOnboarding = true...');
    const result = await mongoose.connection.db.collection('users').updateMany(
        { hasCompletedOnboarding: { $ne: true } },
        { $set: { hasCompletedOnboarding: true } }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log(`Matched ${result.matchedCount} users total`);

    // Verify the update
    const usersWithOnboarding = await mongoose.connection.db.collection('users').countDocuments({ hasCompletedOnboarding: true });
    const usersWithoutOnboarding = await mongoose.connection.db.collection('users').countDocuments({ hasCompletedOnboarding: { $ne: true } });

    console.log(`\nVerification:`);
    console.log(`  Users with hasCompletedOnboarding = true: ${usersWithOnboarding}`);
    console.log(`  Users with hasCompletedOnboarding != true: ${usersWithoutOnboarding}`);

    await mongoose.disconnect();
    process.exit(0);
}

markExistingUsersOnboarded().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});