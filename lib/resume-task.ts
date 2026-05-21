'use client';

import { readLocalStorageJson, writeLocalStorageJson } from './ui-state';

export type ResumeTaskKey =
  | 'hsk-browse'
  | 'hsk-memorize'
  | 'hsk-quiz'
  | 'hsk-sentence'
  | 'hsk-listening'
  | 'hsk-grammar'
  | 'hsk-library-quiz'
  | 'jlpt-vocab'
  | 'jlpt-kana-hiragana'
  | 'jlpt-kana-katakana'
  | 'toeic-vocab'
  | 'toeic-part2'
  | 'toeic-part5';

export type ResumeTaskMeta = {
  taskKey: ResumeTaskKey;
  appMode: 'hsk' | 'toeic' | 'jlpt';
  label: string;
  route: string;
  updatedAt: number;
  levelScope?: number | 'all' | 'N5' | 'N4';
};
type ResumeTaskDefinition = Omit<ResumeTaskMeta, 'updatedAt'> & {
  matchesRoute: (baseRoute: string) => boolean;
};

const RESUME_TASK_SNAPSHOTS_KEY = 'hsk_resume_task_snapshots';
const RESUME_TASK_META_KEY = 'hsk_resume_task_meta';
const RESUME_TASK_SKIP_KEY = 'hsk_resume_task_skip_once';
const LEGACY_RESUME_PILL_KEY = 'hsk_resume_pill_state';

const RESUME_TASK_DEFINITIONS: ResumeTaskDefinition[] = [
  { taskKey: 'hsk-browse', appMode: 'hsk', label: 'Browse', route: '/study', matchesRoute: route => route === '/study' },
  { taskKey: 'hsk-memorize', appMode: 'hsk', label: 'Memorize', route: '/memorize', matchesRoute: route => route === '/memorize' },
  { taskKey: 'hsk-quiz', appMode: 'hsk', label: 'Quiz', route: '/quiz', matchesRoute: route => route === '/quiz' || route.startsWith('/quiz/') },
  { taskKey: 'hsk-sentence', appMode: 'hsk', label: 'Sentence', route: '/sentence-completion', matchesRoute: route => route.startsWith('/sentence-completion/') },
  { taskKey: 'hsk-listening', appMode: 'hsk', label: 'Listening', route: '/hsk-listening', matchesRoute: route => route === '/hsk-listening' },
  { taskKey: 'hsk-grammar', appMode: 'hsk', label: 'Grammar', route: '/grammar', matchesRoute: route => route === '/grammar' },
  { taskKey: 'hsk-library-quiz', appMode: 'hsk', label: 'Library Quiz', route: '/library/quiz', matchesRoute: route => route === '/library/quiz' },
  { taskKey: 'jlpt-vocab', appMode: 'jlpt', label: 'JLPT Vocabulary', route: '/jlpt/vocab', matchesRoute: route => route === '/jlpt/vocab' },
  { taskKey: 'jlpt-kana-hiragana', appMode: 'jlpt', label: 'Hiragana', route: '/jlpt/kana?script=hiragana', matchesRoute: route => route === '/jlpt/kana?script=hiragana' },
  { taskKey: 'jlpt-kana-katakana', appMode: 'jlpt', label: 'Katakana', route: '/jlpt/kana?script=katakana', matchesRoute: route => route === '/jlpt/kana?script=katakana' },
  { taskKey: 'toeic-vocab', appMode: 'toeic', label: 'TOEIC Vocabulary', route: '/', matchesRoute: route => route === '/' },
  { taskKey: 'toeic-part2', appMode: 'toeic', label: 'TOEIC Part 2', route: '/toeic-part2', matchesRoute: route => route === '/toeic-part2' },
  { taskKey: 'toeic-part5', appMode: 'toeic', label: 'TOEIC Part 5', route: '/toeic-part5', matchesRoute: route => route === '/toeic-part5' },
];

export const ResumeTaskRegistry = RESUME_TASK_DEFINITIONS.reduce<Record<ResumeTaskKey, Omit<ResumeTaskDefinition, 'matchesRoute'>>>((registry, definition) => {
  registry[definition.taskKey] = {
    taskKey: definition.taskKey,
    appMode: definition.appMode,
    label: definition.label,
    route: definition.route,
  };
  return registry;
}, {} as Record<ResumeTaskKey, Omit<ResumeTaskDefinition, 'matchesRoute'>>);

function getBaseRoute(route: string) {
  return route.split('?')[0];
}

function inferTaskKey(route: string): ResumeTaskKey | null {
  const baseRoute = getBaseRoute(route);
  return RESUME_TASK_DEFINITIONS.find(definition => definition.matchesRoute(route))?.taskKey
    ?? RESUME_TASK_DEFINITIONS.find(definition => definition.matchesRoute(baseRoute))?.taskKey
    ?? null;
}

