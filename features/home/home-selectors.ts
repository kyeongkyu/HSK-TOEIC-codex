import type { UserWordData, WordData } from '@/lib/srs';

export type HskHomeStats = {
  dueWords: number;
  wrongWords: number;
  totalWords: number;
};

export type TopicWord = WordData & {
  topicId: string;
};

export function getHskHomeStats(words: WordData[], selectedLevel: number | 'all', userWords: Record<string, UserWordData>, now: number | null): HskHomeStats {
  const filteredWords = selectedLevel === 'all'
    ? words
    : words.filter(word => Number(word.level) === Number(selectedLevel));
  const filteredIds = new Set(filteredWords.map(word => word.id));

  return {
    dueWords: filteredWords.filter(word => (userWords[word.id]?.nextReview ?? 0) <= (now || 0)).length,
    wrongWords: Object.values(userWords).filter(word => filteredIds.has(word.id) && word.wrongCount > 0).length,
    totalWords: filteredWords.length,
  };
}

export function groupWordsByTopic<TWord extends TopicWord>(words: TWord[]) {
  return words.reduce<Record<string, TWord[]>>((groups, word) => {
    (groups[word.topicId] ??= []).push(word);
    return groups;
  }, {});
}
