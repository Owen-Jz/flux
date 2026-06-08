// One-off: archive all non-archived tasks on a given board in a given workspace.
// Usage:
//   node scripts/archive-board-tasks.js            (dry run — reports only)
//   node scripts/archive-board-tasks.js --apply    (performs the archive)
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const WORKSPACE_NAME = 'Closet Full of Coco';
const BOARD_NAME = 'General Tasks';
const APPLY = process.argv.includes('--apply');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', new mongoose.Schema({ name: String, slug: String }, { strict: false }));
  const Board = mongoose.models.Board || mongoose.model('Board', new mongoose.Schema({ name: String, slug: String, workspaceId: mongoose.Schema.Types.ObjectId }, { strict: false }));
  const Task = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({ title: String, status: String, boardId: mongoose.Schema.Types.ObjectId, workspaceId: mongoose.Schema.Types.ObjectId }, { strict: false }));

  // Resolve workspace (case-insensitive exact match)
  const workspaces = await Workspace.find({ name: new RegExp('^' + WORKSPACE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
  if (workspaces.length === 0) {
    console.error(`✗ No workspace named "${WORKSPACE_NAME}" found.`);
    const all = await Workspace.find({}).select('name slug').lean();
    console.error('  Available workspaces:', all.map((w) => `${w.name} (${w.slug})`).join(', ') || '(none)');
    await mongoose.disconnect();
    process.exit(1);
  }
  if (workspaces.length > 1) {
    console.error(`✗ Multiple workspaces named "${WORKSPACE_NAME}":`, workspaces.map((w) => w.slug).join(', '));
    await mongoose.disconnect();
    process.exit(1);
  }
  const workspace = workspaces[0];
  console.log(`Workspace: ${workspace.name} (slug=${workspace.slug}, _id=${workspace._id})`);

  // Resolve board within workspace
  const boards = await Board.find({ workspaceId: workspace._id, name: new RegExp('^' + BOARD_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
  if (boards.length === 0) {
    console.error(`✗ No board named "${BOARD_NAME}" in workspace "${workspace.name}".`);
    const all = await Board.find({ workspaceId: workspace._id }).select('name slug').lean();
    console.error('  Available boards:', all.map((b) => `${b.name} (${b.slug})`).join(', ') || '(none)');
    await mongoose.disconnect();
    process.exit(1);
  }
  if (boards.length > 1) {
    console.error(`✗ Multiple boards named "${BOARD_NAME}":`, boards.map((b) => b.slug).join(', '));
    await mongoose.disconnect();
    process.exit(1);
  }
  const board = boards[0];
  console.log(`Board: ${board.name} (slug=${board.slug}, _id=${board._id})`);

  // Find tasks to archive (everything not already archived)
  const filter = { workspaceId: workspace._id, boardId: board._id, status: { $ne: 'ARCHIVED' } };
  const tasks = await Task.find(filter).select('title status').lean();

  const byStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  console.log(`\nTasks to archive: ${tasks.length}`);
  console.log('  By status:', JSON.stringify(byStatus));
  tasks.forEach((t) => console.log(`  - [${t.status}] ${t.title}`));

  const alreadyArchived = await Task.countDocuments({ workspaceId: workspace._id, boardId: board._id, status: 'ARCHIVED' });
  console.log(`\n(Already archived on this board, untouched: ${alreadyArchived})`);

  if (tasks.length === 0) {
    console.log('\nNothing to do.');
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log('\n--- DRY RUN --- no changes made. Re-run with --apply to archive.');
    await mongoose.disconnect();
    return;
  }

  const result = await Task.updateMany(filter, { $set: { status: 'ARCHIVED' } });
  console.log(`\n✓ Archived ${result.modifiedCount} task(s).`);

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
