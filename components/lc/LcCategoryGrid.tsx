'use client';

import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export type LcCategoryCard = {
  id: string;
  label: string;
  description: string;
  count: number;
};

type LcCategoryGridProps = {
  items: LcCategoryCard[];
  onSelect: (id: string) => void;
};

export function LcCategoryGrid({ items, onSelect }: LcCategoryGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
      }}
      className="grid grid-cols-1 gap-3"
    >
      {items.map((item) => (
        <motion.button
          key={item.id}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          type="button"
          onClick={() => onSelect(item.id)}
          className="group w-full rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 text-left transition-all active:scale-[0.99] hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-black/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-800 dark:hover:bg-white/[0.06]"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">{item.label}</h3>
              <p className="mt-1 text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400">{item.description}</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                {item.count} questions
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white p-3 text-gray-400 shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white dark:bg-white/10">
              <ChevronRight size={18} />
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
