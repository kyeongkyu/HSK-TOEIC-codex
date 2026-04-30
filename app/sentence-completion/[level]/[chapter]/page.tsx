/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Volume2, 
  ChevronRight, 
  Trophy, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { sentences, SentenceData } from '@/data/sentences';
import { hskWords } from '@/data/hsk';
import { speak } from '@/lib/tts';
import { useSettings } from '@/hooks/use-settings';
import { useSentenceProgress } from '@/hooks/use-sentence-progress';
import SegmentedSentence from '@/components/SegmentedSentence';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import { QuizFeedbackPanel } from '@/components/ui/QuizFeedbackPanel';
import { getProgressPercent } from '@/lib/ui-state';
import { getResumeTaskSnapshot, setResumeTaskSnapshot } from '@/lib/resume-task';

type ProblemType = 'A' | 'B' | 'C';

interface QuizQuestion {
  sentence: SentenceData;
  type: ProblemType;
  options: string[]; // For Type A
  correctTokens: string[]; // For Type B and C
  shuffledTokens: string[]; // For Type B and C
}

type SentenceCompletionResumeSnapshot = {
  questions: QuizQuestion[];
  currentIndex: number;
  quizState: 'answering' | 'feedback';
  selectedOption: string | null;
  userTokens: string[];
  shuffledTokens: string[];
  score: number;
  totalErrors: number;
};

