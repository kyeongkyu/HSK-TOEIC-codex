'use client';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSettings } from '@/hooks/use-settings';
import { hskWords } from '@/data/hsk';
import { HSK_CATEGORIES } from '@/data/hsk-categories';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

export default function QuizChapterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const difficulty = params.difficulty as string;
  const mode = searchParams.get('mode') || 'chapter';
  const { selectedLevel, isLoaded: settingsLoaded } = useSettings();

  const filteredWords = useMemo(() => {
    if (!settingsLoaded) return [];
    return selectedLevel === 'all' || selectedLevel === null
      ? hskWords
      : hskWords.filter(w => w.level === selectedLevel);
  }, [selectedLevel, settingsLoaded]);

  const listItems = useMemo(() => {
    if (mode === 'topic') {
      if (selectedLevel === 'all' || selectedLevel === null) {
        return Object.entries(HSK_CATEGORIES).flatMap(([level, cats]) => 
          cats.map(c => ({
            id: c.id,
            title: `HSK ${level} - ${c.name}`,
            range: `${c.words.length} words`,
            isTopic: true
          }))
        );
      } else {
        const cats = HSK_CATEGORIES[String(selectedLevel)] || [];
        return cats.map(c => ({
          id: c.id,
          title: c.name,
          range: `${c.words.length} words`,
          isTopic: true
        }));
      }
    } else {
      const chapterSize = 15;
      const count = Math.ceil(filteredWords.length / chapterSize);
      return Array.from({ length: count }, (_, i) => ({
        id: String(i + 1),
        title: `Chapter ${i + 1}`,
        range: `${i * chapterSize + 1} ~ ${Math.min((i + 1) * chapterSize, filteredWords.length)}`,
        isTopic: false
      }));
    }
  }, [filteredWords, mode, selectedLevel]);

  if (!settingsLoaded) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="px-6 min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <header className="pt-8 mb-10">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => router.push('/quiz')}
            className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">{difficulty}</span>
        </div>
        <h1 className="text-4xl font-black text-black dark:text-white">
          Select<br/>{mode === 'topic' ? 'Topic' : 'Chapter'}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto pb-12">
        {listItems.map((item, idx) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }} // Cap delay
            onClick={() => router.push(`/quiz/${difficulty}/${item.id}?mode=${mode}`)}
            className="w-full p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between transition-all active:scale-95 group hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800"
          >
            <div className="flex items-center gap-5">
              {!item.isTopic && (
                <div className="w-12 h-12 shrink-0 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {String(item.id).padStart(2, '0')}
                </div>
              )}
              <div className="text-left w-full">
                <h2 className="text-lg font-bold text-black dark:text-white mb-0.5" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                  {item.title}
                </h2>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {item.range}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
