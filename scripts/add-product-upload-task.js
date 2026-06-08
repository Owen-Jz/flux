// One-off: add the "Uploading of recent products" task, assign Mariko,
// email her via the production Resend identity, and upgrade Manuel + Mariko to EDITOR.
// Usage:
//   node scripts/add-product-upload-task.js            (dry run)
//   node scripts/add-product-upload-task.js --apply    (writes + sends)
const mongoose = require('mongoose');
const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { Types } = mongoose;

const APPLY = process.argv.includes('--apply');

const FROM_EMAIL = 'Flux Board <updates@mail.fluxboard.site>';
const REPLY_TO = 'updates@fluxboard.site';
const APP_URL = 'https://fluxboard.site';
const ASSIGNER_NAME = 'Owen';

const WORKSPACE_SLUG = 'closet-full-of-coco';
const BOARD_SLUG = 'general-tasks';

const TASK = {
  title: 'Uploading of recent products',
  description: 'Uploading 200+ products to Dropbox.',
  status: 'BACKLOG',
  priority: 'MEDIUM',
};
const ASSIGNEE_EMAIL = 'mnitta10@gmail.com';        // Mariko Nitta ("Mari")
const EDITOR_EMAILS = ['info@manuelmiltner.com', 'mnitta10@gmail.com']; // Manuel + Mariko -> EDITOR

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function buildHtml({ assigneeNames, taskTitle, workspaceName, taskUrl }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="background-color:#f5f3ff;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;padding:48px 16px"><tbody><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><tbody>
<tr><td style="height:4px;background-color:#7c3aed;line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:28px 40px 0;text-align:center"><span style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-weight:800;font-size:15px;letter-spacing:0.5px;padding:5px 14px;border-radius:8px">flux</span></td></tr>
<tr><td style="padding:32px 40px 40px">
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;line-height:1.3">New Assignment</h1>
<p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7"><strong>${esc(ASSIGNER_NAME)}</strong> assigned <strong>${esc(assigneeNames)}</strong> to a task in <strong>${esc(workspaceName)}</strong>.</p>
<div style="background-color:#faf5ff;border:1px solid #ede9fe;border-left:3px solid #7c3aed;border-radius:10px;padding:16px 20px;margin:24px 0">
<p style="margin:0 0 4px;font-weight:700;font-size:15px;color:#1c1917">${esc(taskTitle)}</p>
<p style="margin:0;font-size:13px;color:#6b7280">in ${esc(workspaceName)}</p></div>
<div style="text-align:center;margin:32px 0"><a href="${esc(taskUrl)}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">View Task</a></div>
</td></tr>
<tr><td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
<p style="margin:0 0 6px;color:#9ca3af;font-size:12px;line-height:1.5">Flux Board &bull; <a href="${APP_URL}" style="color:#7c3aed;text-decoration:none">fluxboard.site</a></p>
<p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af"><a href="${APP_URL}/unsubscribe" style="color:#9ca3af;text-decoration:none">Unsubscribe</a> &middot; <a href="${APP_URL}/privacy" style="color:#9ca3af;text-decoration:none">Privacy Policy</a> &middot; <a href="${APP_URL}/terms" style="color:#9ca3af;text-decoration:none">Terms of Service</a></p>
</td></tr></tbody></table></td></tr></tbody></table></body></html>`;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });
  const Workspace = mongoose.model('Workspace', new mongoose.Schema({}, { strict: false }));
  const Board = mongoose.model('Board', new mongoose.Schema({}, { strict: false }));
  const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const ws = await Workspace.findOne({ slug: WORKSPACE_SLUG }).lean();
  const board = await Board.findOne({ workspaceId: ws._id, slug: BOARD_SLUG }).lean();

  const assignee = await User.findOne({ email: ASSIGNEE_EMAIL }).select('name email notificationPreferences').lean();
  if (!assignee) { console.error(`✗ No user for ${ASSIGNEE_EMAIL}`); process.exit(1); }

  // Next order in BACKLOG column
  const backlog = await Task.find({ workspaceId: ws._id, boardId: board._id, status: 'BACKLOG' }).select('order').lean();
  const nextOrder = backlog.reduce((m, t) => Math.max(m, t.order ?? 0), -1) + 1;

  // Duplicate guard
  const existing = await Task.findOne({ workspaceId: ws._id, boardId: board._id, title: TASK.title, status: { $ne: 'ARCHIVED' } }).lean();

  const taskUrl = `${APP_URL}/${ws.slug}/board/${board.slug}`;
  const optedOut = assignee.notificationPreferences && assignee.notificationPreferences.taskAssigned === false;

  console.log(`Workspace: ${ws.name} | Board: ${board.name}\n`);
  console.log('NEW TASK:');
  console.log(`  [${TASK.status} / ${TASK.priority}] ${TASK.title}  (order ${nextOrder})`);
  console.log(`  desc: ${TASK.description}`);
  console.log(`  assignee: ${assignee.name} <${assignee.email}>${existing ? '  (⚠ task with this title already exists — will reuse, not duplicate)' : ''}`);
  console.log(`\nEMAIL: -> ${assignee.email}${optedOut ? '  (SKIPPED: opted out)' : ''}`);
  console.log('\nROLE UPGRADES -> EDITOR:');
  EDITOR_EMAILS.forEach((e) => console.log(`  ${e}`));

  if (!APPLY) {
    console.log('\n--- DRY RUN --- no changes. Re-run with --apply.');
    await mongoose.disconnect();
    return;
  }

  // 1. Create (or reuse) the task with assignee set
  let taskId;
  if (existing) {
    await Task.updateOne({ _id: existing._id }, { $addToSet: { assignees: new Types.ObjectId(String(assignee._id)) }, $set: { description: TASK.description } });
    taskId = existing._id;
    console.log('\n✓ Reused existing task, ensured assignee.');
  } else {
    const created = await Task.create({
      workspaceId: ws._id, boardId: board._id,
      title: TASK.title, description: TASK.description,
      status: TASK.status, priority: TASK.priority, order: nextOrder,
      assignees: [new Types.ObjectId(String(assignee._id))],
      subtasks: [], tags: [], comments: [],
      createdAt: new Date(), updatedAt: new Date(),
    });
    taskId = created._id;
    console.log(`\n✓ Created task ${taskId}`);
  }

  // 2. Email the assignee via the production Resend identity
  if (!optedOut) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = buildHtml({ assigneeNames: assignee.name || 'Someone', taskTitle: TASK.title, workspaceName: ws.name, taskUrl });
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL, replyTo: REPLY_TO, to: assignee.email,
      subject: `New Assignment in ${ws.name}: ${TASK.title}`, html,
    });
    if (error) console.error(`✗ Email failed -> ${assignee.email}: ${error.name || ''} ${error.message || JSON.stringify(error)}`);
    else console.log(`✓ Email sent -> ${assignee.email}  id=${data.id}`);
  }

  // 3. Upgrade roles to EDITOR
  const editorUsers = await User.find({ email: { $in: EDITOR_EMAILS } }).select('_id email').lean();
  for (const u of editorUsers) {
    const res = await Workspace.updateOne(
      { _id: ws._id },
      { $set: { 'members.$[m].role': 'EDITOR' } },
      { arrayFilters: [{ 'm.userId': new Types.ObjectId(String(u._id)) }] }
    );
    console.log(`✓ Role -> EDITOR for ${u.email} (modified ${res.modifiedCount})`);
  }

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
