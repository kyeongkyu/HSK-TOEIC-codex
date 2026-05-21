import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const SOURCES = {
  N5: 'https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n5.csv',
  N4: 'https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n4.csv',
};

const kanaMap = new Map(Object.entries({
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ゔ: 'vu',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa',
  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'wo', ン: 'n',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  ダ: 'da', ヂ: 'ji', ヅ: 'zu', デ: 'de', ド: 'do',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
  ヴ: 'vu',
  ァ: 'a', ィ: 'i', ゥ: 'u', ェ: 'e', ォ: 'o',
  ャ: 'ya', ュ: 'yu', ョ: 'yo', ヮ: 'wa',
}));

const yoon = new Map(Object.entries({
  kya: 'kya', kiya: 'kya', kyu: 'kyu', kiyu: 'kyu', kyo: 'kyo', kiyo: 'kyo',
  gya: 'gya', giya: 'gya', gyu: 'gyu', giyu: 'gyu', gyo: 'gyo', giyo: 'gyo',
  sha: 'sha', shiya: 'sha', shu: 'shu', shiyu: 'shu', sho: 'sho', shiyo: 'sho',
  ja: 'ja', jiya: 'ja', ju: 'ju', jiyu: 'ju', jo: 'jo', jiyo: 'jo',
  cha: 'cha', chiya: 'cha', chu: 'chu', chiyu: 'chu', cho: 'cho', chiyo: 'cho',
  nya: 'nya', niya: 'nya', nyu: 'nyu', niyu: 'nyu', nyo: 'nyo', niyo: 'nyo',
  hya: 'hya', hiya: 'hya', hyu: 'hyu', hiyu: 'hyu', hyo: 'hyo', hiyo: 'hyo',
  bya: 'bya', biya: 'bya', byu: 'byu', biyu: 'byu', byo: 'byo', biyo: 'byo',
  pya: 'pya', piya: 'pya', pyu: 'pyu', piyu: 'pyu', pyo: 'pyo', piyo: 'pyo',
  mya: 'mya', miya: 'mya', myu: 'myu', miyu: 'myu', myo: 'myo', miyo: 'myo',
  rya: 'rya', riya: 'rya', ryu: 'ryu', riyu: 'ryu', ryo: 'ryo', riyo: 'ryo',
}));

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function sanitizeJapanese(text) {
  return text.replace(/[～~]/g, '').replace(/\s+/g, '').trim();
}

