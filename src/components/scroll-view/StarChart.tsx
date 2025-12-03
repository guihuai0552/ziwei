'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

// Helper for PDF generation
const parseInlineHtml = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
};

const parseMarkdownToHtml = (text: string) => {
    if (!text) return '';

    return text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<br/>';

        // Headers
        if (trimmed.startsWith('#')) {
            const match = trimmed.match(/^(#+)\s+(.*)/);
            if (match) {
                const level = match[1].length;
                const content = match[2];
                // Map levels to styles
                const fontSize = level === 1 ? '16px' : level === 2 ? '14px' : '13px';
                const marginTop = level === 1 ? '15px' : '10px';
                const borderBottom = level <= 2 ? 'border-bottom: 1px solid #eee;' : '';
                return `<div style="font-size: ${fontSize}; font-weight: bold; margin-top: ${marginTop}; margin-bottom: 8px; ${borderBottom} padding-bottom: 4px;">${parseInlineHtml(content)}</div>`;
            }
        }

        // Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^[-*]\s+/, '');
            return `<div style="margin-left: 10px; margin-bottom: 4px; display: flex;"><span style="margin-right: 8px;">•</span><span>${parseInlineHtml(content)}</span></div>`;
        }

        // Paragraphs
        return `<div style="margin-bottom: 8px; line-height: 1.5;">${parseInlineHtml(trimmed)}</div>`;
    }).join('');
};

interface StarChartProps {
    allPalaces: any[];
    language: 'zh' | 'en';
}

