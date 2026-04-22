/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { UserWordData } from '@/lib/srs';
import { hskWords } from '@/data/hsk';
import { toeicWords } from '@/data/toeic';

export function useUserWords() {
  const [userWords, setUserWords] = useState<Record<string, UserWordData>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('hsk_user_words');
    let initialData: Record<string, UserWordData> = {};
    
    if (stored) {
      initialData = JSON.parse(stored);
    }

    const allWords = [...hskWords, ...toeicWords];
    
    // Sync with allWords: add missing words
    let needsUpdate = false;
    allWords.forEach(w => {
      if (!initialData[w.id]) {
        initialData[w.id] = {
          id: w.id,
          memoryStrength: 0.3,
          lastReviewed: null,
          nextReview: Date.now(),
          wrongCount: 0
        };
        needsUpdate = true;
      }
    });

    if (needsUpdate || !stored) {
      localStorage.setItem('hsk_user_words', JSON.stringify(initialData));
    }

    setUserWords(initialData);
    setIsLoaded(true);
  }, []);

  const updateWord = (id: string, newData: UserWordData) => {
    setUserWords(prev => {
      const updated = { ...prev, [id]: newData };
      localStorage.setItem('hsk_user_words', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (id: string) => {
    setUserWords(prev => {
      const current = prev[id];
      const updated = {
        ...prev,
        [id]: {
          id,
          memoryStrength: current?.memoryStrength ?? 0.3,
          lastReviewed: current?.lastReviewed ?? null,
          nextReview: current?.nextReview ?? Date.now(),
          wrongCount: current?.wrongCount ?? 0,
          isFavorite: !current?.isFavorite
        }
      };
      localStorage.setItem('hsk_user_words', JSON.stringify(updated));
      return updated;
    });
  };

  return { userWords, updateWord, toggleFavorite, isLoaded };
}
