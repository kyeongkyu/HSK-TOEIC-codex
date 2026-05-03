'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { grammarData, GrammarPoint, GrammarPracticeQuestion } from '@/data/grammar';
import SegmentedSentence from '@/components/SegmentedSentence';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import { getProgressPercent, readLocalStorageJson, uniqueStrings, writeLocalStorageJson } from '@/lib/ui-state';
import { getResumeTaskSnapshot, setResumeTaskSnapshot, shouldSaveActiveResumeSnapshot } from '@/lib/resume-task';

type GrammarProgress = {
  completedPointIds: string[];
  correctQuestionIds: string[];
  wrongQuestionIds: string[];
  lastStudiedAt?: string;
};
type GrammarResumeSnapshot = {
  activePointId: string | null;
  answerState: Record<string, { answer: string; correct: boolean }>;
  scrollY: number;
};

const GRAMMAR_PROGRESS_KEY = 'hsk_grammar_progress';

const emptyProgress: GrammarProgress = {
  completedPointIds: [],
  correctQuestionIds: [],
  wrongQuestionIds: [],
};

function readGrammarProgress(): GrammarProgress {
  const parsed = readLocalStorageJson<Partial<GrammarProgress>>(GRAMMAR_PROGRESS_KEY, emptyProgress);
  return {
    completedPointIds: Array.isArray(parsed.completedPointIds) ? parsed.completedPointIds : [],
    correctQuestionIds: Array.isArray(parsed.correctQuestionIds) ? parsed.correctQuestionIds : [],
    wrongQuestionIds: Array.isArray(parsed.wrongQuestionIds) ? parsed.wrongQuestionIds : [],
    lastStudiedAt: parsed.lastStudiedAt,
  };
}

function saveGrammarProgress(progress: GrammarProgress) {
  writeLocalStorageJson(GRAMMAR_PROGRESS_KEY, progress);
}

function getLevelTitle(selectedLevel: number | 'all') {
  return selectedLevel === 'all' ? 'HSK 1-6' : `HSK ${selectedLevel}`;
}

function groupByLevel(points: GrammarPoint[]) {
  return points.reduce<Record<number, GrammarPoint[]>>((groups, point) => {
    (groups[point.level] ??= []).push(point);
    return groups;
  }, {});
}

