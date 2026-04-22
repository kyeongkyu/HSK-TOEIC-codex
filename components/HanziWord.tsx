'use client';
import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

import { useSettings } from '@/hooks/use-settings';

export default function HanziWord({ word, shouldAnimate = true }: { word: string, shouldAnimate?: boolean }) {
  const isChinese = (char: string) => /[\u4e00-\u9fa5]/.test(char);
  const chars = word.split('');
  const { hanziFont, hanziSize } = useSettings();

  const textSizes = ['text-4xl', 'text-6xl', 'text-8xl'];
  const textSize = textSizes[hanziSize - 1] || 'text-8xl';

  return (
    <div className="flex justify-center space-x-2 my-4 flex-wrap">
      {chars.map((char, i) => (
        isChinese(char) ? <HanziChar key={i} char={char} shouldAnimate={shouldAnimate} /> : <span key={i} className={`${textSize} font-black flex items-center dark:text-white`} style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>{char}</span>
      ))}
    </div>
  );
}

function HanziChar({ char, shouldAnimate }: { char: string, shouldAnimate: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const { isDarkMode } = useSettings();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    writerRef.current = HanziWriter.create(ref.current, char, {
      width: 80,
      height: 80,
      padding: 5,
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
  }, [char, isDarkMode, shouldAnimate]);

  const animate = () => {
    writerRef.current?.animateCharacter();
  };

  return <div ref={ref} onClick={animate} className="cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-1 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm" />;
}
