import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose, { Types } from 'mongoose';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Task } from '../models/Task';
import { ActivityLog } from '../models/ActivityLog';
import { ApiKey } from '../models/ApiKey';
import { WebhookEndpoint } from '../models/WebhookEndpoint';
import { PushSubscription } from '../models/PushSubscription';
import { WorkspaceInvite } from '../models/WorkspaceInvite';

/**
 * One-time purge of known test accounts (2026-06-12 audit).
 * Mirrors actions/account.ts deleteAccount + the purge-deleted-workspaces
 * cron cascade, but hard-deletes immediately (test data needs no grace period).
 */
const TEST_EMAILS = [
  'testuser123@example.com',
  'empty-dashboard-1778704324187@test.com',
  'onboarding-eligible-1778704324190@test.com',
  'test@example.com',
  'test2@example.com',
  'test-fixed-123@example.com',
  'qatest+flux1779869152@mailinator.com',
  'smoke.test.1780047344@aurion-qa.local',
  'flux.qa.20260612@maildrop.cc',
];

async function purgeUser(email: string): Promise<boolean> {
  const user = await User.findOne({ email }).select('_id email');
  if (!user) {
    console.log(`- ${email}: not found (skipped)`);
    return false;
  }
  const userId = user._id as Types.ObjectId;

  // 1. Hard-purge workspaces this user OWNS (tasks → activity → boards → workspace)
  const owned = await Workspace.find({ ownerId: userId }).select('_id slug');
  for (const ws of owned) {
    const boards = await Board.find({ workspaceId: ws._id }).select('_id');
    const boardIds = boards.map((b) => b._id);
    if (boardIds.length > 0) await Task.deleteMany({ boardId: { $in: boardIds } });
    await Task.deleteMany({ workspaceId: ws._id });
    await ActivityLog.deleteMany({ workspaceId: ws._id });
    await Board.deleteMany({ workspaceId: ws._id });
    await Workspace.deleteOne({ _id: ws._id });
  }

  // 2. Remove membership + task assignments in workspaces owned by others
  const memberWs = await Workspace.find({
    'members.userId': userId,
    ownerId: { $ne: userId },
  }).select('_id');
  if (memberWs.length > 0) {
    const ids = memberWs.map((w) => w._id);
    await Task.updateMany(
      { workspaceId: { $in: ids }, assignees: userId.toString() },
      { $pull: { assignees: userId.toString() } }
    );
    await Workspace.updateMany({ _id: { $in: ids } }, { $pull: { members: { userId } } });
  }

  // 3. Credentials, subscriptions, pending invites
  await Promise.all([
    ApiKey.deleteMany({ userId }),
    WebhookEndpoint.deleteMany({ userId }),
    PushSubscription.deleteMany({ userId }),
    WorkspaceInvite.deleteMany({ email }),
  ]);

  // 4. The user record
  await User.deleteOne({ _id: userId });

  console.log(`- ${email}: deleted (purged ${owned.length} owned workspace(s))`);
  return true;
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const before = await User.countDocuments();
  console.log(`Users before: ${before}`);

  let deleted = 0;
  for (const email of TEST_EMAILS) {
    if (await purgeUser(email)) deleted++;
  }

  const after = await User.countDocuments();
  console.log(`\nDeleted ${deleted} test account(s). Users: ${before} -> ${after}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
