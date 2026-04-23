/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserWords } from '@/hooks/use-user-words';
import { useSettings } from '@/hooks/use-settings';
import { hskWords } from '@/data/hsk';
import { WordData } from '@/lib/srs';
import { sentences, SentenceData } from '@/data/sentences';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, RefreshCcw, AlertCircle, ChevronRight, Trophy, Sparkles, RotateCcw, Star, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { speak } from '@/lib/tts';
import SegmentedSentence from '@/components/SegmentedSentence';

type QuestionFormat = 'hanzi-to-meaning' | 'meaning-to-hanzi' | 'sentence-fill' | 'sentence-unscramble-ko' | 'sentence-unscramble-zh';

interface LibraryQuizQuestion {
  format: QuestionFormat;
  word: WordData;
  options?: WordData[];
  sentence?: SentenceData;
  stringOptions?: string[];
  correctTokens?: string[];
  shuffledTokens?: string[];
}

type QuizState = 'answering' | 'feedback' | 'finished';

export default function LibraryQuizPage() {
  const router = useRouter();
  const { userWords, toggleFavorite, isLoaded: wordsLoaded } = useUserWords();
  const { ttsSpeed, selectedLevel, separateLibraryByLevel, hanziFont, isLoaded: settingsLoaded } = useSettings();

  const [questions, setQuestions] = useState<LibraryQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<string[]>([]);
  const [shuffledTokens, setShuffledTokens] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  // Get library words
  const libraryWords = useMemo(() => {
    if (!wordsLoaded) return [];
    const favoriteWordIds = new Set(Object.keys(userWords).filter(id => userWords[id]?.isFavorite));
    let filtered = hskWords.filter(w => favoriteWordIds.has(w.id));
    
    if (separateLibraryByLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(w => w.level === selectedLevel);
    }
    
    return filtered;
  }, [userWords, wordsLoaded, separateLibraryByLevel, selectedLevel]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('library-quiz-progress');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSavedIndex(parsed);
        setShowResumeModal(true);
      }
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (quizState !== 'finished' && currentIndex > 0) {
      localStorage.setItem('library-quiz-progress', currentIndex.toString());
    } else if (quizState === 'finished') {
      localStorage.removeItem('library-quiz-progress');
    }
  }, [currentIndex, quizState]);

  // Generate quiz questions
  useEffect(() => {
    if (libraryWords.length === 0 || questions.length > 0) return;
    
    // Shuffle library words for questions
    const shuffled = [...libraryWords].sort(() => Math.random() - 0.5);
    
    const generatedQuestions: LibraryQuizQuestion[] = shuffled.map(word => {
      const matchingSentences = sentences.filter(s => s.chinese && s.chinese.includes(word.word));
      
      let formats: QuestionFormat[] = ['hanzi-to-meaning', 'meaning-to-hanzi'];
      if (matchingSentences.length > 0) {
        formats.push('sentence-fill', 'sentence-unscramble-ko', 'sentence-unscramble-zh');
      }
      
      const format = formats[Math.floor(Math.random() * formats.length)];
      
      if (format === 'hanzi-to-meaning' || format === 'meaning-to-hanzi') {
        const levelWords = hskWords.filter(w => !separateLibraryByLevel || selectedLevel === 'all' || w.level === selectedLevel);
        
        let wrongOptions = levelWords
          .filter(w => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
          
        // Fallback if not enough words in the same level
        if (wrongOptions.length < 3) {
          const otherWords = hskWords
            .filter(w => w.id !== word.id && !wrongOptions.find(wo => wo.id === w.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, 3 - wrongOptions.length);
          wrongOptions = [...wrongOptions, ...otherWords];
        }

        const options = [...wrongOptions, word].sort(() => Math.random() - 0.5);
        return { format, word, options };
      } else {
        const sentence = matchingSentences[Math.floor(Math.random() * matchingSentences.length)];
        
        let stringOptions: string[] = [];
        let correctTokens: string[] = [];
        let shuffledTokens: string[] = [];
        
        if (format === 'sentence-fill') {
          const levelWords = hskWords.filter(w => !separateLibraryByLevel || selectedLevel === 'all' || w.level === selectedLevel);
          let distractors = levelWords.filter(w => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
          
          if (distractors.length < 3) {
            const otherDistractors = hskWords
              .filter(w => w.word !== word.word && !distractors.includes(w.word))
              .sort(() => Math.random() - 0.5)
              .slice(0, 3 - distractors.length)
              .map(w => w.word);
            distractors = [...distractors, ...otherDistractors];
          }
          
          stringOptions = [...distractors, word.word].sort(() => Math.random() - 0.5);
        } else if (format === 'sentence-unscramble-ko') {
          correctTokens = sentence.koreanTokens;
          const otherKoreanTokens = sentences
            .filter(os => os.id !== sentence.id)
            .flatMap(os => os.koreanTokens)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          shuffledTokens = [...correctTokens, ...otherKoreanTokens].sort(() => Math.random() - 0.5);
        } else if (format === 'sentence-unscramble-zh') {
          correctTokens = sentence.tokens;
          const otherChineseTokens = sentences
            .filter(os => os.id !== sentence.id)
            .flatMap(os => os.tokens)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          shuffledTokens = [...correctTokens, ...otherChineseTokens].sort(() => Math.random() - 0.5);
        }
        
        return { format, word, sentence, stringOptions, correctTokens, shuffledTokens };
      }
    });
    
    setQuestions(generatedQuestions);
  }, [libraryWords, questions.length, selectedLevel, separateLibraryByLevel]);

  useEffect(() => {
    if (wordsLoaded && libraryWords.length === 0) {
      router.push('/library');
    }
  }, [wordsLoaded, libraryWords.length, router]);

  const currentQuestion = questions[currentIndex];

  const isCorrect = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.format === 'hanzi-to-meaning' || currentQuestion.format === 'meaning-to-hanzi') {
      return selectedOption === currentQuestion.word.id;
    } else if (currentQuestion.format === 'sentence-fill') {
      return selectedOption === currentQuestion.word.word;
    } else {
      return userTokens.join('') === currentQuestion.correctTokens?.join('');
    }
  }, [currentQuestion, selectedOption, userTokens]);

  useEffect(() => {
    if (currentQuestion) {
      if (currentQuestion.shuffledTokens) {
        setShuffledTokens([...currentQuestion.shuffledTokens]);
      }
    }
  }, [currentIndex, questions, currentQuestion]);

  // Auto-play TTS
  useEffect(() => {
    if (currentQuestion && quizState === 'answering') {
      if (currentQuestion.format === 'hanzi-to-meaning') {
        speak(currentQuestion.word.word, ttsSpeed);
      } else if (currentQuestion.format === 'sentence-fill' || currentQuestion.format === 'sentence-unscramble-ko') {
        if (currentQuestion.sentence) {
          speak(currentQuestion.sentence.chinese, ttsSpeed);
        }
      }
    }
  }, [currentIndex, quizState, currentQuestion, ttsSpeed]);

  if (!wordsLoaded || !settingsLoaded || questions.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const handleOptionSelect = (optionValue: string) => {
    if (quizState !== 'answering') return;
    
    setSelectedOption(optionValue);
    
    let isAnsCorrect = false;
    if (currentQuestion.format === 'hanzi-to-meaning' || currentQuestion.format === 'meaning-to-hanzi') {
      isAnsCorrect = optionValue === currentQuestion.word.id;
    } else if (currentQuestion.format === 'sentence-fill') {
      isAnsCorrect = optionValue === currentQuestion.word.word;
    }
    
    handleAnswer(isAnsCorrect);
  };

  const handleTokenClick = (token: string, idx: number) => {
    if (quizState !== 'answering') return;
    
    if (currentQuestion.format === 'sentence-unscramble-zh') {
      speak(token, ttsSpeed);
    }

    const newUserTokens = [...userTokens, token];
    setUserTokens(newUserTokens);
    
    setShuffledTokens(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    
    if (currentQuestion.correctTokens && newUserTokens.length === currentQuestion.correctTokens.length) {
      const isAnsCorrect = newUserTokens.join('') === currentQuestion.correctTokens.join('');
      handleAnswer(isAnsCorrect);
    }
  };

  const handleUserTokenClick = (token: string, idx: number) => {
    if (quizState !== 'answering') return;
    
    setUserTokens(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    
    setShuffledTokens(prev => [...prev, token]);
  };

  const handleAnswer = (isAnsCorrect: boolean) => {
    setQuizState('feedback');
    if (isAnsCorrect) {
      setScore(s => s + 1);
      if (currentQuestion.format === 'hanzi-to-meaning' || currentQuestion.format === 'meaning-to-hanzi') {
        speak(currentQuestion.word.word, ttsSpeed);
      } else if (currentQuestion.sentence) {
        speak(currentQuestion.sentence.chinese, ttsSpeed);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setQuizState('answering');
      setSelectedOption(null);
      setUserTokens([]);
    } else {
      setQuizState('finished');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setQuizState('answering');
      setSelectedOption(null);
      setUserTokens([]);
    }
  };

  const handleRestart = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setQuizState('answering');
    setSelectedOption(null);
    setUserTokens([]);
    setScore(0);
    localStorage.removeItem('library-quiz-progress');
  };

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
                localStorage.removeItem('library-quiz-progress');
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
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <div className="px-6 min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md overflow-hidden bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-8 sm:p-10"
        >
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow-600/20">
            <Trophy className="text-yellow-600 dark:text-yellow-400" size={48} />
          </div>
          
          <h1 className="text-[clamp(2rem,9vw,3.4rem)] leading-none font-black text-black dark:text-white mb-2">학습 완료!</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-10">
            Library Quiz • {questions.length} Words
          </p>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-10">
            <div className="min-w-0 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl">
              <div className="min-w-0 text-[clamp(1.9rem,9vw,3rem)] leading-none font-black text-blue-600 dark:text-blue-400 mb-2">{accuracy}%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Accuracy</div>
            </div>
            <div className="min-w-0 p-4 sm:p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl">
              <div className="min-w-0 break-keep text-[clamp(1.7rem,8vw,2.8rem)] leading-none font-black text-black dark:text-white mb-2">{score}/{questions.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Correct</div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white w-full py-5 rounded-2xl font-bold text-base sm:text-lg active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              <RefreshCcw size={20} />
              <span>다시 풀기</span>
            </button>
            <button 
              onClick={() => router.push('/library')}
              className="text-sm font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors pt-4"
            >
              라이브러리로 돌아가기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="px-6 pt-8 flex items-center mb-8 relative">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={() => router.push('/library')}
            className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Library Quiz
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < currentIndex ? 'w-3 bg-blue-600 dark:bg-blue-500' : 
                  i === currentIndex ? 'w-6 bg-blue-600 dark:bg-blue-500' : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex justify-end">
          <div className="w-11 -mr-3" />
        </div>
      </div>

      <div className="flex-1 px-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Question Area */}
            <div className="mb-12 flex flex-col items-center w-full">
              {currentQuestion.format === 'hanzi-to-meaning' ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8">Listen and select the correct meaning</span>
                  <div className="flex justify-center mb-4">
                    <SegmentedSentence 
                      sentence={currentQuestion.word.word} 
                      hidePlayButton 
                      interactive={quizState === 'feedback'}
                    />
                  </div>
                  <button 
                    onClick={() => speak(currentQuestion.word.word, ttsSpeed)}
                    className="p-4 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full active:scale-95 transition-all"
                  >
                    <Volume2 size={24} />
                  </button>
                </>
              ) : currentQuestion.format === 'meaning-to-hanzi' ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8">Select the correct Hanzi</span>
                  <div className="text-5xl font-black text-black dark:text-white mb-4">
                    {currentQuestion.word.meaning}
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                    <Sparkles size={14} />
                    {currentQuestion.format === 'sentence-fill' ? '빈칸 채우기' : currentQuestion.format === 'sentence-unscramble-ko' ? '한글 해석 배열' : '중국어 문장 배열'}
                  </div>
                  
                  <div className="text-center py-8 w-full">
                    {currentQuestion.format === 'sentence-fill' ? (
                      <div className="flex flex-col items-center gap-8 w-full">
                        <div className="text-4xl font-black text-black dark:text-white leading-relaxed flex flex-wrap justify-center items-center gap-x-1" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                          {currentQuestion.sentence?.chinese.split(currentQuestion.word.word).map((part, i, arr) => (
                            <span key={i} className="flex items-center">
                              <SegmentedSentence 
                                sentence={part} 
                                hidePlayButton 
                                interactive={quizState === 'feedback'} 
                              />
                              {i < arr.length - 1 && (
                                <div className="flex flex-col items-center mx-2">
                                  <span className="inline-block w-24 border-b-4 border-blue-500 text-blue-500 min-h-[1.5em] text-center">
                                    {quizState === 'feedback' ? currentQuestion.word.word : ' '}
                                  </span>
                                  {quizState === 'feedback' && selectedOption === currentQuestion.word.word && (
                                    <span className="text-sm font-medium text-blue-400 mt-1">
                                      {currentQuestion.word.pinyin.toLowerCase()}
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
                                {currentQuestion.sentence?.pinyin}
                              </div>
                              <div className="text-lg font-bold text-gray-400 dark:text-gray-500">
                                {currentQuestion.sentence?.korean}
                              </div>
                            </div>
                            
                            {quizState === 'feedback' && selectedOption !== currentQuestion.word.word && (
                              <div className="mt-4 p-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-3xl w-full max-w-md">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3">정답 문장</div>
                                <div className="text-2xl font-black text-green-700 dark:text-green-400 mb-1" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                                  {currentQuestion.sentence?.chinese}
                                </div>
                                <div className="text-sm font-medium text-green-600/70 dark:text-green-400/70">
                                  {currentQuestion.sentence?.pinyin}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    ) : currentQuestion.format === 'sentence-unscramble-ko' ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center">
                          <SegmentedSentence 
                            sentence={currentQuestion.sentence?.chinese || ''} 
                            hidePlayButton
                            interactive={quizState === 'feedback'}
                          />
                        </div>
                        {quizState === 'feedback' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center gap-1 mt-2"
                          >
                            <div className="text-xl font-medium text-gray-500 dark:text-gray-400">
                              {currentQuestion.sentence?.pinyin}
                            </div>
                            <div className="text-lg font-bold text-gray-400 dark:text-gray-500">
                              {currentQuestion.sentence?.korean}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <div className="text-3xl font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentQuestion.sentence?.korean}
                        </div>
                        {quizState === 'feedback' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className="text-4xl font-black text-black dark:text-white" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                              {currentQuestion.sentence?.chinese}
                            </div>
                            <div className="text-xl font-medium text-blue-600 dark:text-blue-400">
                              {currentQuestion.sentence?.pinyin}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {(currentQuestion.format === 'sentence-fill' || currentQuestion.format === 'sentence-unscramble-ko' || currentQuestion.format === 'sentence-unscramble-zh') && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => speak(currentQuestion.sentence?.chinese || '', ttsSpeed)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all active:scale-95 font-bold text-sm shadow-sm"
                        >
                          <Volume2 size={18} />
                          <span>문장 듣기</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Options Area */}
            <div className="w-full">
              {currentQuestion.format === 'hanzi-to-meaning' || currentQuestion.format === 'meaning-to-hanzi' ? (
                <div className="grid grid-cols-1 gap-3 w-full">
                  {currentQuestion.options?.map((option, idx) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrectOption = option.id === currentQuestion.word.id;
                    
                    let bgColor = 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700';
                    let textColor = 'text-black dark:text-white';
                    
                    if (quizState === 'feedback') {
                      if (isCorrectOption) {
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
                            handleOptionSelect(option.id);
                          }
                        }}
                        className={`w-full p-5 rounded-3xl border-2 ${bgColor} ${textColor} font-bold text-lg transition-all ${quizState === 'answering' ? 'active:scale-95 cursor-pointer hover:border-blue-500' : 'cursor-default'} flex flex-col items-stretch gap-2 group`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="flex-1 text-left">
                            {currentQuestion.format === 'hanzi-to-meaning' ? option.meaning : option.word}
                          </span>
                          {quizState === 'feedback' && isCorrectOption && <CheckCircle2 className="text-green-500" size={24} />}
                          {quizState === 'feedback' && isSelected && !isCorrectOption && <XCircle className="text-red-500" size={24} />}
                        </div>
                        
                        {quizState === 'feedback' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-3 mt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between"
                          >
                            <div className="flex flex-col items-start text-left">
                              <SegmentedSentence 
                                sentence={option.word} 
                                hidePlayButton 
                                interactive={true}
                              />
                              <div className="text-base font-medium opacity-80">{option.pinyin.toLowerCase()}</div>
                              {currentQuestion.format === 'meaning-to-hanzi' && (
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
                                className="p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full transition-colors cursor-pointer relative z-10"
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
              ) : currentQuestion.format === 'sentence-fill' ? (
                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.stringOptions?.map((option, idx) => (
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
                        className={`w-full p-6 rounded-3xl border-2 font-bold text-xl transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                          quizState === 'answering' 
                            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-blue-500' 
                            : option === currentQuestion.word.word
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                              : selectedOption === option
                                ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-50 cursor-default'
                        }`}
                      >
                        <SegmentedSentence 
                          sentence={option} 
                          hidePlayButton 
                          interactive={quizState === 'feedback'}
                        />
                        
                        {quizState === 'feedback' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="w-full pt-3 mt-3 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-2"
                          >
                            {(() => {
                              const wordData = hskWords.find(w => w.word === option);
                              if (!wordData) return null;
                              return (
                                <>
                                  <div className="text-sm font-medium opacity-80">{wordData.pinyin.toLowerCase()}</div>
                                  <div className="text-xs font-medium opacity-60">{wordData.meaning}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(wordData.id);
                                      }}
                                      className={`p-2 rounded-full transition-colors ${userWords[wordData.id]?.isFavorite ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : 'bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40'}`}
                                    >
                                      <Star size={16} fill={userWords[wordData.id]?.isFavorite ? "currentColor" : "none"} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speak(option, ttsSpeed);
                                      }}
                                      className="p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full transition-colors"
                                    >
                                      <Volume2 size={16} />
                                    </button>
                                  </div>
                                </>
                              );
                            })()}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="min-h-[80px] p-6 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-wrap gap-2 items-center justify-center">
                    <AnimatePresence>
                      {userTokens.map((token, idx) => (
                        <motion.button
                          key={`user-${idx}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          onClick={() => handleUserTokenClick(token, idx)}
                          className={`px-4 py-2 rounded-xl font-bold text-lg shadow-sm transition-colors ${
                            quizState === 'feedback'
                              ? isCorrect
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                          }`}
                          style={currentQuestion.format === 'sentence-unscramble-zh' ? { fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` } : {}}
                        >
                          {token}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <AnimatePresence>
                      {shuffledTokens.map((token, idx) => (
                        <motion.button
                          key={`shuffled-${idx}-${token}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          onClick={() => handleTokenClick(token, idx)}
                          disabled={quizState !== 'answering'}
                          className="px-5 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-black dark:text-white rounded-2xl font-bold text-xl shadow-sm hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={currentQuestion.format === 'sentence-unscramble-zh' ? { fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` } : {}}
                        >
                          {token}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Footer & Navigation */}
      <div className="px-6 h-48 flex flex-col items-center justify-center gap-4">
        <AnimatePresence>
          {quizState === 'feedback' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className={`mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isCorrect ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {isCorrect ? (
                  <><CheckCircle2 size={16} /> Correct Choice</>
                ) : (
                  <><AlertCircle size={16} /> Incorrect Choice</>
                )}
              </div>
              
              <div className="text-center mb-6">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 italic mb-1">{currentQuestion.word.pinyin.toLowerCase()}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{currentQuestion.word.meaning}</div>
              </div>

              <div className="flex w-full gap-3">
                <button 
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-5 px-6 rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-50"
                >
                  <ArrowLeft size={20} />
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white py-5 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Show Previous and Show Answer buttons when answering */}
        <AnimatePresence>
          {quizState === 'answering' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl flex justify-start gap-3"
            >
              {currentIndex > 0 && (
                <button 
                  onClick={handlePrevious}
                  className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3 px-4 rounded-xl font-bold active:scale-95 transition-all"
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm">이전 문제</span>
                </button>
              )}
              <button 
                onClick={() => setQuizState('feedback')}
                className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-3 px-4 rounded-xl font-bold active:scale-95 transition-all border border-blue-100 dark:border-blue-800/30"
              >
                <Eye size={16} />
                <span className="text-sm">정답 보기</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
