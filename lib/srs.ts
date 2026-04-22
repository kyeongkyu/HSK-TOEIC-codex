export interface WordData {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  phonetic?: string;
  example: string;
  exampleTranslation?: string;
  level: number;
  memorizationTip?: string;
}

export interface UserWordData {
  id: string;
  memoryStrength: number;
  lastReviewed: number | null;
  nextReview: number;
  wrongCount: number;
  isFavorite?: boolean;
}

export function processReview(userWord: UserWordData, isCorrect: boolean): UserWordData {
  let { memoryStrength, wrongCount } = userWord;
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (isCorrect) {
    memoryStrength += 0.1;
  } else {
    memoryStrength -= 0.2;
    wrongCount += 1;
  }

  if (memoryStrength < 0) memoryStrength = 0;

  let nextReview = now;
  if (isCorrect) {
    const intervalDays = 1 + (memoryStrength * 5);
    nextReview = now + (intervalDays * ONE_DAY);
  }

  return {
    ...userWord,
    memoryStrength,
    lastReviewed: now,
    nextReview,
    wrongCount
  };
}
