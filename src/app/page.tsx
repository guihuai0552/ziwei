'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from '@/components/scroll-view/DatePicker';
import StarChart from '@/components/scroll-view/StarChart';

export default function Home() {
  const [step, setStep] = useState<'entry' | 'loading' | 'report'>('entry');
  const [astrolabeData, setAstrolabeData] = useState<any>(null);

  const handleGenerate = async (birthInfo: any) => {
    setStep('loading');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthInfo }),
      });

      const data = await response.json();

      if (data.astrolabe) {
        setAstrolabeData(data.astrolabe);
        setStep('report');
      } else {
        // Handle error
        console.error('No astrolabe data');
        setStep('entry');
      }
    } catch (e) {
      console.error(e);
      setStep('entry');
    }
  };

  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm transition-colors"
        >
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'entry' && (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <DatePicker onGenerate={handleGenerate} />
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-4"
          >
            <div className="text-center space-y-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                <img
                  src="/loading-spinner.jpg"
                  alt="Loading"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <h2 className="text-xl font-serif tracking-widest">ALIGNING STARS</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Calculating Destiny Code...</p>
            </div>
          </motion.div>
        )}

        {step === 'report' && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto"
          >
            <button
              onClick={() => setStep('entry')}
              className="mb-8 text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              ← Start Over
            </button>

            <div className="space-y-12 pb-24">
              <header className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-serif">Destiny Report</h1>
                <div className="w-12 h-1 bg-white mx-auto" />
              </header>

              <StarChart allPalaces={astrolabeData.palaces} language={language} />

              <footer className="text-center pt-12 border-t border-gray-900">
                <p className="text-gray-600 text-sm mb-4">Seek deeper guidance?</p>
                <button className="bg-white text-black px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-gray-200 transition-colors">
                  Book Consultation
                </button>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

