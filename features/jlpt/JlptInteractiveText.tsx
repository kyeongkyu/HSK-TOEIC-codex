/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Volume2, X } from 'lucide-react';

import { useUserWords } from '@/hooks/use-user-words';
import { speakJapanese } from '@/lib/tts';
import type { JlptKanaItem } from '@/data/jlpt/kana';

type JlptInteractiveTextProps = {
  text: string;
  kanaItems: JlptKanaItem[];
  fallbackLibraryId: string;
  className?: string;
};

type Token = {
  text: string;
  item: JlptKanaItem | null;
  isInteractive: boolean;
};

const POPUP_WIDTH = 224;
const POPUP_MARGIN = 12;
const POPUP_GAP = 10;
const JAPANESE_CHAR = /[\u3040-\u30ff\u3400-\u9fff々〆ー]/u;
const PUNCTUATION = /^[\s\u3000\u3001\u3002、。！？!?.,]+$/u;

function getVirtualId(char: string) {
  return `jlpt-char-${char.codePointAt(0)}`;
}

export function JlptInteractiveText({ text, kanaItems, fallbackLibraryId, className = '' }: JlptInteractiveTextProps) {
  const { userWords, toggleFavorite } = useUserWords();
  const [activeToken, setActiveToken] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number; placement: 'top' | 'bottom' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const suppressOpenRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemByKana = useMemo(() => {
    const map = new Map<string, JlptKanaItem>();
    kanaItems.forEach(item => {
      if (!map.has(item.kana)) map.set(item.kana, item);
    });
    return map;
  }, [kanaItems]);

  const tokens = useMemo<Token[]>(() => (
    Array.from(text).map(char => ({
      text: char,
      item: itemByKana.get(char) ?? null,
      isInteractive: JAPANESE_CHAR.test(char) && !PUNCTUATION.test(char),
    }))
  ), [itemByKana, text]);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setActiveToken(null);
  }, [text]);

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
      const estimatedHeight = 150;
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
  }, [activeToken]);

  const closePopup = () => {
    suppressOpenRef.current = true;
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(() => {
      suppressOpenRef.current = false;
    }, 250);
    setActiveToken(null);
  };

  const togglePopup = (index: number) => {
    if (suppressOpenRef.current) return;
    setActiveToken(current => current === index ? null : index);
  };

  const activeData = activeToken !== null ? tokens[activeToken] : null;
  const libraryId = activeData?.item?.id ?? (activeData ? getVirtualId(activeData.text) : fallbackLibraryId);
  const isSaved = Boolean(userWords[libraryId]?.isFavorite || userWords[fallbackLibraryId]?.isFavorite);

  const popupLayer = isMounted && activeData && popupPosition
    ? createPortal(
      <>
        <div className="fixed inset-0 z-[70]" onClick={closePopup} />
        <div
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          className="fixed z-[80] w-56 max-w-[calc(100vw-3rem)] rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40"
          style={{
            left: popupPosition.left,
            top: popupPosition.top,
            transform: popupPosition.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              closePopup();
            }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Close JLPT popup"
          >
            <X size={14} />
          </button>

          <div className="pr-8">
            <div className="text-2xl font-black text-black dark:text-white">{activeData.text}</div>
            <div className="mt-1 text-sm font-bold lowercase text-indigo-700 dark:text-indigo-300">
              {activeData.item?.romaji ?? 'japanese'}
            </div>
            <div className="mt-2 text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-300">
              {activeData.item ? `${activeData.item.example} · ${activeData.item.exampleKo}` : 'Japanese character'}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                speakJapanese(activeData.text);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white transition-all active:scale-95"
            >
              <Volume2 size={15} />
              <span>TTS</span>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(activeData.item?.id ?? fallbackLibraryId);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-95 ${
                isSaved
                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Star size={15} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Library'}</span>
            </button>
          </div>
        </div>
      </>,
      document.body,
    )
    : null;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1 gap-y-1 ${className}`}>
      {popupLayer}
      {tokens.map((token, index) => (
        token.isInteractive ? (
          <span
            key={`${token.text}-${index}`}
            ref={(node) => {
              tokenRefs.current[index] = node;
            }}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              togglePopup(index);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                togglePopup(index);
              }
            }}
            className="cursor-pointer border-b border-dotted border-indigo-400 transition-colors hover:text-indigo-700 dark:border-indigo-500 dark:hover:text-indigo-300"
          >
            {token.text}
          </span>
        ) : (
          <span key={`${token.text}-${index}`}>{token.text}</span>
        )
      ))}
    </span>
  );
}
