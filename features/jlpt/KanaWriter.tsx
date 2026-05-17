'use client';
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';

type KanaWriterProps = {
  kana: string;
  romaji: string;
};

const KANA_STROKE_BASE = '/jlpt-kana-strokes';
const KANA_CHAR_PATTERN = /[\u3040-\u30ffー]/u;

function getStrokeSvgPath(char: string) {
  return `${KANA_STROKE_BASE}/${char.codePointAt(0)}.svg`;
}

function StaticKanaFallback({ char }: { char: string }) {
  return (
    <div className="relative flex aspect-square min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[1.25rem] border border-indigo-200 bg-white dark:border-indigo-900 dark:bg-black">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <span className="border-r border-b border-indigo-100 dark:border-indigo-950" />
        <span className="border-b border-indigo-100 dark:border-indigo-950" />
        <span className="border-r border-indigo-100 dark:border-indigo-950" />
        <span />
      </div>
      <span className="relative select-none text-6xl font-black leading-none text-black dark:text-white">{char}</span>
    </div>
  );
}

export function KanaWriter({ kana, romaji }: KanaWriterProps) {
  const [replayKey, setReplayKey] = useState(0);
  const chars = useMemo(() => Array.from(kana), [kana]);

  return (
    <div className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50/70 p-4 shadow-inner dark:border-indigo-900/50 dark:bg-indigo-950/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">Kana Writer</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black lowercase text-indigo-700 shadow-sm dark:bg-gray-950 dark:text-indigo-300">{romaji}</span>
      </div>

      <button
        type="button"
        onClick={() => setReplayKey(key => key + 1)}
        className="grid w-full gap-3 rounded-[1.5rem] border border-indigo-200 bg-white p-3 transition-all active:scale-[0.99] dark:border-indigo-900 dark:bg-black"
        style={{ gridTemplateColumns: `repeat(${Math.min(chars.length, 3)}, minmax(0, 1fr))` }}
        aria-label="Replay kana stroke order"
      >
        {chars.map((char, index) => (
          KANA_CHAR_PATTERN.test(char) ? (
            <div key={`${char}-${index}-${replayKey}`} className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white dark:bg-gray-950">
              <img
                src={`${getStrokeSvgPath(char)}?replay=${replayKey}-${index}`}
                alt={`${char} stroke order`}
                className="h-full w-full object-contain dark:invert"
                draggable={false}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <StaticKanaFallback key={`${char}-${index}`} char={char} />
          )
        ))}
      </button>

      <p className="mt-3 text-center text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400">
        Tap the writer to replay the stroke order animation.
      </p>
    </div>
  );
}
