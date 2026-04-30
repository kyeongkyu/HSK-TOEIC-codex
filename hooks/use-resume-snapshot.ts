'use client';

import { useEffect } from 'react';
import { setResumeTaskSnapshot, shouldSaveActiveResumeSnapshot, type ResumeTaskKey } from '@/lib/resume-task';

type UseResumeSnapshotOptions<TSnapshot> = {
  route: string;
  label: string;
  snapshot: TSnapshot | null;
  taskKey?: ResumeTaskKey;
  enabled?: boolean;
  active?: boolean;
  hasContent?: boolean;
};

export function useResumeSnapshot<TSnapshot>({
  route,
  label,
  snapshot,
  taskKey,
  enabled = true,
  active = true,
  hasContent = true,
}: UseResumeSnapshotOptions<TSnapshot>) {
  useEffect(() => {
    if (!enabled || !snapshot || !shouldSaveActiveResumeSnapshot(active, hasContent)) return;
    setResumeTaskSnapshot(route, label, snapshot, taskKey);
  }, [active, enabled, hasContent, label, route, snapshot, taskKey]);
}
