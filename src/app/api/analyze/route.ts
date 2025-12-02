import { IztroEngine } from '@/lib/iztro-engine';

export async function POST(req: Request) {
    try {
        const { birthInfo } = await req.json();

        // 1. Generate Astrolabe
        const { astrolabe } = IztroEngine.analyze(birthInfo);

        return Response.json({
            astrolabe,
            report: null // Report generation is disabled for performance
        });

    } catch (error) {
        console.error('Analysis failed:', error);
        return Response.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
