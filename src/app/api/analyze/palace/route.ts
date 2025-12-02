import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import OpenAI from 'openai';
import { getMutagens, getThreePartiesFourAreas } from '@/lib/ziwei-rules';
import { RagClient } from '@/lib/rag-client';

export const maxDuration = 300;

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { palaceName, palaceIndex, allPalaces, stars, decadal, context, language } = await req.json();

        if (!palaceName || !stars) {
            return Response.json({ error: 'Missing palace data' }, { status: 400 });
        }

        // Advanced Analysis Preparation
        let advancedContext = '';
        let mutagenInfo = '';

        if (allPalaces && typeof palaceIndex === 'number') {
            const { self, opposite, triad1, triad2 } = getThreePartiesFourAreas(palaceIndex, allPalaces);

            // Helper to format stars
            const fmt = (p: any) => {
                if (!p) return 'Unknown';
                const majors = p.majorStars.map((s: any) => `${s.name}(${s.brightness})`).join('、');
                return majors || 'No Major Stars';
            };

            advancedContext = `
    Three Parties and Four Areas (三方四正):
    - Core (本宫 - ${self.name}): ${fmt(self)}
    - Opposite (对宫 - ${opposite.name}): ${fmt(opposite)}
    - Triad 1 (三方 - ${triad1.name}): ${fmt(triad1)}
    - Triad 2 (三方 - ${triad2.name}): ${fmt(triad2)}
        `;

            // Mutagen Logic
            const stem = self.heavenlyStem;
            const mutagens = getMutagens(stem);
            mutagenInfo = `
    Palace Stem (宫干): ${stem}
    Mutagen Flow (四化): ${mutagens}
    Instruction: Analyze if these transforming stars appear in the Three Parties.
        `;
        }

        // Format stars for prompt (Basic)
        const majorStars = stars.majorStars.map((s: any) => `${s.name}(${s.brightness}${s.mutagen ? ',' + s.mutagen : ''})`).join('、');
        const minorStars = stars.minorStars.map((s: any) => `${s.name}(${s.brightness || '-'})`).join('、');
        const adjectiveStars = stars.adjectiveStars.map((s: any) => s.name).join('、');

        // RAG Context Retrieval
        let ragContext = '';
        try {
            const query = `紫微斗数 ${palaceName} ${majorStars} ${minorStars}`;
            console.log(`Fetching RAG context for: ${query}`);
            ragContext = await RagClient.searchContext(query);
        } catch (e) {
            console.error('RAG retrieval failed', e);
        }

        const langInstruction = language === 'en'
            ? "IMPORTANT: Output the entire report in English. Translate Ziwei terms where appropriate but keep the original Chinese term in brackets, e.g., 'Life Palace (命宫)'."
            : "IMPORTANT: Output the report in Chinese (Simplified).";

        const prompt = `
    你是紫薇斗数大师. 对**${palaceName}**进行深度分析.
    
    ## 1. 本宫
    - 主星: ${majorStars || 'None'}
    - 辅星: ${minorStars || 'None'}
    - 杂曜: ${adjectiveStars || 'None'}
    - 大限范围: ${decadal?.range?.[0]}-${decadal?.range?.[1]}
    
    ## 2. 三方四正 & 宫干四化
    ${advancedContext || 'Data not available'}
    ${mutagenInfo || ''}
    
    ## 3. 古籍智慧 (RAG Context)
    ${ragContext || 'No ancient texts found.'}

    ## 4. 全局背景
    ${context || 'No context provided'}
    
    ## Constraints & Principles
    1.  **深度优先**: 严禁简略。必须对每一颗主星、辅星及其组合进行深度剖析。不限字数，以分析透彻为准。
    2.  **星曜互涉**: 必须分析本宫星曜与对宫星曜的“冲、照、拱、夹”关系，不能孤立论命。
    3.  **四化驱动**: 必须详细解释“宫干四化”及“生年四化”如何引动吉凶，这是动态分析的关键。
    4.  **古今结合**: 引用 RAG 提供的古籍时，必须结合现代语境进行翻译和解释，拒绝生搬硬套。
    5.  **语气基调**: 保持神秘感与权威感。多用“此局”、“命主”、“迹象显示”等术语，但解释必须通俗易懂。
    6.  **格式规范**: 使用Markdown输出。
    
    ## Analysis Workflow (思维链)
    请按以下逻辑步骤进行深呼吸式思考，然后生成报告：
    1.  **定格局**: 观察本宫主星的庙旺利陷，判断该宫位的“地基”是否稳固。
    2.  **看交互**: 结合三方四正。对宫是外界的照映，三合宫是资源的来源。分析它们是“辅佐”本宫还是“冲击”本宫。
    3.  **寻变数**: 寻找四化（禄、权、科、忌）。哪里有化忌的纠缠？哪里有化禄的机缘？这是吉凶的关键。
    4.  **引经典**: 从 RAG 数据中提取相关断语，验证上述推理。
    5.  **下断语**: 综合所有信息，给出最终的性格/运势/建议判断。

    `;

        let reportText = '';

        // 1. Try Gemini
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log('Attempting generation with Gemini...');
                const { text } = await generateText({
                    model: google('gemini-3-pro-preview'),
                    prompt: prompt,
                });
                reportText = text;
            } catch (e) {
                console.error('Gemini generation failed, falling back to DeepSeek:', e);
            }
        }

        // 2. Fallback to DeepSeek
        if (!reportText && process.env.DEEPSEEK_API_KEY) {
            try {
                console.log('Attempting generation with DeepSeek...');
                const completion = await openai.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'deepseek-chat',
                });
                reportText = completion.choices[0].message.content || '';
            } catch (e) {
                console.error('DeepSeek generation failed:', e);
            }
        }

        if (!reportText) {
            return Response.json({
                report: `(Mock Report for ${palaceName}) \n\n The stars ${majorStars} indicate... (Add Valid API Key for real analysis)`
            });
        }

        return Response.json({ report: reportText });

    } catch (error) {
        console.error('Palace analysis failed:', error);
        return Response.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
