'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useCompletion } from '@ai-sdk/react';

interface StarChartProps {
    allPalaces: any[];
    language: 'zh' | 'en';
}

export default function StarChart({ allPalaces, language }: StarChartProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: containerRef });
    // Infinite Scroll: Duplicate data 3 times
    // We will scroll to the middle set initially
    const palaces = [...allPalaces, ...allPalaces, ...allPalaces];

    useEffect(() => {
        if (containerRef.current && allPalaces.length > 0) {
            // Scroll to the start of the middle set
            const cardWidth = containerRef.current.scrollWidth / 3;
            containerRef.current.scrollLeft = cardWidth;
        }
    }, [allPalaces]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        // ... (scroll logic remains same)
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

    if (!allPalaces || allPalaces.length === 0) return null;

    return (
        <div className="w-full py-12 overflow-hidden relative group">
            {/* Enhanced Mask */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,black_0%,transparent_30%,transparent_70%,black_100%)] z-10 pointer-events-none" />

            <div className="text-center mb-8">
                <h3 className="text-xl font-serif text-white mb-2">Ziwei Astrolabe</h3>
                <p className="text-gray-500 text-xs tracking-widest uppercase">Swipe to Explore Palaces</p>
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
                    // Pass the original 12 palaces for context
                    <PalaceCard
                        key={`${palace.name}-${idx}`}
                        palace={palace}
                        index={idx % 12}
                        allPalaces={allPalaces} // Changed 'data.palaces' to 'allPalaces'
                        language={language}
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

function PalaceCard({ palace, index, allPalaces, language }: { palace: any, index: number, allPalaces: any[], language: 'zh' | 'en' }) {
    const [expanded, setExpanded] = useState(false);

    const { completion, complete, isLoading } = useCompletion({
        api: '/api/analyze/palace',
    });

    if (!palace) return null;

    const handleGenerateReport = async () => {
        if (completion) {
            setExpanded(!expanded);
            return;
        }

        setExpanded(true);
        try {
            await complete('', {
                body: {
                    palaceName: palace.name,
                    palaceIndex: index,
                    allPalaces: allPalaces,
                    stars: {
                        majorStars: palace.majorStars,
                        minorStars: palace.minorStars,
                        adjectiveStars: palace.adjectiveStars
                    },
                    decadal: palace.decadal,
                    context: "Global context placeholder",
                    language: language
                }
            });
        } catch (error) {
            console.error('Failed to generate report', error);
        }
    };

    // Simple Markdown Parser for Bold text
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Header detection
            if (line.startsWith('### ')) {
                return <h4 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('## ')) {
                return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-3">{line.replace('## ', '')}</h3>;
            }

            // Bold parsing
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-2 text-gray-300 leading-relaxed">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
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
                        className="w-full py-3 px-4 bg-white text-black hover:bg-gray-200 text-xs uppercase tracking-widest font-bold transition-colors rounded flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">✧</span> Analyzing...
                            </>
                        ) : (
                            <>
                                <span>✧</span> {completion ? (expanded ? 'Hide Insight' : 'Show Insight') : 'Reveal Destiny'}
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {expanded && (completion || isLoading) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-6 pb-2 text-sm">
                                    {renderMarkdown(completion)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
}
