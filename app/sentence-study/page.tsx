/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Eye, EyeOff, List, Star, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HSK_SENTENCE_STUDY_TOPICS,
  hskSentenceStudyItems,
  HskSentenceStudyItem,
  HskSentenceStudyTopic,
} from '@/data/hsk-sentence-study';
import { hskWords } from '@/data/hsk';
import { useSettings } from '@/hooks/use-settings';
import { useUserWords } from '@/hooks/use-user-words';
import { speak } from '@/lib/tts';

const BOOKMARK_STORAGE_KEY = 'hsk_sentence_study_bookmarks';

type RevealState = {
  pinyin: boolean;
  translation: boolean;
  expression: boolean;
  grammar: boolean;
};

const INITIAL_REVEAL_STATE: RevealState = {
  pinyin: false,
  translation: false,
  expression: false,
  grammar: false,
};

function getLevelForSentenceStudy(selectedLevel: number | 'all') {
  return selectedLevel === 'all' ? 1 : selectedLevel;
}

function getDifficultyLabel(sentence: HskSentenceStudyItem) {
  if (sentence.difficultyTag === 'stretch') return '확장';
  if (sentence.difficultyTag === 'core') return '핵심';
  return '기초';
}

function getSentenceTextSizeClass(text: string) {
  const length = Array.from(text).length;
  if (length <= 8) return 'text-4xl sm:text-5xl leading-tight';
  if (length <= 12) return 'text-[2rem] sm:text-4xl leading-tight';
  if (length <= 16) return 'text-[1.75rem] sm:text-3xl leading-snug';
  return 'text-[1.45rem] sm:text-[1.85rem] leading-snug';
}

