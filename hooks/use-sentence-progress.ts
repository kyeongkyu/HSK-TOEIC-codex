import { useState, useEffect } from 'react';

export type ChapterStatus = 'green' | 'yellow' | 'red' | null;

export interface ChapterProgress {
  [level: string]: {
    [chapter: string]: {
      errors: number;
      status: ChapterStatus;
    };
  };
}

export function useSentenceProgress() {
  const [progress, setProgress] = useState<ChapterProgress>({});

  useEffect(() => {
    const stored = localStorage.getItem('sentence_completion_progress');
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse sentence progress', e);
      }
    }
  }, []);

  const updateProgress = (level: number, chapter: number, errors: number) => {
    let status: ChapterStatus = 'red';
    if (errors === 0) status = 'green';
    else if (errors < 3) status = 'yellow';

    const newProgress = {
      ...progress,
      [level]: {
        ...(progress[level] || {}),
        [chapter]: { errors, status }
      }
    };

    setProgress(newProgress);
    localStorage.setItem('sentence_completion_progress', JSON.stringify(newProgress));
  };

  const getChapterStatus = (level: number, chapter: number): ChapterStatus => {
    return progress[level]?.[chapter]?.status || null;
  };

  return { progress, updateProgress, getChapterStatus };
}
