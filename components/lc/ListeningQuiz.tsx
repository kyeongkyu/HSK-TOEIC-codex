'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bookmark, CheckCircle2, Headphones, RotateCcw, Volume2 } from 'lucide-react';
import {
  LC_FILTER_META,
  LcChoiceId,
  LcFilterKind,
  LcFilterValue,
  LcPart2Question,
  LcReviewFilter,
  TOEIC_LC_PART2_QUESTIONS,
} from '@/data/toeic-lc-part2';
import { useTTS } from '@/hooks/useTTS';
import { ChoiceButton } from './ChoiceButton';
import { LcCategoryCard, LcCategoryGrid } from './LcCategoryGrid';
import { ReviewPanel } from './ReviewPanel';

type ListeningQuizProps = {
  onPracticeActiveChange?: (active: boolean) => void;
};

type LcAttemptRecord = {
  questionId: string;
  selectedAnswer: LcChoiceId;
  correct: boolean;
  playedCount: number;
  solvedAt: string;
  durationMs: number;
  questionType: LcPart2Question['questionType'];
  trapType: LcPart2Question['trapType'];
  scenario: LcPart2Question['scenario'];
};

type LcProgressState = {
  attempts: LcAttemptRecord[];
  bookmarkedIds: string[];
  replayCounts: Record<string, number>;
  savedSetProgress: Record<string, { currentIndex: number }>;
};

type LcQuestionSnapshot = {
  selectedAnswer: LcChoiceId | null;
  submitted: boolean;
  showTranscript: boolean;
};

const STORAGE_KEY = 'toeic_lc_part2_progress';
const DEFAULT_PROGRESS: LcProgressState = {
  attempts: [],
  bookmarkedIds: [],
  replayCounts: {},
  savedSetProgress: {},
};

const MAIN_FILTERS: Array<{ kind: LcFilterKind; label: string; description: string }> = [
  { kind: 'questionType', label: 'Question Type', description: 'Practice who, when, where, and other Part 2 question patterns.' },
  { kind: 'trapType', label: 'Trap Type', description: 'Train keyword traps, indirect answers, and elimination skills.' },
  { kind: 'scenario', label: 'Scenario', description: 'Focus on office, meeting, travel, service, and workplace contexts.' },
  { kind: 'review', label: 'Review', description: 'Return to incorrect, frequently missed, replayed, or bookmarked questions.' },
];

function normalizeProgress(stored: unknown): LcProgressState {
  if (!stored || typeof stored !== 'object') return DEFAULT_PROGRESS;

  const parsed = stored as Partial<LcProgressState>;
  return {
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    bookmarkedIds: Array.isArray(parsed.bookmarkedIds) ? parsed.bookmarkedIds : [],
    replayCounts: parsed.replayCounts && typeof parsed.replayCounts === 'object' ? parsed.replayCounts : {},
    savedSetProgress: parsed.savedSetProgress && typeof parsed.savedSetProgress === 'object' ? parsed.savedSetProgress : {},
  };
}

function getSetProgressKey(kind: LcFilterKind, value: LcFilterValue) {
  return `${kind}:${value}`;
}

function getReviewQuestionIds(progress: LcProgressState, reviewFilter: LcReviewFilter) {
  const ids = new Set<string>();

  if (reviewFilter === 'bookmarked') {
    progress.bookmarkedIds.forEach((id) => ids.add(id));
    return ids;
  }

  if (reviewFilter === 'replayed_often') {
    Object.entries(progress.replayCounts).forEach(([questionId, count]) => {
      if (count >= 3) ids.add(questionId);
    });
    return ids;
  }

  const wrongCounts = progress.attempts.reduce<Record<string, number>>((counts, attempt) => {
    if (!attempt.correct) {
      counts[attempt.questionId] = (counts[attempt.questionId] ?? 0) + 1;
    }
    return counts;
  }, {});

  Object.entries(wrongCounts).forEach(([questionId, count]) => {
    if (reviewFilter === 'incorrect_only' && count > 0) ids.add(questionId);
    if (reviewFilter === 'frequently_missed' && count >= 2) ids.add(questionId);
  });

  return ids;
}

