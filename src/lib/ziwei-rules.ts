export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export const MUTAGEN_RULES: Record<string, string> = {
    '甲': '廉贞→禄, 破军→权, 武曲→科, 太阳→忌',
    '乙': '天机→禄, 天梁→权, 紫微→科, 太阴→忌',
    '丙': '天同→禄, 天机→权, 文昌→科, 廉贞→忌',
    '丁': '太阴→禄, 天同→权, 天机→科, 巨门→忌',
    '戊': '贪狼→禄, 太阴→权, 右弼→科, 天机→忌',
    '己': '武曲→禄, 贪狼→权, 天梁→科, 文曲→忌',
    '庚': '太阳→禄, 武曲→权, 太阴→科, 天同→忌',
    '辛': '巨门→禄, 太阳→权, 文曲→科, 文昌→忌',
    '壬': '天梁→禄, 紫微→权, 左辅→科, 武曲→忌',
    '癸': '破军→禄, 巨门→权, 太阴→科, 贪狼→忌',
};

export function getMutagens(stem: string): string {
    return MUTAGEN_RULES[stem] || 'Unknown Stem';
}

export function getThreePartiesFourAreas(currentIndex: number, palaces: any[]) {
    const count = palaces.length;
    // Ensure index is within 0-11
    const idx = currentIndex % count;

    const oppositeIndex = (idx + 6) % count;
    const triad1Index = (idx + 4) % count;
    const triad2Index = (idx + 8) % count; // or -4

    return {
        self: palaces[idx],
        opposite: palaces[oppositeIndex],
        triad1: palaces[triad1Index],
        triad2: palaces[triad2Index],
    };
}
