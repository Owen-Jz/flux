import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { User, Workspace } from '../models/index';
import { nanoid } from 'nanoid';

async function createWorkspace() {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not found in .env.local');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: 'owendigitals@gmail.com' });
  if (!user) {
    console.log('User not found');
    const users = await User.find({}).select('email name').limit(10);
    users.forEach(u => console.log('-', u.email, '-', u.name));
    await mongoose.disconnect();
    return;
  }
  console.log('Found user:', user.email, user._id);

  const existing = await Workspace.findOne({ slug: 'brinova' });
  if (existing) {
    console.log('Workspace brinova already exists with ID:', existing._id);
    await mongoose.disconnect();
    return;
  }

  const workspace = await Workspace.create({
    name: 'Brinova',
    slug: 'brinova',
    ownerId: user._id,
    inviteCode: nanoid(10),
    settings: { publicAccess: false },
    members: [{
      userId: user._id,
      role: 'ADMIN',
      joinedAt: new Date()
    }]
  });

  console.log('Created workspace:', workspace.name, 'slug:', workspace.slug);
  await mongoose.disconnect();
}

createWorkspace().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});