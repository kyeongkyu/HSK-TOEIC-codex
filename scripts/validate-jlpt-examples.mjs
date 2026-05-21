import { jlptN5Vocab } from '../data/jlpt/vocab-n5.ts';
import { jlptN4Vocab } from '../data/jlpt/vocab-n4.ts';

const japaneseTextPattern = /^[\u3040-\u30ff\u3400-\u9fff\u3000-\u303f\uff01-\uff5e、。！？ー々\s]+$/;

const forbiddenPatterns = [
  { name: 'old memorization template', pattern: /を覚えます/ },
  { name: 'placeholder Korean', pattern: /이 어휘는|라는 뜻입니다/ },
  { name: 'bad Korean adjective ending', pattern: /(어려운|쉬운|약한|젊은|나쁜)입니다/ },
  { name: 'bad Korean verb ending', pattern: /오늘 .+다합니다/ },
  { name: 'mechanical today template', pattern: /^今日、.+ます。$/ },
  { name: 'wrong suru object pattern', pattern: /をします。/ },
  { name: 'wrong drink translation', pattern: /사물[을를] 마십니다|상인[을를] 마십니다|가게[을를] 마십니다/ },
];

function cleanJapanese(value) {
  return String(value ?? '')
    .split(/[;/]/)[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/[「」『』\s]/g, '')
    .trim();
}

function collectSurfaces(items) {
  const surfaces = new Set();
  for (const item of items) {
    for (const value of [item.word, item.kana]) {
      for (const part of String(value).split(/[;/]/)) {
        const clean = cleanJapanese(part);
        if (clean.length >= 2) surfaces.add(clean);
      }
    }
  }
  return surfaces;
}

function hasTarget(item) {
  const word = cleanJapanese(item.word);
  const kana = cleanJapanese(item.kana);
  const exampleJa = cleanJapanese(item.exampleJa);
  const exampleTtsText = cleanJapanese(item.exampleTtsText ?? '');
  return Boolean(
    (word && exampleJa.includes(word))
      || (kana && exampleTtsText.includes(kana))
      || (kana && exampleJa.includes(kana))
      || (word.length > 1 && exampleJa.includes(word.slice(0, -1)))
      || (kana.length > 1 && exampleTtsText.includes(kana.slice(0, -1))),
  );
}

function validateLevel(items, level, upperLevelItems = []) {
  const errors = [];
  const ownSurfaces = collectSurfaces(items);
  const upperSurfaces = [...collectSurfaces(upperLevelItems)]
    .filter((surface) => !ownSurfaces.has(surface))
    .filter((surface) => /[\u4e00-\u9fff]/.test(surface) && surface.length >= 3)
    .sort((a, b) => b.length - a.length);

  for (const item of items) {
    const prefix = `${item.id} ${item.word}`;

    if (!item.exampleJa) errors.push(`${prefix}: exampleJa is empty`);
    if (!item.exampleRomaji) errors.push(`${prefix}: exampleRomaji is empty`);
    if (!item.exampleKo) errors.push(`${prefix}: exampleKo is empty`);
    if (!item.exampleTtsText) errors.push(`${prefix}: exampleTtsText is empty`);
    if (item.exampleRomaji !== item.exampleRomaji.toLowerCase()) {
      errors.push(`${prefix}: exampleRomaji must be lowercase`);
    }
    if (!japaneseTextPattern.test(item.exampleTtsText ?? '')) {
      errors.push(`${prefix}: exampleTtsText must contain Japanese text only`);
    }
    if (!hasTarget(item)) {
      errors.push(`${prefix}: example does not include target word or reading`);
    }

    for (const { name, pattern } of forbiddenPatterns) {
      if (pattern.test(item.exampleJa) || pattern.test(item.exampleKo) || pattern.test(item.exampleTtsText ?? '')) {
        errors.push(`${prefix}: forbidden ${name}`);
      }
    }

    if (level === 'N5') {
      const violation = upperSurfaces.find((surface) => cleanJapanese(item.exampleJa).includes(surface));
      if (violation) {
        errors.push(`${prefix}: N5 example may include upper-level word "${violation}"`);
      }
    }
  }

  return errors;
}

const errors = [
  ...validateLevel(jlptN5Vocab, 'N5', jlptN4Vocab),
  ...validateLevel(jlptN4Vocab, 'N4'),
];

const roof = jlptN4Vocab.find((item) => item.word === '屋上' || item.kana === 'おくじょう');
if (!roof || roof.exampleJa !== '天気がいいから、屋上に行ってみようよ。') {
  errors.push('屋上: requested example sentence is missing');
}

if (errors.length > 0) {
  console.error(`JLPT example validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 160)) console.error(`- ${error}`);
  if (errors.length > 160) console.error(`...and ${errors.length - 160} more`);
  process.exit(1);
}

console.log(`JLPT example validation passed (${jlptN5Vocab.length} N5, ${jlptN4Vocab.length} N4)`);
