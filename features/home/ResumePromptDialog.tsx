'use client';

import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ResumeTaskMeta } from '@/lib/resume-task';

export type PendingResumePrompt = {
  meta: ResumeTaskMeta;
  freshLabel: string;
  onFreshStart: () => void;
  onResume: () => void;
};

type ResumePromptDialogProps = {
  prompt: PendingResumePrompt | null;
  isClient: boolean;
  onClose: () => void;
};

export function ResumePromptDialog({ prompt, isClient, onClose }: ResumePromptDialogProps) {
  if (!prompt || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-6 text-center shadow-2xl shadow-black/20 dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          <ChevronRight size={28} />
        </div>
        <h2 className="text-2xl font-black text-gray-950 dark:text-white">이어서 할까요?</h2>
        <p className="mt-3 break-keep text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-400">
          이전에 하던 {prompt.meta.label} 작업이 저장되어 있습니다.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => {
              const action = prompt.onResume;
              onClose();
              action();
            }}
            className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            이어하기
          </button>
          <button
            type="button"
            onClick={() => {
              const action = prompt.onFreshStart;
              onClose();
              action();
            }}
            className="w-full rounded-2xl bg-gray-100 px-4 py-4 text-sm font-black text-gray-800 transition-all active:scale-[0.98] dark:bg-gray-800 dark:text-gray-100"
          >
            처음부터 {prompt.freshLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl px-4 py-3 text-sm font-black text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            취소
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
