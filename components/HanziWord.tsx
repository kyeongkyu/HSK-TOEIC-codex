'use client';
import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

import { useSettings } from '@/hooks/use-settings';

type HanziWordProps = {
  word: string;
  shouldAnimate?: boolean;
  singleLine?: boolean;
};

const getSingleLineWriterSize = (length: number, hanziSize: number) => {
  if (length >= 5) return 46;
  if (length === 4) return hanziSize === 1 ? 48 : 56;
  if (length === 3) return hanziSize === 1 ? 56 : hanziSize === 2 ? 66 : 72;
  return hanziSize === 1 ? 64 : hanziSize === 2 ? 76 : 82;
};

export default function HanziWord({ word, shouldAnimate = true, singleLine = false }: HanziWordProps) {
  const isChinese = (char: string) => /[\u4e00-\u9fa5]/.test(char);
  const chars = word.split('');
  const { hanziFont, hanziSize } = useSettings();

  const textSizes = ['text-4xl', 'text-6xl', 'text-8xl'];
  const textSize = textSizes[hanziSize - 1] || 'text-8xl';
  const writerSize = singleLine ? getSingleLineWriterSize(chars.length, hanziSize) : 80;

  return (
    <div className={`flex justify-center ${singleLine ? 'flex-nowrap gap-1 my-0 max-w-full overflow-visible' : 'flex-wrap space-x-2 my-4'}`}>
      {chars.map((char, i) => (
        isChinese(char) ? <HanziChar key={i} char={char} shouldAnimate={shouldAnimate} size={writerSize} compact={singleLine} /> : <span key={i} className={`${textSize} font-black flex items-center dark:text-white`} style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{char}</span>
      ))}
    </div>
  );
}

function HanziChar({ char, shouldAnimate, size, compact }: { char: string, shouldAnimate: boolean, size: number, compact: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const { isDarkMode } = useSettings();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    writerRef.current = HanziWriter.create(ref.current, char, {
      width: size,
      height: size,
      padding: compact ? 3 : 5,
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 50,
      showOutline: true,
      strokeColor: isDarkMode ? '#ffffff' : '#1f2937',
      radicalColor: isDarkMode ? '#93c5fd' : '#2563eb', // Lighter blue for dark mode
      outlineColor: isDarkMode ? '#374151' : '#e5e7eb', // Darker outline for dark mode to not compete with stroke
    });
    
    if (shouldAnimate) {
      const timeout = setTimeout(() => {
        writerRef.current?.animateCharacter();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [char, isDarkMode, shouldAnimate, size, compact]);

  const animate = () => {
    writerRef.current?.animateCharacter();
  };

  return <div ref={ref} onClick={animate} className={`${compact ? 'rounded-lg p-0.5' : 'rounded-xl p-1'} cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm`} />;
}
