'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

type ReviewPanelProps = {
  correct: boolean;
  explanation: string;
  transcript: string;
  showTranscript: boolean;
  isLast: boolean;
  canGoPrevious: boolean;
  onToggleTranscript: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function ReviewPanel({
  correct,
  explanation,
  transcript,
  showTranscript,
  isLast,
  canGoPrevious,
  onToggleTranscript,
  onPrevious,
  onNext,
}: ReviewPanelProps) {
  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className={`mb-4 flex items-center gap-2 font-black ${correct ? 'text-green-600' : 'text-red-500'}`}>
        {correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {correct ? 'Correct' : 'Incorrect'}
      </div>
      <p className="text-sm font-bold leading-relaxed text-gray-700 dark:text-gray-200">{explanation}</p>
      <button
        type="button"
        onClick={onToggleTranscript}
        className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-gray-700 transition-all active:scale-[0.99] dark:bg-gray-900 dark:text-gray-100"
      >
        {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
      </button>
      {showTranscript && (
        <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm font-medium leading-relaxed text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
          {transcript}
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 rounded-2xl bg-white px-4 py-4 text-sm font-black text-gray-700 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-gray-900 dark:text-gray-100"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-[0.99] hover:bg-blue-700"
        >
          {isLast ? 'View Results' : 'Next Question'}
        </button>
      </div>
    </div>
  );
}
