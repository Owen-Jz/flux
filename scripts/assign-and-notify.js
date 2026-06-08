// One-off: assign restructuring tasks to team members AND send the real
// assignment notification email through the production Resend identity.
// Usage:
//   node scripts/assign-and-notify.js            (dry run — no DB writes, no emails)
//   node scripts/assign-and-notify.js --apply    (assigns + sends emails)
const mongoose = require('mongoose');
const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const APPLY = process.argv.includes('--apply');

// Mirrors lib/email/resend.ts exactly so this is a true test of the prod path.
const FROM_EMAIL = 'Flux Board <updates@mail.fluxboard.site>';
const REPLY_TO = 'updates@fluxboard.site';
// App links: use the production URL (the app template uses NEXTAUTH_URL, which is
// localhost in this env — see note in the report).
const APP_URL = 'https://fluxboard.site';

const WORKSPACE_NAME = 'Closet Full of Coco';
const BOARD_NAME = 'General Tasks';
const ASSIGNER_NAME = 'Owen';

// task title -> assignee emails
const ASSIGNMENTS = [
  { title: 'Logins management', emails: ['owendigitals@gmail.com'] },
  { title: 'Domain verification and fix', emails: ['owendigitals@gmail.com'] },
  { title: 'Setting up email account creation', emails: ['owendigitals@gmail.com', 'info@manuelmiltner.com'] },
  { title: 'Find a good image editor', emails: ['owendigitals@gmail.com', 'info@manuelmiltner.com'] },
  { title: 'Start posting for jobs', emails: ['owendigitals@gmail.com', 'info@manuelmiltner.com'] },
  { title: 'Finance tracker & product system management', emails: ['owendigitals@gmail.com', 'info@manuelmiltner.com'] },
  { title: 'Get in touch with lawyers', emails: ['info@manuelmiltner.com'] },
  { title: 'Meeting with the 3D designer', emails: ['info@manuelmiltner.com'] },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Faithful inline-HTML version of components/emails/task-assigned.tsx + email-layout.tsx
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });
  const Workspace = mongoose.model('Workspace', new mongoose.Schema({}, { strict: false }));
  const Board = mongoose.model('Board', new mongoose.Schema({}, { strict: false }));
  const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const workspace = await Workspace.findOne({ name: new RegExp('^' + WORKSPACE_NAME + '$', 'i') }).lean();
  const board = await Board.findOne({ workspaceId: workspace._id, name: new RegExp('^' + BOARD_NAME + '$', 'i') }).lean();
  const boardSlug = board.slug || 'general-tasks';
  console.log(`Workspace: ${workspace.name} | Board: ${board.name}\n`);

  // Resolve all assignee users up front.
  const allEmails = [...new Set(ASSIGNMENTS.flatMap((a) => a.emails))];
  const users = await User.find({ email: { $in: allEmails } }).select('name email notificationPreferences').lean();
  const userByEmail = Object.fromEntries(users.map((u) => [u.email.toLowerCase(), u]));
  for (const e of allEmails) {
    if (!userByEmail[e.toLowerCase()]) { console.error(`✗ No user account for ${e}`); process.exit(1); }
  }

  const taskUrl = `${APP_URL}/${workspace.slug}/board/${boardSlug}`;
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  const plannedEmails = [];

  for (const a of ASSIGNMENTS) {
    const task = await Task.findOne({ workspaceId: workspace._id, boardId: board._id, title: a.title });
    if (!task) { console.error(`✗ Task not found: ${a.title}`); process.exit(1); }

    const assigneeUsers = a.emails.map((e) => userByEmail[e.toLowerCase()]);
    const assigneeNames = assigneeUsers.map((u) => u.name || 'Someone').join(', ');
    const assigneeIds = assigneeUsers.map((u) => String(u._id));

    // DB: set assignees (dedup with any pre-existing)
    const current = (task.assignees || []).map(String);
    const merged = [...new Set([...current, ...assigneeIds])];
    console.log(`• ${a.title}`);
    console.log(`    assignees -> ${assigneeNames}`);

    if (APPLY) {
      task.assignees = merged;
      await task.save();
    }

    // Each assignee gets a per-task email (mirrors the app's per-assignment send),
    // unless they opted out (notificationPreferences.taskAssigned === false).
    for (const u of assigneeUsers) {
      const optedOut = u.notificationPreferences && u.notificationPreferences.taskAssigned === false;
      if (optedOut) { console.log(`    (skip email -> ${u.email}: opted out)`); continue; }
      plannedEmails.push({
        to: u.email,
        subject: `New Assignment in ${workspace.name}: ${a.title}`,
        html: buildHtml({ assigneeNames, taskTitle: a.title, workspaceName: workspace.name, taskUrl }),
      });
    }
  }

  console.log(`\nEmails to send: ${plannedEmails.length}`);
  plannedEmails.forEach((e) => console.log(`    -> ${e.to}  |  ${e.subject}`));

  if (!APPLY) {
    console.log('\n--- DRY RUN --- no DB writes, no emails sent. Re-run with --apply.');
    await mongoose.disconnect();
    return;
  }

  if (!resend) { console.error('\n✗ RESEND_API_KEY missing — cannot send.'); await mongoose.disconnect(); process.exit(1); }

  console.log('\nSending via Resend...');
  let ok = 0, fail = 0;
  for (const e of plannedEmails) {
    try {
      const { data, error } = await resend.emails.send({ from: FROM_EMAIL, replyTo: REPLY_TO, to: e.to, subject: e.subject, html: e.html });
      if (error) { fail++; console.error(`    ✗ ${e.to}: ${error.name || ''} ${error.message || JSON.stringify(error)}`); }
      else { ok++; console.log(`    ✓ ${e.to}  id=${data.id}`); }
    } catch (err) {
      fail++; console.error(`    ✗ ${e.to}: ${err.message}`);
    }
    await sleep(600); // stay under Resend rate limits
  }
  console.log(`\nDone. Sent ${ok}, failed ${fail}.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
