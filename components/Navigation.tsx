'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function Navigation() {
  const pathname = usePathname();
  const { appMode } = useSettings();
  const [rootView, setRootView] = React.useState('home');

  React.useEffect(() => {
    const handleRootView = (event: Event) => {
      const nextView = (event as CustomEvent<string>).detail;
      setRootView(nextView || 'home');
    };

    window.addEventListener('app-root-view-change', handleRootView);
    return () => window.removeEventListener('app-root-view-change', handleRootView);
  }, []);

  React.useEffect(() => {
    if (pathname !== '/') setRootView('home');
  }, [pathname]);

  // Show navigation only on Home, Library, and Settings pages.
  const isHomeScreen = pathname === '/' && (appMode !== 'toeic' || rootView === 'home');
  const isNavigablePage = isHomeScreen || pathname === '/settings' || pathname === '/library';
  const showNav = (appMode === 'hsk' || appMode === 'toeic') && isNavigablePage;
  
  // Calculate active states before early return to satisfy TypeScript
  const isHome = pathname === '/';
  const isLibrary = pathname === '/library';
  const isSettings = pathname === '/settings';
  const navLinkClass = 'flex flex-col items-center justify-center px-4 py-1 cursor-pointer transition-all duration-200 active:scale-95 transform-gpu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800';

  if (!showNav) return null;

  return (
    <nav 
      className="fixed left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/70 dark:border-gray-700/70 shadow-lg rounded-3xl flex justify-around py-1.5 z-[9999] pointer-events-auto transition-colors duration-200"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      {appMode === 'hsk' && (
        <>
          <Link href="/" className={`${navLinkClass} hover:text-blue-600 dark:hover:text-blue-400 ${isHome ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <Home size={20} />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </Link>
          <Link href="/library" className={`${navLinkClass} hover:text-yellow-500 dark:hover:text-yellow-400 ${isLibrary ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[10px] mt-0.5 font-medium">Library</span>
          </Link>
          <Link href="/settings" className={`${navLinkClass} hover:text-black dark:hover:text-white ${isSettings ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="text-[10px] mt-0.5 font-medium">Settings</span>
          </Link>
        </>
      )}
      {appMode === 'toeic' && (
        <>
          <Link href="/" className={`${navLinkClass} hover:text-blue-600 dark:hover:text-blue-400 ${isHome ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <BookOpen size={20} />
            <span className="text-[10px] mt-0.5 font-medium">Vocab</span>
          </Link>
          <Link href="/library" className={`${navLinkClass} hover:text-yellow-500 dark:hover:text-yellow-400 ${isLibrary ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[10px] mt-0.5 font-medium">Library</span>
          </Link>
          <Link href="/settings" className={`${navLinkClass} hover:text-black dark:hover:text-white ${isSettings ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="text-[10px] mt-0.5 font-medium">Settings</span>
          </Link>
        </>
      )}
    </nav>
  );
}
