import { RagClient } from './src/lib/rag-client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    const query = "紫微星在命宫代表什么？";
    console.log(`Query: ${query}`);
    const context = await RagClient.searchContext(query);
    console.log('--- Context Retrieved ---');
    console.log(context);
}

main().catch(console.error);
