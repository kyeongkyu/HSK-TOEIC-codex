/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettings } from '@/hooks/use-settings';
import { useUserWords } from '@/hooks/use-user-words';
import { hskWords } from '@/data/hsk';
import { HSK_CATEGORIES } from '@/data/hsk-categories';
import HanziWord from '@/components/HanziWord';
import SegmentedSentence from '@/components/SegmentedSentence';
import { Volume2, ChevronLeft, ChevronRight, X, List, Info, Star, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '@/lib/tts';

import { Suspense } from 'react';

const getFocusHanziTextSize = (word: string, hanziSize: number) => {
  const length = Array.from(word).length;

  if (hanziSize === 1) {
    if (length >= 5) return 'text-3xl';
    return 'text-4xl';
  }

  if (hanziSize === 2) {
    if (length >= 5) return 'text-3xl';
    if (length === 4) return 'text-4xl';
    if (length === 3) return 'text-5xl';
    return 'text-6xl';
  }

  if (length >= 5) return 'text-5xl';
  if (length === 4) return 'text-6xl';
  if (length === 3) return 'text-7xl';
  return 'text-8xl';
};

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wordIdParam = searchParams.get('wordId');
  const { selectedLevel, ttsSpeed, hanziWriterMode, hanziFont, hanziSize, isLoaded: settingsLoaded } = useSettings();
  const { userWords, toggleFavorite, isLoaded: wordsLoaded } = useUserWords();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'focus' | 'list'>('focus');
  const [pendingListFocusWordId, setPendingListFocusWordId] = useState<string | null>(null);
  const [listReturnHighlightId, setListReturnHighlightId] = useState<string | null>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<number | null>(null);

  const categories = useMemo(() => {
    const levelNum = Number(selectedLevel);
    if (HSK_CATEGORIES[String(levelNum)]) {
      return HSK_CATEGORIES[String(levelNum)];
    }
    return null;
  }, [selectedLevel]);

  const filteredWords = useMemo(() => {
    if (!settingsLoaded) return [];
    let words = selectedLevel === 'all' || selectedLevel === null
      ? hskWords
      : hskWords.filter(w => Number(w.level) === Number(selectedLevel));

    if (categories && selectedTopicId) {
      const category = categories.find(c => c.id === selectedTopicId);
      if (category && category.words) {
        words = words.filter(w => category.words.includes(w.word));
      }
    }
    return words;
  }, [selectedLevel, settingsLoaded, selectedTopicId, categories]);

  useEffect(() => {
    if (wordIdParam && filteredWords.length > 0) {
      const index = filteredWords.findIndex(w => w.id === wordIdParam);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [wordIdParam, filteredWords]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode !== 'list' || !selectedTopicId || !pendingListFocusWordId) return;

    const targetWordId = pendingListFocusWordId;
    const frameId = requestAnimationFrame(() => {
      const target = listItemRefs.current[targetWordId];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setListReturnHighlightId(targetWordId);
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setListReturnHighlightId((prev) => (prev === targetWordId ? null : prev));
          highlightTimeoutRef.current = null;
        }, 1200);
      }
      setPendingListFocusWordId(null);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [viewMode, selectedTopicId, pendingListFocusWordId]);

  useEffect(() => {
    const shouldLockScroll = Boolean(selectedTopicId && viewMode === 'focus' && !isListOpen);
    if (!shouldLockScroll) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    const lockScroll = () => {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') lockScroll();
    };

    lockScroll();
    window.addEventListener('pageshow', lockScroll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', lockScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [isListOpen, selectedTopicId, viewMode]);

  if (!settingsLoaded || !wordsLoaded) return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;

  if (categories && !selectedTopicId) {
    return (
      <div className="flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="px-6 pt-8 flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all transform-gpu"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="ml-4 text-xl font-black text-black dark:text-white">HSK {selectedLevel} Topic</h1>
          </div>
          
          <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
            <button
              onClick={() => setViewMode('focus')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'focus'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
        
        <div className="px-6 grid grid-cols-1 gap-4 pb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedTopicId(category.id)}
              className="w-full p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl text-left active:scale-[0.98] transition-all hover:border-blue-500/50 group transform-gpu will-change-transform"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-black dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {category.words.length} words
                  </p>
                </div>
                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (filteredWords.length === 0) {
    return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">No words found for this level.</div>;
  }

  const currentWord = filteredWords[currentIndex] || filteredWords[0];
  const isFavorite = userWords[currentWord.id]?.isFavorite || false;
  const focusHanziTextSize = getFocusHanziTextSize(currentWord.word, hanziSize);

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex(prev => Math.min(filteredWords.length - 1, prev + 1));

  const playAudio = (text: string) => {
    speak(text, ttsSpeed);
  };

  if (viewMode === 'list' && selectedTopicId) {
    return (
      <div className="flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="px-5 pt-8 flex items-center justify-between gap-3 mb-8">
          <div className="flex min-w-0 flex-1 items-center">
            <button
              onClick={() => setSelectedTopicId(null)}
              className="p-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all shrink-0 transform-gpu"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="ml-4 min-w-0 truncate text-xl font-black text-black dark:text-white">
              {categories?.find(c => c.id === selectedTopicId)?.name}
            </h1>
          </div>
          <div className="flex shrink-0 gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
            <button
              onClick={() => setViewMode('focus')}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            >
              Focus
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
            >
              List
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-12">
          {filteredWords.map((w, idx) => (
            <div
              key={w.id}
              ref={(node) => {
                listItemRefs.current[w.id] = node;
              }}
              role="button"
              tabIndex={0}
              onClick={() => {
                setCurrentIndex(idx);
                setViewMode('focus');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setCurrentIndex(idx);
                  setViewMode('focus');
                }
              }}
              className={`w-full text-left p-5 rounded-2xl flex justify-between items-center transition-all border bg-gray-50 dark:bg-gray-800/50 text-black dark:text-white transform-gpu cursor-pointer active:scale-[0.99] ${
                listReturnHighlightId === w.id
                  ? 'border-blue-500 dark:border-blue-400 [animation:pulse_0.55s_ease-in-out_2]'
                  : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold leading-none" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{w.word}</span>
                  <span className="text-sm font-bold tracking-wider text-gray-400">
                    {w.pinyin.toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 text-right">
                  {w.meaning}
                </span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    playAudio(w.word);
                  }}
                  className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-black dark:text-white active:scale-90 transition-all transform-gpu"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="px-5 pt-4 sm:pt-6 flex shrink-0 items-center justify-between mb-4">
        <div className="flex items-center min-w-0 mr-4">
          <button 
            onClick={() => {
              if (categories && selectedTopicId) {
                setSelectedTopicId(null);
                setCurrentIndex(0);
              } else {
                router.back();
              }
            }}
            className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all flex-shrink-0 transform-gpu"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          {categories && selectedTopicId && (
            <h1 className="ml-4 text-xl font-black text-black dark:text-white truncate">
              {categories.find(c => c.id === selectedTopicId)?.name}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          {categories && selectedTopicId && (
            <button
              onClick={() => {
                setPendingListFocusWordId(currentWord.id);
                setViewMode('list');
              }}
              className="mr-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-gray-100 dark:bg-gray-800 text-black dark:text-white active:scale-95 transform-gpu"
            >
              List
            </button>
          )}
          <button
            onClick={() => setIsListOpen(true)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-4 py-2.5 rounded-xl font-bold active:scale-95 transition-all"
          >
            <List size={16} />
            <span className="text-sm">{currentIndex + 1} / {filteredWords.length}</span>
          </button>
        </div>
      </div>

      {/* Word Content */}
      <div className="flex-1 min-h-0 px-5 flex flex-col items-center justify-start text-center gap-5 w-full max-w-md mx-auto overflow-hidden pb-3">
        <div className="relative w-full">
          {currentWord.memorizationTip && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl mb-5 relative"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Info size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Learning Tip</span>
              </div>
              <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed font-medium italic">
                &ldquo;{currentWord.memorizationTip}&rdquo;
              </p>
            </motion.div>
          )}
          
          <div className="relative inline-block max-w-full mb-3">
            {hanziWriterMode ? (
              <HanziWord word={currentWord.word} shouldAnimate={true} singleLine />
            ) : (
              <div className={`${focusHanziTextSize} max-w-full whitespace-nowrap font-bold leading-none tracking-tight text-black dark:text-white`} style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                {currentWord.word}
              </div>
            )}
            <button
              onClick={() => toggleFavorite(currentWord.id)}
              className={`absolute -top-3 -right-10 p-3 rounded-full transition-all active:scale-95 ${
                isFavorite ? 'text-yellow-500' : 'text-gray-200 dark:text-gray-700'
              }`}
            >
              <Star size={32} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          
              <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="flex items-center justify-center w-full gap-3">
              <div className="w-11" /> {/* Spacer to balance the audio button for center alignment */}
              <div className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{currentWord.pinyin.toLowerCase()}</span>
                {currentWord.phonetic && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-mono mt-1">{currentWord.phonetic}</span>
                )}
              </div>
              <button 
                onClick={() => playAudio(currentWord.word)} 
                className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-black dark:text-white active:scale-90 transition-all"
              >
                <Volume2 size={20} />
              </button>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white">
              {currentWord.meaning}
            </h2>
          </div>
        </div>
        
        {currentWord.example && (
          <div className="w-full space-y-2.5">
            <div className="h-px w-12 bg-gray-100 dark:bg-gray-800 mx-auto" />
            <div className="space-y-2.5" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
              <SegmentedSentence sentence={currentWord.example} />
              {currentWord.exampleTranslation && (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  {currentWord.exampleTranslation}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 pt-2 grid shrink-0 grid-cols-2 gap-3" style={{ paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}>
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white py-4 rounded-2xl font-bold disabled:opacity-30 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>
        <button 
          onClick={handleNext}
          disabled={currentIndex === filteredWords.length - 1}
          className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white py-4 rounded-2xl font-bold disabled:opacity-30 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* List Overlay */}
      <AnimatePresence>
        {isListOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900"
          >
            <div className="px-6 pt-8 pb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-black dark:text-white">Word List</h2>
              <button 
                onClick={() => setIsListOpen(false)} 
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-black dark:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-12">
              {filteredWords.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsListOpen(false);
                  }}
                  className={`w-full text-left p-5 rounded-2xl flex justify-between items-center transition-all border ${
                    currentIndex === idx 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-black dark:text-white'
                  }`}
                >
                <div className="flex items-baseline gap-4">
                    <span className={`text-xs font-bold ${currentIndex === idx ? 'text-white/50' : 'text-gray-400'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold leading-none mb-1" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{w.word}</span>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold tracking-wider ${currentIndex === idx ? 'text-white/60' : 'text-gray-500'}`}>
                          {w.pinyin.toLowerCase()}
                        </span>
                        {w.phonetic && (
                          <span className={`text-[8px] font-medium font-mono ${currentIndex === idx ? 'text-white/40' : 'text-gray-400 italic'}`}>
                            {w.phonetic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${currentIndex === idx ? 'text-white/80' : 'text-gray-500'}`}>
                    {w.meaning}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>}>
      <StudyContent />
    </Suspense>
  );
}
