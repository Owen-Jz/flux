import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Admin } from '../models/Admin';

/**
 * One-time admin repair (2026-06-12 audit):
 * 1. Remove Admin records whose userId no longer resolves to a User (orphans).
 * 2. Ensure the designated account has a SUPER_ADMIN record with full permissions.
 * Idempotent — safe to re-run.
 */
const SUPER_ADMIN_EMAIL = 'owendigitals@gmail.com';

async function repairAdmin() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  // 1. Delete orphaned admin records
  const admins = await Admin.find({});
  for (const a of admins) {
    const user = await User.findById(a.userId).select('email');
    if (!user) {
      await Admin.deleteOne({ _id: a._id });
      console.log(`Deleted orphaned Admin record ${a._id} (userId ${a.userId} has no User)`);
    } else {
      console.log(`Keeping Admin record for ${user.email} (role ${a.role})`);
    }
  }

  // 2. Ensure designated SUPER_ADMIN
  const target = await User.findOne({ email: SUPER_ADMIN_EMAIL }).select('email name');
  if (!target) {
    console.error(`Target user ${SUPER_ADMIN_EMAIL} not found — aborting`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const fullPermissions = {
    users: true,
    workspaces: true,
    analytics: true,
    settings: true,
    billing: true,
  };

  const existing = await Admin.findOne({ userId: target._id });
  if (existing) {
    existing.role = 'SUPER_ADMIN';
    existing.permissions = fullPermissions;
    await existing.save();
    console.log(`Updated existing Admin record for ${target.email} → SUPER_ADMIN, full permissions`);
  } else {
    await Admin.create({
      userId: target._id,
      role: 'SUPER_ADMIN',
      permissions: fullPermissions,
    });
    console.log(`Created SUPER_ADMIN record for ${target.email} (${target.name})`);
  }

  // Final state
  const finalAdmins = await Admin.find({}).populate('userId', 'email');
  console.log(`\n=== Final Admin records (${finalAdmins.length}) ===`);
  for (const a of finalAdmins) {
    const u = a.userId as unknown as { email?: string } | null;
    console.log(`- ${u?.email ?? '(orphan)'} | role:${a.role}`);
  }

  await mongoose.disconnect();
}

repairAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
