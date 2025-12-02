import { astro } from 'iztro';
import { Solar, Lunar } from 'lunar-javascript';

export type Gender = 'male' | 'female';
export type CalendarType = 'solar' | 'lunar';

export interface BirthInfo {
    dateStr: string; // YYYY-MM-DD
    timeIndex: number; // 0-12
    gender: Gender;
    type: CalendarType;
    name?: string;
    isLeapMonth?: boolean; // For lunar
}

export interface IztroResult {
    astrolabe: any; // Using any for now as iztro types are not easily imported or complex
    horoscope?: string;
}

export class IztroEngine {
    static analyze(info: BirthInfo): IztroResult {
        const { dateStr, timeIndex, gender, type, isLeapMonth } = info;
        const genderStr = gender === 'male' ? '男' : '女';
        const fixLeap = true; // Default to fix leap month handling if needed

        let astrolabeResult;

        try {
            if (type === 'solar') {
                astrolabeResult = astro.bySolar(dateStr, timeIndex, genderStr, fixLeap, 'zh-CN');
            } else {
                astrolabeResult = astro.byLunar(dateStr, timeIndex, genderStr, isLeapMonth || false, fixLeap, 'zh-CN');
            }

            return {
                astrolabe: astrolabeResult,
            };
        } catch (error) {
            console.error('Iztro analysis failed:', error);
            throw new Error('Failed to generate astrolabe');
        }
    }

    static formatForRAG(astrolabe: any): string {
        let formatted = `五行局：${astrolabe.fiveElementsClass}\n\n`;

        astrolabe.palaces.forEach((p: any) => {
            const majorStars = p.majorStars.map((s: any) => `${s.name}(${s.brightness}${s.mutagen ? ',' + s.mutagen : ''})`).join('、');
            const minorStars = p.minorStars.map((s: any) => `${s.name}(${s.brightness || '-'})`).join('、');
            const adjectiveStars = p.adjectiveStars.map((s: any) => s.name).join('、');

            formatted += `### ${p.name} (${p.earthlyBranch}宫)\n`;
            formatted += `- 主星：${majorStars || '无'}\n`;
            formatted += `- 辅星：${minorStars || '无'}\n`;
            formatted += `- 杂曜：${adjectiveStars || '无'}\n`;
            formatted += `- 十年大限：${p.decadal.range[0]}-${p.decadal.range[1]}\n\n`;
        });

        return formatted;
    }
}
