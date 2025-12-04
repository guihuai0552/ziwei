# PocketBase Setup for Ziwei Astrolabe

## 1. Deployment
You can deploy PocketBase to **Zeabur** or **Vercel** (using a Docker container or Go binary).
For Zeabur:
1. Create a new service.
2. Select "Marketplace" -> "PocketBase".
3. Or deploy a Docker image `pocketbase/pocketbase:latest`.

## 2. Configuration
1. Access your PocketBase Admin UI (e.g., `https://your-app.zeabur.app/_/`).
2. Create an admin account.
3. Create a new collection named `redemption_codes`.
4. Add the following fields:
   - `code` (Text, Unique, Required)
   - `is_used` (Bool)
   - `used_by` (Text)
   - `used_at` (Date)

## 3. Import Codes
1. Run the generation script locally:
   ```bash
   node pocketbase/generate_codes.js
   ```
   This will create `pocketbase/codes.json`.
2. In PocketBase Admin UI, go to `redemption_codes` collection.
3. Click "Settings" (gear icon) -> "Import collections" (or just use the API to seed).
   *Note: PocketBase UI might not have a direct JSON import for records in all versions. If not, use the API script below.*

### Seeding via API (Optional)
If you cannot import JSON directly, use this script to push codes to your remote instance:

```javascript
// pocketbase/seed_remote.js
import PocketBase from 'pocketbase';
import codes from './codes.json' assert { type: "json" };

const pb = new PocketBase('https://YOUR_POCKETBASE_URL');

async function seed() {
    await pb.admins.authWithPassword('admin@example.com', 'password');
    
    for (const item of codes) {
        try {
            await pb.collection('redemption_codes').create(item);
            console.log(`Created ${item.code}`);
        } catch (e) {
            console.error(`Failed ${item.code}`, e.message);
        }
    }
}

seed();
```

## 4. Environment Variables
In your Next.js project (Vercel), set:
- `NEXT_PUBLIC_POCKETBASE_URL`: Your PocketBase URL
- `POCKETBASE_ADMIN_EMAIL`: For server-side operations (if needed)
- `POCKETBASE_ADMIN_PASSWORD`: For server-side operations (if needed)
