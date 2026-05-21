export type JlptLevel = 'N5' | 'N4';

export type JlptVocabPriority = 'essential' | 'recommended';

export type JlptVocabItem = {
  id: string;
  level: JlptLevel;
  word: string;
  kana: string;
  romaji: string;
  meaningKo: string;
  partOfSpeech: string;
  exampleJa: string;
  exampleRomaji: string;
  exampleKo: string;
  tags: string[];
  priority: JlptVocabPriority;
  wordTtsText?: string;
  exampleTtsText?: string;
};