function PracticeBlock({
  point,
  question,
  answered,
  onAnswer,
}: {
  point: GrammarPoint;
  question: GrammarPracticeQuestion;
  answered?: { answer: string; correct: boolean };
  onAnswer: (pointId: string, question: GrammarPracticeQuestion, answer: string) => void;
}) {
  const isAnswered = Boolean(answered);

  return (
    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Practice</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 break-keep">{question.prompt}</p>
        </div>
        {isAnswered && (
          <div className={`shrink-0 rounded-full p-2 ${answered?.correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            {answered?.correct ? <Check size={16} /> : <X size={16} />}
          </div>
        )}
      </div>

      {question.type === 'multiple_choice' && question.choices ? (
        <div className="grid gap-2">
          {question.choices.map((choice) => {
            const selected = answered?.answer === choice;
            const isCorrect = question.answer === choice;
            const resultClass = !isAnswered
              ? 'bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-600 text-gray-800 dark:text-gray-100'
              : isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : selected
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 text-rose-700 dark:text-rose-300'
                  : 'bg-white/60 dark:bg-gray-900/60 text-gray-400 dark:text-gray-500';

            return (
              <button
                key={choice}
                disabled={isAnswered}
                onClick={() => onAnswer(point.id, question, choice)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all active:scale-[0.99] transform-gpu ${resultClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={isAnswered}
            onClick={() => onAnswer(point.id, question, question.answer)}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-60"
          >
            Show Answer
          </button>
          {isAnswered && (
            <span className="inline-flex items-center rounded-xl bg-white dark:bg-gray-900 px-4 py-3 text-sm font-black text-blue-600 dark:text-blue-300">
              {question.answer}
            </span>
          )}
        </div>
      )}

      {isAnswered && (
        <p className="mt-3 rounded-xl bg-white/80 dark:bg-gray-900/70 px-4 py-3 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-300">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

function GrammarCard({
  point,
  completed,
  answerState,
  resumeExpanded,
  onComplete,
  onAnswer,
  onView,
}: {
  point: GrammarPoint;
  completed: boolean;
  answerState: Record<string, { answer: string; correct: boolean }>;
  resumeExpanded?: boolean;
  onComplete: (pointId: string) => void;
  onAnswer: (pointId: string, question: GrammarPracticeQuestion, answer: string) => void;
  onView?: (pointId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (resumeExpanded) setExpanded(true);
  }, [resumeExpanded]);

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800/70">
      <button
        onClick={() => {
          setExpanded((value) => !value);
          onView?.(point.id);
        }}
        className="w-full p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                HSK {point.level}
              </span>
              {completed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 size={12} />
                  Done
                </span>
              )}
            </div>
            <h2 className="text-xl font-black leading-tight text-gray-950 dark:text-white break-keep">{point.title}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-300 break-keep">{point.summary}</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-gray-100 p-3 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-gray-100 p-5 dark:border-gray-700">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Pattern</p>
            <p className="break-words text-lg font-black leading-snug text-blue-700 dark:text-blue-300">{point.pattern}</p>
          </div>

          <div className="grid gap-3">
            <section>
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Core</h3>
              <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300 break-keep">{point.explanation}</p>
            </section>
            <section>
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Usage</h3>
              <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300 break-keep">{point.usage}</p>
            </section>
            {point.commonMistake && (
              <section className="rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
                <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">Mistake</h3>
                <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-200 break-keep">{point.commonMistake}</p>
              </section>
            )}
          </div>

          <section>
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Examples</h3>
            <div className="space-y-3">
              {point.examples.map((example) => (
                <div key={example.chinese} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                  <div className="text-xl font-black leading-snug text-gray-950 dark:text-white">
                    <SegmentedSentence sentence={example.chinese} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-300">{example.pinyin}</p>
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{example.translationKo}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            {point.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                {tag}
              </span>
            ))}
          </div>

          {point.practiceQuestions.map((question) => (
            <PracticeBlock
              key={question.id}
              point={point}
              question={question}
              answered={answerState[question.id]}
              onAnswer={onAnswer}
            />
          ))}

          <button
            onClick={() => onComplete(point.id)}
            className={`w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98] transform-gpu ${
              completed
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {completed ? 'Completed' : 'Mark as Learned'}
          </button>
        </div>
      )}
    </article>
  );
}

export default function GrammarPageClient() {
  const router = useRouter();
  const { selectedLevel, isLoaded } = useSettings();
  const [progress, setProgress] = useState<GrammarProgress>(emptyProgress);
  const [answerState, setAnswerState] = useState<Record<string, { answer: string; correct: boolean }>>({});
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const restoredRef = useRef(false);
  const pointRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setProgress(readGrammarProgress());
  }, []);

  useEffect(() => {
    if (!isLoaded || restoredRef.current) return;
    const restoreId = window.setTimeout(() => {
      const snapshot = getResumeTaskSnapshot<GrammarResumeSnapshot>('/grammar');
      if (!snapshot) {
        restoredRef.current = true;
        return;
      }
      setAnswerState(snapshot.answerState ?? {});
      setActivePointId(snapshot.activePointId);
      restoredRef.current = true;
      requestAnimationFrame(() => {
        if (snapshot.activePointId && pointRefs.current[snapshot.activePointId]) {
          pointRefs.current[snapshot.activePointId]?.scrollIntoView({ behavior: 'auto', block: 'center' });
        } else {
          window.scrollTo({ top: snapshot.scrollY ?? 0, behavior: 'auto' });
        }
      });
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [isLoaded]);

  const filteredGrammar = useMemo(() => {
    return grammarData.filter((point) => selectedLevel === 'all' || point.level === selectedLevel);
  }, [selectedLevel]);

  const groupedGrammar = useMemo(() => groupByLevel(filteredGrammar), [filteredGrammar]);
  const completedSet = useMemo(() => new Set(progress.completedPointIds), [progress.completedPointIds]);
  const completedCount = filteredGrammar.filter((point) => completedSet.has(point.id)).length;
  const progressPercent = getProgressPercent(completedCount, filteredGrammar.length);

  const persistProgress = (updater: (current: GrammarProgress) => GrammarProgress) => {
    setProgress((current) => {
      const next = updater(current);
      saveGrammarProgress(next);
      return next;
    });
  };

  const handleComplete = (pointId: string) => {
    persistProgress((current) => ({
      ...current,
      completedPointIds: uniqueStrings([...current.completedPointIds, pointId]),
      lastStudiedAt: new Date().toISOString(),
    }));
  };

  const handleAnswer = (pointId: string, question: GrammarPracticeQuestion, answer: string) => {
    const correct = answer.trim() === question.answer.trim();
    setAnswerState((current) => ({ ...current, [question.id]: { answer, correct } }));
    persistProgress((current) => ({
      completedPointIds: correct ? uniqueStrings([...current.completedPointIds, pointId]) : current.completedPointIds,
      correctQuestionIds: correct ? uniqueStrings([...current.correctQuestionIds, question.id]) : current.correctQuestionIds.filter((id) => id !== question.id),
      wrongQuestionIds: correct ? current.wrongQuestionIds.filter((id) => id !== question.id) : uniqueStrings([...current.wrongQuestionIds, question.id]),
      lastStudiedAt: new Date().toISOString(),
    }));
  };

  useEffect(() => {
    if (!isLoaded || !restoredRef.current || !shouldSaveActiveResumeSnapshot(Boolean(activePointId))) return;
    setResumeTaskSnapshot('/grammar', 'Grammar', {
      activePointId,
      answerState,
      scrollY: window.scrollY,
    } satisfies GrammarResumeSnapshot, { taskKey: 'hsk-grammar', levelScope: selectedLevel });
  }, [activePointId, answerState, isLoaded, selectedLevel]);

  useEffect(() => {
    if (!isLoaded || !restoredRef.current || !shouldSaveActiveResumeSnapshot(Boolean(activePointId))) return;
    let frameId = 0;
    const saveScrollSnapshot = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setResumeTaskSnapshot('/grammar', 'Grammar', {
          activePointId,
          answerState,
          scrollY: window.scrollY,
        } satisfies GrammarResumeSnapshot, { taskKey: 'hsk-grammar', levelScope: selectedLevel });
      });
    };

    window.addEventListener('scroll', saveScrollSnapshot, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', saveScrollSnapshot);
    };
  }, [activePointId, answerState, isLoaded, selectedLevel]);

  if (!isLoaded) {
    return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white px-6 pb-8 dark:bg-gray-900">
      <header className="pt-8 pb-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="rounded-2xl bg-gray-100 p-3 text-gray-700 transition-all active:scale-95 dark:bg-gray-800 dark:text-gray-200"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">{getLevelTitle(selectedLevel)}</p>
            <h1 className="text-2xl font-black text-gray-950 dark:text-white">Grammar Mode</h1>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/70">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-950 dark:text-white">문법 학습 진행률</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{completedCount} / {filteredGrammar.length} completed</p>
              </div>
            </div>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-300">{progressPercent}%</span>
          </div>
          <ProgressMeter
            percent={progressPercent}
            trackClassName="bg-gray-200 dark:bg-gray-700"
            fillClassName="bg-blue-600 dark:bg-blue-400 duration-500"
          />
        </div>
      </header>

      <main className="space-y-8">
        {filteredGrammar.length === 0 ? (
          <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            해당 급수의 문법 데이터가 없습니다.
          </div>
        ) : selectedLevel === 'all' ? (
          Object.entries(groupedGrammar).map(([level, points]) => (
            <section key={level} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">HSK {level}</h2>
                <span className="text-xs font-black text-blue-600 dark:text-blue-300">{points.length} points</span>
              </div>
              <div className="space-y-4">
                {points.map((point) => (
                  <div
                    key={point.id}
                    ref={(node) => {
                      pointRefs.current[point.id] = node;
                    }}
                  >
                    <GrammarCard
                      point={point}
                      completed={completedSet.has(point.id)}
                      answerState={answerState}
                      resumeExpanded={activePointId === point.id}
                      onView={setActivePointId}
                      onComplete={handleComplete}
                      onAnswer={handleAnswer}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="space-y-4">
            {filteredGrammar.map((point) => (
              <div
                key={point.id}
                ref={(node) => {
                  pointRefs.current[point.id] = node;
                }}
              >
                <GrammarCard
                  point={point}
                  completed={completedSet.has(point.id)}
                  answerState={answerState}
                  resumeExpanded={activePointId === point.id}
                  onView={setActivePointId}
                  onComplete={handleComplete}
                  onAnswer={handleAnswer}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
