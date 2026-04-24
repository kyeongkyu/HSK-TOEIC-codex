'use client';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { useSettings } from '@/context/SettingsContext';

const HSK_PREFETCH_ROUTES = ['/', '/study', '/hsk-listening', '/sentence-study', '/library', '/settings', '/quiz', '/memorize', '/grammar'] as const;
const TOEIC_PREFETCH_ROUTES = ['/', '/library', '/settings', '/toeic-part2', '/toeic-part5'] as const;
const pageTransitionVariants = {
  initial: (direction: number) => ({ opacity: 0, x: direction * 24, scale: 0.992 }),
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -18, scale: 0.996 }),
};

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appMode } = useSettings();
  const [rootView, setRootView] = React.useState('home');
  const previousIndexRef = React.useRef(-1);
  // eslint-disable-next-line react-hooks/refs -- Used only to derive the direction for the current route transition.
  const previousIndex = previousIndexRef.current;
  const routeOrder = React.useMemo(
    () => ['/', '/library', '/settings'],
    [],
  );
  const currentIndex = routeOrder.indexOf(pathname);
  const transitionDirection =
    currentIndex !== -1 && previousIndex !== -1 && currentIndex !== previousIndex
      ? currentIndex > previousIndex ? 1 : -1
      : 1;

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
    if (currentIndex !== -1) {
      previousIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  React.useEffect(() => {
    const routes = appMode === 'hsk'
      ? HSK_PREFETCH_ROUTES
      : appMode === 'toeic'
        ? TOEIC_PREFETCH_ROUTES
        : [];
    if (routes.length === 0) return;

    const prefetchRoutes = () => {
      routes.forEach(route => router.prefetch(route));
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
    <div className="max-w-md mx-auto min-h-screen flex flex-col overflow-x-hidden transform-gpu">
      <main className={`flex-1 pt-4 sm:pt-[44px] flex flex-col transition-all duration-200 ${showNav ? 'pb-[114px]' : 'pb-6'}`}>
        <AnimatePresence mode="popLayout" initial={false} custom={transitionDirection}>
          <motion.div
            layoutRoot
            key={pathname}
            custom={transitionDirection}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 36,
              mass: 0.9,
            }}
            style={{ willChange: 'transform, opacity' }}
            className="flex-1 flex flex-col transform-gpu"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
