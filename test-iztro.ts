import { astro } from 'iztro';
console.log('astro keys:', Object.keys(astro));
try {
    // @ts-ignore
    const result = astro.bySolar('2000-1-1', 0, '男', true, 'zh-CN');
    console.log('Success:', !!result);
} catch (e) {
    console.error('Error:', e);
}
