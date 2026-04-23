const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

function getToneTargetIndex(syllable: string) {
  const lower = syllable.toLowerCase();
  const aIndex = lower.indexOf('a');
  if (aIndex !== -1) return aIndex;

  const eIndex = lower.indexOf('e');
  if (eIndex !== -1) return eIndex;

  const ouIndex = lower.indexOf('ou');
  if (ouIndex !== -1) return ouIndex;

  for (let index = lower.length - 1; index >= 0; index -= 1) {
    if ('io uü'.replace(/\s/g, '').includes(lower[index])) return index;
  }

  return -1;
}

function applyTone(syllable: string, tone: number) {
  const normalized = syllable.replace(/u:/gi, 'ü').replace(/v/gi, 'ü');
  if (tone < 1 || tone > 4) return normalized;

  const targetIndex = getToneTargetIndex(normalized);
  if (targetIndex === -1) return normalized;

  const char = normalized[targetIndex];
  const lowerChar = char.toLowerCase();
  const marked = TONE_MARKS[lowerChar]?.[tone - 1];
  if (!marked) return normalized;

  const toneChar = char === char.toUpperCase() ? marked.toUpperCase() : marked;
  return `${normalized.slice(0, targetIndex)}${toneChar}${normalized.slice(targetIndex + 1)}`;
}

export function formatPinyin(pinyin: string) {
  return pinyin.replace(/([a-zA-ZüÜv:]+)([1-5])/g, (_match, syllable: string, toneText: string) => {
    const tone = Number(toneText);
    return applyTone(syllable, tone);
  });
}
