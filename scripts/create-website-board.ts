import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { User, Workspace, Board } from '../models/index';

async function createBoard() {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not found');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: 'owendigitals@gmail.com' });
  if (!user) {
    console.log('User not found');
    await mongoose.disconnect();
    return;
  }
  console.log('Found user:', user.email);

  const workspace = await Workspace.findOne({ slug: 'brinova' });
  if (!workspace) {
    console.log('Workspace brinova not found');
    await mongoose.disconnect();
    return;
  }
  console.log('Found workspace:', workspace.name);

  // Check if board already exists
  const existing = await Board.findOne({ workspaceId: workspace._id, slug: 'website' });
  if (existing) {
    console.log('Board "website" already exists');
    await mongoose.disconnect();
    return;
  }

  const board = await Board.create({
    name: 'Website',
    slug: 'website',
    workspaceId: workspace._id,
    color: '#6366f1',
  });

  console.log('Created board:', board.name, 'slug:', board.slug);
  await mongoose.disconnect();
}

createBoard().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});