function hasKanji(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

function pickWordAndKana(expression, reading) {
  if (hasKanji(reading) && !hasKanji(expression) && kanaToRomaji(expression)) {
    return { word: reading, kana: expression };
  }

  return { word: expression, kana: reading };
}

function kanaToRomaji(input) {
  const chars = [...input.replace(/[～~\s]/g, '')];
  const out = [];
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    if (char === 'っ' || char === 'ッ') {
      const next = kanaMap.get(chars[i + 1] ?? '') ?? '';
      if (next) out.push(next[0]);
      continue;
    }
    if (char === 'ー') {
      const prev = out[out.length - 1] ?? '';
      const vowel = [...prev].reverse().find(c => 'aeiou'.includes(c));
      if (vowel) out.push(vowel);
      continue;
    }
    const next = chars[i + 1];
    if (next === 'ゃ' || next === 'ゅ' || next === 'ょ' || next === 'ャ' || next === 'ュ' || next === 'ョ') {
      const base = kanaMap.get(char) ?? '';
      const tail = kanaMap.get(next) ?? '';
      const combined = yoon.get(`${base}${tail}`) ?? yoon.get(`${base.slice(0, -1)}${tail}`);
      if (combined) {
        out.push(combined);
        i += 1;
        continue;
      }
    }
    out.push(kanaMap.get(char) ?? char);
  }
  return out.join('').toLowerCase().replace(/[^a-z0-9'-]/g, '');
}

function inferPartOfSpeech(expression, meaning) {
  const lower = meaning.toLowerCase();
  if (lower.startsWith('to ') || lower.includes('; to ') || lower.includes(', to ')) return '동사';
  if (expression.endsWith('い') || lower.includes('adjective')) return '형용사';
  if (lower.includes('adverb') || lower.includes('quickly') || lower.includes('usually')) return '부사';
  if (lower.includes('particle')) return '조사';
  if (lower.includes('expression') || expression.includes('～') || expression.includes('~')) return '표현';
  return '명사/표현';
}

function makeTags(rawTags, priority, level) {
  const tags = rawTags
    .split(/\s+/)
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(tag => !/^JLPT(_N?[0-9])?$/.test(tag))
    .map(tag => tag.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'))
    .filter(Boolean);
  return Array.from(new Set([`jlpt-${level.toLowerCase()}`, priority, ...tags])).slice(0, 8);
}

async function translateMeanings(meanings) {
  const unique = Array.from(new Set(meanings));
  const result = new Map();
  const batchSize = 35;
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const source = batch.join('\n');
    try {
      const query = new URLSearchParams({
        client: 'gtx',
        sl: 'en',
        tl: 'ko',
        dt: 't',
        q: source,
      });
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query}`);
      if (!response.ok) throw new Error(`Google translate endpoint returned ${response.status}`);
      const payload = await response.json();
      const text = Array.isArray(payload?.[0])
        ? payload[0].map(part => part?.[0] ?? '').join('')
        : '';
      const lines = text.split('\n');
      if (lines.length === batch.length) {
        batch.forEach((meaning, index) => result.set(meaning, lines[index].trim() || meaning));
      } else {
        batch.forEach((meaning, index) => result.set(meaning, lines[index]?.trim() || meaning));
      }
      console.log(`translated ${Math.min(i + batch.length, unique.length)} / ${unique.length}`);
    } catch (error) {
      console.warn(`translation fallback for batch ${i}:`, error?.message ?? error);
      batch.forEach(meaning => result.set(meaning, meaning));
    }
  }
  return result;
}

async function loadLevel(level) {
  const response = await fetch(SOURCES[level]);
  if (!response.ok) throw new Error(`Failed to fetch ${level}: ${response.status}`);
  const rows = parseCsv(await response.text());
  const [, ...records] = rows;
  const seen = new Set();
  return records
    .map(([expression = '', reading = '', meaning = '', tags = '']) => ({
      expression: expression.trim(),
      reading: reading.trim(),
      meaning: meaning.trim(),
      tags: tags.trim(),
    }))
    .filter(item => item.expression && item.reading && item.meaning)
    .filter(item => {
      const key = `${item.expression}\t${item.reading}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function toTsString(value) {
  return JSON.stringify(value);
}

function makeExampleRomaji(spoken) {
  const head = kanaToRomaji(spoken);
  return head ? `${head} o oboemasu` : 'oboemasu';
}

function makeExampleKo(meaningKo, partOfSpeech) {
  const verb = partOfSpeech === '\uD45C\uD604' ? '\uC775\uD799\uB2C8\uB2E4' : '\uC678\uC6C1\uB2C8\uB2E4';
  return `\u2018${meaningKo}\u2019\uC744 ${verb}.`;
}

function emitLevel(level, rows, translations) {
  const levelLower = level.toLowerCase();
  const constName = `jlpt${level}Vocab`;
  const items = rows.map((row, index) => {
    const priority = /Genki|Intermediate_Japanese/i.test(row.tags) ? 'essential' : 'recommended';
    const { word: displayWord, kana } = pickWordAndKana(row.expression, row.reading);
    const spoken = sanitizeJapanese(kana || displayWord);
    const displayForSentence = sanitizeJapanese(displayWord) || spoken;
    const meaningKo = translations.get(row.meaning) ?? row.meaning;
    const partOfSpeech = inferPartOfSpeech(displayWord, row.meaning);
    return {
      id: `jlpt-${levelLower}-${String(index + 1).padStart(3, '0')}`,
      level,
      word: displayWord,
      kana,
      romaji: kanaToRomaji(kana),
      meaningKo,
      partOfSpeech,
      exampleJa: `\u300c${displayForSentence}\u300d\u3092\u899a\u3048\u307e\u3059\u3002`,
      exampleRomaji: makeExampleRomaji(spoken),
      exampleKo: makeExampleKo(meaningKo, partOfSpeech),
      tags: makeTags(row.tags, priority, level),
      priority,
      wordTtsText: spoken,
      exampleTtsText: `${spoken}\u3092\u304a\u307c\u3048\u307e\u3059\u3002`,
    };
  });

  const body = [
    "import type { JlptVocabItem } from './types';",
    '',
    `export const ${constName}: JlptVocabItem[] = [`,
    ...items.map(item => [
      '  {',
      `    id: ${toTsString(item.id)},`,
      `    level: ${toTsString(item.level)},`,
      `    word: ${toTsString(item.word)},`,
      `    kana: ${toTsString(item.kana)},`,
      `    romaji: ${toTsString(item.romaji)},`,
      `    meaningKo: ${toTsString(item.meaningKo)},`,
      `    partOfSpeech: ${toTsString(item.partOfSpeech)},`,
      `    exampleJa: ${toTsString(item.exampleJa)},`,
      `    exampleRomaji: ${toTsString(item.exampleRomaji)},`,
      `    exampleKo: ${toTsString(item.exampleKo)},`,
      `    tags: ${JSON.stringify(item.tags)},`,
      `    priority: ${toTsString(item.priority)},`,
      `    wordTtsText: ${toTsString(item.wordTtsText)},`,
      `    exampleTtsText: ${toTsString(item.exampleTtsText)},`,
      '  },',
    ].join('\n')),
    '];',
    '',
  ].join('\n');

  return { body, count: items.length };
}

const levels = /** @type {const} */ (['N5', 'N4']);
const loaded = new Map();
for (const level of levels) {
  loaded.set(level, await loadLevel(level));
}

const allMeanings = levels.flatMap(level => loaded.get(level).map(row => row.meaning));
const translations = await translateMeanings(allMeanings);

await mkdir(join(repoRoot, 'data', 'jlpt'), { recursive: true });

for (const level of levels) {
  const { body, count } = emitLevel(level, loaded.get(level), translations);
  await writeFile(join(repoRoot, 'data', 'jlpt', `vocab-${level.toLowerCase()}.ts`), body, 'utf8');
  console.log(`wrote ${level}: ${count} items`);
}

await writeFile(
  join(repoRoot, 'data', 'jlpt', 'README.md'),
  [
    '# JLPT vocabulary data',
    '',
    'This directory contains JLPT N5/N4 vocabulary candidate data used by the app.',
    '',
    '## Sources',
    '',
    '- Vocabulary source: [`elzup/jlpt-word-list`](https://github.com/elzup/jlpt-word-list), MIT License.',
    '- That project notes its source chain as `chyyran/jlpt-anki-decks`, based on JLPT decks from tanos.co.uk and forked from `jamsinclair/open-anki-jlpt-decks`.',
    '- Korean meanings are machine-translated from the English glosses during local data generation and lightly normalized by the app schema.',
    '',
    '## Notes',
    '',
    '- JLPT does not publish official vocabulary lists. These files should be treated as open-license JLPT candidate study data, not an official exam list.',
    '- `romaji` values are generated from kana readings and stored in lowercase.',
    '- `wordTtsText` and `exampleTtsText` intentionally contain Japanese reading text only.',
    '',
  ].join('\n'),
  'utf8',
);
