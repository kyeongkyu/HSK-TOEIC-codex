import type { WordData } from '@/lib/srs';
import type { JlptKanaItem } from '@/data/jlpt/kana';
import type { JlptVocabItem } from '@/data/jlpt/vocab-n5';

export type LibraryWord = WordData & {
  source?: 'hsk' | 'toeic' | 'jlpt-vocab' | 'jlpt-kana';
  speakText?: string;
  displayStyle?: 'hanzi' | 'latin' | 'kana';
};

export function normalizeJlptVocabForLibrary(word: JlptVocabItem): LibraryWord {
  return {
    id: word.id,
    word: word.word,
    pinyin: `${word.kana} · ${word.romaji}`,
    meaning: word.meaningKo,
    example: word.exampleJa,
    exampleTranslation: word.exampleKo,
    level: 5,
    source: 'jlpt-vocab',
    speakText: word.kana,
    displayStyle: 'kana',
  };
}

export function normalizeJlptKanaForLibrary(item: JlptKanaItem): LibraryWord {
  return {
    id: item.id,
    word: item.kana,
    pinyin: item.romaji,
    meaning: `${item.example} · ${item.exampleKo}`,
    example: item.exampleSentenceJa,
    exampleTranslation: item.exampleSentenceKo,
    level: 5,
    source: 'jlpt-kana',
    speakText: item.kana,
    displayStyle: 'kana',
  };
}
