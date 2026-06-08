
import mongoose from 'mongoose';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env.local from ${envPath}`);
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (value) {
                process.env[key.trim()] = value;
            }
        }
    });
} else {
    console.warn('.env.local not found');
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

// Fix for SRV resolution issues in some environments
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn('Failed to set custom DNS servers:', e);
}

const TARGET_DB = process.env.MONGODB_DB || 'flux';
// Never allow this destructive script to touch the shared/default or system DBs.
const PROTECTED_DBS = new Set(['test', 'admin', 'local', 'config']);

async function clearDatabase() {
    if (PROTECTED_DBS.has(TARGET_DB)) {
        console.error(`❌ Refusing to clear protected/shared database "${TARGET_DB}". This script only clears a dedicated app database (set MONGODB_DB).`);
        process.exit(1);
    }
    // Require an explicit confirmation that matches the exact target DB name.
    if (process.env.CONFIRM_CLEAR !== TARGET_DB) {
        console.error(`❌ Safety guard: this will DROP EVERY collection in database "${TARGET_DB}".`);
        console.error(`   To proceed, re-run with:  CONFIRM_CLEAR=${TARGET_DB} node scripts/clear-db.mjs`);
        process.exit(1);
    }

    console.log(`Connecting to MongoDB (target database: ${TARGET_DB})...`);
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            dbName: TARGET_DB,
        });
        console.log(`✅ Connected. Clearing database: ${mongoose.connection.db.databaseName}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length === 0) {
            console.log('No collections found to clear.');
        } else {
            console.log(`Found ${collections.length} collections. Clearing...`);
            for (const collection of collections) {
                console.log(`Dropping collection: ${collection.name}`);
                await mongoose.connection.db.dropCollection(collection.name);
            }
            console.log('✅ All collections dropped successfully.');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    } catch (error) {
        console.error('❌ Error clearing database:');
        console.error(error);
        process.exit(1);
    }
}

clearDatabase();
