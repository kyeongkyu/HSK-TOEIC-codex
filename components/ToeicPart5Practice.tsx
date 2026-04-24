'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import {
  TOEIC_PART5_DIFFICULTIES,
  toeicPart5Questions,
  ToeicPart5Difficulty,
  ToeicPart5Question,
} from '@/data/toeic-part5';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import { StatCard } from '@/components/ui/StatCard';
import { getProgressPercent, readLocalStorageJson, writeLocalStorageJson } from '@/lib/ui-state';

type Part5Stats = Record<ToeicPart5Difficulty, {
  correct: number;
  wrong: number;
  wrongIds: string[];
  currentIndex: number;
}>;

type ToeicPart5PracticeProps = {
  onPracticeActiveChange?: (active: boolean) => void;
};

const defaultStats: Part5Stats = {
  beginner: { correct: 0, wrong: 0, wrongIds: [], currentIndex: 0 },
  intermediate: { correct: 0, wrong: 0, wrongIds: [], currentIndex: 0 },
  advanced: { correct: 0, wrong: 0, wrongIds: [], currentIndex: 0 },
};

const storageKey = 'toeic_part5_stats';
const difficultyOrder: ToeicPart5Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const questionsByDifficulty: Record<ToeicPart5Difficulty, ToeicPart5Question[]> = {
  beginner: toeicPart5Questions.filter(q => q.difficulty === 'beginner'),
  intermediate: toeicPart5Questions.filter(q => q.difficulty === 'intermediate'),
  advanced: toeicPart5Questions.filter(q => q.difficulty === 'advanced'),
};
const questionCountByDifficulty: Record<ToeicPart5Difficulty, number> = {
  beginner: questionsByDifficulty.beginner.length,
  intermediate: questionsByDifficulty.intermediate.length,
  advanced: questionsByDifficulty.advanced.length,
};

