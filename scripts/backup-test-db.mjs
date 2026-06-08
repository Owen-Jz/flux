// Phase A backup: export every collection in the shared `test` DB to typed EJSON
// files OUTSIDE the repo (contains real data — never commit). Read-only on Mongo.
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const uri = readFileSync('.env.local', 'utf8').match(/^MONGODB_URI=(.*)$/m)[1].trim();
const SOURCE_DB = process.env.BACKUP_DB || 'test';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join(homedir(), 'flux-db-backups', `${SOURCE_DB}-${stamp}`);
mkdirSync(outDir, { recursive: true });

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const db = client.db(SOURCE_DB);
  const colls = (await db.listCollections().toArray()).map((c) => c.name).sort();
  console.log(`Backing up DB "${SOURCE_DB}" (${colls.length} collections) -> ${outDir}`);
  let total = 0;
  for (const name of colls) {
    const docs = await db.collection(name).find({}).toArray();
    writeFileSync(join(outDir, `${name}.json`), EJSON.stringify(docs, null, 2));
    total += docs.length;
    console.log(`  ${name.padEnd(24)} ${String(docs.length).padStart(7)} docs`);
  }
  writeFileSync(join(outDir, '_manifest.json'), EJSON.stringify({ sourceDb: SOURCE_DB, takenAt: stamp, collections: colls, totalDocs: total }, null, 2));
  console.log(`\nBACKUP COMPLETE: ${total} docs across ${colls.length} collections.`);
  console.log(`Location: ${outDir}`);
} catch (e) {
  console.error('BACKUP FAILED:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