const StarChart = ({ allPalaces, language }: StarChartProps) => {
    const [loadingPalaces, setLoadingPalaces] = useState<Record<number, boolean>>({});
    const [currentPalaces, setCurrentPalaces] = useState(allPalaces);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Sync with props if they change (e.g. new generation)
    useEffect(() => {
        setCurrentPalaces(allPalaces);
    }, [allPalaces]);

    // Infinite Scroll: Duplicate data 3 times
    const palaces = [...currentPalaces, ...currentPalaces, ...currentPalaces];

    useEffect(() => {
        if (containerRef.current && currentPalaces.length > 0) {
            // Scroll to the start of the middle set
            const cardWidth = containerRef.current.scrollWidth / 3;
            containerRef.current.scrollLeft = cardWidth;
        }
    }, [currentPalaces]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (container.children.length === 0) return;

        const firstCard = container.children[0] as HTMLElement;
        const cardWidth = firstCard.offsetWidth + 16;
        const oneSetWidth = cardWidth * 12;
        const buffer = 50;

        if (container.scrollLeft < buffer) {
            container.scrollLeft += oneSetWidth;
        } else if (container.scrollLeft > (oneSetWidth * 2) - buffer) {
            container.scrollLeft -= oneSetWidth;
        }
    };

    const handleGenerateSinglePalaceImpl = async (index: number) => {
        const realIndex = index % 12;
        if (loadingPalaces[realIndex] || currentPalaces[realIndex].analysis) return;

        setLoadingPalaces(prev => ({ ...prev, [realIndex]: true }));
        try {
            const palace = currentPalaces[realIndex];
            const res = await fetch('/api/analyze/palace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    palaceName: palace.name,
                    palaceIndex: realIndex,
                    allPalaces: currentPalaces,
                    stars: {
                        majorStars: palace.majorStars,
                        minorStars: palace.minorStars,
                        adjectiveStars: palace.adjectiveStars
                    },
                    decadal: palace.decadal,
                    context: "Global context placeholder",
                    language: language
                }),
            });
            const result = await res.json();

            setCurrentPalaces(prev => {
                const newPalaces = [...prev];
                newPalaces[realIndex] = { ...newPalaces[realIndex], analysis: result.analysis };
                return newPalaces;
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPalaces(prev => ({ ...prev, [realIndex]: false }));
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // 1. Ensure all palaces have analysis
            const missingIndices = currentPalaces
                .map((p, i) => p.analysis ? -1 : i)
                .filter(i => i !== -1);

            let completePalaces = [...currentPalaces];

            if (missingIndices.length > 0) {
                const promises = missingIndices.map(async (index) => {
                    const palace = currentPalaces[index];
                    try {
                        const res = await fetch('/api/analyze/palace', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                palaceName: palace.name,
                                palaceIndex: index,
                                allPalaces: currentPalaces,
                                stars: {
                                    majorStars: palace.majorStars,
                                    minorStars: palace.minorStars,
                                    adjectiveStars: palace.adjectiveStars
                                },
                                decadal: palace.decadal,
                                context: "Global context placeholder",
                                language: language
                            }),
                        });
                        const result = await res.json();
                        return { index, analysis: result.analysis };
                    } catch (e) {
                        console.error(`Failed to fetch palace ${index}`, e);
                        return { index, analysis: 'Analysis failed.' };
                    }
                });

                const results = await Promise.all(promises);
                results.forEach(({ index, analysis }) => {
                    completePalaces[index] = { ...completePalaces[index], analysis };
                });

                // Update local state with fetched analyses so UI reflects it too
                setCurrentPalaces(completePalaces);
            }

            // 2. Generate HTML content
            const content = document.createElement('div');
            content.className = 'p-8 bg-white text-black font-serif';
            content.innerHTML = `
                <h1 style="text-align: center; font-size: 24px; margin-bottom: 30px; font-weight: bold;">Ziwei Astrolabe Report</h1>
                ${completePalaces.map((p, i) => `
                    <div style="margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 4px;">
                        <h2 style="font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; font-weight: bold;">
                            ${p.name} <span style="font-weight: normal; font-size: 14px; color: #666;">(${p.earthlyBranch})</span>
                        </h2>
                        <div style="font-size: 11px; color: #333;">
                            ${parseMarkdownToHtml(p.analysis || 'No analysis available.')}
                        </div>
                    </div>
                `).join('')}
            `;

            // 3. Generate PDF
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: 10,
                filename: 'ziwei-report.pdf',
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(content).save();

        } catch (error) {
            console.error('PDF generation failed', error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="w-full py-12 overflow-hidden relative group">
            {/* Enhanced Mask */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,black_0%,transparent_30%,transparent_70%,black_100%)] z-10 pointer-events-none" />

            <div className="text-center mb-8 relative z-20">
                <h3 className="text-xl font-serif text-white mb-2">Ziwei Astrolabe</h3>
                <p className="text-gray-500 text-xs tracking-widest uppercase mb-4">Swipe to Explore Palaces</p>

                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPdf}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs uppercase tracking-widest text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGeneratingPdf ? 'Generating Report...' : 'Download Full Report'}
                </button>
            </div>

            {/* Carousel Container */}
            <div
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory pb-12 no-scrollbar gap-4 items-start"
                style={{
                    scrollBehavior: 'auto',
                    paddingLeft: 'calc(50% - 225px)', // Use % to avoid scrollbar issues
                    paddingRight: 'calc(50% - 225px)',
                }}
                onScroll={handleScroll}
            >
                {palaces.map((palace: any, idx: number) => (
                    <PalaceCard
                        key={`${palace.name}-${idx}`}
                        palace={palace}
                        index={idx % 12}
                        allPalaces={currentPalaces}
                        language={language}
                        onGenerate={() => handleGenerateSinglePalaceImpl(idx)}
                        isLoading={loadingPalaces[idx % 12]}
                    />
                ))}
            </div>

            {/* Mobile Padding Adjustment Style */}
            <style jsx>{`
                @media (max-width: 768px) {
                    .no-scrollbar {
                        padding-left: calc(50vw - 42.5vw); /* Center 85vw card */
                        padding-right: calc(50vw - 42.5vw);
                    }
                }
            `}</style>
        </div>
    );
}

