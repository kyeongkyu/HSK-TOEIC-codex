/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { hskWords } from '@/data/hsk';
import { Volume2, X, Star } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useUserWords } from '@/hooks/use-user-words';
import { speak } from '@/lib/tts';

const PUNCTUATION = /^[\u3002\uFF0C\uFF1F\uFF01\u201C\u201D\u3001\uFF1A\uFF1B\s]+$/;

const hskWordsMap = new Map(hskWords.map(w => [w.word, w]));

export default function SegmentedSentence({ 
  sentence, 
  hidePlayButton = false,
  interactive = true,
  className = '',
  variant = 'default',
}: { 
  sentence: string; 
  hidePlayButton?: boolean;
  interactive?: boolean;
  className?: string;
  variant?: 'default' | 'quizPrompt';
}) {
  const { ttsSpeed, hanziFont } = useSettings();
  const { userWords, toggleFavorite } = useUserWords();
  const [activeToken, setActiveToken] = useState<number | null>(null);

  const containerClasses =
    variant === 'quizPrompt'
      ? 'gap-y-4 gap-x-2 text-6xl sm:text-7xl text-black dark:text-white leading-[0.92] font-black whitespace-nowrap'
      : 'gap-y-3 gap-x-1 text-xl text-gray-600 dark:text-gray-300 leading-relaxed';

  const tokens = useMemo(() => {
    let i = 0;
    const newTokens = [];
    while (i < sentence.length) {
      let match = null;
      // Try to find the longest matching word in the dictionary (max length 5)
      for (let len = 5; len > 0; len--) {
        const sub = sentence.substring(i, i + len);
        const found = hskWordsMap.get(sub);
        if (found) {
          match = found;
          break;
        }
      }
      
      if (match) {
        newTokens.push({ text: match.word, wordData: match, isPunc: false });
        i += match.word.length;
      } else {
        const char = sentence[i];
        newTokens.push({ text: char, wordData: null, isPunc: PUNCTUATION.test(char) });
        i++;
      }
    }
    return newTokens;
  }, [sentence]);

  useEffect(() => {
    setActiveToken(null);
  }, [sentence]);

  const playAudio = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    speak(text, ttsSpeed);
  };

  return (
    <div className={`relative flex flex-wrap items-center justify-center ${containerClasses} ${className}`}>
      {activeToken !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveToken(null)} />
      )}
      
      {tokens.map((token, idx) => {
        const isLast = idx === tokens.length - 1;
        const nextIsPunc = tokens[idx + 1]?.isPunc;

        return (
          <span key={idx} className="relative flex items-center">
            {token.wordData && interactive ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToken(activeToken === idx ? null : idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveToken(activeToken === idx ? null : idx);
                  }
                }}
                className={`cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${activeToken === idx ? 'text-blue-600 dark:text-blue-400 font-bold' : ''} border-b-2 border-dashed border-blue-200 dark:border-blue-800 pb-0.5`}
                style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}
              >
                {token.text}
              </span>
            ) : (
              <span style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{token.text}</span>
            )}

            {!token.isPunc && !isLast && !nextIsPunc && interactive && (
              <span className="mx-1.5 text-gray-300 dark:text-gray-700 text-sm font-light">/</span>
            )}

            {activeToken === idx && token.wordData && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-gray-800 dark:bg-gray-950 text-white p-4 rounded-2xl shadow-2xl z-50 text-center text-sm transform transition-all animate-in fade-in zoom-in duration-200">
                <button onClick={(e) => { e.stopPropagation(); setActiveToken(null); }} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{token.wordData.word}</div>
                <div className="text-blue-300 dark:text-blue-400 font-medium text-base mb-2">{token.wordData.pinyin.toLowerCase()}</div>
                <div className="mb-3 text-gray-100 dark:text-gray-200">{token.wordData.meaning}</div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => playAudio(token.wordData.word, e)}
                    className="flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full p-2.5 transition-colors"
                  >
                    <Volume2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(token.wordData!.id);
                    }}
                    className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${
                      userWords[token.wordData.id]?.isFavorite 
                        ? 'bg-yellow-400/30 text-yellow-400 hover:bg-yellow-400/40' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Star size={18} fill={userWords[token.wordData.id]?.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-800 dark:border-t-gray-950"></div>
              </div>
            )}
          </span>
        );
      })}
      
      {!hidePlayButton && (
        <span 
          role="button"
          tabIndex={0}
          onClick={(e) => playAudio(sentence, e)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              playAudio(sentence, e as any);
            }
          }}
          className="ml-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer inline-flex items-center justify-center"
        >
          <Volume2 size={18} />
        </span>
      )}
    </div>
  );
}
