'use client';
import { useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { hskWords } from '@/data/hsk';
import { toeicWords } from '@/data/toeic';
import { Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

type ResetScope = 'hsk' | 'toeic';
type StoredUserWords = Record<string, unknown>;

const USER_WORDS_KEY = 'hsk_user_words';
const HSK_WORD_IDS = new Set<string>(hskWords.map((word) => word.id));
const TOEIC_WORD_IDS = new Set<string>(toeicWords.map((word) => word.id));

export default function SettingsPage() {
  const { 
    selectedLevel, 
    setLevel, 
    themeMode,
    setThemeMode,
    isCarouselView,
    toggleCarouselView,
    ttsSpeed, 
    setTtsSpeed, 
    hanziWriterMode, 
    toggleHanziWriterMode, 
    separateLibraryByLevel,
    toggleSeparateLibraryByLevel,
    hanziFont,
    setHanziFont,
    hanziSize,
    setHanziSize,
    isLoaded,
    appMode
  } = useSettings();
  const [resetScope, setResetScope] = useState<ResetScope | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!isLoaded) return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;

  const resetUserWordsForScope = (scope: ResetScope) => {
    const rawUserWords = localStorage.getItem(USER_WORDS_KEY);
    if (!rawUserWords) return;

    try {
      const userWords = JSON.parse(rawUserWords) as StoredUserWords;
      const resetIds = scope === 'hsk' ? HSK_WORD_IDS : TOEIC_WORD_IDS;
      const preservedUserWords = Object.fromEntries(
        Object.entries(userWords).filter(([id]) => !resetIds.has(id))
      );

      if (Object.keys(preservedUserWords).length > 0) {
        localStorage.setItem(USER_WORDS_KEY, JSON.stringify(preservedUserWords));
      } else {
        localStorage.removeItem(USER_WORDS_KEY);
      }
    } catch {
      return;
    }
  };

  const handleResetProgress = () => {
    if (!resetScope) return;

    setIsResetting(true);
    resetUserWordsForScope(resetScope);

    const keysToRemove =
      resetScope === 'hsk'
        ? [
            'hsk_level',
            'hsk_hanzi_writer_mode',
            'hsk_hanzi_font',
            'hsk_hanzi_size',
            'hsk_separate_library_by_level',
            'sentence_completion_progress'
          ]
        : ['toeic_part5_stats', 'toeic_lc_part2_progress'];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (resetScope === 'hsk') {
      const dynamicKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sentence-completion-progress-') || key.startsWith('quiz-progress-') || key === 'library-quiz-progress')) {
          dynamicKeys.push(key);
        }
      }
      dynamicKeys.forEach(key => localStorage.removeItem(key));
    }

    setResetScope(null);

    // Hard redirect to home page to ensure all contexts are reset
    window.location.href = '/';
  };

  const ttsSpeedLabels = ['아주 느림', '느림', '보통', '빠름', '아주 빠름'];

  const hanziFonts = [
    { name: 'Noto Serif SC', label: 'Noto Serif SC', desc: '명조체 (기본)' },
    { name: 'Noto Sans SC', label: 'Noto Sans SC', desc: '고딕체' },
    { name: 'Ma Shan Zheng', label: 'Ma Shan Zheng', desc: '붓글씨체' },
    { name: 'Source Han Sans', label: 'Source Han Sans', desc: '고딕체 (Source)' },
    { name: 'PingFang SC', label: 'PingFang SC', desc: '애플 고딕체' },
  ];

  const hanziSizeLabels = ['작게', '중간', '크게 (기본)'];

  const renderThemeMode = () => (
    <section>
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Appearance</h2>
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-black dark:text-white">Theme Mode</span>
          </div>
          <div className="flex gap-1 sm:gap-2 bg-gray-200 dark:bg-gray-700 p-1.5 rounded-full">
            {(['light', 'dark', 'black'] as const).map((mode, index) => {
              const labels = ['Light', 'Medium', 'Dark'];
              return (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  className={`flex-1 py-2 sm:py-3 rounded-full text-[10px] sm:text-xs md:text-sm font-bold transition-all active:scale-[0.98] transform-gpu ${
                    themeMode === mode
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {labels[index]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

  const renderResetSection = (scope: ResetScope) => {
    const isHskReset = scope === 'hsk';

    return (
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Data Management</h2>
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-4">
          <button 
            onClick={() => setResetScope(scope)}
            className="w-full flex items-center justify-center gap-2 bg-black dark:bg-gray-800 text-white py-5 rounded-2xl font-bold active:scale-95 transition-all shadow-lg transform-gpu"
          >
            <Trash2 size={20} />
            <span>{isHskReset ? 'Reset HSK Progress' : 'Reset TOEIC Progress'}</span>
          </button>
        </div>
      </section>
    );
  };

  const renderResetModal = () => {
    if (!resetScope) return null;

    const isHskReset = resetScope === 'hsk';

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-6">
            <AlertTriangle size={32} />
            <h3 className="text-xl font-bold">{isHskReset ? 'Reset HSK Progress?' : 'Reset TOEIC Progress?'}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-10 leading-relaxed font-medium">
            {isHskReset
              ? 'This will permanently delete your HSK vocabulary progress, HSK favorites, and HSK practice stats. TOEIC progress will not be affected.'
              : 'This will permanently delete your TOEIC vocabulary progress, TOEIC favorites, and Part 5 stats. HSK progress will not be affected.'}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleResetProgress}
              disabled={isResetting}
              className={`flex items-center justify-center bg-red-600 dark:bg-red-500 text-white w-full py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20 transform-gpu ${isResetting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span>{isResetting ? 'Resetting...' : isHskReset ? 'Yes, Reset HSK' : 'Yes, Reset TOEIC'}</span>
            </button>
            <button 
              onClick={() => !isResetting && setResetScope(null)}
              disabled={isResetting}
              className={`text-sm font-bold pt-2 transition-colors ${isResetting ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  if (appMode === 'toeic') {
    return (
      <div className="px-6 flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
        <div className="pt-12 mb-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Preferences</span>
            <h1 className="text-4xl font-black text-black dark:text-white">Settings</h1>
          </div>
        </div>
        <div className="space-y-10">
          {renderThemeMode()}
          {renderResetSection('toeic')}
        </div>
        {renderResetModal()}
      </div>
    );
  }

  return (
    <div className="px-6 flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      <div className="pt-12 mb-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Preferences</span>
        <h1 className="text-4xl font-black text-black dark:text-white">Settings</h1>
      </div>

      <div className="space-y-10">
        {renderThemeMode()}
        
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Display</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-black dark:text-white mb-1">Carousel View</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Show home modes as swipeable cards</span>
              </div>
              <button 
                onClick={toggleCarouselView}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 active:scale-95 transform-gpu ${isCarouselView ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isCarouselView ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-black dark:text-white mb-1">Hanzi Writer Mode</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Show stroke animations for Chinese characters</span>
              </div>
              <button 
                onClick={toggleHanziWriterMode}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 active:scale-95 transform-gpu ${hanziWriterMode ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${hanziWriterMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Library</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-black dark:text-white mb-1">Separate by Level</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Only show library words for the selected HSK level</span>
              </div>
              <button 
                onClick={toggleSeparateLibraryByLevel}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 active:scale-95 transform-gpu ${separateLibraryByLevel ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${separateLibraryByLevel ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Hanzi Size</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-6">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black dark:text-white">Word Hanzi Size</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 italic">{hanziSizeLabels[hanziSize - 1]}</span>
              </div>
              <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1.5 rounded-full">
                {[1, 2, 3].map((size) => (
                  <button
                    key={size}
                    onClick={() => setHanziSize(size)}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all active:scale-[0.98] transform-gpu ${
                      hanziSize === size
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md'
                        : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center italic">
                Adjust the size of word Chinese characters in Browse and Memorize modes.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Hanzi Font</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-4">
            <div className="flex flex-col gap-2">
              {hanziFonts.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setHanziFont(font.name)}
                  className={`flex flex-col items-start p-4 rounded-2xl transition-all active:scale-[0.99] transform-gpu ${
                    hanziFont === font.name
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="font-bold text-lg" style={{ fontFamily: `"${font.name}", sans-serif` }}>
                    {font.label}
                  </span>
                  <span className={`text-xs mt-1 ${hanziFont === font.name ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {font.desc}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center italic mt-4">
              Choose your preferred font for Chinese characters.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Audio Speed</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-6">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black dark:text-white">TTS Speed</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 italic">{ttsSpeedLabels[ttsSpeed - 1]}</span>
              </div>
              <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1.5 rounded-full">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setTtsSpeed(level)}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all active:scale-[0.98] transform-gpu ${
                      ttsSpeed === level
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md'
                        : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center italic">
                Adjust the pronunciation speed for words and sentences.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">HSK Level</h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4].map(level => (
                <button
                  key={level}
                  onClick={() => setLevel(level)}
                  className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] transform-gpu ${
                    selectedLevel === level 
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Level {level}
                </button>
              ))}
              <button
                onClick={() => setLevel('all')}
                className={`col-span-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] transform-gpu ${
                  selectedLevel === 'all' 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All Levels
              </button>
            </div>
          </div>
        </section>

        {renderResetSection('hsk')}
      </div>

      {renderResetModal()}
    </div>
  );
}
