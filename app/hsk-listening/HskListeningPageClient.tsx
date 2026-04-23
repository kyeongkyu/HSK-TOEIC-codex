/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Headphones,
  ListChecks,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  getHskListeningQuestions,
  HSK_LISTENING_QUESTIONS,
  HSK_LISTENING_REVIEW_META,
  HSK_LISTENING_TOPIC_META,
  HskListeningActivityType,
  HskListeningAttempt,
  HskListeningLevel,
  HskListeningQuestion,
  HskListeningReviewFilter,
  HskListeningTopic,
} from '@/data/hsk-listening';
import { useSettings } from '@/hooks/use-settings';
import { useHskTTS } from '@/hooks/useHskTTS';
import { formatPinyin } from '@/lib/pinyin';

type Step = 'topic' | 'mode' | 'review-filter' | 'questions' | 'results';
type StudyMode = 'practice' | 'quiz' | 'review';

type ProgressState = {
  attempts: HskListeningAttempt[];
  bookmarkedIds: string[];
  replayCounts: Record<string, number>;
  savedSetProgress: Record<string, { currentIndex: number }>;
};

const STORAGE_KEY = 'hsk_listening_progress';
const DEFAULT_PROGRESS: ProgressState = {
  attempts: [],
  bookmarkedIds: [],
  replayCounts: {},
  savedSetProgress: {},
};
const TOPICS = Object.keys(HSK_LISTENING_TOPIC_META) as HskListeningTopic[];

const MODE_META: Record<StudyMode, { label: string; description: string }> = {
  practice: { label: 'Practice', description: 'Listen first, then reveal pinyin, Hanzi, meaning, and explanation.' },
  quiz: { label: 'Quiz', description: 'Solve multiple choice, fill blank, and dictation questions separately.' },
  review: { label: 'Review', description: 'Return to incorrect, replayed, or bookmarked listening questions.' },
};

function normalizeProgress(stored: unknown): ProgressState {
  if (!stored || typeof stored !== 'object') return DEFAULT_PROGRESS;
  const parsed = stored as Partial<ProgressState>;
  return {
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    bookmarkedIds: Array.isArray(parsed.bookmarkedIds) ? parsed.bookmarkedIds : [],
    replayCounts: parsed.replayCounts && typeof parsed.replayCounts === 'object' ? parsed.replayCounts : {},
    savedSetProgress: parsed.savedSetProgress && typeof parsed.savedSetProgress === 'object' ? parsed.savedSetProgress : {},
  };
}

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[，。！？,.!?\s]/g, '')
    .trim();
}

function isAnswerCorrect(question: HskListeningQuestion, selectedAnswer: string) {
  const expected = normalizeAnswer(question.answer);
  const selected = normalizeAnswer(selectedAnswer);

  if (question.activityType === 'dictation') {
    return selected === expected || selected === normalizeAnswer(question.pinyin);
  }

  return selected === expected;
}

function getReviewIds(progress: ProgressState, filter: HskListeningReviewFilter) {
  const ids = new Set<string>();

  if (filter === 'bookmarked') {
    progress.bookmarkedIds.forEach((id) => ids.add(id));
    return ids;
  }

  if (filter === 'replayed_often') {
    Object.entries(progress.replayCounts).forEach(([id, count]) => {
      if (count >= 3) ids.add(id);
    });
    return ids;
  }

  const wrongCounts = progress.attempts.reduce<Record<string, number>>((counts, attempt) => {
    if (!attempt.correct) counts[attempt.questionId] = (counts[attempt.questionId] ?? 0) + 1;
    return counts;
  }, {});

  Object.entries(wrongCounts).forEach(([id, count]) => {
    if (filter === 'incorrect_only' && count > 0) ids.add(id);
    if (filter === 'frequently_missed' && count >= 2) ids.add(id);
  });

  return ids;
}

function activityBadge(activityType: HskListeningActivityType) {
  return activityType.replace(/_/g, ' ');
}

function getSetProgressKey(
  level: HskListeningLevel,
  topic: HskListeningTopic,
  mode: Exclude<StudyMode, 'review'> | 'review',
  filter?: HskListeningReviewFilter,
) {
  return mode === 'review'
    ? `${level}:${topic}:review:${filter ?? 'all'}`
    : `${level}:${topic}:${mode}`;
}

