/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserWords } from '@/hooks/use-user-words';
import { useSettings } from '@/hooks/use-settings';
import { hskWords } from '@/data/hsk';
import { HSK_CATEGORIES } from '@/data/hsk-categories';
import { processReview } from '@/lib/srs';
import HanziWord from '@/components/HanziWord';
import { Volume2, Info, Star, ArrowLeft, ChevronRight } from 'lucide-react';
import { speak } from '@/lib/tts';

export default function MemorizePage() {
  const router = useRouter();
  const { userWords, updateWord, toggleFavorite, isLoaded: wordsLoaded } = useUserWords();
  const { selectedLevel, ttsSpeed, hanziWriterMode, hanziFont, hanziSize, isLoaded: settingsLoaded } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [sessionWords, setSessionWords] = useState<typeof hskWords>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const hanziTextSize = hanziSize === 1 ? 'text-4xl' : hanziSize === 2 ? 'text-6xl' : 'text-8xl';

  const categories = useMemo(() => {
    const levelNum = Number(selectedLevel);
    if (HSK_CATEGORIES[String(levelNum)]) {
      return HSK_CATEGORIES[String(levelNum)];
    }
    return null;
  }, [selectedLevel]);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const topicWords = useMemo(() => {
    if (!wordsLoaded || !settingsLoaded) return [];
    let filteredWords = selectedLevel === 'all' || selectedLevel === null
      ? hskWords 
      : hskWords.filter(w => Number(w.level) === Number(selectedLevel));

    if (categories && selectedTopicId) {
      const category = categories.find(c => c.id === selectedTopicId);
      if (category && category.words) {
        filteredWords = filteredWords.filter(w => category.words.includes(w.word));
      }
    }
    return filteredWords;
  }, [wordsLoaded, settingsLoaded, selectedLevel, selectedTopicId, categories]);

  const dueWords = useMemo(() => {
    if (now === null) return [];
    return topicWords.filter(w => {
      const uw = userWords[w.id];
      return uw && uw.nextReview <= now;
    });
  }, [topicWords, userWords, now]);

  useEffect(() => {
    if (!isReviewing && (!categories || selectedTopicId) && dueWords.length > 0) {
      setSessionWords(dueWords);
      setIsReviewing(true);
    }
  }, [dueWords, categories, selectedTopicId, isReviewing]);

  useEffect(() => {
    if (categories && !selectedTopicId) {
      setSessionWords([]);
      setIsReviewing(false);
      setCurrentIndex(0);
    }
  }, [selectedTopicId, categories]);

  if (!wordsLoaded || !settingsLoaded || now === null) return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;

  if (categories && !selectedTopicId) {
    return (
      <div className="flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="px-6 pt-8 flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all transform-gpu"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="ml-4 text-xl font-black text-black dark:text-white">HSK {selectedLevel} Topic</h1>
        </div>
        
        <div className="px-6 grid grid-cols-1 gap-4 pb-12">
          {categories.map((category) => {
            const topicWords = hskWords.filter(w => Number(w.level) === Number(selectedLevel) && category.words && category.words.includes(w.word));
            const dueInTopic = topicWords.filter(w => {
              const uw = userWords[w.id];
              return uw && uw.nextReview <= now;
            }).length;

            return (
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {category.words.length} words
                      </p>
                      {dueInTopic > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">
                          {dueInTopic} DUE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const activeWords = isReviewing ? sessionWords : dueWords;
  const isFinished = isReviewing 
    ? currentIndex >= sessionWords.length 
    : (dueWords.length === 0);

  if (isFinished) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-900">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold mb-3 text-black dark:text-white">All caught up!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">You have reviewed all due words for this topic.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          <button
            onClick={() => {
              if (categories && selectedTopicId) {
                setSelectedTopicId(null);
                setCurrentIndex(0);
              } else {
                router.back();
              }
            }}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold active:scale-95 transition-all transform-gpu"
          >
            {categories && selectedTopicId ? 'Back to Topics' : 'Go Back'}
          </button>
          <button
            onClick={() => {
              setSessionWords(topicWords);
              setCurrentIndex(0);
              setIsReviewing(true);
            }}
            className="w-full px-8 py-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-2xl font-bold active:scale-95 transition-all transform-gpu"
          >
            다시 학습하기
          </button>
        </div>
      </div>
    );
  }

  const currentWord = activeWords[currentIndex];
  const isFavorite = userWords[currentWord.id]?.isFavorite || false;

  const handleReview = (isCorrect: boolean) => {
    const uw = userWords[currentWord.id];
    const updated = processReview(uw, isCorrect);
    updateWord(currentWord.id, updated);
    setCurrentIndex(prev => prev + 1);
  };

  const playAudio = (text: string) => {
    speak(text, ttsSpeed);
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="px-6 pt-8 flex items-center justify-between mb-8">
        <button 
          onClick={() => {
            if (categories && selectedTopicId) {
              setSelectedTopicId(null);
              setCurrentIndex(0);
            } else {
              router.back();
            }
          }}
          className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all transform-gpu"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Reviewing • {currentIndex + 1} / {activeWords.length}
        </div>
        <div className="w-11" />
      </div>

      {/* Word Content */}
      <div className="flex-1 px-6 flex flex-col items-center justify-center text-center space-y-10 w-full max-w-md mx-auto">
        <div className="relative w-full">
          {currentWord.memorizationTip && (
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl mb-10 relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Info size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Learning Tip</span>
              </div>
              <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed font-medium italic">
                &ldquo;{currentWord.memorizationTip}&rdquo;
              </p>
            </div>
          )}
          
          <div className="relative inline-block mb-4">
            {hanziWriterMode ? (
              <HanziWord word={currentWord.word} shouldAnimate={true} />
            ) : (
              <div className={`${hanziTextSize} font-bold text-black dark:text-white`} style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                {currentWord.word}
              </div>
            )}
            <button
              onClick={() => toggleFavorite(currentWord.id)}
                className={`absolute -top-4 -right-12 p-3 rounded-full transition-all active:scale-95 transform-gpu ${
                isFavorite ? 'text-yellow-500' : 'text-gray-200 dark:text-gray-700'
              }`}
            >
              <Star size={32} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center w-full gap-3">
              <div className="w-11" /> {/* Spacer to balance the audio button for center alignment */}
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentWord.pinyin.toLowerCase()}</span>
                {currentWord.phonetic && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-mono mt-1">{currentWord.phonetic}</span>
                )}
              </div>
              <button 
                onClick={() => playAudio(currentWord.word)} 
                  className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-black dark:text-white active:scale-90 transition-all transform-gpu"
              >
                <Volume2 size={20} />
              </button>
            </div>
            <h2 className="text-4xl font-black text-black dark:text-white">
              {currentWord.meaning}
            </h2>
          </div>
        </div>
        
        {currentWord.example && (
          <div className="w-full space-y-4">
            <div className="h-px w-12 bg-gray-100 dark:bg-gray-800 mx-auto" />
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                  &ldquo;{currentWord.example}&rdquo;
                </span>
                <button 
                  onClick={() => playAudio(currentWord.example)} 
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90 transition-all transform-gpu"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              {currentWord.exampleTranslation && (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  {currentWord.exampleTranslation}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Buttons */}
      <div className="px-6 pb-12 grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleReview(false)}
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-black dark:text-white py-5 rounded-2xl font-bold active:scale-95 transition-all transform-gpu"
        >
          <span>Don&apos;t Know</span>
        </button>
        <button 
          onClick={() => handleReview(true)}
            className="flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white py-5 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-blue-600/20 transform-gpu"
        >
          <span>Know</span>
        </button>
      </div>
    </div>
  );
}
