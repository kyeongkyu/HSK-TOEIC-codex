'use client';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSettings } from '@/hooks/use-settings';
import { hskWords } from '@/data/hsk';
import { HSK_CATEGORIES } from '@/data/hsk-categories';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

type QuizListItem = {
  id: string;
  title: string;
  range: string;
  isTopic: boolean;
  questionCount: number;
};

function getQuizProgressStorageKey(difficulty: string, mode: string, chapterParam: string) {
  return `quiz-progress-${difficulty}-${mode}-${chapterParam}`;
}

function getLegacyQuizProgressStorageKey(difficulty: string, chapterParam: string) {
  return `quiz-progress-${difficulty}-${chapterParam}`;
}

function readSavedQuizIndex(difficulty: string, mode: string, chapterParam: string) {
  if (typeof window === 'undefined') return 0;

  const storageKey = getQuizProgressStorageKey(difficulty, mode, chapterParam);
  const legacyStorageKey = getLegacyQuizProgressStorageKey(difficulty, chapterParam);
  const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);

  if (!saved) return 0;

  try {
    const parsed = JSON.parse(saved) as { currentIndex?: number };
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, saved);
    }
    localStorage.removeItem(legacyStorageKey);
    return Math.max(parsed.currentIndex ?? 0, 0);
  } catch {
    return 0;
  }
}

export default function QuizChapterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const difficulty = params.difficulty as string;
  const mode = searchParams.get('mode') || 'chapter';
  const { selectedLevel, isLoaded: settingsLoaded } = useSettings();
  const [savedProgressByItem, setSavedProgressByItem] = useState<Record<string, number>>({});

  const filteredWords = useMemo(() => {
    if (!settingsLoaded) return [];
    return selectedLevel === 'all' || selectedLevel === null
      ? hskWords
      : hskWords.filter((word) => word.level === selectedLevel);
  }, [selectedLevel, settingsLoaded]);

  const listItems = useMemo<QuizListItem[]>(() => {
    if (mode === 'topic') {
      if (selectedLevel === 'all' || selectedLevel === null) {
        return Object.entries(HSK_CATEGORIES).flatMap(([level, categories]) =>
          categories.map((category) => ({
            id: category.id,
            title: `HSK ${level} - ${category.name}`,
            range: `${category.words.length} words`,
            isTopic: true,
            questionCount: category.words.length,
          })),
        );
      }

      const categories = HSK_CATEGORIES[String(selectedLevel)] || [];
      return categories.map((category) => ({
        id: category.id,
        title: category.name,
        range: `${category.words.length} words`,
        isTopic: true,
        questionCount: category.words.length,
      }));
    }

    const chapterSize = 15;
    const count = Math.ceil(filteredWords.length / chapterSize);

    return Array.from({ length: count }, (_, index) => ({
      id: String(index + 1),
      title: `Chapter ${index + 1}`,
      range: `${index * chapterSize + 1} ~ ${Math.min((index + 1) * chapterSize, filteredWords.length)}`,
      isTopic: false,
      questionCount: Math.min(chapterSize, Math.max(filteredWords.length - index * chapterSize, 0)),
    }));
  }, [filteredWords, mode, selectedLevel]);

  useEffect(() => {
    if (!settingsLoaded) return;

    const nextProgressByItem = listItems.reduce<Record<string, number>>((progressMap, item) => {
      progressMap[item.id] = readSavedQuizIndex(difficulty, mode, item.id);
      return progressMap;
    }, {});

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrates saved quiz progress from localStorage after mount.
    setSavedProgressByItem(nextProgressByItem);
  }, [difficulty, listItems, mode, settingsLoaded]);

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
          Select
          <br />
          {mode === 'topic' ? 'Topic' : 'Chapter'}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto pb-12">
        {listItems.map((item, index) => {
          const savedIndex = Math.min(savedProgressByItem[item.id] ?? 0, item.questionCount);
          const progressPercent = item.questionCount > 0
            ? Math.round((savedIndex / item.questionCount) * 100)
            : 0;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              onClick={() => router.push(`/quiz/${difficulty}/${item.id}?mode=${mode}`)}
              className="w-full p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between transition-all active:scale-95 group hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="flex items-center gap-5 w-full min-w-0">
                {!item.isTopic && (
                  <div className="w-12 h-12 shrink-0 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {String(item.id).padStart(2, '0')}
                  </div>
                )}
                <div className="text-left w-full min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-black dark:text-white mb-0.5" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        {item.title}
                      </h2>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {item.range}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-blue-600 dark:text-blue-400">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-gray-900/70">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <ChevronRight className="ml-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
