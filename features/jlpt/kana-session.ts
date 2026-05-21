import type { JlptKanaGroup, JlptKanaScript } from '@/data/jlpt/kana';

export type KanaView = 'chart' | 'card';

export type KanaProgress = {
  script: JlptKanaScript;
  view: KanaView;
  group: JlptKanaGroup | 'all';
  currentIndex: number;
  tab?: KanaView | 'cards' | 'quiz';
};

export const JLPT_KANA_PROGRESS_KEY = 'jlpt_kana_progress';

export const DEFAULT_KANA_PROGRESS: KanaProgress = {
  script: 'hiragana',
  view: 'chart',
  group: 'all',
  currentIndex: 0,
};

export const kanaGroupLabels: Array<{ id: JlptKanaGroup | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'basic', label: 'Basic' },
  { id: 'dakuten', label: 'Dakuten' },
  { id: 'handakuten', label: 'Handakuten' },
  { id: 'yoon', label: 'Yoon' },
  { id: 'small', label: 'Small' },
  { id: 'special', label: 'Special' },
];

export function getScriptFromSearch(): JlptKanaScript {
  if (typeof window === 'undefined') return 'hiragana';
  return new URLSearchParams(window.location.search).get('script') === 'katakana' ? 'katakana' : 'hiragana';
}

export function getKanaRoute(script: JlptKanaScript) {
  return `/jlpt/kana?script=${script}`;
}

export function getKanaTaskKey(script: JlptKanaScript) {
  return script === 'katakana' ? 'jlpt-kana-katakana' : 'jlpt-kana-hiragana';
}

export function getKanaLabel(script: JlptKanaScript) {
  return script === 'katakana' ? 'Katakana' : 'Hiragana';
}

export function getKanaHomeModeIntent(script: JlptKanaScript) {
  return script === 'katakana' ? 'kana-katakana' : 'kana-hiragana';
}

export function clampKanaIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

export function normalizeKanaProgress(progress: KanaProgress | null, script: JlptKanaScript): KanaProgress {
  if (!progress || progress.script !== script) return { ...DEFAULT_KANA_PROGRESS, script };
  const view = progress.view === 'card' || progress.tab === 'cards' ? 'card' : 'chart';
  return {
    script,
    view,
    group: progress.group ?? 'all',
    currentIndex: progress.currentIndex ?? 0,
  };
}
