export const LOCAL_JLPT_KANA_AUDIO_KEYS = ['a'] as const;

const LOCAL_JLPT_KANA_AUDIO_KEY_SET = new Set<string>(LOCAL_JLPT_KANA_AUDIO_KEYS);

export function hasLocalJlptKanaAudio(key: string) {
  return LOCAL_JLPT_KANA_AUDIO_KEY_SET.has(key);
}
