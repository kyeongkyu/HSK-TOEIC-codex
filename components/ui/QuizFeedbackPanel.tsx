import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type QuizFeedbackPanelProps = {
  isCorrect: boolean;
  children: ReactNode;
  correctLabel?: string;
  reviewLabel?: string;
  className?: string;
};

export function QuizFeedbackPanel({
  isCorrect,
  children,
  correctLabel = 'Correct',
  reviewLabel = 'Review Answer',
  className = '',
}: QuizFeedbackPanelProps) {
  return (
    <div className={`rounded-[1.75rem] border border-gray-100 bg-gray-50/90 p-5 shadow-xl shadow-gray-200/60 dark:border-gray-700 dark:bg-gray-800/80 dark:shadow-black/20 ${className}`}>
      <div className={`mx-auto mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${
        isCorrect
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      }`}>
        {isCorrect ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        {isCorrect ? correctLabel : reviewLabel}
      </div>
      {children}
    </div>
  );
}
