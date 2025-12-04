const fs = require('fs');

// Generate 1000 records to get their IDs
const records = [];
for (let i = 0; i < 1000; i++) {
    records.push({
        is_used: false,
        // We don't need a 'code' field anymore, we use the system ID
        // You can add other metadata here if needed
        note: `Batch 1 - ${i}`
    });
}

// Note: This JSON is for IMPORTING into PocketBase.
// PocketBase import expects an array of objects.
// However, we can't "predict" the IDs if we just import.
// If we want to KNOW the IDs, we have to create them via API or set custom IDs.
// PocketBase allows setting custom IDs (15 chars).

// Let's generate custom 15-char IDs so we know them beforehand!
function generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const recordsWithIds = records.map(r => ({
    id: generateId(),
    ...r
}));

documents: codeList
};

// Output as a JSON file compatible with PocketBase import (or just raw data)
// PocketBase import usually takes a JSON array of records.
fs.writeFileSync('pocketbase/codes.json', JSON.stringify(codeList, null, 2));

console.log(`Generated ${codeList.length} codes in pocketbase/codes.json`);