function readJsonRecord<T>(key: string): Record<string, T> {
  return readLocalStorageJson<Record<string, T>>(key, {});
}

function inferTaskMeta(route: string, label: string): ResumeTaskMeta | null {
  const taskKey = inferTaskKey(route);
  const definition = taskKey ? ResumeTaskRegistry[taskKey] : null;

  return definition ? { ...definition, label, route, updatedAt: Date.now() } : null;
}

function shouldSkipResume(route: string) {
  if (typeof window === 'undefined') return false;
  const skipRoute = sessionStorage.getItem(RESUME_TASK_SKIP_KEY);
  if (!skipRoute) return false;

  const routeTaskKey = inferTaskKey(route);
  const matches = skipRoute === route || skipRoute === getBaseRoute(route) || Boolean(routeTaskKey && skipRoute === routeTaskKey);
  if (matches) {
    sessionStorage.removeItem(RESUME_TASK_SKIP_KEY);
  }
  return matches;
}

export function consumeResumeTaskFreshStart(route: string, taskKey?: ResumeTaskKey) {
  if (typeof window === 'undefined') return false;
  const skipRoute = sessionStorage.getItem(RESUME_TASK_SKIP_KEY);
  if (!skipRoute) return false;

  const inferredTaskKey = taskKey ?? inferTaskKey(route);
  const matches = skipRoute === route || skipRoute === getBaseRoute(route) || Boolean(inferredTaskKey && skipRoute === inferredTaskKey);
  if (matches) {
    sessionStorage.removeItem(RESUME_TASK_SKIP_KEY);
  }
  return matches;
}

type ResumeTaskOptions = {
  taskKey?: ResumeTaskKey;
  levelScope?: number | 'all' | 'N5' | 'N4';
};

export function setResumeTaskSnapshot(route: string, label: string, snapshot: unknown, taskKeyOrOptions?: ResumeTaskKey | ResumeTaskOptions) {
  if (typeof window === 'undefined') return;
  const options = typeof taskKeyOrOptions === 'string' ? { taskKey: taskKeyOrOptions } : taskKeyOrOptions;
  const taskKey = options?.taskKey;

  const snapshots = readJsonRecord<unknown>(RESUME_TASK_SNAPSHOTS_KEY);
  snapshots[route] = snapshot;
  snapshots[getBaseRoute(route)] = snapshot;
  writeLocalStorageJson(RESUME_TASK_SNAPSHOTS_KEY, snapshots);

  const inferred = inferTaskMeta(route, label);
  const explicitDefinition = taskKey ? ResumeTaskRegistry[taskKey] : null;
  const meta = inferred
    ? { ...inferred, taskKey: taskKey ?? inferred.taskKey }
    : taskKey
      ? { taskKey, appMode: explicitDefinition?.appMode ?? (taskKey.startsWith('toeic') ? 'toeic' : taskKey.startsWith('jlpt') ? 'jlpt' : 'hsk'), label, route, updatedAt: Date.now() } satisfies ResumeTaskMeta
      : null;

  if (meta) {
    const metadata = readJsonRecord<ResumeTaskMeta>(RESUME_TASK_META_KEY);
    metadata[meta.taskKey] = { ...meta, levelScope: options?.levelScope, updatedAt: Date.now() };
    writeLocalStorageJson(RESUME_TASK_META_KEY, metadata);
  }

  localStorage.removeItem(LEGACY_RESUME_PILL_KEY);
}

export function setResumeTaskMeta(meta: Omit<ResumeTaskMeta, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  const metadata = readJsonRecord<ResumeTaskMeta>(RESUME_TASK_META_KEY);
  metadata[meta.taskKey] = { ...meta, updatedAt: Date.now() };
  writeLocalStorageJson(RESUME_TASK_META_KEY, metadata);
  localStorage.removeItem(LEGACY_RESUME_PILL_KEY);
}

export function getResumeTaskSnapshot<T>(route: string): T | null {
  if (typeof window === 'undefined' || shouldSkipResume(route)) return null;
  const snapshots = readJsonRecord<unknown>(RESUME_TASK_SNAPSHOTS_KEY);
  const snapshot = snapshots[route] ?? snapshots[getBaseRoute(route)];
  return snapshot && typeof snapshot === 'object' ? snapshot as T : null;
}

export function getResumeTaskMeta(taskKey: ResumeTaskKey): ResumeTaskMeta | null {
  if (typeof window === 'undefined') return null;
  const metadata = readJsonRecord<ResumeTaskMeta>(RESUME_TASK_META_KEY);
  return metadata[taskKey] ?? null;
}

export function markResumeTaskFreshStart(route: string, taskKey?: ResumeTaskKey) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RESUME_TASK_SKIP_KEY, taskKey ?? inferTaskKey(route) ?? route);
}

export function shouldSaveActiveResumeSnapshot(isActive: boolean, hasContent = true) {
  return isActive && hasContent;
}