function PalaceCard({ palace, index, allPalaces, language, onGenerate, isLoading }: { palace: any, index: number, allPalaces: any[], language: 'zh' | 'en', onGenerate: () => void, isLoading: boolean }) {
    const [expanded, setExpanded] = useState(false);

    const handleGenerateReport = () => {
        if (palace.analysis) {
            setExpanded(!expanded);
        } else {
            onGenerate();
        }
    };

    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={j} className="text-white font-bold tracking-wide">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    // Enhanced Markdown Parser
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();

            // Headers (H1-H6)
            const headerMatch = trimmed.match(/^(#+)\s+(.*)/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const content = headerMatch[2];

                if (level === 1) {
                    return (
                        <h1 key={i} className="text-3xl font-serif text-white mt-8 mb-6 pb-4 border-b border-white/10 tracking-wider text-center">
                            {content}
                        </h1>
                    );
                }
                if (level === 2) {
                    return (
                        <h2 key={i} className="text-xl font-serif text-gray-200 mt-8 mb-4 flex items-center gap-3">
                            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                            {content}
                        </h2>
                    );
                }
                if (level >= 3) {
                    return (
                        <h3 key={i} className="text-sm font-sans uppercase tracking-[0.2em] text-gray-500 mt-6 mb-3 pl-1">
                            {content}
                        </h3>
                    );
                }
            }
            // List Items
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const content = trimmed.replace(/^[-*]\s+/, '');
                return (
                    <div key={i} className="flex gap-4 mb-2 pl-1 group">
                        <span className="text-gray-600 mt-2 text-[6px]">●</span>
                        <p className="text-gray-300 leading-loose text-sm md:text-base font-light">
                            {parseInline(content)}
                        </p>
                    </div>
                );
            }

            // Empty lines
            if (!trimmed) {
                return <div key={i} className="h-4" />;
            }

            // Regular Paragraphs
            return (
                <p key={i} className="mb-4 text-gray-300 leading-loose text-sm md:text-base font-light">
                    {parseInline(trimmed)}
                </p>
            );
        });
    };

    return (
        <div className="snap-center shrink-0 w-[85vw] md:w-[450px] perspective-1000">
            <motion.div
                className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 p-6 md:p-8 rounded-xl relative overflow-hidden group-hover:border-gray-600 transition-colors flex flex-col shadow-2xl"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-10% 0px -10% 0px" }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-6xl text-white select-none pointer-events-none">
                    {index + 1}
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="text-3xl font-serif text-white mb-1">{palace.name}</h4>
                        <div className="text-xs text-gray-400 uppercase tracking-widest">{palace.earthlyBranch} Palace</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">Decade</div>
                        <div className="text-sm font-mono text-gray-200">
                            {palace.decadal?.range?.[0]}-{palace.decadal?.range?.[1]}
                        </div>
                    </div>
                </div>

                {/* Major Stars */}
                <div className="flex flex-wrap gap-4 mb-6 min-h-[60px] items-center justify-center">
                    {palace.majorStars?.length > 0 ? (
                        palace.majorStars.map((star: any) => (
                            <div key={star.name} className="text-center">
                                <div className={`text-4xl font-serif mb-1 ${star.brightness === '庙' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' :
                                    star.brightness === '旺' ? 'text-yellow-200' : 'text-white'
                                    }`}>
                                    {star.name}
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider border border-gray-700 rounded px-1 inline-block">
                                    {star.brightness}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-600 italic font-serif text-sm">Empty Palace</div>
                    )}
                </div>

                {/* Minor Stars Grid */}
                <div className="grid grid-cols-4 gap-2 border-t border-gray-800 pt-4 mb-4">
                    {palace.minorStars?.map((star: any) => (
                        <div key={star.name} className="text-center">
                            <div className="text-xs text-gray-300 mb-0.5">{star.name}</div>
                            <div className="text-[9px] text-gray-500 scale-90">{star.brightness || '-'}</div>
                        </div>
                    ))}
                </div>

                {/* Adjective Stars (Misc) */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {palace.adjectiveStars?.map((star: any) => (
                        <span key={star.name} className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-black/50 rounded border border-gray-800">
                            {star.name}
                        </span>
                    ))}
                </div>

                {/* Report Section */}
                <div className="mt-auto pt-4 border-t border-gray-800">
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-white text-black hover:bg-gray-200 text-xs uppercase tracking-widest font-bold transition-colors rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span>Divining...</span>
                        ) : palace.analysis ? (
                            <><span>✧</span> {expanded ? 'Hide Insight' : 'Show Insight'}</>
                        ) : (
                            <><span>✦</span> Reveal Destiny</>
                        )}
                    </button>

                    <AnimatePresence>
                        {expanded && palace.analysis && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-6 pb-2">
                                    <div className="bg-black/40 rounded-lg p-6 border border-white/5 shadow-inner">
                                        {renderMarkdown(palace.analysis)}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
}

export default StarChart;
