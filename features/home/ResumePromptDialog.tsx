'use client';

import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ResumeTaskMeta } from '@/lib/resume-task';

const RESUME_TITLE = '\uC774\uC5B4\uC11C \uD560\uAE4C\uC694?';
const RESUME_DESCRIPTION_PREFIX = '\uC774\uC804\uC5D0 \uD558\uB358 ';
const RESUME_DESCRIPTION_SUFFIX = ' \uC791\uC5C5\uC774 \uC800\uC7A5\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.';
const RESUME_BUTTON_LABEL = '\uC774\uC5B4\uD558\uAE30';
const FRESH_START_PREFIX = '\uCC98\uC74C\uBD80\uD130 ';
const CANCEL_LABEL = '\uCDE8\uC18C';

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        className="w-full max-w-sm rounded-[2rem] border border-gray-200/60 bg-white/80 p-6 text-center shadow-2xl shadow-black/20 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/85"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200/50 bg-blue-100/80 text-blue-600 shadow-sm backdrop-blur-sm dark:border-blue-400/20 dark:bg-blue-900/40 dark:text-blue-300">
          <ChevronRight size={28} />
        </div>
        <h2 className="text-2xl font-black text-gray-950 dark:text-white">{RESUME_TITLE}</h2>
        <p className="mt-3 break-keep text-sm font-bold leading-relaxed text-gray-500 dark:text-gray-300">
          {RESUME_DESCRIPTION_PREFIX}{prompt.meta.label}{RESUME_DESCRIPTION_SUFFIX}
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
            {RESUME_BUTTON_LABEL}
          </button>
          <button
            type="button"
            onClick={() => {
              const action = prompt.onFreshStart;
              onClose();
              action();
            }}
            className="w-full rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-4 text-sm font-black text-gray-800 shadow-sm backdrop-blur-sm transition-all active:scale-[0.98] dark:border-gray-700/70 dark:bg-gray-900/55 dark:text-gray-100"
          >
            {FRESH_START_PREFIX}{prompt.freshLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl px-4 py-3 text-sm font-black text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {CANCEL_LABEL}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