export default function SentenceStudyPage() {
  const router = useRouter();
  const { selectedLevel, ttsSpeed, hanziFont, isLoaded } = useSettings();
  const { userWords, toggleFavorite } = useUserWords();
  const [selectedTopic, setSelectedTopic] = useState<HskSentenceStudyTopic | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListOpen, setIsListOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<RevealState>(INITIAL_REVEAL_STATE);
  const [activeKeywordKey, setActiveKeywordKey] = useState<string | null>(null);

  const activeLevel = getLevelForSentenceStudy(selectedLevel);

  const levelSentences = useMemo(
    () => hskSentenceStudyItems.filter((sentence) => sentence.level === activeLevel),
    [activeLevel],
  );

  const topicCounts = useMemo(() => {
    return HSK_SENTENCE_STUDY_TOPICS.reduce<Record<string, number>>((counts, topic) => {
      counts[topic] = levelSentences.filter((sentence) => sentence.topic === topic).length;
      return counts;
    }, {});
  }, [levelSentences]);

  const filteredSentences = useMemo(() => {
    if (selectedTopic === 'all') return levelSentences;
    return levelSentences.filter((sentence) => sentence.topic === selectedTopic);
  }, [levelSentences, selectedTopic]);

  const currentSentence = filteredSentences[currentIndex];
  const isBookmarked = currentSentence ? bookmarkedIds.includes(currentSentence.id) : false;

  const getKeywordWord = (keyword: HskSentenceStudyItem['keywords'][number]) => {
    return keyword.wordId
      ? hskWords.find((word) => word.id === keyword.wordId)
      : hskWords.find((word) => word.word === keyword.word);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (stored) {
        setBookmarkedIds(JSON.parse(stored));
      }
    } catch {
      setBookmarkedIds([]);
    }
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setRevealed(INITIAL_REVEAL_STATE);
    setIsListOpen(false);
  }, [activeLevel, selectedTopic]);

  useEffect(() => {
    if (currentIndex <= filteredSentences.length - 1) return;
    setCurrentIndex(Math.max(filteredSentences.length - 1, 0));
  }, [currentIndex, filteredSentences.length]);

  const toggleBookmark = () => {
    if (!currentSentence) return;
    setBookmarkedIds((prev) => {
      const next = prev.includes(currentSentence.id)
        ? prev.filter((id) => id !== currentSentence.id)
        : [...prev, currentSentence.id];
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const moveToSentence = (index: number) => {
    setCurrentIndex(index);
    setRevealed(INITIAL_REVEAL_STATE);
    setIsListOpen(false);
    setActiveKeywordKey(null);
  };

  const moveBy = (amount: number) => {
    moveToSentence(Math.min(Math.max(currentIndex + amount, 0), filteredSentences.length - 1));
  };

  const toggleReveal = (key: keyof RevealState) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const playSentence = () => {
    if (!currentSentence) return;
    speak(currentSentence.audioText, ttsSpeed, 'zh-CN');
  };

  if (!isLoaded) {
    return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;
  }

  if (!currentSentence) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 flex items-center justify-center text-center">
        <div className="max-w-sm rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-8">
          <h1 className="text-2xl font-black text-black dark:text-white">문장 데이터 준비 중</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400">
            현재 선택한 급수에는 아직 문장 학습 샘플이 없습니다. 1차 버전은 HSK 1급부터 제공합니다.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white active:scale-95 transition-all"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 pb-8 transition-colors duration-200">
      <header className="pt-8 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-3 text-black dark:text-white active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
              HSK {activeLevel}
            </p>
            <h1 className="text-xl font-black text-black dark:text-white">Sentence Study</h1>
          </div>
          <button
            onClick={toggleBookmark}
            className={`rounded-2xl p-3 transition-all active:scale-95 ${
              isBookmarked
                ? 'bg-yellow-100 text-yellow-500 dark:bg-yellow-500/15'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
            aria-label={isBookmarked ? 'Remove sentence bookmark' : 'Bookmark sentence'}
          >
            <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setSelectedTopic('all')}
          className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-black transition-all active:scale-95 ${
            selectedTopic === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          전체 {levelSentences.length}
        </button>
        {HSK_SENTENCE_STUDY_TOPICS.filter((topic) => topicCounts[topic] > 0).map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-black transition-all active:scale-95 ${
              selectedTopic === topic
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {topic} {topicCounts[topic]}
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center justify-between rounded-[1.5rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <button
            onClick={() => setIsListOpen((open) => !open)}
            className="flex items-center gap-2 rounded-2xl bg-white dark:bg-gray-900 px-3 py-2 text-xs font-black text-gray-600 dark:text-gray-300 shadow-sm active:scale-95 transition-all"
          >
            <List size={16} />
            List
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {currentSentence.topic} · {getDifficultyLabel(currentSentence)}
            </p>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400">
              {currentIndex + 1} / {filteredSentences.length}
            </p>
          </div>
          <button
            onClick={playSentence}
            className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            aria-label="Listen to sentence"
          >
            <Volume2 size={18} />
          </button>
        </div>

        <AnimatePresence>
          {isListOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-[1.5rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2"
            >
              {filteredSentences.map((sentence, index) => (
                <button
                  key={sentence.id}
                  onClick={() => moveToSentence(index)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                    index === currentIndex
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-100 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900/70 dark:text-white'
                  }`}
                >
                  <p className="truncate text-sm font-black">{sentence.text}</p>
                  <p className={`mt-1 truncate text-xs ${index === currentIndex ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'}`}>
                    {sentence.translationKo}
                  </p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          key={currentSentence.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-visible rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm"
        >
          <div className="mb-6 text-center">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
              Read First
            </p>
            <h2
              className={`mx-auto max-w-full whitespace-normal break-words font-black text-black dark:text-white ${getSentenceTextSizeClass(currentSentence.text)}`}
              style={{
                fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})`,
                overflowWrap: 'anywhere',
                wordBreak: 'normal',
              }}
            >
              {currentSentence.text}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <RevealButton label="Pinyin" active={revealed.pinyin} onClick={() => toggleReveal('pinyin')} />
            <RevealButton label="Meaning" active={revealed.translation} onClick={() => toggleReveal('translation')} />
            <RevealButton label="Expression" active={revealed.expression} onClick={() => toggleReveal('expression')} />
            <RevealButton label="Grammar" active={revealed.grammar} onClick={() => toggleReveal('grammar')} />
          </div>

          <div className="mt-5 space-y-3">
            {revealed.pinyin && <InfoPanel title="병음" body={currentSentence.pinyin} accent="blue" />}
            {revealed.translation && <InfoPanel title="해석" body={currentSentence.translationKo} accent="green" />}
            {revealed.expression && <InfoPanel title="핵심 표현" body={currentSentence.expression} accent="amber" />}
            {revealed.grammar && <InfoPanel title="문법 포인트" body={currentSentence.grammar} accent="violet" />}
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
              Keywords
            </p>
            <div className="flex flex-wrap gap-2">
              {currentSentence.keywords.map((keyword) => (
                (() => {
                  const wordData = getKeywordWord(keyword);
                  const keywordKey = `${currentSentence.id}-${keyword.word}`;
                  const isActive = activeKeywordKey === keywordKey;
                  return (
                    <div key={keywordKey} className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveKeywordKey(isActive ? null : keywordKey)}
                        className="rounded-xl bg-white dark:bg-gray-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                      >
                        <span className="text-blue-600 dark:text-blue-400">{keyword.word}</span>
                        <span className="ml-1 text-gray-400">?</span>
                        <span className="ml-1">{wordData?.meaning ?? keyword.meaningKo}</span>
                      </button>

                      {isActive && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-3rem)] rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-2xl shadow-black/10 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40">
                          <div className="text-lg font-black text-black dark:text-white">{keyword.word}</div>
                          {wordData?.pinyin && (
                            <div className="mt-1 text-sm font-bold text-blue-600 dark:text-blue-400">{wordData.pinyin.toLowerCase()}</div>
                          )}
                          <div className="mt-2 text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-300">
                            {wordData?.meaning ?? keyword.meaningKo}
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => speak(keyword.word, ttsSpeed, 'zh-CN')}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white active:scale-95 transition-all"
                            >
                              <Volume2 size={15} />
                              TTS
                            </button>
                            {wordData && (
                              <button
                                type="button"
                                onClick={() => toggleFavorite(wordData.id)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black active:scale-95 transition-all ${
                                  userWords[wordData.id]?.isFavorite
                                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                <Star size={15} fill={userWords[wordData.id]?.isFavorite ? 'currentColor' : 'none'} />
                                Library
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ))}
            </div>
            {currentSentence.notes && (
              <p className="mt-4 rounded-2xl bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                {currentSentence.notes}
              </p>
            )}
          </div>
        </motion.section>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => moveBy(-1)}
            disabled={currentIndex === 0}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 font-black text-gray-700 dark:text-gray-200 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <button
            onClick={() => moveBy(1)}
            disabled={currentIndex === filteredSentences.length - 1}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RevealButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition-all active:scale-95 ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          : 'bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400'
      }`}
    >
      {active ? <EyeOff size={15} /> : <Eye size={15} />}
      {active ? `Hide ${label}` : `Show ${label}`}
    </button>
  );
}

function InfoPanel({ title, body, accent }: { title: string; body: string; accent: 'blue' | 'green' | 'amber' | 'violet' }) {
  const accentClass = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    green: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border px-4 py-3 ${accentClass}`}
    >
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{title}</p>
      <p className="text-sm font-bold leading-relaxed">{body}</p>
    </motion.div>
  );
}
