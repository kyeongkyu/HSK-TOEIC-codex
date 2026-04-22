'use client';
import { useUserWords } from '@/hooks/use-user-words';
import { hskWords } from '@/data/hsk';
import { toeicWords } from '@/data/toeic';
import Link from 'next/link';
import { Star, BookOpen, Brain, CheckSquare } from 'lucide-react';
import { useState, useMemo } from 'react';
import { speak } from '@/lib/tts';
import { useSettings } from '@/hooks/use-settings';

export default function LibraryPage() {
  const { userWords, toggleFavorite, isLoaded } = useUserWords();
  const { ttsSpeed, separateLibraryByLevel, selectedLevel, hanziFont, appMode } = useSettings();
  const [isMemorizeMode, setIsMemorizeMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({});
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedWords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpeakWord = (word: { id: string; word: string }) => {
    setSpeakingWordId(word.id);
    speak(word.word, ttsSpeed, appMode === 'toeic' ? 'en-US' : 'zh-CN', () => {
      setSpeakingWordId(current => current === word.id ? null : current);
    });
  };

  const favoriteWords = useMemo(() => {
    const favoriteWordIds = new Set(Object.keys(userWords).filter(id => userWords[id]?.isFavorite));
    let filtered = (appMode === 'toeic' ? toeicWords : hskWords).filter(w => favoriteWordIds.has(w.id));
    
    if (appMode !== 'toeic' && separateLibraryByLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(w => w.level === selectedLevel);
    }
    
    return filtered;
  }, [userWords, separateLibraryByLevel, selectedLevel, appMode]);

  if (!isLoaded) return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;

  return (
    <div className="px-6 flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      {/* Header */}
      <div className="pt-12 mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Collection</span>
            <h1 className="text-4xl font-black text-black dark:text-white">Library</h1>
          </div>
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{favoriteWords.length}</span>
          </div>
        </div>

        {favoriteWords.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsMemorizeMode(!isMemorizeMode);
                setRevealedWords({});
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all active:scale-95 transform-gpu ${isMemorizeMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'}`}
            >
              <Brain size={18} />
              <span>{isMemorizeMode ? 'Reviewing' : 'Memorize'}</span>
            </button>
            <Link
              href="/library/quiz"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all active:scale-95 bg-black dark:bg-blue-500 text-white shadow-lg transform-gpu"
            >
              <CheckSquare size={18} />
              <span>Quiz</span>
            </Link>
          </div>
        )}
      </div>

      {favoriteWords.length === 0 ? (
        <div className="p-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-[2rem] flex flex-col items-center text-center transform-gpu">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <Star size={32} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-black dark:text-white mb-2">No favorites yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-[200px]">
            Curate your collection by starring words in Browse mode.
          </p>
          <Link 
            href={appMode === 'toeic' ? "/" : "/study"} 
            className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-blue-600/20 transform-gpu"
          >
            <BookOpen size={18} />
            <span>Start Browsing</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favoriteWords.map(word => (
            <div 
              key={word.id} 
              className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl flex items-center justify-between group relative overflow-hidden transform-gpu"
            >
              <div className="flex items-center gap-4 z-10 min-w-0 flex-1">
                <button 
                  onClick={() => toggleFavorite(word.id)}
                  className="text-yellow-500 p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90 transform-gpu"
                >
                  <Star size={20} fill="currentColor" />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleSpeakWord(word)}
                      className={`${appMode === 'toeic' ? 'text-xl' : 'text-3xl'} font-bold truncate text-left transition-colors active:scale-[0.98] transform-gpu ${speakingWordId === word.id ? 'text-blue-600 dark:text-blue-400' : 'text-black dark:text-white'}`}
                      style={appMode === 'toeic' ? undefined : { fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}
                      aria-label={`Listen to ${word.word}`}
                    >
                      {word.word}
                    </button>
                    {appMode === 'toeic' && (
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase">
                        {word.pinyin}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div 
                className={`flex flex-col items-end text-right z-10 shrink-0 max-w-[42%] ${isMemorizeMode ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (isMemorizeMode) {
                    toggleReveal(word.id);
                  }
                }}
              >
                {isMemorizeMode && !revealedWords[word.id] ? (
                  <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tap to reveal</span>
                  </div>
                ) : (
                  <>
                    {appMode !== 'toeic' && (
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 italic mb-1">{word.pinyin.toLowerCase()}</span>
                    )}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-snug">{word.meaning}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
