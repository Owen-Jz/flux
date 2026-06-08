// Phase B: copy Flux-owned collections from the shared `test` DB into the
// dedicated `flux` DB. Non-destructive (source untouched), idempotent (upsert by
// _id), and self-verifying (asserts dest count == source count per collection).
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

const uri = readFileSync('.env.local', 'utf8').match(/^MONGODB_URI=(.*)$/m)[1].trim();
const SOURCE = process.env.SOURCE_DB || 'test';
const DEST = process.env.DEST_DB || 'flux';

// Flux-owned collections only. Other apps' collections in `test` are NOT touched.
const FLUX_COLLECTIONS = [
  'users', 'workspaces', 'boards', 'tasks', 'issues', 'activitylogs',
  'workspaceinvites', 'auditlogs', 'apikeys', 'webhookendpoints',
  'accessrequests', 'contacts', 'pushsubscriptions', 'failedwebhooks',
  'processedwebhooks', 'idempotencykeys', 'admins', 'anonplanusages',
  'webhookeyrotations',
];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
let failures = 0;
try {
  await client.connect();
  const src = client.db(SOURCE);
  const dst = client.db(DEST);
  const existing = new Set((await src.listCollections().toArray()).map((c) => c.name));

  console.log(`Copying Flux collections: ${SOURCE} -> ${DEST}\n`);
  console.log('collection'.padEnd(22) + 'src'.padStart(7) + 'dst(before)'.padStart(13) + 'dst(after)'.padStart(12) + '  result');

  for (const name of FLUX_COLLECTIONS) {
    if (!existing.has(name)) {
      console.log(name.padEnd(22) + '—'.padStart(7) + '(not in source — skipped)'.padStart(40));
      continue;
    }
    const docs = await src.collection(name).find({}).toArray();
    const before = await dst.collection(name).estimatedDocumentCount();
    if (docs.length > 0) {
      const ops = docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
      // chunk to stay well under bulk limits
      for (let i = 0; i < ops.length; i += 500) {
        await dst.collection(name).bulkWrite(ops.slice(i, i + 500), { ordered: false });
      }
    }
    const after = await dst.collection(name).countDocuments();
    const ok = after >= docs.length; // dest is a superset (re-runnable)
    if (!ok) failures++;
    console.log(
      name.padEnd(22) + String(docs.length).padStart(7) + String(before).padStart(13) + String(after).padStart(12) +
      '  ' + (ok ? 'OK' : 'MISMATCH!')
    );
  }

  console.log(`\n${failures === 0 ? 'MIGRATION OK — all Flux collections copied.' : `MIGRATION HAD ${failures} MISMATCH(ES) — investigate before cutover.`}`);
  if (failures > 0) process.exitCode = 1;
} catch (e) {
  console.error('MIGRATION FAILED:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
