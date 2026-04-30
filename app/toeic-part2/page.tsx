'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const ListeningQuiz = dynamic(
  () => import('@/components/lc/ListeningQuiz').then((module) => module.ListeningQuiz),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        Loading listening practice...
      </div>
    ),
  },
);

export default function ToeicPart2Page() {
  const [isPracticeActive, setIsPracticeActive] = useState(false);

  return (
    <div className="min-h-[calc(100vh-120px)] overflow-x-hidden bg-white px-5 py-4 transition-colors duration-200 dark:bg-gray-900">
      {!isPracticeActive && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-800 transition-all active:scale-95 dark:bg-gray-800 dark:text-gray-100"
          >
            <ArrowLeft size={16} />
            TOEIC
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Practice</p>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Part 2 LC</h1>
          </div>
        </div>
      )}

      <ListeningQuiz onPracticeActiveChange={setIsPracticeActive} />
    </div>
  );
}
