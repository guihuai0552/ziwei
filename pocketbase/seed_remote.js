import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load codes
const codesPath = path.join(__dirname, 'codes.json');
const codes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));

// Configuration
// REPLACE THESE WITH YOUR ZEABUR URL AND ADMIN CREDENTIALS
const POCKETBASE_URL = 'https://your-pocketbase-app.zeabur.app';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password';

const pb = new PocketBase(POCKETBASE_URL);

async function seed() {
    console.log(`Connecting to ${POCKETBASE_URL}...`);

    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Authentication successful.');
    } catch (e) {
        console.error('Authentication failed. Please check your URL and credentials.');
        console.error(e.message);
        return;
    }

    console.log(`Found ${codes.length} codes to import.`);

    let successCount = 0;
    let failCount = 0;

    // Batch process to avoid overwhelming the server
    const batchSize = 50;
    for (let i = 0; i < codes.length; i += batchSize) {
        const batch = codes.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
            try {
                // Check if exists first to avoid duplicates
                try {
                    await pb.collection('redemption_codes').getFirstListItem(`code="${item.code}"`);
                    // console.log(`Skipped ${item.code} (already exists)`);
                } catch (err) {
                    if (err.status === 404) {
                        await pb.collection('redemption_codes').create(item);
                        // console.log(`Created ${item.code}`);
                        successCount++;
                    } else {
                        throw err;
                    }
                }
            } catch (e) {
                console.error(`Failed ${item.code}`, e.message);
                failCount++;
            }
        }));
        process.stdout.write(`\rProcessed ${Math.min(i + batchSize, codes.length)}/${codes.length}...`);
    }

    console.log('\nDone!');
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed/Skipped: ${failCount}`);
}

seed();
