'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  selectedLevel: number | 'all';
  setLevel: (level: number | 'all') => void;
  selectedJlptLevel: 'N5';
  setJlptLevel: (level: 'N5') => void;
  isDarkMode: boolean;
  themeMode: 'light' | 'dark' | 'black';
  setThemeMode: (mode: 'light' | 'dark' | 'black') => void;
  isCarouselView: boolean;
  toggleCarouselView: () => void;
  ttsSpeed: number;
  setTtsSpeed: (speed: number) => void;
  hskTtsSpeed: number;
  toeicTtsSpeed: number;
  setHskTtsSpeed: (speed: number) => void;
  setToeicTtsSpeed: (speed: number) => void;
  hanziWriterMode: boolean;
  toggleHanziWriterMode: () => void;
  jlptKanaWriterMode: boolean;
  toggleJlptKanaWriterMode: () => void;
  separateLibraryByLevel: boolean;
  toggleSeparateLibraryByLevel: () => void;
  hanziFont: string;
  setHanziFont: (font: string) => void;
  hanziSize: number;
  setHanziSize: (size: number) => void;
  isLoaded: boolean;
  appMode: 'hsk' | 'toeic' | 'jlpt' | 'entry' | null;
  setAppMode: (mode: 'hsk' | 'toeic' | 'jlpt' | 'entry') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>(1);
  const [selectedJlptLevel, setSelectedJlptLevel] = useState<'N5'>('N5');
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'black'>('light');
  const [isCarouselView, setIsCarouselView] = useState(false);
  const [hanziWriterMode, setHanziWriterMode] = useState(false);
  const [jlptKanaWriterMode, setJlptKanaWriterMode] = useState(false);
  const [separateLibraryByLevel, setSeparateLibraryByLevel] = useState(false);
  const [hanziFont, setHanziFontState] = useState('Noto Serif SC');
  const [hanziSize, setHanziSizeState] = useState(3);
  const [hskTtsSpeed, setHskTtsSpeedState] = useState(3);
  const [toeicTtsSpeed, setToeicTtsSpeedState] = useState(3);
  const [isLoaded, setIsLoaded] = useState(false);
  const [appMode, setAppModeState] = useState<'hsk' | 'toeic' | 'jlpt' | 'entry' | null>(null);

  useEffect(() => {
    const storedAppMode = localStorage.getItem('appMode');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppModeState(storedAppMode === 'hsk' ? 'hsk' : storedAppMode === 'toeic' ? 'toeic' : storedAppMode === 'jlpt' ? 'jlpt' : 'entry');

    const storedLevel = localStorage.getItem('hsk_level');
    if (storedLevel) {
      setSelectedLevel(storedLevel === 'all' ? 'all' : parseInt(storedLevel, 10));
    }

    localStorage.setItem('jlpt_level', 'N5');
    setSelectedJlptLevel('N5');
    
    // Fallback for old isDarkMode and new themeMode
    const storedTheme = localStorage.getItem('hsk_theme_mode');
    let initialTheme: 'light' | 'dark' | 'black' = 'light';
    
    if (storedTheme === 'dark' || storedTheme === 'black' || storedTheme === 'light') {
      initialTheme = storedTheme;
    } else {
      const storedDarkMode = localStorage.getItem('hsk_dark_mode');
      if (storedDarkMode === 'true') initialTheme = 'dark';
    }
    
    setThemeModeState(initialTheme);
    
    localStorage.setItem('hsk_carousel_view', 'false');
    setIsCarouselView(false);
    
    const storedHanziWriterMode = localStorage.getItem('hsk_hanzi_writer_mode');
    setHanziWriterMode(storedHanziWriterMode === 'true');

    const storedJlptKanaWriterMode = localStorage.getItem('jlpt_kana_writer_mode');
    setJlptKanaWriterMode(storedJlptKanaWriterMode === 'true');

    const storedSeparateLibraryByLevel = localStorage.getItem('hsk_separate_library_by_level');
    setSeparateLibraryByLevel(storedSeparateLibraryByLevel === 'true');
    
    const storedHanziFont = localStorage.getItem('hsk_hanzi_font');
    if (storedHanziFont) {
      setHanziFontState(storedHanziFont);
    }

    const storedHanziSize = localStorage.getItem('hsk_hanzi_size');
    if (storedHanziSize) {
      setHanziSizeState(parseInt(storedHanziSize, 10));
    }
    
    const storedHskTtsSpeed = localStorage.getItem('hsk_tts_speed');
    if (storedHskTtsSpeed) {
      setHskTtsSpeedState(parseInt(storedHskTtsSpeed, 10));
    }

    const storedToeicTtsSpeed = localStorage.getItem('toeic_tts_speed');
    if (storedToeicTtsSpeed) {
      setToeicTtsSpeedState(parseInt(storedToeicTtsSpeed, 10));
    }
    
    if (initialTheme !== 'light') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (initialTheme === 'black') {
      document.documentElement.classList.add('theme-black');
    } else {
      document.documentElement.classList.remove('theme-black');
    }
    
    setIsLoaded(true);
  }, []);

  const setLevel = (level: number | 'all') => {
    setSelectedLevel(level);
    localStorage.setItem('hsk_level', String(level));
  };

  const setJlptLevel = (level: 'N5') => {
    setSelectedJlptLevel(level);
    localStorage.setItem('jlpt_level', level);
  };

  const setAppMode = (mode: 'hsk' | 'toeic' | 'jlpt' | 'entry') => {
    setAppModeState(mode);
    if (mode === 'entry') {
      localStorage.removeItem('appMode');
    } else {
      localStorage.setItem('appMode', mode);
    }
  };

  const setTtsSpeed = (speed: number) => {
    if (appMode === 'toeic') {
      setToeicTtsSpeed(speed);
    } else {
      setHskTtsSpeed(speed);
    }
  };

  const setHskTtsSpeed = (speed: number) => {
    setHskTtsSpeedState(speed);
    localStorage.setItem('hsk_tts_speed', String(speed));
  };

  const setToeicTtsSpeed = (speed: number) => {
    setToeicTtsSpeedState(speed);
    localStorage.setItem('toeic_tts_speed', String(speed));
  };

  const setHanziFont = (font: string) => {
    setHanziFontState(font);
    localStorage.setItem('hsk_hanzi_font', font);
  };

  const setHanziSize = (size: number) => {
    setHanziSizeState(size);
    localStorage.setItem('hsk_hanzi_size', String(size));
  };

  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    if (themeMode !== 'light') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    if (themeMode === 'black') {
      root.classList.add('theme-black');
    } else {
      root.classList.remove('theme-black');
    }
  }, [themeMode, isLoaded]);

  const setThemeMode = (mode: 'light' | 'dark' | 'black') => {
    setThemeModeState(mode);
    localStorage.setItem('hsk_theme_mode', mode);
  };

  const toggleCarouselView = () => {
    const newValue = !isCarouselView;
    setIsCarouselView(newValue);
    localStorage.setItem('hsk_carousel_view', String(newValue));
  };

  const toggleHanziWriterMode = () => {
    const newValue = !hanziWriterMode;
    setHanziWriterMode(newValue);
    localStorage.setItem('hsk_hanzi_writer_mode', String(newValue));
  };

  const toggleJlptKanaWriterMode = () => {
    const newValue = !jlptKanaWriterMode;
    setJlptKanaWriterMode(newValue);
    localStorage.setItem('jlpt_kana_writer_mode', String(newValue));
  };

  const toggleSeparateLibraryByLevel = () => {
    const newValue = !separateLibraryByLevel;
    setSeparateLibraryByLevel(newValue);
    localStorage.setItem('hsk_separate_library_by_level', String(newValue));
  };

  return (
    <SettingsContext.Provider value={{ 
      selectedLevel, 
      setLevel, 
      selectedJlptLevel,
      setJlptLevel,
      isDarkMode: themeMode !== 'light',
      themeMode,
      setThemeMode,
      isCarouselView,
      toggleCarouselView,
      ttsSpeed: appMode === 'toeic' ? toeicTtsSpeed : hskTtsSpeed, 
      setTtsSpeed, 
      hskTtsSpeed,
      toeicTtsSpeed,
      setHskTtsSpeed,
      setToeicTtsSpeed,
      hanziWriterMode, 
      toggleHanziWriterMode, 
      jlptKanaWriterMode,
      toggleJlptKanaWriterMode,
      separateLibraryByLevel,
      toggleSeparateLibraryByLevel,
      hanziFont,
      setHanziFont,
      hanziSize,
      setHanziSize,
      isLoaded,
      appMode,
      setAppMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
