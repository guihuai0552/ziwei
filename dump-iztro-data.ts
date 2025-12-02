import { astro } from 'iztro';
import fs from 'fs';

const astrolabe = astro.bySolar('2000-1-1', 0, '男', true, 'zh-CN');

// Create a simplified version to avoid circular references if any, though JSON.stringify usually handles simple objects well.
// iztro objects might have methods, so we'll just try stringifying.
try {
    const json = JSON.stringify(astrolabe, null, 2);
    fs.writeFileSync('iztro-data-dump.json', json);
    console.log('Data dumped to iztro-data-dump.json');
} catch (e) {
    console.error('Error dumping data:', e);
}
