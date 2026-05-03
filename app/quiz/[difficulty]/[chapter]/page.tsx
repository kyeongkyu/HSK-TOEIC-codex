'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSettings } from '@/hooks/use-settings';
import { hskWords } from '@/data/hsk';
import { HSK_CATEGORIES } from '@/data/hsk-categories';
import { WordData } from '@/lib/srs';
import SegmentedSentence from '@/components/SegmentedSentence';
import { speak } from '@/lib/tts';
import { useUserWords } from '@/hooks/use-user-words';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, RefreshCcw, ChevronRight, Trophy, AlertCircle, Star, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import { QuizFeedbackPanel } from '@/components/ui/QuizFeedbackPanel';
import { clampCount, getProgressPercent } from '@/lib/ui-state';
import { getResumeTaskSnapshot, setResumeTaskSnapshot } from '@/lib/resume-task';

type QuizState = 'answering' | 'feedback' | 'finished';
type QuizQuestionType = 'hanzi-to-meaning' | 'meaning-to-hanzi';
type QuizQuestionSnapshot = {
  selectedOption: string | null;
  quizState: Exclude<QuizState, 'finished'>;
  optionIds: string[];
  questionType: QuizQuestionType;
};
type QuizResumeSnapshot = {
  currentIndex: number;
  selectedOption: string | null;
  quizState: Exclude<QuizState, 'finished'>;
  score: number;
  isWrongReview: boolean;
  wrongQueueIds: string[];
};

function getQuizProgressStorageKey(difficulty: string, mode: string, chapterParam: string) {
  return `quiz-progress-${difficulty}-${mode}-${chapterParam}`;
}

function getLegacyQuizProgressStorageKey(difficulty: string, chapterParam: string) {
  return `quiz-progress-${difficulty}-${chapterParam}`;
}

function normalizeSavedQuizProgress(
  saved: unknown,
  totalQuestions: number,
): {
  currentIndex: number;
  isWrongReview: boolean;
  wrongQueueIds: string[];
  score: number;
} {
  const parsed = saved && typeof saved === 'object'
    ? saved as Partial<{
      currentIndex: number;
      isWrongReview: boolean;
      wrongQueueIds: unknown;
      score: number;
    }>
    : {};
  const wrongQueueIds = Array.isArray(parsed.wrongQueueIds)
    ? parsed.wrongQueueIds.filter((id): id is string => typeof id === 'string')
    : [];
  const isWrongReview = Boolean(parsed.isWrongReview) && wrongQueueIds.length > 0;
  const maxIndex = isWrongReview
    ? Math.max(wrongQueueIds.length - 1, 0)
    : Math.max(totalQuestions - 1, 0);

  return {
    currentIndex: clampCount(parsed.currentIndex ?? 0, maxIndex),
    isWrongReview,
    wrongQueueIds,
    score: clampCount(parsed.score ?? 0, totalQuestions),
  };
}

