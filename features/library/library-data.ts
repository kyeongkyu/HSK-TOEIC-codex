import type { LibraryWord } from '@/features/jlpt/library';
import { normalizeJlptKanaForLibrary, normalizeJlptVocabForLibrary } from '@/features/jlpt/library';

type LibraryAppMode = 'hsk' | 'toeic' | 'jlpt' | 'entry' | null;

export async function loadLibraryWords(appMode: LibraryAppMode): Promise<LibraryWord[]> {
  if (appMode === 'toeic') {
    const { toeicWords } = await import('@/data/toeic');
    return toeicWords.map(word => ({ ...word, source: 'toeic', displayStyle: 'latin' }));
  }

  if (appMode === 'jlpt') {
    const [{ jlptN5Vocab }, { jlptN4Vocab }, { jlptHiragana, jlptKatakana }] = await Promise.all([
      import('@/data/jlpt/vocab-n5'),
      import('@/data/jlpt/vocab-n4'),
      import('@/data/jlpt/kana'),
    ]);
    return [
      ...jlptN5Vocab.map(normalizeJlptVocabForLibrary),
      ...jlptN4Vocab.map(normalizeJlptVocabForLibrary),
      ...jlptHiragana.map(normalizeJlptKanaForLibrary),
      ...jlptKatakana.map(normalizeJlptKanaForLibrary),
    ];
  }

  const { hskWords } = await import('@/data/hsk');
  return hskWords.map(word => ({ ...word, source: 'hsk', displayStyle: 'hanzi' }));
}

export function getFavoriteLibraryWords(
  userWords: Record<string, { isFavorite?: boolean } | undefined>,
  wordData: LibraryWord[],
  options: {
    appMode: LibraryAppMode;
    separateLibraryByLevel: boolean;
    selectedLevel: number | 'all';
  },
) {
  const favoriteWordIds = new Set(Object.keys(userWords).filter(id => userWords[id]?.isFavorite));
  let filtered = wordData.filter(word => favoriteWordIds.has(word.id));

  if (options.appMode === 'hsk' && options.separateLibraryByLevel && options.selectedLevel !== 'all') {
    filtered = filtered.filter(word => word.level === options.selectedLevel);
  }

  return filtered;
}
