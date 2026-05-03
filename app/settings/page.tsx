'use client';
import { useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Trash2, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { motion } from 'motion/react';

type ResetScope = 'hsk' | 'toeic';
type StoredUserWords = Record<string, unknown>;

const USER_WORDS_KEY = 'hsk_user_words';
const HSK_WORD_ID_PATTERN = /^\d+$/;

function isUserWordInScope(id: string, scope: ResetScope) {
  const isHskWord = HSK_WORD_ID_PATTERN.test(id);
  return scope === 'hsk' ? isHskWord : !isHskWord;
}

export default function SettingsPage() {
  const { 
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
  const [isHanziFontMenuOpen, setIsHanziFontMenuOpen] = useState(false);

  if (!isLoaded) return <div className="min-h-[50vh] p-8 text-center text-gray-500 flex items-center justify-center">Loading...</div>;

  const resetUserWordsForScope = (scope: ResetScope) => {
    const rawUserWords = localStorage.getItem(USER_WORDS_KEY);
    if (!rawUserWords) return;

    try {
      const userWords = JSON.parse(rawUserWords) as StoredUserWords;
      const preservedUserWords = Object.fromEntries(
        Object.entries(userWords).filter(([id]) => !isUserWordInScope(id, scope))
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
            'hsk_grammar_progress',
            'hsk_sentence_study_bookmarks',
            'sentence_completion_progress'
          ]
        : ['toeic_part5_stats', 'toeic_lc_part2_progress', 'toeic_tts_speed'];

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

  const ttsSpeedLabels = ['\uC544\uC8FC \uB290\uB9BC', '\uB290\uB9BC', '\uBCF4\uD1B5', '\uBE60\uB984', '\uC544\uC8FC \uBE60\uB984'];

  const hanziFonts = [
    { name: 'Noto Serif SC', label: 'Noto Serif SC', desc: '\uBA85\uC870\uCCB4 (\uAE30\uBCF8)' },
    { name: 'Noto Sans SC', label: 'Noto Sans SC', desc: '\uACE0\uB515\uCCB4' },
    { name: 'Ma Shan Zheng', label: 'Ma Shan Zheng', desc: '\uBD93\uAE00\uC528\uCCB4' },
    { name: 'Source Han Sans', label: 'Source Han Sans', desc: '\uACE0\uB515\uCCB4 (Source)' },
    { name: 'PingFang SC', label: 'PingFang SC', desc: '\uC560\uD50C \uACE0\uB515\uCCB4' },
  ];

  const currentHanziFont = hanziFonts.find(font => font.name === hanziFont) ?? hanziFonts[0];
  const hanziSizeLabels = ['\uC791\uAC8C', '\uC911\uAC04', '\uD06C\uAC8C (\uAE30\uBCF8)'];

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

  const renderTtsSpeedSection = () => (
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
            Adjust the pronunciation speed for the current mode.
          </p>
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
      <div className="px-4 flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
        <div className="pt-10 mb-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Preferences</span>
            <h1 className="text-4xl font-black text-black dark:text-white">Settings</h1>
          </div>
        </div>
        <div className="space-y-10">
          {renderThemeMode()}
          {renderTtsSpeedSection()}
          {renderResetSection('toeic')}
        </div>
        {renderResetModal()}
      </div>
    );
  }

  return (
    <div className="px-4 flex flex-col flex-1 bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      <div className="pt-10 mb-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Preferences</span>
        <h1 className="text-4xl font-black text-black dark:text-white">Settings</h1>
      </div>

      <div className="space-y-10">
        {renderThemeMode()}

        {renderTtsSpeedSection()}
        
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
                className={`relative inline-flex h-8 w-14 shrink-0 overflow-hidden rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 active:scale-95 transform-gpu ${isCarouselView ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${isCarouselView ? 'translate-x-6' : 'translate-x-0'}`}
                />
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
                className={`relative inline-flex h-8 w-14 shrink-0 overflow-hidden rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 active:scale-95 transform-gpu ${hanziWriterMode ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${hanziWriterMode ? 'translate-x-6' : 'translate-x-0'}`}
                />
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
                className={`relative inline-flex h-8 w-14 shrink-0 overflow-hidden rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 active:scale-95 transform-gpu ${separateLibraryByLevel ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${separateLibraryByLevel ? 'translate-x-6' : 'translate-x-0'}`}
                />
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
            <button
              type="button"
              onClick={() => setIsHanziFontMenuOpen(open => !open)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-300 ease-out hover:shadow-md active:scale-[0.99] dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                  style={{ fontFamily: `"${currentHanziFont.name}", sans-serif` }}
                >
                  {'\u6C49'}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-lg font-black text-black dark:text-white" style={{ fontFamily: `"${currentHanziFont.name}", sans-serif` }}>
                    {currentHanziFont.label}
                  </span>
                  <span className="mt-1 block text-xs font-bold text-gray-500 dark:text-gray-400">
                    {currentHanziFont.desc}
                  </span>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`shrink-0 text-gray-400 transition-transform duration-300 ease-out ${isHanziFontMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity,transform,margin] duration-300 ease-out ${
                isHanziFontMenuOpen
                  ? 'mt-3 grid-rows-[1fr] translate-y-0 opacity-100'
                  : 'mt-0 grid-rows-[0fr] -translate-y-2 opacity-0 pointer-events-none'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="flex origin-top flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-black/5 transition-transform duration-300 ease-out dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/20">
                {hanziFonts.map((font) => (
                <button
                  key={font.name}
                  type="button"
                  onClick={() => {
                    setHanziFont(font.name);
                    setIsHanziFontMenuOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-all active:scale-[0.99] transform-gpu ${
                    hanziFont === font.name
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 dark:bg-blue-500'
                      : 'text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-black ${
                        hanziFont === font.name
                          ? 'bg-white/15 text-white'
                          : 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-300'
                      }`}
                      style={{ fontFamily: `"${font.name}", sans-serif` }}
                    >
                      {'\u6C49'}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black" style={{ fontFamily: `"${font.name}", sans-serif` }}>
                        {font.label}
                      </span>
                      <span className={`mt-0.5 block text-xs font-bold ${hanziFont === font.name ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {font.desc}
                      </span>
                    </span>
                  </span>
                  {hanziFont === font.name && <Check size={18} className="shrink-0" />}
                </button>
                ))}
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center italic mt-4">
              Choose your preferred font for Chinese characters.
            </p>
          </div>
        </section>

        {renderResetSection('hsk')}
      </div>

      {renderResetModal()}
    </div>
  );
}
