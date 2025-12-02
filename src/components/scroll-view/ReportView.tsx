'use client';

import { motion } from 'framer-motion';

interface ReportViewProps {
    report: string;
    isLoading: boolean;
}

export default function ReportView({ report, isLoading }: ReportViewProps) {
    return (
        <div className="w-full max-w-md mx-auto text-left font-serif leading-relaxed">
            {isLoading ? (
                <div className="py-12 text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-t-2 border-white rounded-full mx-auto"
                    />
                    <p className="text-xs uppercase tracking-widest text-gray-500 animate-pulse">
                        Consulting the Stars...
                    </p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-headings:font-serif"
                >
                    {/* Simple markdown rendering - for MVP just text or use a library if needed. 
              Here we assume report is simple text or we can use a basic parser later. 
              For now, just displaying as whitespace-pre-wrap */}
                    <div className="whitespace-pre-wrap">{report}</div>
                </motion.div>
            )}
        </div>
    );
}
