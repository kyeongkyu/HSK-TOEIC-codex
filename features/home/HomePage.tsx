'use client';
import { useUserWords } from '@/hooks/use-user-words';
import { useSettings } from '@/hooks/use-settings';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence } from 'motion/react';
import { BookOpen, Brain, CheckSquare, ChevronRight, PenTool, ArrowLeft, Briefcase, Monitor, Users, ShoppingCart, Landmark, TrendingUp, Utensils, Plane, Building, Megaphone, Headphones, Database, Truck, FileText, Factory, Calendar, ShieldCheck, Volume2, Star, X } from 'lucide-react';
import { speak } from '@/lib/tts';
import type { WordData } from '@/lib/srs';
import { markNavigationStart } from '@/lib/navigation-performance';
import { loadHskWords, loadToeicWords } from '@/features/data/loaders';
import {
  getResumeTaskMeta,
  getResumeTaskSnapshot,
  markResumeTaskFreshStart,
  setResumeTaskSnapshot,
  type ResumeTaskKey,
  type ResumeTaskMeta,
} from '@/lib/resume-task';
import { ResumePromptDialog, type PendingResumePrompt } from './ResumePromptDialog';
import { getHskHomeStats, groupWordsByTopic } from './home-selectors';

const EntryScreen = dynamic(
  () => import('@/components/entry-screen').then((module) => module.EntryScreen),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">
        Loading...
      </div>
    ),
  },
);

const CARD_WIDTH = 280;
const GAP = 16;
const OFFSET = CARD_WIDTH + GAP;

type ToeicWord = WordData & {
  topicId: string;
  phonetic?: string;
};

type CarouselCardData = {
  title: string;
  description: string;
  link: string;
  taskKey?: ResumeTaskKey;
  accentClass: string;
  iconClass: string;
  surfaceClass: string;
  icon: ReactNode;
};
type ToeicVocabResumeSnapshot = {
  selectedToeicTopicId: string | null;
  toeicWordIndex: number;
  toeicStudyMode: 'focus' | 'list';
  showToeicTopics: boolean;
};
type CarouselCardMotionValue = ReturnType<typeof useMotionValue<number>>;

