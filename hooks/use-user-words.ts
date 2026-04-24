/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { UserWordData } from '@/lib/srs';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/ui-state';

function createDefaultUserWord(id: string): UserWordData {
  return {
    id,
    memoryStrength: 0.3,
    lastReviewed: null,
    nextReview: Date.now(),
    wrongCount: 0,
  };
}

export function useUserWords() {
  const [userWords, setUserWords] = useState<Record<string, UserWordData>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUserWords(readLocalStorageJson<Record<string, UserWordData>>('hsk_user_words', {}));
    setIsLoaded(true);
  }, []);

  const updateWord = (id: string, newData: UserWordData) => {
    setUserWords(prev => {
      const updated = { ...prev, [id]: newData };
      writeLocalStorageJson('hsk_user_words', updated);
      return updated;
    });
  };

  const toggleFavorite = (id: string) => {
    setUserWords(prev => {
      const current = prev[id] ?? createDefaultUserWord(id);
      const updated = {
        ...prev,
        [id]: {
          ...current,
          isFavorite: !current?.isFavorite
        }
      };
      writeLocalStorageJson('hsk_user_words', updated);
      return updated;
    });
  };

  return { userWords, updateWord, toggleFavorite, isLoaded };
}
