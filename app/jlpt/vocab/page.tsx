'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, List, Volume2 } from 'lucide-react';
import { loadJlptVocab } from '@/features/data/loaders';
import { getResumeTaskSnapshot, setResumeTaskSnapshot } from '@/lib/resume-task';
import { getProgressPercent, writeLocalStorageJson } from '@/lib/ui-state';
import { speak } from '@/lib/tts';
import type { JlptVocabItem } from '@/data/jlpt/vocab-n5';

type JlptVocabProgress = {
  currentIndex: number;
  viewMode: 'focus' | 'list';
};

const JLPT_VOCAB_PROGRESS_KEY = 'jlpt_vocab_progress';
const DEFAULT_PROGRESS: JlptVocabProgress = {
  currentIndex: 0,
  viewMode: 'focus',
};

function clampIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

export default function JlptVocabPage() {
  const router = useRouter();
  const [words, setWords] = useState<JlptVocabItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'focus' | 'list'>('focus');

  useEffect(() => {
    let isCancelled = false;

    void loadJlptVocab('N5').then((loadedWords) => {
      if (isCancelled) return;

      const snapshot = getResumeTaskSnapshot<JlptVocabProgress>('/jlpt/vocab');
      const progress = snapshot ?? DEFAULT_PROGRESS;

      setWords(loadedWords);
      setCurrentIndex(clampIndex(progress.currentIndex, loadedWords.length));
      setViewMode(progress.viewMode === 'list' ? 'list' : 'focus');
      setIsLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const currentWord = words[currentIndex];
  const progressPercent = useMemo(() => getProgressPercent(currentIndex + 1, words.length), [currentIndex, words.length]);

  useEffect(() => {
    if (!isLoaded || words.length === 0) return;

    const progress: JlptVocabProgress = {
      currentIndex: clampIndex(currentIndex, words.length),
      viewMode,
    };

    writeLocalStorageJson(JLPT_VOCAB_PROGRESS_KEY, progress);
    setResumeTaskSnapshot('/jlpt/vocab', 'JLPT N5 Vocabulary', progress, 'jlpt-vocab');
  }, [currentIndex, isLoaded, viewMode, words.length]);

  const speakJapanese = (text: string) => {
    speak(text, 3, 'ja-JP');
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white px-6 text-sm font-bold text-gray-500 dark:bg-black dark:text-gray-400">
        Loading JLPT N5 vocabulary...
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-black">
        <BookOpen size={48} className="text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-black text-black dark:text-white">No JLPT words yet</h1>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-black"
        >
          Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 py-4 text-black dark:bg-black dark:text-white">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all active:scale-95 dark:border-gray-800 dark:bg-gray-950"
          aria-label="Back to JLPT home"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">JLPT N5</p>
          <h1 className="text-xl font-black">Vocabulary</h1>
        </div>
        <button
          type="button"
          onClick={() => setViewMode(mode => mode === 'focus' ? 'list' : 'focus')}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all active:scale-95 dark:border-gray-800 dark:bg-gray-950"
          aria-label="Toggle list mode"
        >
          <List size={22} />
        </button>
      </header>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          <span>{currentIndex + 1} / {words.length}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-900">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {viewMode === 'focus' ? (
        <main className="space-y-4">
          <section className="rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-xl shadow-black/5 dark:border-gray-800 dark:bg-gray-950 dark:shadow-black/35">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">{currentWord.partOfSpeech}</p>
                <h2 className="mt-2 break-keep text-5xl font-black leading-none tracking-tight">{currentWord.word}</h2>
                <p className="mt-2 text-2xl font-black text-indigo-700 dark:text-indigo-300">{currentWord.kana}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{currentWord.romaji}</p>
              </div>
              <button
                type="button"
                onClick={() => speakJapanese(currentWord.word)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 p-3 text-white shadow-xl shadow-indigo-700/20 transition-all active:scale-95"
                aria-label="Listen to Japanese word"
              >
                <Volume2 size={22} />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Meaning</p>
              <p className="mt-2 text-2xl font-black">{currentWord.meaningKo}</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-gray-200 bg-white p-3 shadow-lg shadow-black/5 dark:border-gray-800 dark:bg-gray-950 dark:shadow-black/30">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Example</p>
              <button
                type="button"
                onClick={() => speakJapanese(currentWord.exampleJa)}
                className="rounded-xl bg-gray-100 px-3 py-2 text-gray-700 transition-all active:scale-95 dark:bg-gray-900 dark:text-gray-300"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <p className="break-keep text-2xl font-black leading-relaxed">{currentWord.exampleJa}</p>
            <p className="mt-3 break-keep text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-400">{currentWord.exampleKo}</p>
          </section>
        </main>
      ) : (
        <main className="space-y-3">
          {words.map((word, index) => (
            <button
              key={word.id}
              type="button"
              onClick={() => {
                setCurrentIndex(index);
                setViewMode('focus');
              }}
              className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-4 text-left transition-all active:scale-[0.99] ${
                index === currentIndex
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-950 shadow-lg shadow-indigo-700/10 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-sm font-black text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xl font-black">{word.word}</span>
                <span className="mt-1 block truncate text-sm font-bold text-gray-500 dark:text-gray-400">{word.kana} · {word.meaningKo}</span>
              </span>
            </button>
          ))}
        </main>
      )}

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex(index => clampIndex(index - 1, words.length))}
          disabled={currentIndex === 0}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-black shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-950"
        >
          <ChevronLeft size={20} />
          Prev
        </button>
        <button
          type="button"
          onClick={() => setViewMode(mode => mode === 'focus' ? 'list' : 'focus')}
          className="min-h-12 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition-all active:scale-95 dark:bg-gray-900 dark:text-gray-300"
        >
          {currentIndex + 1}/{words.length}
        </button>
        <button
          type="button"
          onClick={() => setCurrentIndex(index => clampIndex(index + 1, words.length))}
          disabled={currentIndex === words.length - 1}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 font-black text-white shadow-xl shadow-black/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

