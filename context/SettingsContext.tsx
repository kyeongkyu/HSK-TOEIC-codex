'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  selectedLevel: number | 'all';
  setLevel: (level: number | 'all') => void;
  isDarkMode: boolean;
  themeMode: 'light' | 'dark' | 'black';
  setThemeMode: (mode: 'light' | 'dark' | 'black') => void;
  isCarouselView: boolean;
  toggleCarouselView: () => void;
  ttsSpeed: number;
  setTtsSpeed: (speed: number) => void;
  hanziWriterMode: boolean;
  toggleHanziWriterMode: () => void;
  separateLibraryByLevel: boolean;
  toggleSeparateLibraryByLevel: () => void;
  hanziFont: string;
  setHanziFont: (font: string) => void;
  hanziSize: number;
  setHanziSize: (size: number) => void;
  isLoaded: boolean;
  appMode: 'hsk' | 'toeic' | 'entry' | null;
  setAppMode: (mode: 'hsk' | 'toeic' | 'entry') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>(1);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'black'>('light');
  const [isCarouselView, setIsCarouselView] = useState(true);
  const [hanziWriterMode, setHanziWriterMode] = useState(false);
  const [separateLibraryByLevel, setSeparateLibraryByLevel] = useState(false);
  const [hanziFont, setHanziFontState] = useState('Noto Serif SC');
  const [hanziSize, setHanziSizeState] = useState(3);
  const [ttsSpeed, setTtsSpeedState] = useState(3); // Default level 3 (1.0x)
  const [isLoaded, setIsLoaded] = useState(false);
  const [appMode, setAppModeState] = useState<'hsk' | 'toeic' | 'entry' | null>(null);

  useEffect(() => {
    const storedAppMode = localStorage.getItem('appMode');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppModeState(storedAppMode === 'hsk' ? 'hsk' : storedAppMode === 'toeic' ? 'toeic' : 'entry');

    const storedLevel = localStorage.getItem('hsk_level');
    if (storedLevel) {
      setSelectedLevel(storedLevel === 'all' ? 'all' : parseInt(storedLevel, 10));
    }
    
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
    
    const storedCarouselView = localStorage.getItem('hsk_carousel_view');
    setIsCarouselView(storedCarouselView === null ? true : storedCarouselView === 'true');
    
    const storedHanziWriterMode = localStorage.getItem('hsk_hanzi_writer_mode');
    setHanziWriterMode(storedHanziWriterMode === 'true');

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
    
    const storedTtsSpeed = localStorage.getItem('hsk_tts_speed');
    if (storedTtsSpeed) {
      setTtsSpeedState(parseInt(storedTtsSpeed, 10));
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

  const setAppMode = (mode: 'hsk' | 'toeic' | 'entry') => {
    setAppModeState(mode);
    if (mode === 'entry') {
      localStorage.removeItem('appMode');
    } else {
      localStorage.setItem('appMode', mode);
    }
  };

  const setTtsSpeed = (speed: number) => {
    setTtsSpeedState(speed);
    localStorage.setItem('hsk_tts_speed', String(speed));
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

  const toggleSeparateLibraryByLevel = () => {
    const newValue = !separateLibraryByLevel;
    setSeparateLibraryByLevel(newValue);
    localStorage.setItem('hsk_separate_library_by_level', String(newValue));
  };

  return (
    <SettingsContext.Provider value={{ 
      selectedLevel, 
      setLevel, 
      isDarkMode: themeMode !== 'light',
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
