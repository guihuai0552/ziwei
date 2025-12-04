import OpenAI from 'openai';
import ziweiIndexData from './ziwei_index.json';

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 300 * 1000, // 120 seconds
});

interface PageIndexNode {
    title: string;
    node_id: string;
    summary?: string;
    prefix_summary?: string;
    text?: string;
    nodes?: PageIndexNode[];
}

interface PageIndexRoot {
    doc_name: string;
    structure: PageIndexNode[];
}

const ziweiIndex = ziweiIndexData as PageIndexRoot;

export class RagClient {
    private static generateTOC(nodes: PageIndexNode[], depth = 0): string {
        let output = '';
        for (const node of nodes) {
            const indent = '  '.repeat(depth);
            const summary = node.summary || node.prefix_summary || '';
            // Limit summary length to save tokens
            const shortSummary = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
            output += `${indent}- [${node.node_id}] ${node.title}: ${shortSummary}\n`;
            if (node.nodes) {
                output += this.generateTOC(node.nodes, depth + 1);
            }
        }
        return output;
    }

    private static findNode(nodes: PageIndexNode[], nodeId: string): PageIndexNode | null {
        for (const node of nodes) {
            if (node.node_id === nodeId) return node;
            if (node.nodes) {
                const found = this.findNode(node.nodes, nodeId);
                if (found) return found;
            }
        }
        return null;
    }

    static async searchContext(query: string): Promise<string> {
        if (!process.env.DEEPSEEK_API_KEY) {
            console.warn('DeepSeek API key missing. Returning mock context.');
            return '';
        }

        try {
            // 1. Construct TOC for LLM
            const toc = this.generateTOC(ziweiIndex.structure);

            // 2. Ask LLM to pick nodes
            const prompt = `
You are a RAG assistant. Given the following document structure (Table of Contents with summaries), identify the Node IDs that are most relevant to answer the user's query.

Document Structure:
${toc}

User Query: "${query}"

Return ONLY a JSON array of Node IDs, e.g., ["0001", "0005"]. Select at most 3-5 most relevant nodes.
`;

            const response = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0].message.content || '';
            let nodeIds: string[] = [];
            try {
                const json = JSON.parse(content);
                // Handle various JSON formats the LLM might return
                nodeIds = json.node_ids || json.ids || json.nodes || (Array.isArray(json) ? json : []);
            } catch (e) {
                console.warn('Failed to parse RAG JSON response, trying regex', e);
                const matches = content.match(/"\d{4}"/g);
                if (matches) nodeIds = matches.map(s => s.replace(/"/g, ''));
            }

            console.log('RAG Selected Nodes:', nodeIds);

            // 3. Retrieve text
            const texts = nodeIds
                .map(id => this.findNode(ziweiIndex.structure, id))
                .filter(node => node && node.text)
                .map(node => `### ${node!.title}\n${node!.text}`);

            return texts.join('\n\n');

        } catch (error) {
            console.error('RAG search failed:', error);
            return '';
        }
    }
}
