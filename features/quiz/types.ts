import type { ReactNode } from 'react';

export type QuizModeAdapter<TQuestion, TSnapshot> = {
  route: string;
  label: string;
  questions: TQuestion[];
  currentIndex: number;
  isFinished: boolean;
  isCorrect: boolean;
  snapshot: TSnapshot | null;
  renderPrompt: (question: TQuestion) => ReactNode;
  renderFeedback: (question: TQuestion) => ReactNode;
};
