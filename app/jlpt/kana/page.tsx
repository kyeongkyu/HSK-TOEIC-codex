'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Star, Table2, Volume2 } from 'lucide-react';
import { JlptInteractiveText } from '@/features/jlpt/JlptInteractiveText';
import { KanaWriter } from '@/features/jlpt/KanaWriter';
import { loadJlptKana } from '@/features/data/loaders';
import { useSettings } from '@/hooks/use-settings';
import { useUserWords } from '@/hooks/use-user-words';
import { consumeResumeTaskFreshStart, getResumeTaskSnapshot, setResumeTaskSnapshot } from '@/lib/resume-task';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/ui-state';
import { speakJapaneseKana, speakJapaneseText } from '@/lib/tts';
import type { JlptKanaGroup, JlptKanaItem, JlptKanaScript } from '@/data/jlpt/kana';
import {
  clampKanaIndex,
  getKanaHomeModeIntent,
  getKanaLabel,
  getKanaRoute,
  getKanaTaskKey,
  getScriptFromSearch,
  JLPT_KANA_PROGRESS_KEY,
  kanaGroupLabels,
  normalizeKanaProgress,
  type KanaProgress,
  type KanaView,
} from '@/features/jlpt/kana-session';

export default function JlptKanaPage() {
  const { jlptKanaWriterMode } = useSettings();
  const { userWords, toggleFavorite } = useUserWords();
  const [script, setScript] = useState<JlptKanaScript>('hiragana');
  const [items, setItems] = useState<JlptKanaItem[]>([]);
  const [popupKanaItems, setPopupKanaItems] = useState<JlptKanaItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<KanaView>('chart');
  const [group, setGroup] = useState<JlptKanaGroup | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadScript = (nextScript: JlptKanaScript, preferStoredProgress = true) => {
    const route = getKanaRoute(nextScript);
    const stored = preferStoredProgress ? readLocalStorageJson<KanaProgress | null>(JLPT_KANA_PROGRESS_KEY, null) : null;
    const snapshot = preferStoredProgress ? getResumeTaskSnapshot<KanaProgress>(route) : null;
    const progress = normalizeKanaProgress(snapshot ?? stored, nextScript);

    setIsLoaded(false);
    void Promise.all([loadJlptKana(nextScript), loadJlptKana('hiragana'), loadJlptKana('katakana')]).then(([loadedItems, hiraganaItems, katakanaItems]) => {
      setScript(nextScript);
      setItems(loadedItems);
      setPopupKanaItems([...hiraganaItems, ...katakanaItems]);
      setGroup(progress.group);
      setCurrentIndex(clampKanaIndex(progress.currentIndex, loadedItems.length));
      setView(progress.view);
      setIsLoaded(true);
    });
  };

  useEffect(() => {
    const nextScript = getScriptFromSearch();
    const route = getKanaRoute(nextScript);
    const isFreshStart = consumeResumeTaskFreshStart(route, getKanaTaskKey(nextScript));
    const stored = isFreshStart ? null : readLocalStorageJson<KanaProgress | null>(JLPT_KANA_PROGRESS_KEY, null);
    const snapshot = isFreshStart ? null : getResumeTaskSnapshot<KanaProgress>(route);
    const progress = normalizeKanaProgress(snapshot ?? stored, nextScript);
    let isCancelled = false;

    void Promise.all([loadJlptKana(nextScript), loadJlptKana('hiragana'), loadJlptKana('katakana')]).then(([loadedItems, hiraganaItems, katakanaItems]) => {
      if (isCancelled) return;
      setScript(nextScript);
      setItems(loadedItems);
      setPopupKanaItems([...hiraganaItems, ...katakanaItems]);
      setGroup(progress.group);
      setCurrentIndex(clampKanaIndex(progress.currentIndex, loadedItems.length));
      setView(progress.view);
      setIsLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return group === 'all' ? items : items.filter(item => item.group === group);
  }, [group, items]);

  const currentItem = filteredItems[clampKanaIndex(currentIndex, filteredItems.length)];
  const isCurrentFavorite = currentItem ? Boolean(userWords[currentItem.id]?.isFavorite) : false;

  useEffect(() => {
    if (!isLoaded || items.length === 0) return;
    const route = getKanaRoute(script);
    const progress: KanaProgress = {
      script,
      view,
      group,
      currentIndex: clampKanaIndex(currentIndex, filteredItems.length),
    };

    writeLocalStorageJson(JLPT_KANA_PROGRESS_KEY, progress);
    setResumeTaskSnapshot(route, getKanaLabel(script), progress, getKanaTaskKey(script));
  }, [currentIndex, filteredItems.length, group, isLoaded, items.length, script, view]);

  const goBackToKanaHome = () => {
    sessionStorage.setItem('jlpt_home_mode_intent', getKanaHomeModeIntent(script));
    window.location.assign('/');
  };

  const handleGroupChange = (nextGroup: JlptKanaGroup | 'all') => {
    setGroup(nextGroup);
    setCurrentIndex(0);
    setView('chart');
  };

  const handleScriptChange = (nextScript: JlptKanaScript) => {
    if (nextScript === script) return;
    const route = getKanaRoute(nextScript);
    window.history.replaceState(null, '', route);
    loadScript(nextScript, false);
  };

  const openCard = (item: JlptKanaItem) => {
    const index = filteredItems.findIndex(candidate => candidate.id === item.id);
    setCurrentIndex(clampKanaIndex(index, filteredItems.length));
    setView('card');
  };

  const toggleCardChartView = () => {
    if (view === 'card') {
      setView('chart');
      return;
    }

    setCurrentIndex(index => clampKanaIndex(index, filteredItems.length));
    setView('card');
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white px-6 text-sm font-bold text-gray-500 dark:bg-black dark:text-gray-400">
        Loading {getKanaLabel(script)}...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 py-4 text-black dark:bg-black dark:text-white">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goBackToKanaHome}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all active:scale-95 dark:border-gray-800 dark:bg-gray-950"
          aria-label="Back to JLPT home"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">JLPT Kana</p>
          <h1 className="text-xl font-black">{getKanaLabel(script)}</h1>
        </div>
        <button
          type="button"
          onClick={toggleCardChartView}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all active:scale-95 dark:border-gray-800 dark:bg-gray-950"
          aria-label={view === 'card' ? 'Show chart' : 'Show card'}
        >
          <Table2 size={22} />
        </button>
      </header>

      {view === 'chart' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950">
            {(['hiragana', 'katakana'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleScriptChange(option)}
                className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition-all ${
                  script === option
                    ? 'bg-black text-white shadow-lg shadow-black/15 dark:bg-white dark:text-black'
                    : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {getKanaLabel(option)}
              </button>
            ))}
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {kanaGroupLabels.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleGroupChange(item.id)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
                  group === item.id
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {view === 'chart' && (
        <main className="space-y-4">
          {Object.entries(filteredItems.reduce<Record<string, JlptKanaItem[]>>((rowsByName, item) => {
            rowsByName[item.row] = [...(rowsByName[item.row] ?? []), item];
            return rowsByName;
          }, {})).map(([row, rowItems]) => (
            <section key={row} className="rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-lg shadow-black/5 dark:border-gray-800 dark:bg-gray-950 dark:shadow-black/30">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">{row}</h2>
                <span className="text-xs font-black text-gray-400">{rowItems.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {rowItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openCard(item)}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center transition-all active:scale-95 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="block text-3xl font-black">{item.kana}</span>
                    <span className="mt-1 block text-xs font-black uppercase text-indigo-700 dark:text-indigo-300">{item.romaji}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </main>
      )}

      {view === 'card' && currentItem && (
        <main className="space-y-4">
          <section className="rounded-[2rem] border border-gray-200 bg-white p-5 text-center shadow-xl shadow-black/5 dark:border-gray-800 dark:bg-gray-950 dark:shadow-black/35">
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleFavorite(currentItem.id)}
                className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl border transition-all active:scale-95 ${
                  isCurrentFavorite
                    ? 'border-yellow-300 bg-yellow-400 text-white shadow-lg shadow-yellow-400/25'
                    : 'border-gray-200 bg-gray-50 text-gray-400 hover:text-yellow-500 dark:border-gray-800 dark:bg-gray-900'
                }`}
                aria-label={isCurrentFavorite ? 'Remove from JLPT library' : 'Add to JLPT library'}
              >
                <Star size={20} fill={isCurrentFavorite ? 'currentColor' : 'none'} />
              </button>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">{currentItem.group} · {currentItem.row}</p>
              {jlptKanaWriterMode ? (
                <button
                  type="button"
                  onClick={() => speakJapaneseKana(currentItem)}
                  className="mt-4 block w-full rounded-[1.75rem] text-left transition-all active:scale-[0.99]"
                  aria-label="Listen to current kana"
                >
                  <KanaWriter kana={currentItem.kana} romaji={currentItem.romaji} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => speakJapaneseKana(currentItem)}
                    className="mx-auto mt-3 block rounded-[2rem] px-5 py-3 transition-all active:scale-[0.98]"
                    aria-label="Listen to current kana"
                  >
                    <span className="block text-8xl font-black leading-none">{currentItem.kana}</span>
                  </button>
                  <p className="mt-1 text-3xl font-black text-indigo-700 dark:text-indigo-300">{currentItem.romaji}</p>
                </>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-lg shadow-black/5 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between gap-3">
              <span aria-hidden="true" />
              <button
                type="button"
                onClick={() => speakJapaneseText(currentItem.exampleTtsText ?? currentItem.example)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition-all active:scale-95 dark:bg-indigo-950/40 dark:text-indigo-300"
                aria-label="Listen to example word"
              >
                <Volume2 size={17} />
              </button>
            </div>
            <div className="mt-1 text-2xl font-black">
              <JlptInteractiveText text={currentItem.example} kanaItems={popupKanaItems} fallbackLibraryId={currentItem.id} />
            </div>
            <p className="mt-1 text-xs font-black lowercase tracking-[0.12em] text-indigo-700 dark:text-indigo-300">{currentItem.exampleRomaji}</p>
            <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-400">{currentItem.exampleKo}</p>
            <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />
            <div className="flex items-center justify-between gap-3">
              <span aria-hidden="true" />
              <button
                type="button"
                onClick={() => speakJapaneseText(currentItem.exampleSentenceTtsText ?? currentItem.exampleSentenceJa)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition-all active:scale-95 dark:bg-indigo-950/40 dark:text-indigo-300"
                aria-label="Listen to example sentence"
              >
                <Volume2 size={17} />
              </button>
            </div>
            <div className="mt-1 text-lg font-black leading-relaxed">
              <JlptInteractiveText text={currentItem.exampleSentenceJa} kanaItems={popupKanaItems} fallbackLibraryId={currentItem.id} />
            </div>
            <p className="mt-1 text-xs font-black lowercase tracking-[0.08em] text-indigo-700 dark:text-indigo-300">{currentItem.exampleSentenceRomaji}</p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-400">{currentItem.exampleSentenceKo}</p>
          </section>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex(index => clampKanaIndex(index - 1, filteredItems.length))}
              disabled={currentIndex === 0}
              className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-black shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-950"
            >
              <ChevronLeft size={20} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setView('chart')}
              className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-4 text-sm font-black text-gray-700 shadow-sm transition-all active:scale-95 dark:bg-gray-900 dark:text-gray-300"
            >
              <Table2 size={18} />
              {currentIndex + 1}/{filteredItems.length}
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex(index => clampKanaIndex(index + 1, filteredItems.length))}
              disabled={currentIndex === filteredItems.length - 1}
              className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-black px-4 py-4 font-black text-white shadow-xl shadow-black/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>

        </main>
      )}
    </div>
  );
}
