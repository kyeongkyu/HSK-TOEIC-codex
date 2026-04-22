'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ToeicPart5Practice } from '@/components/ToeicPart5Practice';
import { useState } from 'react';

export default function ToeicPart5Page() {
  const [isPracticeActive, setIsPracticeActive] = useState(false);

  return (
    <div className="px-5 py-4 min-h-[calc(100vh-120px)] bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      {!isPracticeActive && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm font-black text-gray-800 dark:text-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
            TOEIC
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Practice</p>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Part 5</h1>
          </div>
        </div>
      )}

      <ToeicPart5Practice onPracticeActiveChange={setIsPracticeActive} />
    </div>
  );
}
