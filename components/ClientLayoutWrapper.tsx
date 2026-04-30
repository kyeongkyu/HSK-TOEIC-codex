'use client';

import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useNavigationLatencyReporter } from '@/lib/navigation-performance';

const HSK_PREFETCH_ROUTES = ['/', '/study', '/hsk-listening', '/sentence-study', '/library', '/settings', '/quiz', '/memorize', '/grammar'] as const;
const TOEIC_PREFETCH_ROUTES = ['/', '/library', '/settings', '/toeic-part2', '/toeic-part5'] as const;

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appMode } = useSettings();
  const [rootView, setRootView] = React.useState('home');

  useNavigationLatencyReporter(pathname);

  React.useEffect(() => {
    const handleRootView = (event: Event) => {
      setRootView((event as CustomEvent<string>).detail || 'home');
    };

    window.addEventListener('app-root-view-change', handleRootView);
    return () => window.removeEventListener('app-root-view-change', handleRootView);
  }, []);

  React.useEffect(() => {
    if (pathname !== '/') setRootView('home');
  }, [pathname]);

  React.useEffect(() => {
    const routes = appMode === 'hsk'
      ? HSK_PREFETCH_ROUTES
      : appMode === 'toeic'
        ? TOEIC_PREFETCH_ROUTES
        : [];
    if (routes.length === 0) return;

    const prefetchRoutes = () => {
      routes.forEach(route => router.prefetch(route));
      navigator.serviceWorker?.controller?.postMessage({ type: 'WARM_OFFLINE_ROUTES' });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchRoutes, 300);
    return () => globalThis.clearTimeout(timeoutId);
  }, [appMode, router]);

  const isHomeScreen = pathname === '/' && (appMode !== 'toeic' || rootView === 'home');
  const showNav = (appMode === 'hsk' || appMode === 'toeic') && (isHomeScreen || pathname === '/settings' || pathname === '/library');

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col overflow-x-hidden">
      <main className={`flex-1 pt-4 sm:pt-[44px] flex flex-col transition-all duration-200 ${showNav ? 'pb-[114px]' : 'pb-6'}`}>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