function filterQuestions(kind: LcFilterKind, value: LcFilterValue, progress: LcProgressState) {
  if (kind === 'review') {
    const reviewIds = getReviewQuestionIds(progress, value as LcReviewFilter);
    return TOEIC_LC_PART2_QUESTIONS.filter((question) => reviewIds.has(question.id));
  }

  return TOEIC_LC_PART2_QUESTIONS.filter((question) => question[kind] === value);
}

export function ListeningQuiz({ onPracticeActiveChange }: ListeningQuizProps) {
  const tts = useTTS();
  const stopTts = tts.stop;
  const [progress, setProgress] = useState<LcProgressState>(DEFAULT_PROGRESS);
  const [selectedKind, setSelectedKind] = useState<LcFilterKind | null>(null);
  const [selectedValue, setSelectedValue] = useState<LcFilterValue | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<LcChoiceId | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState<LcAttemptRecord[]>([]);
  const [sessionPlayCounts, setSessionPlayCounts] = useState<Record<string, number>>({});
  const [questionHistory, setQuestionHistory] = useState<Array<LcQuestionSnapshot | null>>([]);
  const questionStartRef = useRef(0);

  useEffect(() => {
    const hydrateTimeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      try {
        setProgress(normalizeProgress(JSON.parse(stored)));
      } catch {
        setProgress(DEFAULT_PROGRESS);
      }
    }, 0);

    return () => window.clearTimeout(hydrateTimeoutId);
  }, []);

  useEffect(() => {
    questionStartRef.current = Date.now();
    stopTts();
  }, [currentIndex, selectedValue, stopTts]);

  useEffect(() => {
    return () => stopTts();
  }, [stopTts]);

  useEffect(() => {
    onPracticeActiveChange?.(selectedKind !== null);
  }, [onPracticeActiveChange, selectedKind]);

  const saveProgress = (nextProgress: LcProgressState) => {
    setProgress(nextProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
  };

  const saveSetProgress = (
    kind: LcFilterKind,
    value: LcFilterValue,
    index: number,
    totalQuestions: number,
    sourceProgress = progress,
  ) => {
    const progressKey = getSetProgressKey(kind, value);
    const nextIndex = totalQuestions > 0
      ? Math.min(Math.max(index, 0), totalQuestions)
      : 0;

    if ((sourceProgress.savedSetProgress[progressKey]?.currentIndex ?? 0) === nextIndex) {
      return;
    }

    saveProgress({
      ...sourceProgress,
      savedSetProgress: {
        ...sourceProgress.savedSetProgress,
        [progressKey]: { currentIndex: nextIndex },
      },
    });
  };

  const categoryCards = useMemo<LcCategoryCard[]>(() => {
    if (!selectedKind) return [];

    const values = LC_FILTER_META[selectedKind].values as Record<string, { label: string; description: string }>;
    return Object.entries(values).map(([id, meta]) => ({
      id,
      label: meta.label,
      description: meta.description,
      count: filterQuestions(selectedKind, id as LcFilterValue, progress).length,
      progressPercent: (() => {
        const filteredQuestions = filterQuestions(selectedKind, id as LcFilterValue, progress);
        const savedIndex = Math.min(
          progress.savedSetProgress[getSetProgressKey(selectedKind, id as LcFilterValue)]?.currentIndex ?? 0,
          filteredQuestions.length,
        );
        return filteredQuestions.length > 0
          ? Math.round((savedIndex / filteredQuestions.length) * 100)
          : 0;
      })(),
    }));
  }, [selectedKind, progress]);

  const questions = useMemo(() => {
    if (!selectedKind || !selectedValue) return [];
    return filterQuestions(selectedKind, selectedValue, progress);
  }, [progress, selectedKind, selectedValue]);

  const currentQuestion = questions[currentIndex];
  const isReviewMode = selectedKind === 'review';
  const currentPlayCount = currentQuestion ? (sessionPlayCounts[currentQuestion.id] ?? 0) : 0;
  const maxPlayCount = isReviewMode || submitted ? Infinity : 2;
  const remainingPlays = Number.isFinite(maxPlayCount) ? Math.max(maxPlayCount - currentPlayCount, 0) : Infinity;
  const isBookmarked = currentQuestion ? progress.bookmarkedIds.includes(currentQuestion.id) : false;
  const isCorrect = Boolean(currentQuestion && selectedAnswer === currentQuestion.answer);

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setSubmitted(false);
    setShowTranscript(false);
  };

  const persistCurrentQuestionState = (overrideIndex?: number) => {
    if (!currentQuestion || isComplete) return;

    const index = overrideIndex ?? currentIndex;
    const snapshot: LcQuestionSnapshot = {
      selectedAnswer,
      submitted,
      showTranscript,
    };

    setQuestionHistory((history) => {
      const nextHistory = [...history];
      nextHistory[index] = snapshot;
      return nextHistory;
    });
  };

  useEffect(() => {
    const snapshot = questionHistory[currentIndex];
    if (snapshot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAnswer(snapshot.selectedAnswer);
      setSubmitted(snapshot.submitted);
      setShowTranscript(snapshot.showTranscript);
      return;
    }

    resetQuestionState();
  }, [currentIndex, questionHistory]);

  const openFilterKind = (kind: LcFilterKind) => {
    setSelectedKind(kind);
    setSelectedValue(null);
    setCurrentIndex(0);
    setIsComplete(false);
    setQuestionHistory([]);
    resetQuestionState();
  };

  const openQuestionSet = (value: string) => {
    const nextValue = value as LcFilterValue;
    const nextQuestions = filterQuestions(selectedKind as LcFilterKind, nextValue, progress);
    const savedIndex = Math.min(
      progress.savedSetProgress[getSetProgressKey(selectedKind as LcFilterKind, nextValue)]?.currentIndex ?? 0,
      Math.max(nextQuestions.length - 1, 0),
    );

    setSelectedValue(value as LcFilterValue);
    setCurrentIndex(savedIndex);
    setIsComplete(false);
    setSessionResults([]);
    setSessionPlayCounts({});
    setQuestionHistory([]);
    resetQuestionState();
  };

  const goBack = () => {
    if (selectedValue) {
      saveSetProgress(selectedKind as LcFilterKind, selectedValue, currentIndex, questions.length);
      setSelectedValue(null);
      setIsComplete(false);
      resetQuestionState();
      return;
    }
    if (selectedKind) {
      setSelectedKind(null);
    }
  };

  const handlePlay = () => {
    if (!currentQuestion || tts.isSpeaking || remainingPlays === 0) return;

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
    void tts.playLcPrompt({
      text: currentQuestion.promptText,
      difficulty: currentQuestion.difficulty,
      questionType: currentQuestion.questionType,
    });
  };

  const toggleBookmark = () => {
    if (!currentQuestion) return;

    const bookmarked = new Set(progress.bookmarkedIds);
    if (bookmarked.has(currentQuestion.id)) {
      bookmarked.delete(currentQuestion.id);
    } else {
      bookmarked.add(currentQuestion.id);
    }

    saveProgress({
      ...progress,
      bookmarkedIds: [...bookmarked],
    });
  };

  const submitAnswer = () => {
    if (!currentQuestion || !selectedAnswer || submitted) return;

    const attempt: LcAttemptRecord = {
      questionId: currentQuestion.id,
      selectedAnswer,
      correct: selectedAnswer === currentQuestion.answer,
      playedCount: currentPlayCount,
      solvedAt: new Date().toISOString(),
      durationMs: Date.now() - (questionStartRef.current || Date.now()),
      questionType: currentQuestion.questionType,
      trapType: currentQuestion.trapType,
      scenario: currentQuestion.scenario,
    };

    const nextProgress = {
      ...progress,
      attempts: [...progress.attempts, attempt],
    };

    saveProgress(nextProgress);
    setSessionResults((results) => [...results, attempt]);
    setSubmitted(true);
    setQuestionHistory((history) => {
      const nextHistory = [...history];
      nextHistory[currentIndex] = {
        selectedAnswer,
        submitted: true,
        showTranscript: false,
      };
      return nextHistory;
    });
  };

  const goNext = () => {
    persistCurrentQuestionState();

    if (currentIndex >= questions.length - 1) {
      if (selectedKind && selectedValue) {
        saveSetProgress(selectedKind, selectedValue, questions.length, questions.length);
      }
      setIsComplete(true);
      tts.stop();
      return;
    }

    const nextIndex = currentIndex + 1;
    if (selectedKind && selectedValue) {
      saveSetProgress(selectedKind, selectedValue, nextIndex, questions.length);
    }
    setCurrentIndex(nextIndex);
  };

  const goPrevious = () => {
    if (currentIndex === 0) return;
    persistCurrentQuestionState();
    const nextIndex = currentIndex - 1;
    if (selectedKind && selectedValue) {
      saveSetProgress(selectedKind, selectedValue, nextIndex, questions.length);
    }
    setCurrentIndex(nextIndex);
  };

  const restartCurrentSet = () => {
    if (selectedKind && selectedValue) {
      saveSetProgress(selectedKind, selectedValue, 0, questions.length);
    }
    setCurrentIndex(0);
    setIsComplete(false);
    setSessionResults([]);
    setSessionPlayCounts({});
    setQuestionHistory([]);
    resetQuestionState();
  };

  if (!selectedKind) {
    return (
      <div className="space-y-5">
        <div className="rounded-[2rem] bg-black/5 p-6 dark:bg-white/[0.04]">
          <div className="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Headphones size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Part 2 LC</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">Listen by skill point</h2>
          <p className="mt-3 text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-400">
            Choose a question type, trap, scenario, or review set. Difficulty stays behind the scenes for TTS pacing.
          </p>
        </div>
        <LcCategoryGrid
          items={MAIN_FILTERS.map((filter) => ({
            id: filter.kind,
            label: filter.label,
            description: filter.description,
            count: filter.kind === 'review'
              ? Object.keys(LC_FILTER_META.review.values).length
              : Object.keys(LC_FILTER_META[filter.kind].values).length,
          }))}
          onSelect={(kind) => openFilterKind(kind as LcFilterKind)}
        />
      </div>
    );
  }

  if (!selectedValue) {
    const meta = LC_FILTER_META[selectedKind];

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-800 transition-all active:scale-95 dark:bg-gray-800 dark:text-gray-100"
        >
          <ArrowLeft size={16} />
          LC Home
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">{meta.label}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tighter text-gray-900 dark:text-white">{meta.description}</h2>
        </div>
        <LcCategoryGrid items={categoryCards} onSelect={openQuestionSet} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-800 transition-all active:scale-95 dark:bg-gray-800 dark:text-gray-100"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <Headphones className="mx-auto mb-5 text-gray-300 dark:text-gray-600" size={52} strokeWidth={1.4} />
          <h2 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">No questions yet</h2>
          <p className="mx-auto mt-3 max-w-[280px] text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-400">
            This category has no saved questions right now. Try another skill point or come back after more practice.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const correctCount = sessionResults.filter((result) => result.correct).length;

    return (
      <div className="space-y-5">
        <div className="rounded-[2rem] bg-blue-600 p-8 text-white shadow-2xl shadow-blue-500/20">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Result</p>
          <h2 className="mt-3 text-4xl font-black tracking-tighter">
            {correctCount} / {questions.length}
          </h2>
          <p className="mt-3 text-sm font-bold leading-relaxed text-white/80">
            Review the missed and replayed items from the review category whenever you want.
          </p>
        </div>
        <button
          type="button"
          onClick={restartCurrentSet}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-4 text-sm font-black text-gray-800 transition-all active:scale-[0.99] dark:bg-gray-800 dark:text-gray-100"
        >
          <RotateCcw size={18} />
          Restart This Set
        </button>
        <button
          type="button"
          onClick={goBack}
          className="w-full rounded-2xl bg-black px-4 py-4 text-sm font-black text-white transition-all active:scale-[0.99] dark:bg-white dark:text-black"
        >
          Choose Another Category
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-800 transition-all active:scale-95 dark:bg-gray-800 dark:text-gray-100"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <span className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-white/[0.03]"
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {[currentQuestion.questionType, currentQuestion.trapType, currentQuestion.scenario].map((badge) => (
            <span key={badge} className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              {badge}
            </span>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Listen first</p>
            <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">
              Remaining plays: {Number.isFinite(remainingPlays) ? remainingPlays : 'Unlimited'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleBookmark}
            className={`rounded-2xl p-3 transition-all active:scale-95 ${isBookmarked ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
          >
            <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <button
          type="button"
          onClick={handlePlay}
          disabled={!tts.isSupported || tts.isLoadingVoices || tts.isSpeaking || remainingPlays === 0}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 px-5 py-5 text-base font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Volume2 size={22} />
          {tts.isSpeaking ? 'Playing...' : 'Play Question'}
        </button>

        {!tts.isSupported && (
          <p className="mb-4 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">
            Speech synthesis is not supported in this browser.
          </p>
        )}
        {tts.isSupported && tts.error && (
          <p className="mb-4 rounded-2xl bg-yellow-50 p-3 text-xs font-bold text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">
            {tts.error}
          </p>
        )}
        {tts.isLoadingVoices && (
          <p className="mb-4 rounded-2xl bg-gray-50 p-3 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Loading English voices...
          </p>
        )}

        <div className="space-y-3">
          {currentQuestion.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              id={choice.id}
              text={choice.text}
              selected={selectedAnswer === choice.id}
              submitted={submitted}
              correct={choice.id === currentQuestion.answer}
              disabled={submitted}
              onSelect={() => setSelectedAnswer(choice.id)}
            />
          ))}
        </div>

        {!submitted && (
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentIndex === 0}
              className="flex-1 rounded-2xl bg-gray-100 px-4 py-4 text-sm font-black text-gray-700 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-gray-800 dark:text-gray-100"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className="flex-1 rounded-2xl bg-black px-4 py-4 text-sm font-black text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
            >
              Submit
            </button>
          </div>
        )}

        {isReviewMode && !submitted && (
          <button
            type="button"
            onClick={() => setShowTranscript((visible) => !visible)}
            className="mt-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 transition-all active:scale-[0.99] dark:bg-gray-800 dark:text-gray-100"
          >
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        )}
        {isReviewMode && !submitted && showTranscript && (
          <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium leading-relaxed text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
            {currentQuestion.transcript}
          </div>
        )}

        {submitted && (
          <div className="mt-5">
            <ReviewPanel
              correct={isCorrect}
              explanation={currentQuestion.explanation}
              transcript={currentQuestion.transcript}
              showTranscript={showTranscript}
              isLast={currentIndex === questions.length - 1}
              canGoPrevious={currentIndex > 0}
              onToggleTranscript={() => setShowTranscript((visible) => !visible)}
              onPrevious={goPrevious}
              onNext={goNext}
            />
          </div>
        )}

        {submitted && (
          <div className="mt-4 flex items-center gap-2 text-xs font-black text-gray-500 dark:text-gray-400">
            {isCorrect ? <CheckCircle2 size={16} className="text-green-600" /> : null}
            <span>{currentQuestion.listeningSkill}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
