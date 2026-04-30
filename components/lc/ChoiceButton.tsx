'use client';

import type { LcChoiceId } from '@/data/toeic-lc-part2';

type ChoiceButtonProps = {
  id: LcChoiceId;
  text: string;
  selected: boolean;
  submitted: boolean;
  correct: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function ChoiceButton({ id, text, selected, submitted, correct, disabled, onSelect }: ChoiceButtonProps) {
  const stateClass = submitted && correct
    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
    : submitted && selected && !correct
      ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
      : selected
        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300'
        : 'border-gray-100 bg-white text-gray-900 hover:border-blue-200 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:border-blue-800';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full rounded-[1.25rem] border p-4 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed ${stateClass}`}
    >
      <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-xs font-black dark:bg-white/10">
        {id}
      </span>
      <span className="text-sm font-bold leading-relaxed">{text}</span>
    </button>
  );
}
