// One-off: seed the restructuring tasks onto the "General Tasks" board
// in the "Closet Full of Coco" workspace.
// Usage:
//   node scripts/seed-restructure-tasks.js            (dry run — reports only)
//   node scripts/seed-restructure-tasks.js --apply    (creates the tasks)
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const WORKSPACE_NAME = 'Closet Full of Coco';
const BOARD_NAME = 'General Tasks';
const APPLY = process.argv.includes('--apply');

// Task definitions, grouped per status. Order is assigned within each column.
const TASKS = [
  // --- IN_PROGRESS ---
  {
    title: 'Domain verification and fix',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
  },
  {
    title: 'Setting up email account creation',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
  },
  // --- BACKLOG ---
  {
    title: 'Find a good image editor',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    subtasks: ['Get 10 image samples to give to the image editor'],
  },
  {
    title: 'Start posting for jobs',
    status: 'BACKLOG',
    priority: 'MEDIUM',
  },
  {
    title: 'AI video generation for landing page',
    description: 'AI video generation (3D landing page) to feature on the landing page. Deprioritised for now — other work takes precedence.',
    status: 'BACKLOG',
    priority: 'LOW',
  },
  {
    title: 'Finance tracker & product system management',
    description: 'Build out the finance tracking and product management system end to end.',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    subtasks: [
      'Define the data model (income, expenses, products)',
      'Product / inventory catalog management',
      'Expense & revenue tracking',
      'Dashboard & reporting view',
    ],
  },
  {
    title: 'Logins management',
    description: 'Central place to record and manage all our logins. Number of accounts: TBD. No passwords stored here.',
    status: 'BACKLOG',
    priority: 'MEDIUM',
  },
  {
    title: 'Get in touch with lawyers',
    status: 'BACKLOG',
    priority: 'MEDIUM',
  },
  {
    title: 'Meeting with the 3D designer',
    status: 'BACKLOG',
    priority: 'MEDIUM',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', new mongoose.Schema({ name: String, slug: String }, { strict: false }));
  const Board = mongoose.models.Board || mongoose.model('Board', new mongoose.Schema({ name: String, slug: String, workspaceId: mongoose.Schema.Types.ObjectId }, { strict: false }));

  const SubtaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => Date.now() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  });
  const TaskSchema = new mongoose.Schema({
    workspaceId: mongoose.Schema.Types.ObjectId,
    boardId: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    status: String,
    priority: String,
    order: Number,
    subtasks: [SubtaskSchema],
    assignees: [mongoose.Schema.Types.ObjectId],
    tags: [String],
  }, { timestamps: true, strict: false });
  const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

  const workspace = await Workspace.findOne({ name: new RegExp('^' + WORKSPACE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
  if (!workspace) { console.error(`✗ Workspace "${WORKSPACE_NAME}" not found.`); await mongoose.disconnect(); process.exit(1); }
  const board = await Board.findOne({ workspaceId: workspace._id, name: new RegExp('^' + BOARD_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
  if (!board) { console.error(`✗ Board "${BOARD_NAME}" not found in workspace.`); await mongoose.disconnect(); process.exit(1); }

  console.log(`Workspace: ${workspace.name} (${workspace.slug})`);
  console.log(`Board: ${board.name} (${board.slug})\n`);

  // Guard against duplicates: skip any title that already exists (non-archived) on this board.
  const existing = await Task.find({ workspaceId: workspace._id, boardId: board._id, status: { $ne: 'ARCHIVED' } }).select('title status order').lean();
  const existingTitles = new Set(existing.map((t) => t.title.toLowerCase()));

  // Starting order per status = max existing order in that column + 1.
  const nextOrder = {};
  for (const t of existing) {
    nextOrder[t.status] = Math.max(nextOrder[t.status] ?? -1, t.order ?? 0);
  }
  const orderCounter = {};
  const getOrder = (status) => {
    if (orderCounter[status] === undefined) orderCounter[status] = (nextOrder[status] ?? -1) + 1;
    return orderCounter[status]++;
  };

  const docs = [];
  const skipped = [];
  for (const def of TASKS) {
    if (existingTitles.has(def.title.toLowerCase())) { skipped.push(def.title); continue; }
    docs.push({
      workspaceId: workspace._id,
      boardId: board._id,
      title: def.title,
      description: def.description,
      status: def.status,
      priority: def.priority,
      order: getOrder(def.status),
      subtasks: (def.subtasks || []).map((s) => ({ title: s, completed: false })),
      tags: [],
      assignees: [],
    });
  }

  // Report
  for (const status of ['IN_PROGRESS', 'BACKLOG']) {
    const group = docs.filter((d) => d.status === status);
    if (!group.length) continue;
    console.log(`${status}:`);
    for (const d of group) {
      console.log(`  [${d.priority}] (order ${d.order}) ${d.title}`);
      (d.subtasks || []).forEach((s) => console.log(`      └─ ${s.title}`));
      if (d.description) console.log(`      desc: ${d.description}`);
    }
    console.log('');
  }
  if (skipped.length) console.log('Skipped (already exist on board):', skipped.join(', '), '\n');

  if (docs.length === 0) { console.log('Nothing to create.'); await mongoose.disconnect(); return; }

  if (!APPLY) {
    console.log(`--- DRY RUN --- would create ${docs.length} task(s). Re-run with --apply.`);
    await mongoose.disconnect();
    return;
  }

  const result = await Task.insertMany(docs);
  console.log(`✓ Created ${result.length} task(s).`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