function getProgressPercent(currentIndex: number, totalQuestions: number) {
  if (totalQuestions === 0) return 0;
  return Math.round((Math.min(Math.max(currentIndex, 0), totalQuestions) / totalQuestions) * 100);
}

export default function HskListeningPage() {
  const tts = useHskTTS();
  const { selectedLevel: homeSelectedLevel } = useSettings();
  const stopTts = tts.stop;
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [step, setStep] = useState<Step>('topic');
  const [selectedTopic, setSelectedTopic] = useState<HskListeningTopic | null>(null);
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [reviewFilter, setReviewFilter] = useState<HskListeningReviewFilter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const [sessionResults, setSessionResults] = useState<HskListeningAttempt[]>([]);
  const [sessionPlayCounts, setSessionPlayCounts] = useState<Record<string, number>>({});
  const questionStartRef = useRef(0);
  const selectedLevel = (homeSelectedLevel === 'all' ? 1 : homeSelectedLevel) as HskListeningLevel;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      try {
        setProgress(normalizeProgress(JSON.parse(stored)));
      } catch {
        setProgress(DEFAULT_PROGRESS);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    questionStartRef.current = Date.now();
    stopTts();
    setSelectedAnswer('');
    setSubmitted(false);
    setRevealStep(0);
  }, [currentIndex, selectedLevel, selectedTopic, selectedMode, reviewFilter, stopTts]);

  useEffect(() => () => stopTts(), [stopTts]);

  const saveProgress = (nextProgress: ProgressState) => {
    setProgress(nextProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
  };

  const saveSetProgress = (
    key: string,
    index: number,
    totalQuestions: number,
    sourceProgress = progress,
  ) => {
    const nextIndex = totalQuestions > 0
      ? Math.min(Math.max(index, 0), totalQuestions)
      : 0;

    if ((sourceProgress.savedSetProgress[key]?.currentIndex ?? 0) === nextIndex) return;

    saveProgress({
      ...sourceProgress,
      savedSetProgress: {
        ...sourceProgress.savedSetProgress,
        [key]: { currentIndex: nextIndex },
      },
    });
  };

  const topicCards = useMemo(() => {
    return TOPICS.map((topic) => ({
      topic,
      ...HSK_LISTENING_TOPIC_META[topic],
      count: getHskListeningQuestions(selectedLevel, topic).length,
    }));
  }, [selectedLevel]);

  const practiceQuestionsForTopic = useMemo(() => {
    if (!selectedTopic) return [];
    return getHskListeningQuestions(selectedLevel, selectedTopic).filter((question) => (
      question.activityType === 'practice' ||
      question.activityType === 'repeat_listening' ||
      question.activityType === 'shadowing'
    ));
  }, [selectedLevel, selectedTopic]);

  const quizQuestionsForTopic = useMemo(() => {
    if (!selectedTopic) return [];
    return getHskListeningQuestions(selectedLevel, selectedTopic).filter((question) => (
      question.activityType === 'multiple_choice' ||
      question.activityType === 'fill_blank' ||
      question.activityType === 'dictation'
    ));
  }, [selectedLevel, selectedTopic]);

  const reviewQuestionsByFilter = useMemo(() => {
    if (!selectedTopic) {
      return {
        incorrect_only: [],
        frequently_missed: [],
        replayed_often: [],
        bookmarked: [],
      } as Record<HskListeningReviewFilter, HskListeningQuestion[]>;
    }

    return (Object.keys(HSK_LISTENING_REVIEW_META) as HskListeningReviewFilter[]).reduce<Record<HskListeningReviewFilter, HskListeningQuestion[]>>((next, filter) => {
      const ids = getReviewIds(progress, filter);
      next[filter] = HSK_LISTENING_QUESTIONS.filter((question) => (
        question.level === selectedLevel &&
        question.topic === selectedTopic &&
        ids.has(question.id)
      ));
      return next;
    }, {
      incorrect_only: [],
      frequently_missed: [],
      replayed_often: [],
      bookmarked: [],
    });
  }, [progress, selectedLevel, selectedTopic]);

  const questions = useMemo(() => {
    if (!selectedTopic || !selectedMode) return [];
    const levelTopicQuestions = getHskListeningQuestions(selectedLevel, selectedTopic);

    if (selectedMode === 'practice') {
      return levelTopicQuestions.filter((question) => (
        question.activityType === 'practice' ||
        question.activityType === 'repeat_listening' ||
        question.activityType === 'shadowing'
      ));
    }

    if (selectedMode === 'quiz') {
      return levelTopicQuestions.filter((question) => (
        question.activityType === 'multiple_choice' ||
        question.activityType === 'fill_blank' ||
        question.activityType === 'dictation'
      ));
    }

    if (!reviewFilter) return [];
    const ids = getReviewIds(progress, reviewFilter);
    return HSK_LISTENING_QUESTIONS.filter((question) => (
      question.level === selectedLevel &&
      question.topic === selectedTopic &&
      ids.has(question.id)
    ));
  }, [progress, reviewFilter, selectedLevel, selectedMode, selectedTopic]);

  const currentQuestion = questions[currentIndex];
  const isBookmarked = currentQuestion ? progress.bookmarkedIds.includes(currentQuestion.id) : false;
  const currentPlayCount = currentQuestion ? (sessionPlayCounts[currentQuestion.id] ?? 0) : 0;
  const isCurrentCorrect = currentQuestion ? isAnswerCorrect(currentQuestion, selectedAnswer) : false;

  const goBack = () => {
    if (step === 'questions') {
      if (selectedTopic && selectedMode) {
        const progressKey = selectedMode === 'review'
          ? getSetProgressKey(selectedLevel, selectedTopic, 'review', reviewFilter ?? undefined)
          : getSetProgressKey(selectedLevel, selectedTopic, selectedMode);
        saveSetProgress(progressKey, currentIndex, questions.length);
      }
      setStep(selectedMode === 'review' ? 'review-filter' : 'mode');
      return;
    }
    if (step === 'review-filter') {
      setStep('mode');
      setReviewFilter(null);
      return;
    }
    if (step === 'mode') {
      setStep('topic');
      setSelectedMode(null);
      return;
    }
    if (step === 'topic') {
      window.history.back();
      return;
    }
    window.history.back();
  };

  const openMode = (mode: StudyMode) => {
    setSelectedMode(mode);
    setSessionResults([]);
    setSessionPlayCounts({});
    if (mode === 'review') {
      setCurrentIndex(0);
      setStep('review-filter');
      return;
    }
    const progressKey = getSetProgressKey(selectedLevel, selectedTopic as HskListeningTopic, mode);
    const totalQuestions = mode === 'practice' ? practiceQuestionsForTopic.length : quizQuestionsForTopic.length;
    const savedIndex = Math.min(
      progress.savedSetProgress[progressKey]?.currentIndex ?? 0,
      Math.max(totalQuestions - 1, 0),
    );
    setCurrentIndex(savedIndex);
    setStep('questions');
  };

  const playQuestion = (speed: 'normal' | 'slow' = 'normal') => {
    if (!currentQuestion || tts.isSpeaking) return;

    const nextProgress = {
      ...progress,
      replayCounts: {
        ...progress.replayCounts,
        [currentQuestion.id]: (progress.replayCounts[currentQuestion.id] ?? 0) + 1,
      },
    };
    saveProgress(nextProgress);
    setSessionPlayCounts((counts) => ({
      ...counts,
      [currentQuestion.id]: (counts[currentQuestion.id] ?? 0) + 1,
    }));
    void tts.playQuestion(currentQuestion, speed);
  };

  const toggleBookmark = () => {
    if (!currentQuestion) return;
    const bookmarked = new Set(progress.bookmarkedIds);
    if (bookmarked.has(currentQuestion.id)) bookmarked.delete(currentQuestion.id);
    else bookmarked.add(currentQuestion.id);
    saveProgress({ ...progress, bookmarkedIds: [...bookmarked] });
  };

  const submitAnswer = () => {
    if (!currentQuestion || !selectedAnswer.trim() || submitted) return;

    const attempt: HskListeningAttempt = {
      questionId: currentQuestion.id,
      selectedAnswer: currentQuestion.activityType === 'multiple_choice' ? selectedAnswer : undefined,
      typedAnswer: currentQuestion.activityType !== 'multiple_choice' ? selectedAnswer : undefined,
      correct: isAnswerCorrect(currentQuestion, selectedAnswer),
      playedCount: currentPlayCount,
      solvedAt: new Date().toISOString(),
      durationMs: Date.now() - questionStartRef.current,
      level: currentQuestion.level,
      topic: currentQuestion.topic,
      contentType: currentQuestion.contentType,
      activityType: currentQuestion.activityType,
      listeningSkill: currentQuestion.listeningSkill,
      errorTags: isAnswerCorrect(currentQuestion, selectedAnswer)
        ? undefined
        : currentQuestion.listeningSkill === 'number_time_listening'
          ? ['number_time_related']
          : currentQuestion.activityType === 'dictation'
            ? ['character_omission']
            : undefined,
    };
    const nextProgress = { ...progress, attempts: [...progress.attempts, attempt] };
    saveProgress(nextProgress);
    setSessionResults((results) => [...results, attempt]);
    setSubmitted(true);
  };

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      if (selectedTopic && selectedMode) {
        const progressKey = selectedMode === 'review'
          ? getSetProgressKey(selectedLevel, selectedTopic, 'review', reviewFilter ?? undefined)
          : getSetProgressKey(selectedLevel, selectedTopic, selectedMode);
        saveSetProgress(progressKey, questions.length, questions.length);
      }
      setStep('results');
      return;
    }
    const nextIndex = currentIndex + 1;
    if (selectedTopic && selectedMode) {
      const progressKey = selectedMode === 'review'
        ? getSetProgressKey(selectedLevel, selectedTopic, 'review', reviewFilter ?? undefined)
        : getSetProgressKey(selectedLevel, selectedTopic, selectedMode);
      saveSetProgress(progressKey, nextIndex, questions.length);
    }
    setCurrentIndex(nextIndex);
  };

  const restartSet = () => {
    if (selectedTopic && selectedMode) {
      const progressKey = selectedMode === 'review'
        ? getSetProgressKey(selectedLevel, selectedTopic, 'review', reviewFilter ?? undefined)
        : getSetProgressKey(selectedLevel, selectedTopic, selectedMode);
      saveSetProgress(progressKey, 0, questions.length);
    }
    setCurrentIndex(0);
    setSelectedAnswer('');
    setSubmitted(false);
    setRevealStep(0);
    setSessionResults([]);
    setSessionPlayCounts({});
    setStep('questions');
  };

  const renderCard = (
    key: string,
    title: string,
    description: string,
    count: string | number,
    onClick: () => void,
    progressPercent?: number,
  ) => (
    <motion.button
      key={key}
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group w-full rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 text-left transition-all active:scale-[0.99] hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-black/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-800 dark:hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            {count}
          </p>
          {typeof progressPercent === 'number' && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  Progress
                </span>
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-gray-900/70">
                <div
                  className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-2xl bg-white p-3 text-gray-400 shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white dark:bg-white/10">
          <ChevronRight size={18} />
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="flex flex-1 flex-col bg-white px-6 dark:bg-gray-900">
      <div className="mb-8 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="rounded-2xl bg-gray-100 p-4 text-gray-900 transition-all active:scale-95 dark:bg-white/10 dark:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">HSK</p>
            <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white">Listening</h1>
          </div>
        </div>
        <p className="text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-400">
          HSK {selectedLevel} 듣기입니다. 홈에서 선택한 급수 기준으로 큰 주제를 고른 뒤 연습해보세요.
        </p>
      </div>

      {step === 'topic' && (
        <div className="space-y-3">
          {topicCards.map((card) => renderCard(
            card.topic,
            card.label,
            card.description,
            `${card.count} questions`,
            () => {
              setSelectedTopic(card.topic);
              setStep('mode');
            },
          ))}
        </div>
      )}

      {step === 'mode' && (
        <div className="space-y-3">
          {(Object.keys(MODE_META) as StudyMode[]).map((mode) => {
            const totalQuestions = mode === 'practice'
              ? practiceQuestionsForTopic.length
              : mode === 'quiz'
                ? quizQuestionsForTopic.length
                : 0;
            const progressPercent = mode === 'review'
              ? undefined
              : getProgressPercent(
                progress.savedSetProgress[getSetProgressKey(selectedLevel, selectedTopic as HskListeningTopic, mode)]?.currentIndex ?? 0,
                totalQuestions,
              );

            return renderCard(
              mode,
              MODE_META[mode].label,
              MODE_META[mode].description,
              mode === 'practice'
                ? `${practiceQuestionsForTopic.length} items`
                : mode === 'quiz'
                  ? `${quizQuestionsForTopic.length} items`
                  : 'saved progress',
              () => openMode(mode),
              progressPercent,
            );
          })}
        </div>
      )}

      {step === 'review-filter' && (
        <div className="space-y-3">
          {(Object.keys(HSK_LISTENING_REVIEW_META) as HskListeningReviewFilter[]).map((filter) => {
            const reviewQuestions = reviewQuestionsByFilter[filter];
            const progressPercent = getProgressPercent(
              progress.savedSetProgress[getSetProgressKey(selectedLevel, selectedTopic as HskListeningTopic, 'review', filter)]?.currentIndex ?? 0,
              reviewQuestions.length,
            );

            return renderCard(
              filter,
              HSK_LISTENING_REVIEW_META[filter].label,
              HSK_LISTENING_REVIEW_META[filter].description,
              `${reviewQuestions.length} questions`,
              () => {
                setReviewFilter(filter);
                setCurrentIndex(
                  Math.min(
                    progress.savedSetProgress[getSetProgressKey(selectedLevel, selectedTopic as HskListeningTopic, 'review', filter)]?.currentIndex ?? 0,
                    Math.max(reviewQuestions.length - 1, 0),
                  ),
                );
                setSessionResults([]);
                setSessionPlayCounts({});
                setStep('questions');
              },
              progressPercent,
            );
          })}
        </div>
      )}

      {step === 'questions' && (
        <div className="flex flex-1 flex-col">
          {!currentQuestion ? (
            <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <Headphones className="mx-auto mb-4 text-gray-400" size={36} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">No questions yet</h2>
              <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-400">이 조건에 맞는 복습 문제가 아직 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
                    HSK {currentQuestion.level} / {HSK_LISTENING_TOPIC_META[currentQuestion.topic].label}
                  </p>
                  <p className="mt-1 text-sm font-black text-gray-500 dark:text-gray-400">
                    {currentIndex + 1} / {questions.length} · {activityBadge(currentQuestion.activityType)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleBookmark}
                  className={`rounded-2xl p-3 transition-all active:scale-95 ${isBookmarked ? 'bg-yellow-100 text-yellow-500 dark:bg-yellow-500/15' : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'}`}
                  aria-label="Bookmark"
                >
                  <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={tts.isSpeaking}
                    onClick={() => playQuestion('normal')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-60"
                  >
                    <Volume2 size={18} />
                    Listen
                  </button>
                  <button
                    type="button"
                    disabled={tts.isSpeaking}
                    onClick={() => playQuestion('slow')}
                    className="rounded-2xl bg-white px-4 py-4 text-sm font-black text-gray-700 transition-all active:scale-[0.99] disabled:opacity-60 dark:bg-gray-900 dark:text-gray-100"
                  >
                    Slow
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-900 dark:text-gray-400">{currentQuestion.contentType}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-900 dark:text-gray-400">{currentQuestion.listeningSkill.replace(/_/g, ' ')}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-900 dark:text-gray-400">{currentPlayCount} plays</span>
                </div>
                {tts.error && <p className="mt-4 text-xs font-bold text-red-500">{tts.error}</p>}
              </div>

              {selectedMode === 'practice' ? (
                <div className="space-y-3">
                  {revealStep >= 1 && <InfoBlock label="Hanzi" value={currentQuestion.transcript} strong />}
                  {revealStep >= 2 && <InfoBlock label="Pinyin" value={formatPinyin(currentQuestion.pinyin)} />}
                  {revealStep >= 3 && <InfoBlock label="Meaning" value={currentQuestion.translation} />}
                  {revealStep >= 4 && <InfoBlock label="Explanation" value={currentQuestion.explanation} />}
                  {revealStep < 4 && (
                    <button
                      type="button"
                      onClick={() => setRevealStep((step) => step + 1)}
                      className="w-full rounded-2xl bg-gray-900 px-4 py-4 text-sm font-black text-white transition-all active:scale-[0.99] dark:bg-blue-500"
                    >
                      {revealStep === 0 ? 'Show Hanzi' : revealStep === 1 ? 'Show Pinyin' : revealStep === 2 ? 'Show Meaning' : 'Show Explanation'}
                    </button>
                  )}
                </div>
              ) : (
                <QuizAnswer
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  submitted={submitted}
                  onChange={setSelectedAnswer}
                />
              )}

              {selectedMode !== 'practice' && !submitted && (
                <button
                  type="button"
                  disabled={!selectedAnswer.trim()}
                  onClick={submitAnswer}
                  className="w-full rounded-2xl bg-gray-950 px-4 py-4 text-sm font-black text-white transition-all active:scale-[0.99] disabled:opacity-40 dark:bg-blue-500"
                >
                  Submit
                </button>
              )}

              {selectedMode !== 'practice' && submitted && (
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className={`mb-4 flex items-center gap-2 font-black ${isCurrentCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    {isCurrentCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {isCurrentCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                  <InfoBlock label="Hanzi" value={currentQuestion.transcript} strong />
                  <InfoBlock label="Pinyin" value={formatPinyin(currentQuestion.pinyin)} />
                  <InfoBlock label="Meaning" value={currentQuestion.translation} />
                  <InfoBlock label="Explanation" value={currentQuestion.explanation} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswer('');
                    setSubmitted(false);
                    setRevealStep(0);
                    playQuestion('normal');
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-4 text-sm font-black text-gray-700 transition-all active:scale-[0.99] dark:bg-white/10 dark:text-gray-100"
                >
                  <RotateCcw size={17} />
                  Replay
                </button>
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-[0.99]"
                >
                  {currentIndex >= questions.length - 1 ? 'Results' : 'Next'}
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'results' && (
        <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-5 sm:p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <ListChecks className="mx-auto mb-4 text-blue-600 dark:text-blue-400" size={42} />
          <h2 className="text-2xl font-black text-gray-950 dark:text-white">Session Complete</h2>
          <p className="mt-2 min-w-0 break-keep text-sm sm:text-base leading-snug font-bold text-gray-500 dark:text-gray-400">
            {selectedMode === 'quiz' || selectedMode === 'review'
              ? `${sessionResults.filter((result) => result.correct).length} / ${sessionResults.length} correct`
              : `${questions.length} listening items practiced`}
          </p>
          <button
            type="button"
            onClick={restartSet}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-[0.99]"
          >
            Restart Set
          </button>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-gray-900">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{label}</p>
      <p className={`${strong ? 'text-2xl font-black' : 'text-sm font-bold'} leading-relaxed text-gray-900 dark:text-white`}>
        {value}
      </p>
    </div>
  );
}

function QuizAnswer({
  question,
  selectedAnswer,
  submitted,
  onChange,
}: {
  question: HskListeningQuestion;
  selectedAnswer: string;
  submitted: boolean;
  onChange: (value: string) => void;
}) {
  if (question.activityType === 'multiple_choice') {
    return (
      <div className="space-y-3">
        {(question.choices ?? []).map((choice) => {
          const selected = selectedAnswer === choice;
          const correct = choice === question.answer;
          const stateClass = submitted && correct
            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
            : submitted && selected && !correct
              ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              : selected
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300'
                : 'border-gray-100 bg-white text-gray-900 hover:border-blue-200 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:border-blue-800';

          return (
            <button
              key={choice}
              type="button"
              disabled={submitted}
              onClick={() => onChange(choice)}
              className={`w-full rounded-[1.25rem] border p-4 text-left text-sm font-bold leading-relaxed transition-all active:scale-[0.99] disabled:cursor-not-allowed ${stateClass}`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    );
  }

  const placeholder = question.activityType === 'dictation'
    ? '들은 문장을 한자로 입력하세요.'
    : `빈칸에 들어갈 표현을 입력하세요.`;

  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      {question.activityType === 'fill_blank' && (
        <p className="mb-4 text-sm font-black leading-relaxed text-gray-700 dark:text-gray-200">
          {question.transcript.replace(question.answer, '____')}
        </p>
      )}
      <textarea
        value={selectedAnswer}
        disabled={submitted}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full resize-none rounded-2xl border border-gray-100 bg-white p-4 text-base font-bold text-gray-900 outline-none transition-all focus:border-blue-400 dark:border-white/10 dark:bg-gray-900 dark:text-white"
      />
    </div>
  );
}
