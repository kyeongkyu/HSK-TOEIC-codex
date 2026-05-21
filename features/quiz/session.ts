import { clampCount } from '@/lib/ui-state';

export type SharedQuizState = 'answering' | 'feedback' | 'finished';
export type ActiveQuizState = Exclude<SharedQuizState, 'finished'>;

export function getSafeQuizResultStats(score: number, totalQuestions: number) {
  const displayScore = clampCount(score, totalQuestions);
  const displayAccuracy = totalQuestions > 0
    ? Math.round((displayScore / totalQuestions) * 100)
    : 0;

  return { displayScore, displayAccuracy };
}

export function shouldPersistQuizProgress(quizState: SharedQuizState, currentIndex: number) {
  return quizState !== 'finished' && currentIndex > 0;
}

export function shouldSaveActiveQuizSnapshot(quizState: SharedQuizState) {
  return quizState !== 'finished';
}
