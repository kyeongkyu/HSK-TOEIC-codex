'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { markNavigationStart } from '@/lib/navigation-performance';
import {
  getResumeTaskMeta,
  markResumeTaskFreshStart,
  type ResumeTaskKey,
  type ResumeTaskMeta,
} from '@/lib/resume-task';
import type { PendingResumePrompt } from './ResumePromptDialog';

type HomeResumePromptOptions = {
  selectedLevel: number | 'all';
  selectedJlptLevel: string;
};

export function useHomeResumePrompt({ selectedLevel, selectedJlptLevel }: HomeResumePromptOptions) {
  const router = useRouter();
  const [pendingResumePrompt, setPendingResumePrompt] = useState<PendingResumePrompt | null>(null);

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
    if (
      !meta
      || (meta.appMode === 'hsk' && meta.levelScope !== selectedLevel)
      || (meta.appMode === 'jlpt' && meta.taskKey === 'jlpt-vocab' && meta.levelScope !== selectedJlptLevel)
    ) {
      onFreshStart();
      return;
    }

    setPendingResumePrompt({
      meta,
      freshLabel,
      onFreshStart,
      onResume: () => {
        markNavigationStart(meta.route);
        if (onResume) {
          onResume(meta);
        } else {
          router.push(meta.route);
        }
      },
    });
  };

  return {
    pendingResumePrompt,
    closeResumePrompt: () => setPendingResumePrompt(null),
    openRouteFromStart,
    prefetchTaskRoute,
    openTaskWithResumePrompt,
  };
}