function getAccuracy(correct: number, wrong: number) {
  const total = correct + wrong;
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function getDifficultyQuestionCount(difficulty: ToeicPart5Difficulty) {
  return questionCountByDifficulty[difficulty];
}

function normalizeStats(stored: unknown): Part5Stats {
  const parsed = stored && typeof stored === 'object' ? stored as Partial<Record<ToeicPart5Difficulty, Partial<Part5Stats[ToeicPart5Difficulty]>>> : {};

  return difficultyOrder.reduce((next, difficulty) => {
    const questionCount = getDifficultyQuestionCount(difficulty);
    const currentIndex = Math.min(
      Math.max(parsed[difficulty]?.currentIndex ?? 0, 0),
      Math.max(questionCount - 1, 0),
    );

    next[difficulty] = {
      ...defaultStats[difficulty],
      ...parsed[difficulty],
      wrongIds: parsed[difficulty]?.wrongIds ?? [],
      currentIndex,
    };

    return next;
  }, {} as Part5Stats);
}

export function ToeicPart5Practice({ onPracticeActiveChange }: ToeicPart5PracticeProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<ToeicPart5Difficulty | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [reviewWrongOnly, setReviewWrongOnly] = useState(false);
  const [expandedDifficulty, setExpandedDifficulty] = useState<ToeicPart5Difficulty | null>(null);
  const [stats, setStats] = useState<Part5Stats>(defaultStats);

  useEffect(() => {
    const stored = readLocalStorageJson<unknown | null>(storageKey, null);
    if (!stored) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrates persisted Part 5 progress after mount without changing first render behavior.
    setStats(normalizeStats(stored));
  }, []);

  useEffect(() => {
    onPracticeActiveChange?.(selectedDifficulty !== null);
  }, [onPracticeActiveChange, selectedDifficulty]);

  const saveStats = (nextStats: Part5Stats) => {
    setStats(nextStats);
    writeLocalStorageJson(storageKey, nextStats);
  };

  const saveProgress = (difficulty: ToeicPart5Difficulty, index: number, sourceStats = stats) => {
    const questionCount = getDifficultyQuestionCount(difficulty);
    const nextIndex = Math.min(Math.max(index, 0), Math.max(questionCount - 1, 0));
    const nextStats = {
      ...sourceStats,
      [difficulty]: {
        ...sourceStats[difficulty],
        currentIndex: nextIndex,
      },
    };

    saveStats(nextStats);
  };

  const questions = useMemo(() => {
    if (!selectedDifficulty) return [];

    const base = questionsByDifficulty[selectedDifficulty];
    if (!reviewWrongOnly) return base;

    const wrongIds = new Set(stats[selectedDifficulty].wrongIds);
    return base.filter(q => wrongIds.has(q.id));
  }, [selectedDifficulty, reviewWrongOnly, stats]);

  const currentQuestion = questions[currentIndex];

  const chooseDifficulty = (difficulty: ToeicPart5Difficulty, mode: 'resume' | 'restart' = 'restart') => {
    const questionCount = getDifficultyQuestionCount(difficulty);
    const savedIndex = stats[difficulty].currentIndex ?? 0;
    const startIndex = mode === 'resume'
      ? Math.min(savedIndex, Math.max(questionCount - 1, 0))
      : 0;

    setSelectedDifficulty(difficulty);
    setCurrentIndex(startIndex);
    setSelectedChoice(null);
    setIsAnswered(false);
    setReviewWrongOnly(false);
    setExpandedDifficulty(null);
    saveProgress(difficulty, startIndex);
  };

  const openDifficulty = (difficulty: ToeicPart5Difficulty) => {
    const hasSavedProgress = (stats[difficulty].currentIndex ?? 0) > 0;

    if (!hasSavedProgress) {
      chooseDifficulty(difficulty);
      return;
    }

    setExpandedDifficulty(current => current === difficulty ? null : difficulty);
  };

  const answerQuestion = (choice: string, question: ToeicPart5Question) => {
    if (isAnswered || !selectedDifficulty) return;

    const isCorrect = choice === question.answer;
    const prev = stats[selectedDifficulty];
    const wrongIdSet = new Set(prev.wrongIds);

    if (isCorrect) {
      wrongIdSet.delete(question.id);
    } else {
      wrongIdSet.add(question.id);
    }

    const nextProgressIndex = Math.min(currentIndex + 1, Math.max(getDifficultyQuestionCount(selectedDifficulty) - 1, 0));
    const nextStats = {
      ...stats,
      [selectedDifficulty]: {
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        wrongIds: [...wrongIdSet],
        currentIndex: nextProgressIndex,
      },
    };

    saveStats(nextStats);

    setSelectedChoice(choice);
    setIsAnswered(true);
  };

  const moveNext = () => {
    const nextIndex = Math.min(currentIndex + 1, questions.length - 1);

    setSelectedChoice(null);
    setIsAnswered(false);
    setCurrentIndex(nextIndex);

    if (selectedDifficulty && !reviewWrongOnly) {
      saveProgress(selectedDifficulty, nextIndex);
    }
  };

  const resetQuestion = () => {
    setSelectedChoice(null);
    setIsAnswered(false);
  };

  const resetDifficulty = () => {
    setSelectedDifficulty(null);
    setCurrentIndex(0);
    setSelectedChoice(null);
    setIsAnswered(false);
    setReviewWrongOnly(false);
  };

  if (!selectedDifficulty) {
    return (
      <div className="space-y-5">
        {difficultyOrder.map((difficulty) => {
          const meta = TOEIC_PART5_DIFFICULTIES[difficulty];
          const difficultyStats = stats[difficulty];
          const questionCount = getDifficultyQuestionCount(difficulty);
          const hasSavedProgress = difficultyStats.currentIndex > 0;
          const isExpanded = expandedDifficulty === difficulty;
          const progressPercent = getProgressPercent(difficultyStats.currentIndex, questionCount);

          return (
            <div key={difficulty} className="overflow-hidden rounded-[1.5rem] bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 transform-gpu">
              <button
                onClick={() => openDifficulty(difficulty)}
                className="w-full p-5 text-left active:scale-[0.99] transition-all hover:bg-white dark:hover:bg-white/[0.04] transform-gpu"
              >
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">{meta.label}</h3>
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{meta.description}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <StatCard label="Correct" value={difficultyStats.correct} tone="green" />
                  <StatCard label="Wrong" value={difficultyStats.wrong} tone="red" />
                  <StatCard
                    label="Progress"
                    value={hasSavedProgress ? `${difficultyStats.currentIndex + 1}/${questionCount}` : `0/${questionCount}`}
                    tone="blue"
                  />
                </div>
                <ProgressMeter
                  className="mt-4"
                  percent={progressPercent}
                  label="Saved Progress"
                  valueLabel={`${progressPercent}%`}
                  trackClassName="bg-white dark:bg-gray-900/70"
                />
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-gray-100 dark:border-white/10 bg-white/70 dark:bg-black/20 p-4"
                >
                  <p className="mb-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                    {difficultyStats.currentIndex + 1}번 문제부터 이어서 풀 수 있어요.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => chooseDifficulty(difficulty, 'resume')}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all transform-gpu"
                    >
                      이어서 풀기
                    </button>
                    <button
                      onClick={() => chooseDifficulty(difficulty, 'restart')}
                      className="rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm font-black text-gray-700 dark:text-gray-100 active:scale-95 transition-all transform-gpu"
                    >
                      처음부터 풀기
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (reviewWrongOnly && questions.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-8 text-center transform-gpu">
        <h3 className="text-xl font-black text-gray-900 dark:text-white">No wrong answers</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">이 난이도에는 아직 복습할 오답이 없습니다.</p>
        <button onClick={() => setReviewWrongOnly(false)} className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white active:scale-95 transition-all transform-gpu">
          Back to practice
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const meta = TOEIC_PART5_DIFFICULTIES[selectedDifficulty];
  const difficultyStats = stats[selectedDifficulty];
  const isCorrect = selectedChoice === currentQuestion.answer;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={resetDifficulty}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm font-black text-gray-800 dark:text-gray-100 active:scale-95 transition-all transform-gpu"
        >
          <ArrowLeft size={16} />
          {meta.label}
        </button>
        <button
          onClick={() => {
            setReviewWrongOnly(value => !value);
            setCurrentIndex(0);
            resetQuestion();
          }}
          className={`rounded-2xl px-4 py-3 text-sm font-black transition-all active:scale-95 transform-gpu ${reviewWrongOnly ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
        >
          Wrong {difficultyStats.wrongIds.length}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="min-w-0 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 p-3">
          <span className="block truncate text-[10px] font-black uppercase text-gray-400">Correct</span>
          <span className="block min-w-0 leading-none text-[clamp(1rem,5vw,1.25rem)] font-black text-green-600">{difficultyStats.correct}</span>
        </div>
        <div className="min-w-0 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 p-3">
          <span className="block truncate text-[10px] font-black uppercase text-gray-400">Wrong</span>
          <span className="block min-w-0 leading-none text-[clamp(1rem,5vw,1.25rem)] font-black text-red-500">{difficultyStats.wrong}</span>
        </div>
        <div className="min-w-0 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 p-3">
          <span className="block truncate text-[10px] font-black uppercase text-gray-400">Accuracy</span>
          <span className="block min-w-0 break-keep leading-none text-[clamp(1rem,5vw,1.25rem)] font-black text-blue-600">{getAccuracy(difficultyStats.correct, difficultyStats.wrong)}%</span>
        </div>
      </div>

      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 p-6 shadow-lg shadow-black/5"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {currentQuestion.tags.map(tag => (
              <span key={tag} className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-[10px] font-black text-blue-600 dark:text-blue-300">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xl font-black leading-relaxed text-gray-900 dark:text-white">
          {currentQuestion.question}
        </p>

        {isAnswered && (
          <div className="mt-5 rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/80 dark:bg-blue-900/20 p-4">
            <span className="block text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">해석</span>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-800 dark:text-gray-100">
              {currentQuestion.translation}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {currentQuestion.choices.map((choice) => {
            const isAnswer = choice === currentQuestion.answer;
            const isSelected = choice === selectedChoice;
            const stateClass = !isAnswered
              ? 'bg-gray-50 dark:bg-gray-900/60 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white hover:border-blue-300'
              : isAnswer
                ? 'bg-green-50 dark:bg-green-900/25 border-green-400 text-green-700 dark:text-green-300'
                : isSelected
                  ? 'bg-red-50 dark:bg-red-900/25 border-red-400 text-red-600 dark:text-red-300'
                  : 'bg-gray-50 dark:bg-gray-900/60 border-gray-100 dark:border-white/10 text-gray-400';

            return (
              <button
                key={choice}
                onClick={() => answerQuestion(choice, currentQuestion)}
                disabled={isAnswered}
                className={`w-full rounded-2xl border px-5 py-4 text-left font-bold transition-all active:scale-[0.99] transform-gpu ${stateClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`mt-6 rounded-2xl border p-5 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/40' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40'}`}>
            <div className="flex items-center gap-2">
              {isCorrect ? <CheckCircle2 size={20} className="text-green-600" /> : <XCircle size={20} className="text-red-500" />}
              <span className={`font-black ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                {isCorrect ? 'Correct' : `Answer: ${currentQuestion.answer}`}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={resetQuestion}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 py-4 font-black text-gray-700 dark:text-gray-200 active:scale-95 transition-all transform-gpu"
        >
          <RotateCcw size={18} />
          Retry
        </button>
        <button
          onClick={moveNext}
          disabled={currentIndex === questions.length - 1}
          className="rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 active:scale-95 transition-all transform-gpu"
        >
          Next
        </button>
      </div>
    </div>
  );
}