function CarouselCard({ card, index, x, currentIndex, onStart, onPrefetch }: { card: CarouselCardData, index: number, x: CarouselCardMotionValue, currentIndex: number, onStart: (card: CarouselCardData) => void, onPrefetch: (card: CarouselCardData) => void }) {
  const inputRange = [-(index + 1) * OFFSET, -index * OFFSET, -(index - 1) * OFFSET];
  
  const scale = useTransform(x, inputRange, [0.85, 1, 0.85]);
  const opacity = useTransform(x, inputRange, [0.5, 1, 0.5]);
  const zIndex = useTransform(x, inputRange, [0, 10, 0]);
  const shadow = useTransform(
    x, 
    inputRange, 
    ["0px 8px 20px rgba(15,23,42,0.04)", "0px 18px 36px rgba(15,23,42,0.12)", "0px 8px 20px rgba(15,23,42,0.04)"]
  );

  return (
    <motion.div
      style={{
        width: CARD_WIDTH,
        scale,
        opacity,
        zIndex,
        boxShadow: shadow,
      }}
      className={`relative shrink-0 h-64 rounded-[1.5rem] bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between transform-gpu will-change-transform overflow-hidden ${card.surfaceClass}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h3 className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">Mode</h3>
          <h2 className="text-gray-950 dark:text-white text-2xl font-black">{card.title}</h2>
        </div>
        <div className={`shrink-0 rounded-2xl p-3 ${card.iconClass}`}>
          {card.icon}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 dark:text-gray-300 text-sm font-medium leading-relaxed break-keep">
          {card.description}
        </p>
        
        <button
          type="button"
          onClick={() => onStart(card)}
          onPointerEnter={() => onPrefetch(card)}
          onFocus={() => onPrefetch(card)}
          className={`inline-flex items-center gap-1.5 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-sm pointer-events-auto transform-gpu ${card.accentClass}`}
        >
          Start Now
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const { userWords, toggleFavorite, isLoaded: wordsLoaded } = useUserWords();
  const { selectedLevel, setLevel, isCarouselView, isLoaded: settingsLoaded, appMode, setAppMode, ttsSpeed } = useSettings();
  const [now, setNow] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
  const [showToeicTopics, setShowToeicTopics] = useState(false);
  const [selectedToeicTopicId, setSelectedToeicTopicId] = useState<string | null>(null);
  const [toeicWordIndex, setToeicWordIndex] = useState(0);
  const [toeicStudyMode, setToeicStudyMode] = useState<'focus' | 'list'>('focus');
  const [showToeicWordList, setShowToeicWordList] = useState(false);
  const [hskWords, setHskWords] = useState<WordData[]>([]);
  const [toeicWords, setToeicWords] = useState<ToeicWord[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [pendingResumePrompt, setPendingResumePrompt] = useState<PendingResumePrompt | null>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (appMode !== 'hsk') return;

    let isCancelled = false;
    void loadHskWords().then((words) => {
      if (!isCancelled) {
        setHskWords(words);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [appMode]);

  useEffect(() => {
    if (appMode !== 'toeic') return;

    let isCancelled = false;
    void loadToeicWords().then((words) => {
      if (!isCancelled) {
        setToeicWords(words);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [appMode]);

  const toeicWordsByTopic = useMemo(() => groupWordsByTopic(toeicWords), [toeicWords]);

  const cards = useMemo<CarouselCardData[]>(() => [
    {
      title: 'Browse Words',
      description: '단어와 예문을 보며 뜻과 발음을 함께 학습하세요.',
      link: '/study',
      taskKey: 'hsk-browse',
      accentClass: 'bg-blue-600 shadow-blue-600/20 dark:bg-blue-500 dark:shadow-blue-500/20',
      iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
      surfaceClass: 'hover:border-blue-200 dark:hover:border-blue-500/40',
      icon: <BookOpen size={24} />
    },
    {
      title: 'Listening',
      description: '급수와 주제별로 중국어 듣기 연습과 문제를 풀어보세요.',
      link: '/hsk-listening',
      taskKey: 'hsk-listening',
      accentClass: 'bg-cyan-600 shadow-cyan-600/20 dark:bg-cyan-500 dark:shadow-cyan-500/20',
      iconClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300',
      surfaceClass: 'hover:border-cyan-200 dark:hover:border-cyan-500/40',
      icon: <Headphones size={24} />
    },
    {
      title: 'Memorize Words',
      description: '복습이 필요한 단어를 SRS 방식으로 효율적으로 외워보세요.',
      link: '/memorize',
      taskKey: 'hsk-memorize',
      accentClass: 'bg-emerald-600 shadow-emerald-600/20 dark:bg-emerald-500 dark:shadow-emerald-500/20',
      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
      surfaceClass: 'hover:border-emerald-200 dark:hover:border-emerald-500/40',
      icon: <Brain size={24} />
    },
    {
      title: 'Quiz Mode',
      description: '퀴즈로 실력을 점검하고 자주 틀리는 단어를 확인하세요.',
      link: '/quiz',
      taskKey: 'hsk-quiz',
      accentClass: 'bg-amber-600 shadow-amber-600/20 dark:bg-amber-500 dark:shadow-amber-500/20',
      iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
      surfaceClass: 'hover:border-amber-200 dark:hover:border-amber-500/40',
      icon: <CheckSquare size={24} />
    },
    {
      title: 'Sentence Study',
      description: '급수별 예문을 읽고 발음, 해석, 표현, 문법 포인트를 단계적으로 확인하세요.',
      link: '/sentence-study',
      accentClass: 'bg-sky-600 shadow-sky-600/20 dark:bg-sky-500 dark:shadow-sky-500/20',
      iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300',
      surfaceClass: 'hover:border-sky-200 dark:hover:border-sky-500/40',
      icon: <FileText size={24} />
    },
    {
      title: 'Sentence Mode',
      description: '빈칸 채우기와 배열 문제로 문장 구조를 익혀보세요.',
      link: `/sentence-completion/${selectedLevel === 'all' ? 1 : selectedLevel}`,
      taskKey: 'hsk-sentence',
      accentClass: 'bg-rose-600 shadow-rose-600/20 dark:bg-rose-500 dark:shadow-rose-500/20',
      iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
      surfaceClass: 'hover:border-rose-200 dark:hover:border-rose-500/40',
      icon: <PenTool size={24} />
    },
    {
      title: 'Grammar Mode',
      description: '중국어 문법의 핵심 구조를 확인하고 연습하세요.',
      link: '/grammar',
      taskKey: 'hsk-grammar',
      accentClass: 'bg-violet-600 shadow-violet-600/20 dark:bg-violet-500 dark:shadow-violet-500/20',
      iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
      surfaceClass: 'hover:border-violet-200 dark:hover:border-violet-500/40',
      icon: <CheckSquare size={24} />
    }
  ], [selectedLevel]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setIsClient(true);
      setNow(Date.now());
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    animate(x, -cardIndex * OFFSET, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    });
  }, [cardIndex, x]);

  useEffect(() => {
    if (appMode !== 'toeic') {
      window.dispatchEvent(new CustomEvent('app-root-view-change', { detail: 'home' }));
      return;
    }

    const rootView = !showToeicTopics && !selectedToeicTopicId ? 'home' : 'subview';
    window.dispatchEvent(new CustomEvent('app-root-view-change', { detail: rootView }));
  }, [appMode, showToeicTopics, selectedToeicTopicId]);

  useEffect(() => {
    const activeToeicWords = selectedToeicTopicId ? toeicWordsByTopic[selectedToeicTopicId] ?? [] : [];
    if (appMode !== 'toeic' || !selectedToeicTopicId || activeToeicWords.length === 0) return;
    const safeToeicWordIndex = Math.min(Math.max(toeicWordIndex, 0), activeToeicWords.length - 1);
    setResumeTaskSnapshot('/', 'TOEIC Vocabulary', {
      selectedToeicTopicId,
      toeicWordIndex: safeToeicWordIndex,
      toeicStudyMode,
      showToeicTopics: true,
    } satisfies ToeicVocabResumeSnapshot, 'toeic-vocab');
  }, [appMode, selectedToeicTopicId, toeicStudyMode, toeicWordIndex, toeicWordsByTopic]);

  const handleDragEnd = (e: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (offset < -50 || velocity < -500) {
      setCardIndex(prev => Math.min(prev + 1, cards.length - 1));
    } else if (offset > 50 || velocity > 500) {
      setCardIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const openRouteFromStart = (route: string, taskKey?: ResumeTaskKey) => {
    markResumeTaskFreshStart(route, taskKey);
    markNavigationStart(route);
    router.push(route);
  };

  const prefetchTaskRoute = (route: string) => {
    router.prefetch(route);
  };

  const openTaskWithResumePrompt = (
    taskKey: ResumeTaskKey | undefined,
    freshLabel: string,
    onFreshStart: () => void,
    onResume?: (meta: ResumeTaskMeta) => void,
  ) => {
    if (!taskKey) {
      onFreshStart();
      return;
    }

    const meta = getResumeTaskMeta(taskKey);
    if (!meta || (meta.appMode === 'hsk' && meta.levelScope !== selectedLevel)) {
      onFreshStart();
      return;
    }

    setPendingResumePrompt({
      meta,
      freshLabel,
      onFreshStart,
      onResume: () => {
        if (onResume) {
          markNavigationStart(meta.route);
          onResume(meta);
        } else {
          markNavigationStart(meta.route);
          router.push(meta.route);
        }
      },
    });
  };

  const handleHskCardStart = (card: CarouselCardData) => {
    openTaskWithResumePrompt(
      card.taskKey,
      card.title,
      () => openRouteFromStart(card.link, card.taskKey),
    );
  };

  const openToeicTopicsFresh = () => {
    setShowToeicTopics(true);
    setSelectedToeicTopicId(null);
    setToeicWordIndex(0);
    setToeicStudyMode('focus');
    setShowToeicWordList(false);
  };

  const resumeToeicVocab = () => {
    const snapshot = getResumeTaskSnapshot<ToeicVocabResumeSnapshot>('/');
    if (!snapshot) {
      openToeicTopicsFresh();
      return;
    }

    setShowToeicTopics(snapshot.showToeicTopics);
    setSelectedToeicTopicId(snapshot.selectedToeicTopicId);
    setToeicWordIndex(snapshot.toeicWordIndex);
    setToeicStudyMode(snapshot.toeicStudyMode);
    setShowToeicWordList(false);
  };

  const { dueWords, wrongWords, totalWords } = useMemo(
    () => getHskHomeStats(hskWords, selectedLevel, userWords, now),
    [hskWords, selectedLevel, userWords, now],
  );

  if (!wordsLoaded || !settingsLoaded || now === null || appMode === null) return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading your progress...</div>;

  if (appMode === 'entry') {
    return (
      <EntryScreen 
        onStart={(target) => {
          if (target === 'hsk') {
            setAppMode('hsk');
          } else if (target === 'toeic') {
            setAppMode('toeic');
          }
        }} 
      />
    );
  }

  if (appMode === 'toeic') {
    const toeicTopics = [
      { id: "core-business", title: "1. Core Business", subtitle: "일반 비즈니스, 회사 운영 전반", icon: <Briefcase size={28} /> },
      { id: "office-equipment", title: "2. Office & Equipment", subtitle: "사무 환경, 장비, 문서 처리", icon: <Monitor size={28} /> },
      { id: "hr-recruitment", title: "3. HR & Recruitment", subtitle: "채용, 지원자, 교육, 평가", icon: <Users size={28} /> },
      { id: "marketing-advertising", title: "4. Marketing & Advertising", subtitle: "광고, 캠페인, 브랜드, 조사", icon: <Megaphone size={28} /> },
      { id: "customer-service", title: "5. Customer Service", subtitle: "문의, 불만, 환불, 지원", icon: <Headphones size={28} /> },
      { id: "it-systems", title: "6. IT & Systems", subtitle: "소프트웨어, 데이터, 접근, 오류", icon: <Database size={28} /> },
      { id: "purchasing", title: "7. Purchasing", subtitle: "구매, 공급업체, 계약 진행", icon: <ShoppingCart size={28} /> },
      { id: "logistics-shipping", title: "8. Logistics & Shipping", subtitle: "배송, 창고, 재고, 지연", icon: <Truck size={28} /> },
      { id: "finance-accounting", title: "9. Finance & Accounting", subtitle: "비용, 예산, 수익, 회계 처리", icon: <Landmark size={28} /> },
      { id: "management-strategy", title: "10. Management & Strategy", subtitle: "의사결정, 운영 전략, 성과 관리", icon: <TrendingUp size={28} /> },
      { id: "legal-contracts", title: "11. Legal & Contracts", subtitle: "계약, 조건, 협상, 책임", icon: <FileText size={28} /> },
      { id: "manufacturing-quality", title: "12. Manufacturing & Quality", subtitle: "생산, 검사, 결함, 공정", icon: <Factory size={28} /> },
      { id: "meetings-scheduling", title: "13. Meetings & Scheduling", subtitle: "일정, 회의, 조율, 변경", icon: <Calendar size={28} /> },
      { id: "travel-trips", title: "14. Travel & Business Trips", subtitle: "출장, 예약, 일정 이동", icon: <Plane size={28} /> },
      { id: "events-hospitality", title: "15. Events & Hospitality", subtitle: "행사, 음식, 서비스", icon: <Utensils size={28} /> },
      { id: "real-estate-construction", title: "16. Real Estate & Construction", subtitle: "건물, 임대, 공사", icon: <Building size={28} /> },
      { id: "healthcare-safety", title: "17. Healthcare & Safety", subtitle: "의료와 산업 안전", icon: <ShieldCheck size={28} /> }
    ];

    return (
      <div className="px-5 py-4 min-h-[calc(100vh-160px)] bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
            {selectedToeicTopicId ? (
               <button 
                onClick={() => {
                  setSelectedToeicTopicId(null);
                  setToeicWordIndex(0);
                  setShowToeicWordList(false);
                }}
                className="flex items-center gap-2 text-2xl font-black tracking-tighter text-black dark:text-white"
               >
                 <ArrowLeft size={24} />
                 {toeicTopics.find(t => t.id === selectedToeicTopicId)?.title.split('. ')[1] || 'Study'}
               </button>
            ) : showToeicTopics ? (
               <button 
                onClick={() => setShowToeicTopics(false)}
                className="flex items-center gap-2 text-2xl font-black tracking-tighter text-black dark:text-white"
               >
                 <ArrowLeft size={24} />
               Topics
               </button>
            ) : (
              <h1 className="text-2xl font-black tracking-tighter text-black dark:text-white">TOEIC</h1>
            )}
          </div>
          {showToeicTopics && !selectedToeicTopicId && (
            <div className="flex items-center rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
              {(['focus', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setToeicStudyMode(mode)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all ${toeicStudyMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
          {!showToeicTopics && !selectedToeicTopicId && (
            <button
              onClick={() => {
                setAppMode('entry');
                setShowToeicTopics(false);
                setSelectedToeicTopicId(null);
                setToeicWordIndex(0);
              }}
              className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Main
            </button>
          )}
        </div>

        {selectedToeicTopicId ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {(() => {
              const filteredToeicWords = toeicWordsByTopic[selectedToeicTopicId] ?? [];
              if (filteredToeicWords.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="p-8 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl text-gray-300 dark:text-gray-600 animate-pulse">
                      <BookOpen size={64} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Content Loading...</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px]">주제별 핵심 단어가 곧 업데이트됩니다. 잠시만 기다려주세요!</p>
                    </div>
                  </div>
                );
              }
              const renderToeicWordList = (variant: 'page' | 'overlay') => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`${variant === 'overlay' ? 'space-y-3' : 'mt-0 rounded-[1.75rem] border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3 space-y-2'}`}
                >
                  {filteredToeicWords.map((item, index) => {
                    const isCurrent = variant === 'overlay' && index === toeicWordIndex;
                    const isItemFavorite = userWords[item.id]?.isFavorite;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setToeicWordIndex(index);
                          setShowToeicWordList(false);
                          setToeicStudyMode('focus');
                        }}
                        className={`w-full min-h-[68px] rounded-2xl px-4 py-3 flex items-center gap-3 text-left border transition-all active:scale-[0.99] ${isCurrent ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-800'}`}
                      >
                        <span className={`w-9 shrink-0 text-xs font-black tabular-nums ${isCurrent ? 'text-white/70' : 'text-gray-400'}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-base font-black">{item.word}</span>
                            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${isCurrent ? 'bg-white/15 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'}`}>
                              {item.pinyin}
                            </span>
                          </div>
                          <p className={`mt-1 text-sm leading-snug ${isCurrent ? 'text-white/85' : 'text-gray-500 dark:text-gray-400'}`}>
                            {item.meaning}
                          </p>
                        </div>
                        <span
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className={`shrink-0 p-2 rounded-xl ${isCurrent ? 'text-yellow-200 hover:bg-white/10' : 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'}`}
                          role="button"
                          aria-label="Toggle favorite"
                        >
                          <Star size={18} fill={isItemFavorite ? 'currentColor' : 'none'} strokeWidth={isItemFavorite ? 0 : 2} />
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              );

              if (toeicStudyMode === 'list') {
                return renderToeicWordList('page');
              }

              const word = filteredToeicWords[toeicWordIndex];
              if (!word) return null;
              const isFavorite = userWords[word.id]?.isFavorite;
              return (
                <div className="pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    key={word.id} 
                    className="relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-500 group-hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]" />
                    
                    <div className="relative p-8 z-10">
                      <button 
                        onClick={() => toggleFavorite(word.id)}
                        className="absolute top-8 right-8 p-2 rounded-xl text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors z-20"
                      >
                        <Star size={24} fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 0 : 2} />
                      </button>

                      {/* Decorative element */}
                      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{word.word}</h2>
                            <button 
                              onClick={() => speak(word.word, ttsSpeed || 1, 'en-US')}
                              className="p-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                            >
                              <Volume2 size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                          {word.phonetic && (
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 font-mono">
                              {word.phonetic}
                            </p>
                          )}
                          <span className="inline-block text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100/50 dark:border-blue-800/50">
                            {word.pinyin}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2.5 ml-1">Meaning</h3>
                          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{word.meaning}</p>
                        </div>

                        <div className="relative bg-black/5 dark:bg-black/20 rounded-[2rem] p-6 border border-black/5 dark:border-white/5 overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                              Usage / Example
                            </h3>
                            <button 
                              onClick={() => speak(word.example, ttsSpeed || 1, 'en-US')}
                              className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 active:scale-95 transition-all shadow-sm"
                              aria-label="Listen to example"
                            >
                              <Volume2 size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed italic">
                              &quot;{word.example.split(new RegExp(`(${word.word}[a-z]*)`, 'gi')).map((part, i) => 
                                 part.toLowerCase().startsWith(word.word.toLowerCase()) ? (
                                   <span key={i} className="text-blue-600 dark:text-blue-400 font-bold not-italic">{part}</span>
                                 ) : (
                                   <span key={i}>{part}</span>
                                 )
                               )}&quot;
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium bg-white/50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-black/[0.03] dark:border-white/[0.03] w-fit">
                              {word.exampleTranslation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {isClient && !showToeicWordList && createPortal(
                    <div
                      className="fixed left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[1.5rem] border border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 p-2 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-md"
                      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setToeicWordIndex(i => Math.max(0, i - 1))}
                          disabled={toeicWordIndex === 0}
                          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 font-black tracking-tight text-gray-700 dark:text-gray-200 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <ArrowLeft size={20} />
                          Prev
                        </button>
                        <button
                          onClick={() => setShowToeicWordList(true)}
                          className="min-h-14 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm font-black tracking-widest text-gray-500 dark:text-gray-400 transition-all active:scale-95 hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-expanded={showToeicWordList}
                        >
                          {toeicWordIndex + 1} / {filteredToeicWords.length}
                        </button>
                        <button
                          onClick={() => setToeicWordIndex(i => Math.min(filteredToeicWords.length - 1, i + 1))}
                          disabled={toeicWordIndex === filteredToeicWords.length - 1}
                          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-black tracking-tight text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-700"
                        >
                          Next
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>,
                    document.body,
                  )}
                  <AnimatePresence>
                    {showToeicWordList && (
                      <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900"
                      >
                        <div className="px-6 pt-8 pb-6 flex items-center justify-between">
                          <div className="min-w-0">
                            <h2 className="text-2xl font-black text-black dark:text-white truncate">Word List</h2>
                            <p className="mt-1 text-xs font-bold text-gray-400 dark:text-gray-500">
                              {toeicTopics.find(t => t.id === selectedToeicTopicId)?.title.split('. ')[1] || 'TOEIC'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowToeicWordList(false)}
                            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-black dark:text-white active:scale-95 transition-all"
                            aria-label="Close word list"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-12">
                          {renderToeicWordList('overlay')}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
          </motion.div>
        ) : !showToeicTopics ? (
          <div className="flex flex-col gap-4 mt-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="relative w-full rounded-[2.5rem] bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 p-10 flex flex-col justify-start shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] min-h-[220px] overflow-hidden group"
            >
               {/* Background Glow */}
               <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-colors duration-1000" />
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

               <h2 className="text-black dark:text-white text-4xl font-black tracking-tighter self-start relative z-10 leading-none">
                 TOEIC<br />
                 <span className="opacity-40">Vocabulary</span>
               </h2>

               <button
                 onClick={() => openTaskWithResumePrompt('toeic-vocab', '단어 학습하기', openToeicTopicsFresh, resumeToeicVocab)}
                 className="mt-10 bg-black dark:bg-white text-white dark:text-black font-black py-4 px-8 rounded-2xl w-max transition-all shadow-2xl hover:scale-105 active:scale-95 relative z-10 tracking-tight"
               >
                 단어 학습하기
               </button>
            </motion.div>

            <button
              type="button"
              onClick={() => openTaskWithResumePrompt('toeic-part2', 'TOEIC Part 2 LC', () => openRouteFromStart('/toeic-part2', 'toeic-part2'))}
              onPointerEnter={() => prefetchTaskRoute('/toeic-part2')}
              onFocus={() => prefetchTaskRoute('/toeic-part2')}
              className="block w-full text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.08, ease: "backOut" }}
                className="relative w-full rounded-[2.5rem] bg-slate-950 p-8 flex items-center justify-between shadow-[0_20px_50px_rgba(15,23,42,0.28)] min-h-[170px] overflow-hidden group active:scale-[0.98] transition-transform"
              >
                <div className="absolute -bottom-16 -right-10 w-56 h-56 bg-blue-400/25 rounded-full blur-[70px] group-hover:bg-blue-400/35 transition-colors duration-700" />
                <div className="relative z-10 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Listening</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tighter text-white leading-none">
                    TOEIC<br />
                    <span className="text-white/70">Part 2 LC</span>
                  </h2>
                  <p className="mt-4 text-sm font-bold leading-relaxed text-white/80 break-keep">
                    질문 유형, 응답 유형, 상황별로 짧은 응답 듣기를 연습하세요.
                  </p>
                </div>
                <div className="relative z-10 shrink-0 rounded-3xl bg-white/15 p-5 text-white">
                  <Headphones size={36} />
                </div>
              </motion.div>
            </button>

            <button
              type="button"
              onClick={() => openTaskWithResumePrompt('toeic-part5', 'TOEIC Part 5', () => openRouteFromStart('/toeic-part5', 'toeic-part5'))}
              onPointerEnter={() => prefetchTaskRoute('/toeic-part5')}
              onFocus={() => prefetchTaskRoute('/toeic-part5')}
              className="block w-full text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.16, ease: "backOut" }}
                className="relative w-full rounded-[2.5rem] bg-blue-600 p-8 flex items-center justify-between shadow-[0_20px_50px_rgba(37,99,235,0.25)] min-h-[170px] overflow-hidden group active:scale-[0.98] transition-transform"
              >
                <div className="absolute -bottom-16 -right-10 w-56 h-56 bg-white/20 rounded-full blur-[70px] group-hover:bg-white/30 transition-colors duration-700" />
                <div className="relative z-10 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Practice</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tighter text-white leading-none">
                    TOEIC<br />
                    <span className="text-white/70">Part 5</span>
                  </h2>
                  <p className="mt-4 text-sm font-bold leading-relaxed text-white/80 break-keep">
                    레벨을 선택하고 문법, 어휘, 문맥 문제를 연습하세요.
                  </p>
                </div>
                <div className="relative z-10 shrink-0 rounded-3xl bg-white/15 p-5 text-white">
                  <FileText size={36} />
                </div>
              </motion.div>
            </button>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
          >
            {toeicTopics.map((topic) => (
              <motion.button 
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                key={topic.id}
                className="text-left w-full rounded-[1.5rem] bg-gray-50 dark:bg-white/[0.03] p-5 flex items-center gap-5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 group active:scale-[0.98]"
                onClick={() => {
                  setSelectedToeicTopicId(topic.id);
                  setToeicWordIndex(0);
                  setShowToeicWordList(false);
                }}
              >
                <div className="bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 p-3.5 rounded-2xl shadow-sm border border-black/5 dark:border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  {topic.icon}
                </div>
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <h3 className="text-[17px] font-black text-gray-900 dark:text-white leading-tight truncate">{topic.title}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide truncate">{topic.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
        <ResumePromptDialog prompt={pendingResumePrompt} isClient={isClient} onClose={() => setPendingResumePrompt(null)} />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 min-h-[calc(100vh-160px)] bg-gray-50/80 dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      {/* Top Bar: Level Selector & Stats */}
      <div className="relative z-[60] flex items-center justify-between gap-4 mb-6 rounded-[1.5rem] border border-gray-200/60 bg-white/60 p-4 shadow-lg shadow-black/5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/60 dark:shadow-black/20">
        <div className="relative z-[70]">
          <button 
            type="button"
            onClick={() => setIsLevelMenuOpen(!isLevelMenuOpen)}
            className="flex items-center gap-2 text-2xl font-black tracking-tighter text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors active:scale-[0.98] transform-gpu"
          >
            {selectedLevel === 'all' ? 'HSK 1~6' : `HSK ${selectedLevel}`}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isLevelMenuOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
          </button>
          
          {isLevelMenuOpen && (
            <div className="absolute top-full left-0 mt-3 w-40 overflow-hidden rounded-3xl border border-gray-200 bg-white py-1.5 shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-gray-700 dark:bg-gray-950 dark:shadow-black/30 z-[80] pointer-events-auto">
              {[1, 2, 3, 4, 5, 6].map(level => (
                <button
                  type="button"
                  key={level}
                  onClick={() => {
                    setLevel(level);
                    setIsLevelMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/60 dark:hover:bg-white/10 ${selectedLevel === level ? 'bg-blue-50/60 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  HSK {level}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLevel('all');
                  setIsLevelMenuOpen(false);
                }}
                className={`w-full border-t border-gray-200/60 px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-white/60 dark:border-white/10 dark:hover:bg-white/10 ${selectedLevel === 'all' ? 'bg-blue-50/60 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}
              >
                HSK 1~6
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppMode('entry');
                  setIsLevelMenuOpen(false);
                }}
                className="w-full border-t border-gray-200/60 px-4 py-2.5 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-white/60 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
              >
                Main
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-gray-800 px-3 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[9px] uppercase font-black text-gray-400 dark:text-gray-500">Total</span>
            <span className="text-xs font-black text-gray-950 dark:text-white">{totalWords}</span>
          </div>
          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[9px] uppercase font-black text-red-400 dark:text-red-500">Wrong</span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">{wrongWords}</span>
          </div>
        </div>
      </div>

      {/* Due for Review Stats */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => openTaskWithResumePrompt('hsk-memorize', 'Memorize Words', () => openRouteFromStart('/memorize', 'hsk-memorize'))}
          className="group block w-full text-left"
        >
          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm dark:shadow-none border border-blue-100/70 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-600/10 active:scale-[0.99] transition-all transform-gpu">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">Due for Review</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">복습이 필요한 단어</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{dueWords}</div>
              <ChevronRight size={18} className="text-blue-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </button>
      </div>

      {/* Mode Selection */}
      {isCarouselView ? (
        <div className="relative w-full py-7 -mx-5 px-5 mb-8">
          <motion.div
            drag="x"
            dragConstraints={{
              left: -((cards.length - 1) * OFFSET),
              right: 0,
            }}
            style={{ x, paddingLeft: 'calc(50% - 140px)', paddingRight: 'calc(50% - 140px)' }}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-4 cursor-grab active:cursor-grabbing w-max"
          >
            {cards.map((card, i) => (
              <CarouselCard key={i} card={card} index={i} x={x} currentIndex={cardIndex} onStart={handleHskCardStart} onPrefetch={(prefetchCard) => prefetchTaskRoute(prefetchCard.link)} />
            ))}
          </motion.div>

          {/* Navigation Dots */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2">
            {cards.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === cardIndex ? 'w-6 bg-blue-600 dark:bg-blue-400' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {cards.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleHskCardStart(card)}
              onPointerEnter={() => prefetchTaskRoute(card.link)}
              onFocus={() => prefetchTaskRoute(card.link)}
              className="group block w-full text-left"
            >
              <div className={`relative w-full rounded-[1.5rem] bg-white dark:bg-gray-800/50 p-5 flex items-center justify-between gap-4 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 active:scale-[0.99] hover:shadow-lg hover:shadow-black/5 transition-all transform-gpu will-change-transform ${card.surfaceClass}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 rounded-2xl p-3 ${card.iconClass}`}>
                    {card.icon}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">Mode</span>
                    <h2 className="text-gray-950 dark:text-white text-xl font-black">{card.title}</h2>
                    <p className="text-gray-500 dark:text-gray-300 text-sm font-medium leading-relaxed break-keep">
                      {card.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-gray-300 dark:text-gray-600 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}
      <ResumePromptDialog prompt={pendingResumePrompt} isClient={isClient} onClose={() => setPendingResumePrompt(null)} />
    </div>
  );
}
