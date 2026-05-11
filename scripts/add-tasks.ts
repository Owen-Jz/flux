import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { User, Workspace, Board, Task } from '../models/index';

async function addTasks() {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not found');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const workspace = await Workspace.findOne({ slug: 'brinova' });
  if (!workspace) {
    console.log('Workspace brinova not found');
    await mongoose.disconnect();
    return;
  }

  const board = await Board.findOne({ workspaceId: workspace._id, slug: 'website' });
  if (!board) {
    console.log('Board website not found');
    await mongoose.disconnect();
    return;
  }

  const tasks = [
    { title: 'Testing Course payments on the platform', status: 'BACKLOG', priority: 'MEDIUM' },
    { title: 'Trusted section logos', status: 'BACKLOG', priority: 'MEDIUM' },
    { title: 'Slack group creation', status: 'BACKLOG', priority: 'MEDIUM' },
  ];

  for (const taskData of tasks) {
    await Task.create({
      ...taskData,
      workspaceId: workspace._id,
      boardId: board._id,
    });
    console.log('Created task:', taskData.title);
  }

  await mongoose.disconnect();
}

addTasks().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});