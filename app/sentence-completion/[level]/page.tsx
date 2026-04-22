'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { sentences } from '@/data/sentences';
import { useSentenceProgress } from '@/hooks/use-sentence-progress';

export default function LevelChapters() {
  const params = useParams();
  const router = useRouter();
  const level = parseInt(params.level as string);
  const { getChapterStatus } = useSentenceProgress();

  const totalChapters = useMemo(() => {
    const levelSentences = sentences.filter(s => s.level === level);
    const questionsPerChapter = 7;
    return Math.ceil(levelSentences.length / questionsPerChapter);
  }, [level]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 transition-colors duration-200">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={() => router.push('/')}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-black dark:hover:text-white transition-colors active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">
              HSK {level} 문장 완성
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              총 {totalChapters}개의 챕터가 준비되어 있습니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: totalChapters }).map((_, idx) => {
            const status = getChapterStatus(level, idx + 1);
            const statusColor = status === 'green' 
              ? 'bg-green-500 text-white' 
              : status === 'yellow' 
                ? 'bg-yellow-500 text-white' 
                : status === 'red' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400';

            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/sentence-completion/${level}/${idx + 1}`)}
                className="group relative flex flex-col items-center p-8 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:shadow-black/5 transition-all active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition-colors mb-4 shadow-sm ${statusColor}`}>
                  {idx + 1}
                </div>
                <span className="text-sm font-bold text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors uppercase tracking-widest">
                  Chapter
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
