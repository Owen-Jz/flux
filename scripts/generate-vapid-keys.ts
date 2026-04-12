import { generateVAPIDKeys } from 'web-push';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const keys = generateVAPIDKeys();

const envPath = path.resolve(process.cwd(), '.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

// Update or add VAPID keys
const vapidLines = [
  `VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  `VAPID_SUBJECT=mailto:notifications@flux.com`,
];

// Remove existing VAPID lines
envContent = envContent
  .split('\n')
  .filter(line => !line.startsWith('VAPID_'))
  .join('\n')
  .trim();

envContent += '\n' + vapidLines.join('\n') + '\n';

fs.writeFileSync(envPath, envContent);
console.log('VAPID keys generated and saved to .env');