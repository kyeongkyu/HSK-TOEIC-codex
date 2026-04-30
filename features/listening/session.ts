export type ListeningQuestionIdentity = {
  id: string;
};

export function findQuestionIndexById<TQuestion extends ListeningQuestionIdentity>(questions: TQuestion[], questionId: string | null) {
  if (!questionId || questions.length === 0) return -1;
  return questions.findIndex(question => question.id === questionId);
}

export function clampQuestionIndex(index: number, questionCount: number) {
  if (questionCount <= 0) return 0;
  return Math.min(Math.max(index, 0), questionCount - 1);
}
