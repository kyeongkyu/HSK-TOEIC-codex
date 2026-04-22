'use client';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { useSettings } from '@/context/SettingsContext';

const ROUTES = ['/', '/study', '/library', '/settings'] as const;
const pageTransitionVariants = {
  initial: (direction: number) => ({ opacity: 0, x: direction * 10 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -10 }),
};

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appMode } = useSettings();
  const [rootView, setRootView] = React.useState('home');
  const currentIndex = ROUTES.indexOf(pathname as typeof ROUTES[number]);
  const previousIndexRef = React.useRef(currentIndex);
  // eslint-disable-next-line react-hooks/refs -- Used only to derive the direction for the current route transition.
  const previousIndex = previousIndexRef.current;
  const transitionDirection = currentIndex !== -1 && previousIndex !== -1 && currentIndex !== previousIndex
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
    previousIndexRef.current = currentIndex;
  }, [currentIndex]);

  React.useEffect(() => {
    if (appMode !== 'hsk') return;
    ROUTES.forEach(route => router.prefetch(route));
  }, [appMode, router]);

  const isHomeScreen = pathname === '/' && (appMode !== 'toeic' || rootView === 'home');
  const showNav = (appMode === 'hsk' || appMode === 'toeic') && (isHomeScreen || pathname === '/settings' || pathname === '/library');

  const handlePanEnd = (_: any, info: any) => {
    // Only handle swipes if we are in HSK mode AND on one of the main routes
    if (appMode !== 'hsk' || currentIndex === -1) return;

    const threshold = 50; 
    const velocityThreshold = 200;
    
    const { offset, velocity } = info;

    // Reject vertical-ish pans
    if (Math.abs(offset.y) > Math.abs(offset.x) * 1.5) return;

    if (offset.x < -threshold || velocity.x < -velocityThreshold) {
      // Swipe Left -> Move to Next Page
      if (currentIndex < ROUTES.length - 1) {
        React.startTransition(() => router.push(ROUTES[currentIndex + 1]));
      }
    } else if (offset.x > threshold || velocity.x > velocityThreshold) {
      // Swipe Right -> Move to Previous Page
      if (currentIndex > 0) {
        React.startTransition(() => router.push(ROUTES[currentIndex - 1]));
      }
    }
  };

  return (
    <motion.div
      onPanEnd={handlePanEnd}
      style={{ touchAction: 'pan-y' }}
      className="max-w-md mx-auto min-h-screen flex flex-col overflow-x-hidden transform-gpu"
    >
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity' }}
            className="flex-1 flex flex-col transform-gpu"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
