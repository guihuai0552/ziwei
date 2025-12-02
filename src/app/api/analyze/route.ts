import OpenAI from 'openai';
import { IztroEngine } from '@/lib/iztro-engine';
import { RagClient } from '@/lib/rag-client';

export const maxDuration = 30;

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { birthInfo } = await req.json();

        // 1. Generate Astrolabe
        const { astrolabe } = IztroEngine.analyze(birthInfo);

        // 2. Get RAG Context
        const context = await RagClient.searchContext(JSON.stringify(astrolabe));

        // 3. Prepare Prompt
        const prompt = `
    You are a Ziwei Dou Shu expert. Based on the following astrology chart data and context, generate a detailed and personalized report.
    
    Chart Data:
    ${IztroEngine.formatForRAG(astrolabe)}
    
    Context:
    ${context}
    
    Please provide a comprehensive report covering ALL 12 palaces.
    
    Structure the report as follows:
    
    ## 1. Core Analysis (Deep Dive)
    Provide an in-depth analysis for the following key palaces, explaining the interaction of major stars, brightness, and mutagens:
    - **Life Palace (命宫)**: Personality, destiny overview, core strengths/weaknesses.
    - **Career Palace (官禄)**: Career path, suitable industries, work style.
    - **Wealth Palace (财帛)**: Financial potential, money management style, sources of wealth.
    - **Spouse Palace (夫妻)**: Relationship patterns, ideal partner characteristics, potential challenges.
    
    ## 2. Full Chart Overview
    Briefly analyze the remaining 8 palaces (Migration, Travel, Health, etc.), highlighting any significant stars or patterns.
    
    ## 3. Summary & Advice
    Provide a final synthesis and actionable advice for the user.
    
    Keep the tone mystical yet accessible and encouraging. Use clear Markdown headers and bullet points.
    `;

        // 4. Call DeepSeek
        if (!process.env.DEEPSEEK_API_KEY) {
            return new Response(JSON.stringify({
                astrolabe,
                report: "API Key missing. This is a mock report.\n\n## Core Personality\nYou are a complex individual with... (Add API Key to see real result)"
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'deepseek-chat',
        });

        const text = completion.choices[0].message.content || 'No report generated.';

        return Response.json({
            astrolabe,
            report: text
        });

    } catch (error) {
        console.error('Analysis failed:', error);
        return Response.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
