export function clampNumber(value: number, min: number, max: number) {
  const safeValue = Number.isFinite(value) ? value : min;
  return Math.min(Math.max(safeValue, min), max);
}

export function clampCount(value: number, max: number) {
  return Math.round(clampNumber(value, 0, Math.max(max, 0)));
}

export function clampPercent(value: number) {
  return Math.round(clampNumber(value, 0, 100));
}

export function getProgressPercent(current: number, total: number) {
  if (total <= 0) return 0;
  return clampPercent((clampNumber(current, 0, total) / total) * 100);
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return safeJsonParse(window.localStorage.getItem(key), fallback);
}

export function writeLocalStorageJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
