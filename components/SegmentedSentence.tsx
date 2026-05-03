/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { hskWords } from '@/data/hsk';
import { Volume2, X, Star } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useUserWords } from '@/hooks/use-user-words';
import { speak } from '@/lib/tts';
import type { WordData } from '@/lib/srs';

const PUNCTUATION = /^[\u3002\uFF0C\uFF1F\uFF01\u201C\u201D\u3001\uFF1A\uFF1B\s]+$/;
const HANZI = /^[\u3400-\u9FFF]$/;

const hskWordsMap = new Map(hskWords.map(w => [w.word, w]));
const POPUP_WIDTH = 192;
const POPUP_MARGIN = 12;
const POPUP_GAP = 10;

type SentenceToken = {
  text: string;
  wordData: WordData | null;
  isPunc: boolean;
  isHanziFallback?: boolean;
};

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
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number; placement: 'top' | 'bottom' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const suppressOpenRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerClasses =
    variant === 'quizPrompt'
      ? 'gap-y-4 gap-x-2 text-6xl sm:text-7xl text-black dark:text-white leading-[0.92] font-black whitespace-nowrap'
      : 'gap-y-3 gap-x-1 text-xl text-gray-600 dark:text-gray-300 leading-relaxed';

  const tokens = useMemo(() => {
    let i = 0;
    const newTokens: SentenceToken[] = [];
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
        const isPunc = PUNCTUATION.test(char);
        newTokens.push({ text: char, wordData: null, isPunc, isHanziFallback: !isPunc && HANZI.test(char) });
        i++;
      }
    }
    return newTokens;
  }, [sentence]);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      if (suppressTimerRef.current) {
        clearTimeout(suppressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setActiveToken(null);
  }, [sentence]);

  useEffect(() => {
    if (activeToken === null) {
      setPopupPosition(null);
      return;
    }

    const updatePosition = () => {
      const target = tokenRefs.current[activeToken];
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const left = Math.min(
        Math.max(rect.left + rect.width / 2, POPUP_WIDTH / 2 + POPUP_MARGIN),
        window.innerWidth - POPUP_WIDTH / 2 - POPUP_MARGIN,
      );
      const estimatedHeight = tokens[activeToken]?.wordData ? 172 : 132;
      const canOpenAbove = rect.top - estimatedHeight - POPUP_GAP > POPUP_MARGIN;

      setPopupPosition({
        left,
        top: canOpenAbove ? rect.top - POPUP_GAP : rect.bottom + POPUP_GAP,
        placement: canOpenAbove ? 'top' : 'bottom',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeToken, tokens]);

  const playAudio = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    speak(text, ttsSpeed);
  };

  const closePopup = () => {
    suppressOpenRef.current = true;
    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current);
    }
    suppressTimerRef.current = setTimeout(() => {
      suppressOpenRef.current = false;
    }, 250);
    setActiveToken(null);
  };

  const togglePopup = (idx: number) => {
    if (suppressOpenRef.current) return;
    setActiveToken(activeToken === idx ? null : idx);
  };

  const activeTokenData = activeToken !== null ? tokens[activeToken] : null;
  const activeTokenIsInteractive = Boolean(activeTokenData && interactive && (activeTokenData.wordData || activeTokenData.isHanziFallback));

  const popupLayer = isMounted && activeTokenData && activeTokenIsInteractive && popupPosition
    ? createPortal(
      <>
        <div className="fixed inset-0 z-[70]" onClick={closePopup} />
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[80] w-60 max-w-[calc(100vw-3rem)] rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-2xl shadow-black/10 transition-all animate-in fade-in zoom-in-95 duration-200 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40"
          style={{
            left: popupPosition!.left,
            top: popupPosition!.top,
            transform: popupPosition!.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closePopup();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closePopup();
            }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Close word popup"
          >
            <X size={14} />
          </button>

          <div className="pr-8">
            <div className="text-lg font-black text-black dark:text-white" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                {activeTokenData!.wordData?.word ?? activeTokenData!.text}
            </div>

            {activeTokenData!.wordData ? (
              <>
                <div className="mt-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                  {activeTokenData!.wordData!.pinyin.toLowerCase()}
                </div>
                <div className="mt-2 text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-300">
                  {activeTokenData!.wordData!.meaning}
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-300">
                단일 한자 듣기
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => playAudio(activeTokenData!.wordData?.word ?? activeTokenData!.text, e)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white active:scale-95 transition-all"
            >
              <Volume2 size={15} />
              <span>TTS</span>
            </button>
            {activeTokenData!.wordData && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(activeTokenData!.wordData!.id);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black active:scale-95 transition-all ${
                  userWords[activeTokenData!.wordData!.id]?.isFavorite
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Star size={15} fill={userWords[activeTokenData!.wordData!.id]?.isFavorite ? 'currentColor' : 'none'} />
                <span>{userWords[activeTokenData!.wordData!.id]?.isFavorite ? 'Saved' : 'Library'}</span>
              </button>
            )}
          </div>
          <div
            className={`absolute left-1/2 -translate-x-1/2 border-[6px] border-transparent ${
              popupPosition!.placement === 'top'
                ? 'top-full border-t-white dark:border-t-gray-900'
                : 'bottom-full border-b-white dark:border-b-gray-900'
            }`}
          />
        </div>
      </>,
      document.body,
    )
    : null;

  return (
    <div className={`relative flex flex-wrap items-center justify-center ${containerClasses} ${className}`}>
      {popupLayer}
      
      {tokens.map((token, idx) => {
        const isLast = idx === tokens.length - 1;
        const nextIsPunc = tokens[idx + 1]?.isPunc;
        const isInteractiveToken = interactive && (token.wordData || token.isHanziFallback);
        const nextToken = tokens[idx + 1];
        const shouldShowDivider =
          Boolean(isInteractiveToken)
          && !isLast
          && !nextIsPunc
          && Boolean(nextToken && (nextToken.wordData || nextToken.isHanziFallback));

        return (
          <span
            key={idx}
            ref={(node) => {
              tokenRefs.current[idx] = node;
            }}
            className="relative flex items-center"
          >
            {isInteractiveToken ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePopup(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePopup(idx);
                  }
                }}
                className={`cursor-pointer rounded-lg px-0.5 pb-0.5 transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-300 ${
                  activeToken === idx
                    ? 'bg-blue-500/10 text-blue-600 shadow-[0_0_0_1px_rgba(59,130,246,0.18)] dark:bg-blue-400/10 dark:text-blue-300'
                    : ''
                } border-b-2 border-dotted border-blue-300/80 dark:border-blue-500/50`}
                style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}
              >
                {token.text}
              </span>
            ) : (
              <span style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{token.text}</span>
            )}

            {shouldShowDivider && (
              <span className="mx-1.5 text-gray-300 dark:text-gray-700 text-sm font-light">/</span>
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
