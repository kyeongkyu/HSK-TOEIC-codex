'use client';

import { useEffect } from 'react';

const NAVIGATION_MARK_PREFIX = 'hsk-nav-start:';

function isNavigationDebugEnabled() {
  if (process.env.NODE_ENV !== 'development') return false;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('hsk_perf_debug') === '1';
}

export function markNavigationStart(target: string) {
  if (typeof performance === 'undefined') return;
  const markName = `${NAVIGATION_MARK_PREFIX}${target}`;
  performance.mark(markName);
}

export function useNavigationLatencyReporter(pathname: string) {
  useEffect(() => {
    if (!isNavigationDebugEnabled() || typeof performance === 'undefined') return;

    const markName = `${NAVIGATION_MARK_PREFIX}${pathname}`;
    const marks = performance.getEntriesByName(markName, 'mark');
    const latestMark = marks.at(-1);
    if (!latestMark) return;

    const duration = Math.round(performance.now() - latestMark.startTime);
    console.info(`[navigation] ${pathname} rendered in ${duration}ms`);
    performance.clearMarks(markName);
  }, [pathname]);
}