export default function SentenceCompletionQuiz() {
  const params = useParams();
  const router = useRouter();
  const level = parseInt(params.level as string);
  const chapterId = parseInt(params.chapter as string);
  const { ttsSpeed, hanziFont } = useSettings();
  const { updateProgress } = useSentenceProgress();
  const resumeRoute = `/sentence-completion/${level}/${chapterId}`;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<'answering' | 'feedback' | 'finished'>('answering');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<string[]>([]);
  const [shuffledTokens, setShuffledTokens] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const resumeHydratedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(`sentence-completion-progress-${level}-${chapterId}`);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSavedIndex(parsed);
        setShowResumeModal(true);
      }
    }
  }, [level, chapterId]);

  useEffect(() => {
    if (quizState !== 'finished' && currentIndex > 0) {
      localStorage.setItem(`sentence-completion-progress-${level}-${chapterId}`, currentIndex.toString());
    } else if (quizState === 'finished') {
      localStorage.removeItem(`sentence-completion-progress-${level}-${chapterId}`);
    }
  }, [currentIndex, quizState, level, chapterId]);

  // Initialize questions for the chapter
  useEffect(() => {
    const levelSentences = sentences.filter(s => s.level === level);
    const questionsPerChapter = 7;
    const startIndex = (chapterId - 1) * questionsPerChapter;
    const chapterSentences = levelSentences.slice(startIndex, startIndex + questionsPerChapter);

    const generatedQuestions: QuizQuestion[] = chapterSentences.map(s => {
      const types: ProblemType[] = ['A', 'B', 'C'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let options: string[] = [];
      let correctTokens: string[] = [];
      let shuffledTokens: string[] = [];

      if (type === 'A') {
        // Type A: Fill in the blank
        options = [...s.distractors, s.blankWord].sort(() => Math.random() - 0.5);
      } else if (type === 'B') {
        // Type B: Korean unscramble
        correctTokens = s.koreanTokens;
        // Add 2-3 distractors from other Korean sentences
        const otherKoreanTokens = levelSentences
          .filter(os => os.id !== s.id)
          .flatMap(os => os.koreanTokens)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        shuffledTokens = [...correctTokens, ...otherKoreanTokens].sort(() => Math.random() - 0.5);
      } else if (type === 'C') {
        // Type C: Chinese unscramble
        correctTokens = s.tokens;
        // Add 2-3 distractors from other Chinese sentences
        const otherChineseTokens = levelSentences
          .filter(os => os.id !== s.id)
          .flatMap(os => os.tokens)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        shuffledTokens = [...correctTokens, ...otherChineseTokens].sort(() => Math.random() - 0.5);
      }

      return {
        sentence: s,
        type,
        options,
        correctTokens,
        shuffledTokens
      };
    });

    setQuestions(generatedQuestions);
  }, [level, chapterId]);

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      const snapshot = getResumeTaskSnapshot<SentenceCompletionResumeSnapshot>(resumeRoute);
      if (!snapshot || snapshot.questions.length === 0) {
        resumeHydratedRef.current = true;
        return;
      }

      setQuestions(snapshot.questions);
      setCurrentIndex(Math.min(Math.max(snapshot.currentIndex, 0), snapshot.questions.length - 1));
      setQuizState(snapshot.quizState);
      setSelectedOption(snapshot.selectedOption);
      setUserTokens(snapshot.userTokens);
      setShuffledTokens(snapshot.shuffledTokens);
      setScore(snapshot.score);
      setTotalErrors(snapshot.totalErrors);
      setShowResumeModal(false);
      resumeHydratedRef.current = true;
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [resumeRoute]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!resumeHydratedRef.current || questions.length === 0 || quizState === 'finished') return;
    setResumeTaskSnapshot(resumeRoute, 'Sentence', {
      questions,
      currentIndex,
      quizState,
      selectedOption,
      userTokens,
      shuffledTokens,
      score,
      totalErrors,
    } satisfies SentenceCompletionResumeSnapshot);
  }, [currentIndex, questions, quizState, resumeRoute, score, selectedOption, shuffledTokens, totalErrors, userTokens]);

  const isCorrect = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === 'A') {
      return selectedOption === currentQuestion.sentence.blankWord;
    }
    return userTokens.join('') === currentQuestion.correctTokens.join('');
  }, [currentQuestion, selectedOption, userTokens]);

  useEffect(() => {
    if (currentQuestion) {
      setShuffledTokens([...currentQuestion.shuffledTokens]);
    }
  }, [currentIndex, questions, currentQuestion]);

  // Auto-play TTS for Chinese sentences
  useEffect(() => {
    if (currentQuestion && quizState === 'answering') {
      if (currentQuestion.type === 'A' || currentQuestion.type === 'B') {
        speak(currentQuestion.sentence.chinese, ttsSpeed);
      }
    }
  }, [currentIndex, quizState, currentQuestion, ttsSpeed]);

  const handleTokenClick = (token: string, idx: number) => {
    if (quizState !== 'answering') return;
    
    // Play sound for Chinese tokens
    if (currentQuestion.type === 'C') {
      speak(token, ttsSpeed);
    }

    const newUserTokens = [...userTokens, token];
    setUserTokens(newUserTokens);
    
    // Remove from shuffled tokens
    setShuffledTokens(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    
    // Check if finished (only if we have enough tokens)
    if (newUserTokens.length === currentQuestion.correctTokens.length) {
      const isCorrect = newUserTokens.join('') === currentQuestion.correctTokens.join('');
      handleAnswer(isCorrect);
    }
  };

  const handleUserTokenClick = (token: string, idx: number) => {
    if (quizState !== 'answering') return;
    
    // Remove from user tokens
    setUserTokens(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    
    // Add back to shuffled tokens
    setShuffledTokens(prev => {
      const next = [...prev, token];
      return next;
    });
  };

  const handleResetTokens = () => {
    if (quizState !== 'answering') return;
    setUserTokens([]);
    // Restore initial shuffled tokens (including distractors)
    setShuffledTokens([...currentQuestion.shuffledTokens]);
  };

  const handleOptionSelect = (option: string) => {
    if (quizState !== 'answering') return;
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.sentence.blankWord;
    handleAnswer(isCorrect);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setQuizState('feedback');
    if (isCorrect) {
      setScore(s => s + 1);
      // Always play full sentence on correct answer
      speak(currentQuestion.sentence.chinese, ttsSpeed);
    } else {
      setTotalErrors(e => e + 1);
      // Add the wrong question to the end of the queue to try again
      setQuestions(prev => [...prev, currentQuestion]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setQuizState('answering');
      setSelectedOption(null);
      setUserTokens([]);
    } else {
      updateProgress(level, chapterId, totalErrors);
      setQuizState('finished');
    }
  };

  const { totalChapters, hasNextChapter } = useMemo(() => {
    const questionsPerChapter = 7;
    const levelSentences = sentences.filter(s => s.level === level);
    const total = Math.ceil(levelSentences.length / questionsPerChapter);
    return {
      totalChapters: total,
      hasNextChapter: chapterId < total
    };
  }, [level, chapterId]);

  if (!currentQuestion) return null;

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
                setCurrentIndex(savedIndex || 0);
              }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-colors"
            >
              이어서 하기
            </button>
            <button
              onClick={() => {
                setShowResumeModal(false);
                setCurrentIndex(0);
                localStorage.removeItem(`sentence-completion-progress-${level}-${chapterId}`);
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-black dark:text-white">학습 완료!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {questions.length}문제 중 {score}문제를 맞혔습니다.
          </p>
          
          <div className="space-y-3">
            {hasNextChapter && (
              <button 
                onClick={() => router.push(`/sentence-completion/${level}/${chapterId + 1}`)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                다음 챕터로 <ChevronRight size={20} />
              </button>
            )}
            <button 
              onClick={() => router.push(`/sentence-completion/${level}`)}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-colors"
            >
              챕터 목록으로
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-colors"
            >
              다시 풀기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeTotal = questions.length;
  const activePosition = activeTotal > 0 ? Math.min(currentIndex + 1, activeTotal) : 0;
  const activeProgressPercent = getProgressPercent(activePosition, activeTotal);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button 
          onClick={() => router.push(`/sentence-completion/${level}`)}
          className="p-2 -ml-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center px-3">
          <div className="mb-2 flex w-full max-w-[220px] items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
              Chapter {chapterId}
            </span>
            <span className="shrink-0 text-[10px] font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">
              {activePosition}/{activeTotal} · {activeProgressPercent}%
            </span>
          </div>
          <ProgressMeter
            className="w-full max-w-[220px]"
            percent={activeProgressPercent}
            ariaLabel="Sentence completion progress"
            trackClassName="bg-gray-100 dark:bg-gray-800"
            fillClassName="bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.35)] duration-300 ease-out dark:bg-blue-400"
          />
        </div>
        <div className="w-10" />
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles size={14} />
            {currentQuestion.type === 'A' ? '빈칸 채우기' : currentQuestion.type === 'B' ? '한글 해석 배열' : '중국어 문장 배열'}
          </div>
          
          <div className="text-center py-8">
            {currentQuestion.type === 'A' ? (
              <div className="flex flex-col items-center gap-8 w-full">
                <div className="text-4xl font-black text-black dark:text-white leading-relaxed flex flex-wrap justify-center items-center gap-x-1" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                  {currentQuestion.sentence.chinese.split(currentQuestion.sentence.blankWord).map((part, i, arr) => (
                    <span key={i} className="flex items-center">
                      <SegmentedSentence 
                        sentence={part} 
                        hidePlayButton 
                        interactive={quizState === 'feedback'} 
                      />
                      {i < arr.length - 1 && (
                        <div className="flex flex-col items-center mx-2">
                          <span className="inline-block w-24 border-b-4 border-blue-500 text-blue-500 min-h-[1.5em] text-center">
                            {quizState === 'feedback' ? currentQuestion.sentence.blankWord : ' '}
                          </span>
                          {quizState === 'feedback' && selectedOption === currentQuestion.sentence.blankWord && (
                            <span className="text-sm font-medium text-blue-400 mt-1">
                              {hskWords.find(w => w.word === currentQuestion.sentence.blankWord)?.pinyin.toLowerCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </span>
                  ))}
                </div>
                
                {quizState === 'feedback' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 w-full"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-xl font-medium text-gray-500 dark:text-gray-400">
                        {currentQuestion.sentence.pinyin}
                      </div>
                      <div className="text-lg font-bold text-gray-400 dark:text-gray-500">
                        {currentQuestion.sentence.korean}
                      </div>
                    </div>
                    
                    {quizState === 'feedback' && selectedOption !== currentQuestion.sentence.blankWord && (
                      <div className="mt-4 p-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-3xl w-full max-w-md">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3">정답 문장</div>
                        <div className="text-2xl font-black text-green-700 dark:text-green-400 mb-1" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                          {currentQuestion.sentence.chinese}
                        </div>
                        <div className="text-sm font-medium text-green-600/70 dark:text-green-400/70">
                          {currentQuestion.sentence.pinyin}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ) : currentQuestion.type === 'B' ? (
              <div className="space-y-4">
                <div className="flex justify-center" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                  <SegmentedSentence 
                    sentence={currentQuestion.sentence.chinese} 
                    hidePlayButton
                    interactive={quizState === 'feedback'}
                  />
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                {currentQuestion.sentence.korean}
              </div>
            )}

            {/* TTS Button for Chinese Questions */}
            {(currentQuestion.type === 'A' || currentQuestion.type === 'B') && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => speak(currentQuestion.sentence.chinese, ttsSpeed)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all active:scale-95 font-bold text-sm shadow-sm"
                >
                  <Volume2 size={18} />
                  <span>문장 듣기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interaction Area */}
        <div className="flex-1 flex flex-col justify-center">
          {currentQuestion.type === 'A' ? (
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="relative group">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (quizState === 'answering') {
                        handleOptionSelect(option);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (quizState === 'answering') {
                          e.preventDefault();
                          handleOptionSelect(option);
                        }
                      }
                    }}
                    className={`w-full p-6 rounded-3xl border-2 font-bold text-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                      quizState === 'answering' 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-blue-500' 
                        : option === currentQuestion.sentence.blankWord
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                          : selectedOption === option
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-50 cursor-default'
                    }`}
                    style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}
                  >
                    <SegmentedSentence 
                      sentence={option} 
                      hidePlayButton 
                      interactive={quizState === 'feedback'}
                    />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(option, ttsSpeed);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/50 dark:bg-black/20 rounded-full text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* User Selection Area */}
              <div className="min-h-[100px] p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-center" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                {quizState === 'feedback' ? (
                  <SegmentedSentence 
                    sentence={currentQuestion.type === 'B' ? userTokens.join(' ') : userTokens.join('')} 
                    hidePlayButton 
                    interactive={currentQuestion.type !== 'B'}
                  />
                ) : (
                  <>
                    {userTokens.length === 0 && (
                      <span className="text-gray-400 font-medium">단어를 선택하여 문장을 완성하세요</span>
                    )}
                    {userTokens.map((token, i) => (
                      <motion.button
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => handleUserTokenClick(token, i)}
                        disabled={quizState !== 'answering'}
                        className="px-4 py-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 font-bold text-lg hover:border-red-500 transition-all active:scale-95"
                        style={currentQuestion.type === 'C' ? { fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` } : {}}
                      >
                        {token}
                      </motion.button>
                    ))}
                  </>
                )}
              </div>

              {/* Token Options Area */}
              <div className="flex flex-wrap gap-2 justify-center">
                {shuffledTokens.map((token, i) => (
                  <div key={i} className="relative">
                    <button
                      onClick={() => handleTokenClick(token, i)}
                      disabled={quizState !== 'answering'}
                      className="px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 font-bold text-lg hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                      style={currentQuestion.type === 'C' ? { fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` } : {}}
                    >
                      {token}
                    </button>
                    {currentQuestion.type === 'C' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(token, ttsSpeed);
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-blue-50 dark:bg-blue-900/40 rounded-full text-blue-400 shadow-sm"
                      >
                        <Volume2 size={10} />
                      </button>
                    )}
                  </div>
                ))}
                {userTokens.length > 0 && quizState === 'answering' && (
                  <button 
                    onClick={handleResetTokens}
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <RotateCcw size={24} />
                  </button>
                )}
              </div>
            </div>
          )}
        {/* Feedback Area (In-flow) */}
        <AnimatePresence>
          {quizState === 'feedback' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <QuizFeedbackPanel isCorrect={isCorrect}>
                <div className="flex flex-col items-center gap-5">
                <div className="w-full rounded-3xl bg-white p-5 text-center shadow-sm dark:bg-gray-900/70">
                  <div className="flex justify-center">
                    <SegmentedSentence sentence={currentQuestion.sentence.chinese} interactive={true} />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
                    {currentQuestion.sentence.korean}
                  </p>
                </div>
                
                <button 
                  onClick={handleNext}
                  className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    isCorrect 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20' 
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  }`}
                >
                  다음 문제 <ChevronRight size={20} />
                </button>
              </div>
              </QuizFeedbackPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
);
}