function getSafeQuizResultStats(score: number, totalQuestions: number) {
  const displayScore = clampCount(score, totalQuestions);
  const displayAccuracy = totalQuestions > 0
    ? Math.round((displayScore / totalQuestions) * 100)
    : 0;

  return { displayScore, displayAccuracy };
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const difficulty = params.difficulty as string;
  const chapterParam = params.chapter as string;
  const mode = searchParams.get('mode') || 'chapter';
  const chapterId = mode === 'chapter' ? parseInt(chapterParam) : NaN;
  const resumeRoute = `/quiz/${difficulty}/${chapterParam}?mode=${mode}`;
  const storageKey = getQuizProgressStorageKey(difficulty, mode, chapterParam);
  const legacyStorageKey = getLegacyQuizProgressStorageKey(difficulty, chapterParam);
  const { selectedLevel, ttsSpeed, hanziFont, isLoaded: settingsLoaded } = useSettings();
  const { userWords, toggleFavorite } = useUserWords();

  const [wrongQueue, setWrongQueue] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [score, setScore] = useState(0);
  const [isWrongReview, setIsWrongReview] = useState(false);
  const [mainQuestionHistory, setMainQuestionHistory] = useState<Array<QuizQuestionSnapshot | null>>([]);
  const [reviewQuestionHistory, setReviewQuestionHistory] = useState<Array<QuizQuestionSnapshot | null>>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{
    currentIndex: number;
    isWrongReview: boolean;
    wrongQueueIds: string[];
    score: number;
  } | null>(null);
  const resumeHydratedRef = useRef(false);

  useEffect(() => {
    if (quizState !== 'finished' && (currentIndex > 0 || isWrongReview)) {
      localStorage.setItem(storageKey, JSON.stringify({
        currentIndex,
        isWrongReview,
        wrongQueueIds: wrongQueue.map(w => w.id),
        score
      }));
      localStorage.removeItem(legacyStorageKey);
    } else if (quizState === 'finished') {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(legacyStorageKey);
    }
  }, [currentIndex, isWrongReview, legacyStorageKey, score, storageKey, quizState, wrongQueue]);

  // Filter words by level and chapter
  const allFilteredWords = useMemo(() => {
    if (!settingsLoaded) return [];
    return selectedLevel === 'all' || selectedLevel === null
      ? hskWords
      : hskWords.filter(w => w.level === selectedLevel);
  }, [selectedLevel, settingsLoaded]);

  const quizWords = useMemo(() => {
    if (!settingsLoaded) return [];
    if (mode === 'topic') {
      let category = null;
      for (const level of Object.keys(HSK_CATEGORIES)) {
        const found = HSK_CATEGORIES[level]?.find(c => c.id === chapterParam);
        if (found) {
          category = found;
          break;
        }
      }
      if (category) {
        const levelMatchedWords = allFilteredWords.filter(w => category.words.includes(w.word));
        if (levelMatchedWords.length > 0) return levelMatchedWords;
        return hskWords.filter(w => category.words.includes(w.word));
      }
      return [];
    } else {
      if (Number.isNaN(chapterId) || chapterId < 1) return [];
      const chapterSize = 15;
      const start = (chapterId - 1) * chapterSize;
      const end = start + chapterSize;
      return allFilteredWords.slice(start, end);
    }
  }, [allFilteredWords, chapterId, chapterParam, mode, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = normalizeSavedQuizProgress(parsed, quizWords.length);
        if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, JSON.stringify(normalized));
        }
        localStorage.removeItem(legacyStorageKey);
        if (normalized.currentIndex > 0 || normalized.isWrongReview || normalized.score > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrates previously saved quiz progress after mount without changing the initial render path.
          setSavedProgress(normalized);
          setShowResumeModal(true);
        }
      } catch {
        // ignore
      }
    }
  }, [legacyStorageKey, quizWords.length, settingsLoaded, storageKey]);

  useEffect(() => {
    if (!settingsLoaded || quizWords.length === 0) return;
    const restoreId = window.setTimeout(() => {
      const snapshot = getResumeTaskSnapshot<QuizResumeSnapshot>(resumeRoute);
      if (!snapshot) {
        resumeHydratedRef.current = true;
        return;
      }

      const orderedWrongQueue = snapshot.wrongQueueIds
        .map(id => allFilteredWords.find(word => word.id === id))
        .filter(Boolean) as WordData[];
      const activeTotal = snapshot.isWrongReview ? orderedWrongQueue.length : quizWords.length;
      const nextIndex = activeTotal > 0
        ? Math.min(Math.max(snapshot.currentIndex, 0), activeTotal - 1)
        : 0;

      setShowResumeModal(false);
      setIsWrongReview(snapshot.isWrongReview && orderedWrongQueue.length > 0);
      setWrongQueue(orderedWrongQueue);
      setCurrentIndex(nextIndex);
      setSelectedOption(snapshot.selectedOption);
      setQuizState(snapshot.quizState);
      setScore(clampCount(snapshot.score, quizWords.length));
      resumeHydratedRef.current = true;
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [allFilteredWords, quizWords.length, resumeRoute, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded || !resumeHydratedRef.current || quizState === 'finished') return;
    setResumeTaskSnapshot(resumeRoute, 'Quiz', {
      currentIndex,
      selectedOption,
      quizState,
      score,
      isWrongReview,
      wrongQueueIds: wrongQueue.map(word => word.id),
    } satisfies QuizResumeSnapshot, { taskKey: 'hsk-quiz', levelScope: selectedLevel });
  }, [currentIndex, isWrongReview, quizState, resumeRoute, score, selectedLevel, selectedOption, settingsLoaded, wrongQueue]);

  const currentWord = useMemo(() => {
    if (isWrongReview) {
      return wrongQueue[currentIndex];
    }
    return quizWords[currentIndex];
  }, [quizWords, wrongQueue, currentIndex, isWrongReview]);

  const questionTypes = useMemo<QuizQuestionType[]>(() => {
    if (quizWords.length === 0) return [];
    
    let ratio = 0.2; // Easy
    if (difficulty === 'medium') ratio = 0.4;
    if (difficulty === 'hard') ratio = 0.6;
    
    const count = Math.ceil(quizWords.length * ratio);
    const types: QuizQuestionType[] = new Array(quizWords.length).fill('hanzi-to-meaning');
    
    // Deterministically pick indices for 'meaning-to-hanzi'
    for (let i = 0; i < count; i++) {
      const index = Math.floor((i * quizWords.length) / count);
      types[index] = 'meaning-to-hanzi';
    }
    
    return types;
  }, [quizWords, difficulty]);

  const currentQuestionType = useMemo<QuizQuestionType>(() => {
    if (isWrongReview) {
      // Use the same ratio logic for the wrongQueue to keep it consistent
      let ratio = 0.2;
      if (difficulty === 'medium') ratio = 0.4;
      if (difficulty === 'hard') ratio = 0.6;
      const count = Math.ceil(wrongQueue.length * ratio);
      const types = new Array(wrongQueue.length).fill('hanzi-to-meaning');
      for (let i = 0; i < count; i++) {
        const index = Math.floor((i * wrongQueue.length) / count);
        types[index] = 'meaning-to-hanzi';
      }
      return types[currentIndex] || 'hanzi-to-meaning';
    }
    return questionTypes[currentIndex] || 'hanzi-to-meaning';
  }, [questionTypes, currentIndex, isWrongReview, wrongQueue.length, difficulty]);

  const optionsCount = 4;

  const [currentOptions, setCurrentOptions] = useState<WordData[]>([]);
  const activeHistory = isWrongReview ? reviewQuestionHistory : mainQuestionHistory;

  const persistCurrentQuestionState = (overrideIndex?: number) => {
    if (!currentWord || currentOptions.length === 0 || quizState === 'finished') return;

    const index = overrideIndex ?? currentIndex;
    const snapshot: QuizQuestionSnapshot = {
      selectedOption,
      quizState,
      optionIds: currentOptions.map((option) => option.id),
      questionType: currentQuestionType,
    };

    const updateHistory = (history: Array<QuizQuestionSnapshot | null>) => {
      const nextHistory = [...history];
      nextHistory[index] = snapshot;
      return nextHistory;
    };

    if (isWrongReview) {
      setReviewQuestionHistory(updateHistory);
    } else {
      setMainQuestionHistory(updateHistory);
    }
  };

  useEffect(() => {
    if (!currentWord || allFilteredWords.length === 0) return;

    const snapshot = activeHistory[currentIndex];
    if (snapshot?.optionIds.length) {
      const restoredOptions = snapshot.optionIds
        .map(id => allFilteredWords.find(w => w.id === id))
        .filter(Boolean) as WordData[];

      if (restoredOptions.length === snapshot.optionIds.length) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restores the saved option order for the active question when revisiting previous items.
        setCurrentOptions(restoredOptions);
        return;
      }
    }

    const timer = setTimeout(() => {
      const others = allFilteredWords.filter(w => w.id !== currentWord.id);
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
      const selectedOthers = shuffledOthers.slice(0, optionsCount - 1);
      const combined = [...selectedOthers, currentWord].sort(() => Math.random() - 0.5);
      setCurrentOptions(combined);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [currentWord, allFilteredWords, optionsCount, activeHistory, currentIndex]);

  useEffect(() => {
    if (quizState === 'finished') return;

    const snapshot = activeHistory[currentIndex];
    if (snapshot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restores the previously answered state for the active question when navigating backward.
      setSelectedOption(snapshot.selectedOption);
      setQuizState(snapshot.quizState);
      return;
    }

    setSelectedOption(null);
    setQuizState('answering');
  }, [activeHistory, currentIndex, quizState]);

  useEffect(() => {
    const totalQuestions = isWrongReview ? wrongQueue.length : quizWords.length;
    if (totalQuestions === 0) return;
    if (currentIndex <= totalQuestions - 1) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Clamps stale restored indexes after refresh or when the filtered quiz set shrinks.
    setCurrentIndex(Math.max(0, totalQuestions - 1));
  }, [currentIndex, isWrongReview, wrongQueue.length, quizWords.length]);

  const handleAnswer = (optionId: string) => {
    if (!currentWord) return;
    if (quizState !== 'answering') return;
    
    setSelectedOption(optionId);
    setQuizState('feedback');

    if (optionId === currentWord.id) {
      if (!isWrongReview) {
        setScore(prev => prev + 1);
      }
    } else if (!isWrongReview) {
      // Main-round misses enter the review queue once. Review-round misses are
      // moved to the back in handleNext so the queue cannot grow forever.
      setWrongQueue(prev => [...prev, currentWord]);
    }

    const snapshot: QuizQuestionSnapshot = {
      selectedOption: optionId,
      quizState: 'feedback',
      optionIds: currentOptions.map((option) => option.id),
      questionType: currentQuestionType,
    };

    if (isWrongReview) {
      setReviewQuestionHistory((history) => {
        const nextHistory = [...history];
        nextHistory[currentIndex] = snapshot;
        return nextHistory;
      });
    } else {
      setMainQuestionHistory((history) => {
        const nextHistory = [...history];
        nextHistory[currentIndex] = snapshot;
        return nextHistory;
      });
    }
  };

  const handleNext = () => {
    persistCurrentQuestionState();

    if (isWrongReview) {
      const wasCorrect = selectedOption === currentWord.id;
      const remainingQueue = wrongQueue.filter((_, index) => index !== currentIndex);
      const remainingHistory = reviewQuestionHistory.filter((_, index) => index !== currentIndex);

      if (wasCorrect) {
        if (remainingQueue.length === 0) {
          setWrongQueue([]);
          setReviewQuestionHistory([]);
          setIsWrongReview(false);
          setCurrentIndex(0);
          setSelectedOption(null);
          setQuizState('finished');
          return;
        }

        setWrongQueue(remainingQueue);
        setReviewQuestionHistory(remainingHistory);
        setCurrentIndex(Math.min(currentIndex, remainingQueue.length - 1));
        setSelectedOption(null);
        setQuizState('answering');
      } else {
        const nextQueue = [...remainingQueue, currentWord];
        const nextHistory = [...remainingHistory, null];
        const nextIndex = remainingQueue.length === 0
          ? 0
          : Math.min(currentIndex, remainingQueue.length - 1);

        setWrongQueue(nextQueue);
        setReviewQuestionHistory(nextHistory);
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        setQuizState('answering');
      }
    } else {
      if (currentIndex < quizWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        if (wrongQueue.length > 0) {
          // Shuffle wrong queue for next round
          setWrongQueue(prev => [...prev].sort(() => Math.random() - 0.5));
          setIsWrongReview(true);
          setReviewQuestionHistory([]);
          setCurrentIndex(0);
          setSelectedOption(null);
          setQuizState('answering');
        } else {
          setSelectedOption(null);
          setQuizState('finished');
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    persistCurrentQuestionState();
    setCurrentIndex(prev => prev - 1);
  };

  useEffect(() => {
    if (quizState === 'answering' && currentWord && difficulty !== 'hard') {
      speak(currentWord.word, ttsSpeed);
    } else if (quizState === 'feedback' && currentWord && difficulty !== 'hard') {
      speak(currentWord.word, ttsSpeed);
    }
  }, [quizState, currentWord, difficulty, ttsSpeed]);

  const chaptersCount = useMemo(() => {
    if (allFilteredWords.length === 0) return 0;
    return Math.ceil(allFilteredWords.length / 15);
  }, [allFilteredWords]);

  if (!settingsLoaded) return <div className="p-8 text-center text-gray-500">Loading Quiz...</div>;
  if (quizWords.length === 0) {
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-2xl font-black text-black dark:text-white mb-3">문제를 불러오지 못했어요</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            현재 선택된 chapter 또는 topic에 해당하는 HSK 퀴즈 단어가 없습니다.
          </p>
          <button
            onClick={() => router.push(`/quiz/${difficulty}?mode=${mode}`)}
            className="mt-6 w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold active:scale-95 transition-all"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }
  if (!currentWord && quizState !== 'finished') return <div className="p-8 text-center text-gray-500">Loading Quiz...</div>;

  const activeTotal = isWrongReview ? wrongQueue.length : quizWords.length;
  const activePosition = activeTotal > 0 ? Math.min(currentIndex + 1, activeTotal) : 0;
  const activeProgressPercent = getProgressPercent(activePosition, activeTotal);

  if (showResumeModal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">이어서 학습할까요?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            이전에 학습하던 진도가 저장되어 있습니다.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setShowResumeModal(false);
                if (savedProgress) {
                  const orderedWrongQueue = savedProgress.wrongQueueIds
                    .map(id => allFilteredWords.find(w => w.id === id))
                    .filter(Boolean) as WordData[];
                  const totalQuestions = savedProgress.isWrongReview
                    ? orderedWrongQueue.length
                    : quizWords.length;
                  const nextIndex = totalQuestions > 0
                    ? Math.min(savedProgress.currentIndex, totalQuestions - 1)
                    : 0;
                  const safeScore = clampCount(savedProgress.score, quizWords.length);

                  setIsWrongReview(savedProgress.isWrongReview && orderedWrongQueue.length > 0);
                  setCurrentIndex(nextIndex);
                  setScore(safeScore);
                  setMainQuestionHistory([]);
                  setReviewQuestionHistory([]);
                  setWrongQueue(orderedWrongQueue);
                }
              }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-colors"
            >
              이어서 하기
            </button>
            <button
              onClick={() => {
                setShowResumeModal(false);
                setCurrentIndex(0);
                setIsWrongReview(false);
                setScore(0);
                setWrongQueue([]);
                setMainQuestionHistory([]);
                setReviewQuestionHistory([]);
                localStorage.removeItem(storageKey);
                localStorage.removeItem(legacyStorageKey);
              }}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-colors"
            >
              처음부터 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (quizState === 'finished') {
    const totalQuestions = quizWords.length;
    const { displayScore, displayAccuracy } = getSafeQuizResultStats(score, totalQuestions);
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md overflow-hidden bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-[3rem] p-8 sm:p-10 shadow-xl"
        >
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-yellow-600 dark:text-yellow-400" size={48} />
          </div>
          <h1 className="text-[clamp(2rem,9vw,3rem)] leading-none font-black text-black dark:text-white mb-2">Quiz Finished!</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 uppercase tracking-[0.28em]">
            {mode === 'topic' ? 'Topic Quiz' : `Chapter ${chapterId}`} • {difficulty}
          </p>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-10">
            <div className="min-w-0 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="min-w-0 text-[clamp(2.15rem,11vw,4rem)] leading-none font-black text-blue-600 dark:text-blue-400 mb-2">{displayAccuracy}%</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Accuracy</div>
            </div>
            <div className="min-w-0 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="min-w-0 break-keep text-[clamp(1.9rem,9vw,3.6rem)] leading-none font-black text-green-600 dark:text-green-400 mb-2">{displayScore}/{totalQuestions}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Correct</div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} /> Retry {mode === 'topic' ? 'Topic' : 'Chapter'}
            </button>
            {mode === 'chapter' && chapterId < chaptersCount && (
              <button 
                onClick={() => router.push(`/quiz/${difficulty}/${chapterId + 1}?mode=chapter`)}
                className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-2xl font-bold text-base sm:text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Next Chapter <ChevronRight size={20} />
              </button>
            )}
            <button 
              onClick={() => router.push(`/quiz/${difficulty}?mode=${mode}`)}
              className="w-full py-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-bold hover:text-black dark:hover:text-white transition-colors"
            >
              Back to {mode === 'topic' ? 'Topics' : 'Chapters'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center px-3">
          <div className="mb-2 flex w-full max-w-[220px] items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
              {isWrongReview ? 'Reviewing Errors' : (mode === 'topic' ? 'Topic Quiz' : `Chapter ${chapterId}`)}
            </span>
            <span className="shrink-0 text-[10px] font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">
              {activePosition}/{activeTotal} · {activeProgressPercent}%
            </span>
          </div>
          <ProgressMeter
            className="w-full max-w-[220px]"
            percent={activeProgressPercent}
            ariaLabel={isWrongReview ? 'Review progress' : 'Quiz progress'}
            trackClassName="bg-gray-100 dark:bg-gray-800"
            fillClassName="bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.35)] duration-300 ease-out dark:bg-blue-400"
          />
          <span className="sr-only">
            {isWrongReview ? 'Reviewing Errors' : (mode === 'topic' ? 'Topic Quiz' : `Chapter ${chapterId}`)}
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentWord.id + (isWrongReview ? '-review' : '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Word Display */}
            <div className="mb-8">
              {currentQuestionType === 'hanzi-to-meaning' ? (
                <>
                  <div className="flex justify-center" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                    <SegmentedSentence 
                      sentence={currentWord.word} 
                      hidePlayButton 
                      variant="quizPrompt"
                      interactive={false}
                    />
                  </div>
                  {difficulty === 'easy' && (
                    <div className="mt-2">
                      <div className="text-2xl font-medium text-blue-600 dark:text-blue-400">{currentWord.pinyin.toLowerCase()}</div>
                    </div>
                  )}
                  {difficulty !== 'hard' && (
                    <button 
                      onClick={() => speak(currentWord.word, ttsSpeed)}
                      className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400 active:scale-95 transition-all shadow-sm"
                    >
                      <Volume2 size={24} />
                    </button>
                  )}
                </>
              ) : (
                <div className="py-12">
                  <div className="text-5xl font-black text-black dark:text-white mb-4">
                    {currentWord.meaning}
                  </div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select the correct Hanzi</div>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 w-full">
              {currentOptions.map((option, idx) => {
                const isCorrect = option.id === currentWord.id;
                const isSelected = selectedOption === option.id;
                
                let bgColor = 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700';
                let textColor = 'text-black dark:text-white';
                
                if (quizState === 'feedback') {
                  if (isCorrect) {
                    bgColor = 'bg-green-100 dark:bg-green-900/30 border-green-500';
                    textColor = 'text-green-700 dark:text-green-400';
                  } else if (isSelected) {
                    bgColor = 'bg-red-100 dark:bg-red-900/30 border-red-500';
                    textColor = 'text-red-700 dark:text-red-400';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (quizState === 'answering') {
                        handleAnswer(option.id);
                      }
                    }}
                    className={`w-full p-5 rounded-3xl border-2 ${bgColor} ${textColor} font-bold text-lg transition-all ${quizState === 'answering' ? 'active:scale-95 cursor-pointer hover:border-blue-500' : 'cursor-default'} flex flex-col items-stretch gap-2 group`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex-1 text-left" style={currentQuestionType === 'meaning-to-hanzi' ? { fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` } : {}}>
                        {currentQuestionType === 'hanzi-to-meaning' ? option.meaning : option.word}
                      </span>
                      {quizState === 'feedback' && isCorrect && <CheckCircle2 className="text-green-500" size={24} />}
                      {quizState === 'feedback' && isSelected && !isCorrect && <XCircle className="text-red-500" size={24} />}
                    </div>
                    
                    {quizState === 'feedback' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-3 mt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between"
                      >
                        <div className="flex flex-col items-start text-left">
                          <div style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                            <SegmentedSentence 
                              sentence={option.word} 
                              hidePlayButton 
                              interactive={true}
                            />
                          </div>
                          <div className="text-base font-medium opacity-80">{option.pinyin.toLowerCase()}</div>
                          {currentQuestionType === 'meaning-to-hanzi' && (
                            <div className="text-sm font-medium opacity-80">{option.meaning}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(option.id);
                            }}
                            className={`p-2 rounded-full transition-colors cursor-pointer relative z-10 ${userWords[option.id]?.isFavorite ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : 'bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40'}`}
                          >
                            <Star size={20} fill={userWords[option.id]?.isFavorite ? "currentColor" : "none"} />
                          </button>
                          <button 
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              speak(option.word, ttsSpeed);
                            }}
                            className="p-2 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-black/40 transition-colors cursor-pointer relative z-10"
                          >
                            <Volume2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Footer */}
      <div className="px-6 pb-6 pt-4 flex items-center justify-center">
        {(quizState === 'feedback' || currentIndex > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            {quizState === 'feedback' && (
              <QuizFeedbackPanel isCorrect={selectedOption === currentWord.id} className="mb-4 w-full">
                <div className="rounded-3xl bg-white p-5 text-center shadow-sm dark:bg-gray-900/70">
                  <div className="flex justify-center">
                    <SegmentedSentence sentence={currentWord.word} hidePlayButton interactive={true} />
                  </div>
                  <div className="mt-3 text-base font-black text-blue-600 dark:text-blue-400">{currentWord.pinyin.toLowerCase()}</div>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
                    {currentWord.meaning}
                  </p>
                </div>
              </QuizFeedbackPanel>
            )}

            {false && quizState === 'feedback' && (
              <>
                <div className={`mb-4 flex items-center gap-2 font-black uppercase tracking-tighter ${selectedOption === currentWord.id ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedOption === currentWord.id ? (
                    <><CheckCircle2 size={20} /> Correct!</>
                  ) : (
                    <><AlertCircle size={20} /> Incorrect</>
                  )}
                </div>
                
                {selectedOption !== currentWord.id && (
                  <div className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    정답: <span className="text-black dark:text-white font-bold">{currentWord.meaning}</span> 
                    {difficulty !== 'easy' && <span className="ml-2">({currentWord.pinyin.toLowerCase()})</span>}
                  </div>
                )}
              </>
            )}

            <div className="flex w-full items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-2xl font-bold text-lg active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {quizState === 'feedback' ? (
                <button 
                  onClick={handleNext}
                  className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Next Question <ChevronRight size={20} />
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
