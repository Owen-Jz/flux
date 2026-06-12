import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Admin } from '../models/Admin';

/**
 * Read-only audit: prints every registered account and every Admin record.
 * Usage: npx tsx scripts/list-accounts.ts
 */
async function listAccounts() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const users = await User.find({})
    .select('name email plan subscriptionStatus emailVerified createdAt trialEndsAt')
    .sort({ createdAt: 1 })
    .lean();

  console.log(`\n=== Registered accounts (${users.length}) ===`);
  for (const u of users) {
    const verified = u.emailVerified ? 'verified' : 'UNVERIFIED';
    const created = u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '?';
    const trial = u.trialEndsAt ? ` trial-ends:${new Date(u.trialEndsAt).toISOString().slice(0, 10)}` : '';
    console.log(
      `- ${u.email} | ${u.name ?? '(no name)'} | plan:${u.plan ?? 'free'} | sub:${u.subscriptionStatus ?? 'none'} | ${verified} | joined:${created}${trial}`
    );
  }

  const admins = await Admin.find({}).populate('userId', 'name email').lean();
  console.log(`\n=== Admin records (${admins.length}) ===`);
  if (admins.length === 0) {
    console.log('(none — no DB-backed admin exists)');
  }
  for (const a of admins) {
    const u = a.userId as unknown as { name?: string; email?: string } | null;
    const perms = Object.entries(a.permissions ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',');
    console.log(
      `- ${u?.email ?? '(orphaned userId)'} | ${u?.name ?? ''} | role:${a.role} | perms:[${perms}] | lastLogin:${a.lastLogin ? new Date(a.lastLogin).toISOString() : 'never'}`
    );
  }

  console.log(`\nADMIN_EMAIL env (env-based admin): ${process.env.ADMIN_EMAIL ? 'set' : 'NOT SET'}`);
  console.log(`ADMIN_PASSWORD_HASH env: ${process.env.ADMIN_PASSWORD_HASH ? 'set' : 'NOT SET'}`);

  await mongoose.disconnect();
}

listAccounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
