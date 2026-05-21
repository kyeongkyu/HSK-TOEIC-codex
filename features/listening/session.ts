import type {
  HskListeningAttempt,
  HskListeningQuestion,
  HskListeningReviewFilter,
  HskListeningLevel,
  HskListeningTopic,
} from '@/data/hsk-listening';

export type ListeningQuestionIdentity = {
  id: string;
};

export type HskListeningProgressState = {
  attempts: HskListeningAttempt[];
  bookmarkedIds: string[];
  replayCounts: Record<string, number>;
  savedSetProgress: Record<string, { currentIndex: number }>;
};

export const DEFAULT_HSK_LISTENING_PROGRESS: HskListeningProgressState = {
  attempts: [],
  bookmarkedIds: [],
  replayCounts: {},
  savedSetProgress: {},
};

export function findQuestionIndexById<TQuestion extends ListeningQuestionIdentity>(questions: TQuestion[], questionId: string | null) {
  if (!questionId || questions.length === 0) return -1;
  return questions.findIndex(question => question.id === questionId);
}

export function clampQuestionIndex(index: number, questionCount: number) {
  if (questionCount <= 0) return 0;
  return Math.min(Math.max(index, 0), questionCount - 1);
}

export function normalizeHskListeningProgress(stored: unknown): HskListeningProgressState {
  if (!stored || typeof stored !== 'object') return DEFAULT_HSK_LISTENING_PROGRESS;
  const parsed = stored as Partial<HskListeningProgressState>;
  return {
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    bookmarkedIds: Array.isArray(parsed.bookmarkedIds) ? parsed.bookmarkedIds : [],
    replayCounts: parsed.replayCounts && typeof parsed.replayCounts === 'object' ? parsed.replayCounts : {},
    savedSetProgress: parsed.savedSetProgress && typeof parsed.savedSetProgress === 'object' ? parsed.savedSetProgress : {},
  };
}

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[\uFF0C\u3002\uFF01\uFF1F\u3001,.!?\s]/g, '')
    .trim();
}

export function isHskListeningAnswerCorrect(question: HskListeningQuestion, selectedAnswer: string) {
  const expected = normalizeAnswer(question.answer);
  const selected = normalizeAnswer(selectedAnswer);

  if (question.activityType === 'dictation') {
    return selected === expected || selected === normalizeAnswer(question.pinyin);
  }

  return selected === expected;
}

export function getHskListeningReviewIds(progress: HskListeningProgressState, filter: HskListeningReviewFilter) {
  const ids = new Set<string>();

  if (filter === 'bookmarked') {
    progress.bookmarkedIds.forEach((id) => ids.add(id));
    return ids;
  }

  if (filter === 'replayed_often') {
    Object.entries(progress.replayCounts).forEach(([id, count]) => {
      if (count >= 3) ids.add(id);
    });
    return ids;
  }

  const wrongCounts = progress.attempts.reduce<Record<string, number>>((counts, attempt) => {
    if (!attempt.correct) counts[attempt.questionId] = (counts[attempt.questionId] ?? 0) + 1;
    return counts;
  }, {});

  Object.entries(wrongCounts).forEach(([id, count]) => {
    if (filter === 'incorrect_only' && count > 0) ids.add(id);
    if (filter === 'frequently_missed' && count >= 2) ids.add(id);
  });

  return ids;
}

export function getHskListeningSetProgressKey(
  level: HskListeningLevel,
  topic: HskListeningTopic,
  mode: 'practice' | 'quiz' | 'review',
  filter?: HskListeningReviewFilter,
) {
  return mode === 'review'
    ? `${level}:${topic}:review:${filter ?? 'all'}`
    : `${level}:${topic}:${mode}`;
}
