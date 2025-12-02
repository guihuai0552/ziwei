import { astro } from 'iztro';

try {
    const result = astro.bySolar('2000-1-1', 0, '男', true, 'zh-CN');
    result?.palaces.forEach((p, i) => {
        if (!p.earthlyBranch) console.error(`Palace ${i} missing earthlyBranch`);
        if (!p.decadal) console.error(`Palace ${i} missing decadal`);
        if (!p.adjectiveStars) console.error(`Palace ${i} missing adjectiveStars`);
        if (!Array.isArray(p.adjectiveStars)) console.error(`Palace ${i} adjectiveStars is not array`);
    });
    console.log('Check complete');
} catch (e) {
    console.error('Error:', e);
}
