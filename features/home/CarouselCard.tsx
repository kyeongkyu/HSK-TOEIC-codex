'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { ResumeTaskKey } from '@/lib/resume-task';

export const CARD_WIDTH = 280;
export const GAP = 16;
export const OFFSET = CARD_WIDTH + GAP;

export type CarouselCardData = {
  title: string;
  description: string;
  link: string;
  taskKey?: ResumeTaskKey;
  accentClass: string;
  iconClass: string;
  surfaceClass: string;
  icon: ReactNode;
};

type CarouselCardProps = {
  card: CarouselCardData;
  index: number;
  x: MotionValue<number>;
  onStart: (card: CarouselCardData) => void;
  onPrefetch: (card: CarouselCardData) => void;
};

export function CarouselCard({ card, index, x, onStart, onPrefetch }: CarouselCardProps) {
  const inputRange = [-(index + 1) * OFFSET, -index * OFFSET, -(index - 1) * OFFSET];

  const scale = useTransform(x, inputRange, [0.85, 1, 0.85]);
  const opacity = useTransform(x, inputRange, [0.5, 1, 0.5]);
  const zIndex = useTransform(x, inputRange, [0, 10, 0]);
  const shadow = useTransform(
    x,
    inputRange,
    ['0px 8px 20px rgba(15,23,42,0.04)', '0px 18px 36px rgba(15,23,42,0.12)', '0px 8px 20px rgba(15,23,42,0.04)'],
  );

  return (
    <motion.div
      style={{
        width: CARD_WIDTH,
        scale,
        opacity,
        zIndex,
        boxShadow: shadow,
      }}
      className={`relative flex h-64 shrink-0 transform-gpu flex-col justify-between overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-5 will-change-transform dark:border-gray-700 dark:bg-gray-800/50 ${card.surfaceClass}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Mode</h3>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white">{card.title}</h2>
        </div>
        <div className={`shrink-0 rounded-2xl p-3 ${card.iconClass}`}>{card.icon}</div>
      </div>

      <div className="mt-auto space-y-4">
        <p className="break-keep text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-300">
          {card.description}
        </p>

        <button
          type="button"
          onClick={() => onStart(card)}
          onPointerEnter={() => onPrefetch(card)}
          onFocus={() => onPrefetch(card)}
          className={`pointer-events-auto inline-flex transform-gpu items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${card.accentClass}`}
        >
          Start Now
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
