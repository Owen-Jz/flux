
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
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

// Fix for SRV resolution issues in some environments
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function testConnection() {
    console.log('Connecting to MongoDB...');
    const maskedUri = MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//****:****@');
    console.log(`Using URI: ${maskedUri}`);
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ MongoDB connection successful!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in database:', collections.map(c => c.name));

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error(error.message);
        if (error.cause) console.error('Cause:', error.cause);
        process.exit(1);
    }
}

testConnection();
