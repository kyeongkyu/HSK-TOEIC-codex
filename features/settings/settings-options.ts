export type ResetScope = 'hsk' | 'toeic';
export type StoredUserWords = Record<string, unknown>;

export const USER_WORDS_KEY = 'hsk_user_words';
export const HSK_WORD_ID_PATTERN = /^\d+$/;

export const ttsSpeedLabels = [
  '\uC544\uC8FC \uB290\uB9BC',
  '\uB290\uB9BC',
  '\uBCF4\uD1B5',
  '\uBE60\uB984',
  '\uC544\uC8FC \uBE60\uB984',
];

export const hanziFonts = [
  { name: 'Noto Serif SC', label: 'Noto Serif SC', desc: '\uBA85\uC870\uCCB4 (\uAE30\uBCF8)' },
  { name: 'Noto Sans SC', label: 'Noto Sans SC', desc: '\uACE0\uB515\uCCB4' },
  { name: 'Ma Shan Zheng', label: 'Ma Shan Zheng', desc: '\uBD93\uAE00\uC528\uCCB4' },
  { name: 'Source Han Sans', label: 'Source Han Sans', desc: '\uACE0\uB515\uCCB4 (Source)' },
  { name: 'PingFang SC', label: 'PingFang SC', desc: '\uC560\uD50C \uACE0\uB515\uCCB4' },
];

export const hanziSizeLabels = ['\uC791\uAC8C', '\uC911\uAC04', '\uD06C\uAC8C (\uAE30\uBCF8)'];

export function isUserWordInScope(id: string, scope: ResetScope) {
  const isHskWord = HSK_WORD_ID_PATTERN.test(id);
  const isJlptWord = id.startsWith('jlpt-') || id.startsWith('hiragana-') || id.startsWith('katakana-');
  return scope === 'hsk' ? isHskWord : !isHskWord && !isJlptWord;
}

export function getResetStorageKeys(scope: ResetScope) {
  if (scope === 'toeic') return ['toeic_part5_stats', 'toeic_lc_part2_progress', 'toeic_tts_speed'];

  return [
    'hsk_level',
    'hsk_hanzi_writer_mode',
    'hsk_hanzi_font',
    'hsk_hanzi_size',
    'hsk_separate_library_by_level',
    'hsk_grammar_progress',
    'hsk_sentence_study_bookmarks',
    'sentence_completion_progress',
  ];
}
