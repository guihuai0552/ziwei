'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from '@/components/scroll-view/DatePicker';
import StarChart from '@/components/scroll-view/StarChart';

export default function Home() {
  const [step, setStep] = useState<'entry' | 'loading' | 'report'>('entry');
  const [analyzingNames, setAnalyzingNames] = useState<string[]>([]);

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
        // Sort palaces by decadal range (ascending) for UI display
        const sortedPalaces = [...data.astrolabe.palaces].sort((a: any, b: any) => {
          const rangeA = a.decadal?.range?.[0] || 0;
          const rangeB = b.decadal?.range?.[0] || 0;
          return rangeA - rangeB;
        });

        // Find Life Palace in the original array for API call
        const originalLifePalaceIndex = data.astrolabe.palaces.findIndex((p: any) => p.isLifePalace || p.name === '命宫');

        // Find Life Palace in the sorted array for UI update
        const sortedLifePalaceIndex = sortedPalaces.findIndex((p: any) => p.isLifePalace || p.name === '命宫');

        let enrichedPalaces = [...sortedPalaces];

        if (originalLifePalaceIndex !== -1) {
          try {
            const palace = data.astrolabe.palaces[originalLifePalaceIndex];
            const res = await fetch('/api/analyze/palace', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                palaceName: palace.name,
                palaceIndex: originalLifePalaceIndex, // Use original index
                allPalaces: data.astrolabe.palaces, // Pass original array
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

            // Update the palace in the SORTED array
            if (sortedLifePalaceIndex !== -1) {
              enrichedPalaces[sortedLifePalaceIndex] = { ...enrichedPalaces[sortedLifePalaceIndex], analysis: result.analysis };
            }

          } catch (err) {
            console.error(`Failed to analyze Life Palace`, err);
          }
        }

        setAstrolabeData({ ...data.astrolabe, palaces: enrichedPalaces, originalPalaces: data.astrolabe.palaces });
        setStep('report');

        // Identify which palaces need analysis (all except Life Palace which is already done/started)
        const namesToAnalyze = data.astrolabe.palaces
          .filter((p: any, idx: number) => idx !== originalLifePalaceIndex)
          .map((p: any) => p.name);

        setAnalyzingNames(namesToAnalyze);

        // Trigger background analysis for ALL palaces (Simultaneous Analysis)
        data.astrolabe.palaces.forEach(async (palace: any, originalIndex: number) => {
          // Skip if already analyzed (Life Palace might be done or started)
          if (originalIndex === originalLifePalaceIndex) return;

          try {
            const res = await fetch('/api/analyze/palace', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                palaceName: palace.name,
                palaceIndex: originalIndex,
                allPalaces: data.astrolabe.palaces,
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

            // Update state with the new analysis
            setAstrolabeData((prev: any) => {
              if (!prev) return prev;

              // We need to update the palace in the 'palaces' array (which is SORTED)
              // and 'originalPalaces' (which is ORIGINAL order)

              const newOriginalPalaces = [...prev.originalPalaces];
              newOriginalPalaces[originalIndex] = { ...newOriginalPalaces[originalIndex], analysis: result.analysis };

              // Find where this palace is in the sorted array
              const newSortedPalaces = [...prev.palaces];
              const sortedIndex = newSortedPalaces.findIndex(p => p.name === palace.name);
              if (sortedIndex !== -1) {
                newSortedPalaces[sortedIndex] = { ...newSortedPalaces[sortedIndex], analysis: result.analysis };
              }

              return {
                ...prev,
                palaces: newSortedPalaces,
                originalPalaces: newOriginalPalaces
              };
            });

          } catch (err) {
            console.error(`Background analysis failed for ${palace.name}`, err);
          } finally {
            setAnalyzingNames(prev => prev.filter(name => name !== palace.name));
          }
        });
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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const handleUnlockRequest = () => {
    setShowUnlockModal(true);
    setRedeemSuccess(false); // Reset
    setRedeemCode(''); // Reset
    setRedeemError(''); // Reset
  };

  const handleRedeem = async () => {
    if (!redeemCode) return;
    setIsRedeeming(true);
    setRedeemError('');

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsUnlocked(true);
        setRedeemSuccess(true);
        setTimeout(() => {
          setShowUnlockModal(false);
        }, 1500);
      } else {
        setRedeemError(data.error || 'Redemption failed');
      }
    } catch (e) {
      setRedeemError('Network error');
    } finally {
      setIsRedeeming(false);
    }
  };

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

              <StarChart
                allPalaces={astrolabeData.palaces}
                language={language}
                isUnlocked={isUnlocked}
                onUnlockRequest={handleUnlockRequest}
                analyzingNames={analyzingNames}
              />

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

      {/* Unlock Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowUnlockModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                ✕
              </button>

              {redeemSuccess ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-2xl font-serif text-white mb-2">Unlocked Successfully!</h3>
                  <p className="text-gray-400 text-sm">Revealing your destiny...</p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-serif text-white mb-2 text-center">Unlock Full Report</h3>
                  <p className="text-gray-400 text-sm text-center mb-6">
                    Enter your redemption code to reveal the hidden wisdom of all 12 palaces.
                  </p>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter 15-character Redemption ID"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                    />

                    {redeemError && (
                      <p className="text-red-400 text-xs text-center">{redeemError}</p>
                    )}

                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming || !redeemCode}
                      className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                      {isRedeeming ? 'Verifying...' : 'Unlock Now'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

