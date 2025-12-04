const fs = require('fs');
const crypto = require('crypto');

function generateCode() {
    // Generate a random 8-character alphanumeric code
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

const codes = new Set();
while (codes.size < 1000) {
    codes.add(generateCode());
}

const codeList = Array.from(codes).map(code => ({
    code: code,
    is_used: false,
    used_by: null,
    used_at: null
}));

const output = {
    name: "redemption_codes",
    schema: [
        { name: "code", type: "text", required: true, unique: true },
        { name: "is_used", type: "bool" },
        { name: "used_by", type: "text" }, // User ID or similar
        { name: "used_at", type: "date" }
    ],
    documents: codeList
};

// Output as a JSON file compatible with PocketBase import (or just raw data)
// PocketBase import usually takes a JSON array of records.
fs.writeFileSync('pocketbase/codes.json', JSON.stringify(codeList, null, 2));

console.log(`Generated ${codeList.length} codes in pocketbase/codes.json`);
