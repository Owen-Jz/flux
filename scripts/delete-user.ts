import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';

async function deleteUser(email: string) {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.log(`User not found: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const userId = user._id;
  console.log(`Found user:`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  ID:    ${userId}`);

  // Remove workspace memberships
  const db = mongoose.connection.db!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberResult = await (db.collection('workspaces') as any).updateMany(
    { 'members.userId': userId },
    { $pull: { members: { userId } } }
  );
  console.log(`\nRemoved from ${memberResult.modifiedCount} workspace(s)`);

  // Delete the user document
  await User.deleteOne({ _id: userId });
  console.log(`Deleted user: ${email}`);

  await mongoose.disconnect();
  process.exit(0);
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/delete-user.ts <email>');
  process.exit(1);
}

deleteUser(email).catch(e => {
  console.error(e);
  process.exit(1);
});
