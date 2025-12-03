import PocketBase from 'pocketbase';
import { NextRequest, NextResponse } from 'next/server';

// Initialize PocketBase client
// Note: In production, you should use an environment variable for the URL
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        // 1. Authenticate as Admin (to update records)
        // Ideally, use a service account or API key if available, or admin login
        const email = process.env.POCKETBASE_ADMIN_EMAIL;
        const password = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!email || !password) {
            console.warn("PocketBase admin credentials not set. Attempting public access (might fail for updates).");
        } else {
            await pb.admins.authWithPassword(email, password);
        }

        // 2. Find the code
        // We use getFirstListItem to find by the 'code' field
        const record = await pb.collection('redemption_codes').getFirstListItem(`code="${code}"`);

        if (!record) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
        }

        if (record.is_used) {
            return NextResponse.json({ error: 'Code already used' }, { status: 400 });
        }

        // 3. Mark as used
        await pb.collection('redemption_codes').update(record.id, {
            is_used: true,
            used_at: new Date(),
            // used_by: 'user_id_placeholder' // If we had user auth
        });

        return NextResponse.json({ success: true, message: 'Code redeemed successfully' });

    } catch (error: any) {
        console.error('Redemption failed:', error);

        // Handle specific PocketBase errors
        if (error.status === 404) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Redemption failed', details: error.message }, { status: 500 });
    }
}
