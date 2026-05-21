import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { jlptN5Vocab } from '../data/jlpt/vocab-n5.ts';
import { jlptN4Vocab } from '../data/jlpt/vocab-n4.ts';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const manualExamples = new Map([
  ['おくじょう', {
    exampleJa: '天気がいいから、屋上に行ってみようよ。',
    exampleTtsText: 'てんきがいいから、おくじょうにいってみようよ。',
    exampleRomaji: 'tenki ga ii kara okujou ni itte miyou yo',
    exampleKo: '날씨가 좋으니까 옥상에 가 보자.',
  }],
  ['ああ', {
    exampleJa: 'ああ、そうですか。',
    exampleTtsText: 'ああ、そうですか。',
    exampleRomaji: 'aa sou desu ka',
    exampleKo: '아, 그렇습니까?',
  }],
  ['もしもし', {
    exampleJa: 'もしもし、田中さんですか。',
    exampleTtsText: 'もしもし、たなかさんですか。',
    exampleRomaji: 'moshimoshi tanaka san desu ka',
    exampleKo: '여보세요, 다나카 씨입니까?',
  }],
]);

const kanaToRomajiMap = new Map(Object.entries({
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ゃ: 'ya', ゅ: 'yu', ょ: 'yo',
  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'o', ン: 'n',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  ダ: 'da', ヂ: 'ji', ヅ: 'zu', デ: 'de', ド: 'do',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
  ァ: 'a', ィ: 'i', ゥ: 'u', ェ: 'e', ォ: 'o',
  ャ: 'ya', ュ: 'yu', ョ: 'yo',
}));

const yoonMap = new Map(Object.entries({
  kiya: 'kya', kiyu: 'kyu', kiyo: 'kyo',
  giya: 'gya', giyu: 'gyu', giyo: 'gyo',
  shiya: 'sha', shiyu: 'shu', shiyo: 'sho',
  jiya: 'ja', jiyu: 'ju', jiyo: 'jo',
  chiya: 'cha', chiyu: 'chu', chiyo: 'cho',
  niya: 'nya', niyu: 'nyu', niyo: 'nyo',
  hiya: 'hya', hiyu: 'hyu', hiyo: 'hyo',
  biya: 'bya', biyu: 'byu', biyo: 'byo',
  piya: 'pya', piyu: 'pyu', piyo: 'pyo',
  miya: 'mya', miyu: 'myu', miyo: 'myo',
  riya: 'rya', riyu: 'ryu', riyo: 'ryo',
}));

function stripVariant(value) {
  return String(value ?? '')
    .split(/[;/]/)[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/[「」『』]/g, '')
    .trim();
}

function firstMeaning(value) {
  return stripVariant(value)
    .split(/[;,、]/)[0]
    .replace(/^~/, '')
    .trim();
}

function cleanJapanese(value) {
  return stripVariant(value).replace(/\s+/g, '');
}

function kanaToRomaji(input) {
  const chars = [...String(input ?? '').replace(/\s+/g, '')];
  const out = [];
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const next = chars[i + 1];

    if (char === 'っ' || char === 'ッ') {
      const nextRomaji = kanaToRomajiMap.get(next ?? '');
      if (nextRomaji) out.push(nextRomaji[0]);
      continue;
    }

    if (char === 'ー') {
      const previous = out[out.length - 1] ?? '';
      const vowel = [...previous].reverse().find((c) => 'aeiou'.includes(c));
      if (vowel) out.push(vowel);
      continue;
    }

    if ('ゃゅょャュョ'.includes(next ?? '')) {
      const base = kanaToRomajiMap.get(char) ?? '';
      const tail = kanaToRomajiMap.get(next) ?? '';
      const combined = yoonMap.get(`${base}${tail}`);
      if (combined) {
        out.push(combined);
        i += 1;
        continue;
      }
    }

    if ('、。，．！？!?'.includes(char)) {
      out.push(' ');
      continue;
    }

    out.push(kanaToRomajiMap.get(char) ?? ' ');
  }

  return out.join('')
    .replace(/\s+/g, ' ')
    .replace(/\s+(ka|yo|ne|wa|o|e|ni|de|to|mo|ga|no)\b/g, ' $1')
    .trim()
    .toLowerCase();
}

function particleForObject(korean) {
  const char = [...String(korean)].reverse().find((value) => /[가-힣]/.test(value));
  if (!char) return '를';
  return (char.charCodeAt(0) - 0xac00) % 28 === 0 ? '를' : '을';
}

function particleForWith(korean) {
  const char = [...String(korean)].reverse().find((value) => /[가-힣]/.test(value));
  if (!char) return '와';
  return (char.charCodeAt(0) - 0xac00) % 28 === 0 ? '와' : '과';
}

function koreanVerbPotential(meaning) {
  const source = firstMeaning(meaning);
  const table = new Map(Object.entries({
    '만나다': '만날 수 있습니다',
    '보다': '볼 수 있습니다',
    '가다': '갈 수 있습니다',
    '오다': '올 수 있습니다',
    '먹다': '먹을 수 있습니다',
    '마시다': '마실 수 있습니다',
    '읽다': '읽을 수 있습니다',
    '쓰다': '쓸 수 있습니다',
    '듣다': '들을 수 있습니다',
    '사다': '살 수 있습니다',
    '자다': '잘 수 있습니다',
    '열다': '열 수 있습니다',
    '닫다': '닫을 수 있습니다',
    '입다': '입을 수 있습니다',
    '앉다': '앉을 수 있습니다',
    '서다': '설 수 있습니다',
    '알다': '알 수 있습니다',
    '모르다': '모를 수 있습니다',
    '배우다': '배울 수 있습니다',
    '기다리다': '기다릴 수 있습니다',
    '쉬다': '쉴 수 있습니다',
    '부르다': '부를 수 있습니다',
    '잊다': '잊을 수 있습니다',
    '건너다': '건널 수 있습니다',
    '주다': '줄 수 있습니다',
    '받다': '받을 수 있습니다',
    '들어올리다': '들어올릴 수 있습니다',
  }));
  if (table.has(source)) return table.get(source);
  if (source.endsWith('하다')) return `${source.slice(0, -2)}할 수 있습니다`;
  if (source.endsWith('되다')) return `${source.slice(0, -2)}될 수 있습니다`;
  if (source.endsWith('다')) return `${source.slice(0, -1)} 수 있습니다`;
  return `${source}할 수 있습니다`;
}

function koreanAdjectiveSentence(meaning) {
  const source = firstMeaning(meaning);
  const table = new Map(Object.entries({
    '밝다': '밝네요',
    '어렵다': '어렵네요',
    '어려운': '어렵네요',
    '쉽다': '쉽네요',
    '쉬운': '쉽네요',
    '좋다': '좋네요',
    '나쁘다': '나쁘네요',
    '나쁜': '나쁘네요',
    '크다': '크네요',
    '작다': '작네요',
    '길다': '기네요',
    '짧다': '짧네요',
    '덥다': '덥네요',
    '춥다': '춥네요',
    '젊다': '젊네요',
    '젊은': '젊네요',
    '약하다': '약하네요',
    '약한': '약하네요',
    '강하다': '강하네요',
  }));
  if (table.has(source)) return table.get(source);
  if (source.endsWith('색')) return `${source}이네요`;
  if (source.endsWith('다')) return `${source.slice(0, -1)} 느낌입니다`;
  return `${source}입니다`;
}

function categoryFor(item) {
  const meaning = firstMeaning(item.meaningKo);
  const text = `${item.word} ${item.kana} ${meaning} ${item.tags.join(' ')}`;

  if (/동사/.test(item.partOfSpeech)) return 'verb';
  if (/형용사/.test(item.partOfSpeech)) return 'adjective';
  if (/부사/.test(item.partOfSpeech)) return 'adverb';
  if (/색|빨간|파란|검은|하얀|노란/.test(text)) return 'color';
  if (/아침|저녁|밤|낮|오늘|내일|어제|요일|월|년|시간|분|계절|봄|여름|가을|겨울|날/.test(text)) return 'time';
  if (/학교|역|집|가게|방|교실|도서관|병원|회사|공원|屋上|마을|우체국|식당|레스토랑|공항|은행|곳|장소/.test(text)) return 'place';
  if (/사람|학생|선생|친구|가족|어머니|아버지|형|누나|동생|아이|부모|유학생|店員|손님|상인/.test(text)) return 'person';
  if (!/사물|청과물|건물|선물/.test(meaning) && /^(밥|빵|물|차|커피|우유|고기|생선|야채|과일|사과|술|음식|수프|케이크|토마토|초밥)$|마시|먹/.test(meaning)) return 'food';
  if (/책|신문|잡지|편지|문제|글|말|일본어|영어|한자|숙제|시험|공부/.test(text)) return 'study';
  if (/옷|신발|가방|안경|우산|펜|카메라|시계|라디오|전화|차|버스|자전거|돈|사진|지도|종이|컵/.test(text)) return 'object';
  if (item.partOfSpeech === '표현') return 'expression';
  return 'noun';
}

function makeExample(item) {
  const manual = manualExamples.get(cleanJapanese(item.kana)) ?? manualExamples.get(cleanJapanese(item.word));
  if (manual) return manual;

  const display = cleanJapanese(item.word) || cleanJapanese(item.kana);
  const reading = cleanJapanese(item.kana) || display;
  const romaji = item.romaji.toLowerCase();
  const meaning = firstMeaning(item.meaningKo) || item.meaningKo;
  const objectParticle = particleForObject(meaning);
  const withParticle = particleForWith(meaning);
  const category = categoryFor(item);

  switch (category) {
    case 'verb':
      return {
        exampleJa: `${display}ことができます。`,
        exampleTtsText: `${reading}ことができます。`,
        exampleRomaji: `${romaji} koto ga dekimasu`,
        exampleKo: `${koreanVerbPotential(meaning)}.`,
      };
    case 'adjective':
      return {
        exampleJa: `${display}ですね。`,
        exampleTtsText: `${reading}ですね。`,
        exampleRomaji: `${romaji} desu ne`,
        exampleKo: `${koreanAdjectiveSentence(meaning)}.`,
      };
    case 'adverb':
      return {
        exampleJa: `${display}話しましょう。`,
        exampleTtsText: `${reading}はなしましょう。`,
        exampleRomaji: `${romaji} hanashimashou`,
        exampleKo: `${meaning} 말해 봅시다.`,
      };
    case 'color':
      return {
        exampleJa: `${display}が好きです。`,
        exampleTtsText: `${reading}がすきです。`,
        exampleRomaji: `${romaji} ga suki desu`,
        exampleKo: `${meaning}을 좋아합니다.`,
      };
    case 'time':
      return {
        exampleJa: `${display}に勉強します。`,
        exampleTtsText: `${reading}にべんきょうします。`,
        exampleRomaji: `${romaji} ni benkyou shimasu`,
        exampleKo: `${meaning}에 공부합니다.`,
      };
    case 'place':
      return {
        exampleJa: `${display}へ行きます。`,
        exampleTtsText: `${reading}へいきます。`,
        exampleRomaji: `${romaji} e ikimasu`,
        exampleKo: `${meaning}에 갑니다.`,
      };
    case 'person':
      return {
        exampleJa: `${display}と話します。`,
        exampleTtsText: `${reading}とはなします。`,
        exampleRomaji: `${romaji} to hanashimasu`,
        exampleKo: `${meaning}${withParticle} 이야기합니다.`,
      };
    case 'food': {
      const isDrink = /물|차|커피|우유|술|수프|마시/.test(meaning);
      return {
        exampleJa: isDrink ? `${display}を飲みます。` : `${display}を食べます。`,
        exampleTtsText: isDrink ? `${reading}をのみます。` : `${reading}をたべます。`,
        exampleRomaji: isDrink ? `${romaji} o nomimasu` : `${romaji} o tabemasu`,
        exampleKo: isDrink ? `${meaning}${objectParticle} 마십니다.` : `${meaning}${objectParticle} 먹습니다.`,
      };
    }
    case 'study':
      return {
        exampleJa: `${display}を読みます。`,
        exampleTtsText: `${reading}をよみます。`,
        exampleRomaji: `${romaji} o yomimasu`,
        exampleKo: `${meaning}${objectParticle} 읽습니다.`,
      };
    case 'object':
      return {
        exampleJa: `${display}を使います。`,
        exampleTtsText: `${reading}をつかいます。`,
        exampleRomaji: `${romaji} o tsukaimasu`,
        exampleKo: `${meaning}${objectParticle} 사용합니다.`,
      };
    case 'expression':
      return {
        exampleJa: `${display}、また話しましょう。`,
        exampleTtsText: `${reading}、またはなしましょう。`,
        exampleRomaji: `${romaji} mata hanashimashou`,
        exampleKo: `${meaning}, 다시 이야기합시다.`,
      };
    default:
      return {
        exampleJa: `${display}を見ます。`,
        exampleTtsText: `${reading}をみます。`,
        exampleRomaji: `${romaji} o mimasu`,
        exampleKo: `${meaning}${objectParticle} 봅니다.`,
      };
  }
}

function normalizeRomaji(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\bo\b/g, 'o')
    .trim()
    .toLowerCase();
}

function updateItems(items) {
  return items.map((item) => {
    const example = makeExample(item);
    return {
      ...item,
      exampleJa: example.exampleJa,
      exampleRomaji: normalizeRomaji(example.exampleRomaji || kanaToRomaji(example.exampleTtsText)),
      exampleKo: example.exampleKo,
      exampleTtsText: example.exampleTtsText,
    };
  });
}

function toTsString(value) {
  return JSON.stringify(value);
}

function writeVocabFile(level, items) {
  const constName = level === 'N5' ? 'jlptN5Vocab' : 'jlptN4Vocab';
  const rows = [
    "import type { JlptVocabItem } from './types';",
    '',
    `export const ${constName}: JlptVocabItem[] = [`,
  ];

  for (const item of items) {
    rows.push('  {');
    rows.push(`    id: ${toTsString(item.id)},`);
    rows.push(`    level: ${toTsString(item.level)},`);
    rows.push(`    word: ${toTsString(item.word)},`);
    rows.push(`    kana: ${toTsString(item.kana)},`);
    rows.push(`    romaji: ${toTsString(item.romaji.toLowerCase())},`);
    rows.push(`    meaningKo: ${toTsString(item.meaningKo)},`);
    rows.push(`    partOfSpeech: ${toTsString(item.partOfSpeech)},`);
    rows.push(`    exampleJa: ${toTsString(item.exampleJa)},`);
    rows.push(`    exampleRomaji: ${toTsString(item.exampleRomaji)},`);
    rows.push(`    exampleKo: ${toTsString(item.exampleKo)},`);
    rows.push(`    tags: ${JSON.stringify(item.tags)},`);
    rows.push(`    priority: ${toTsString(item.priority)},`);
    if (item.wordTtsText) rows.push(`    wordTtsText: ${toTsString(item.wordTtsText)},`);
    if (item.exampleTtsText) rows.push(`    exampleTtsText: ${toTsString(item.exampleTtsText)},`);
    rows.push('  },');
  }

  rows.push('];');
  rows.push('');
  return rows.join('\n');
}

const nextN5 = updateItems(jlptN5Vocab);
const nextN4 = updateItems(jlptN4Vocab);

await writeFile(join(repoRoot, 'data/jlpt/vocab-n5.ts'), writeVocabFile('N5', nextN5), 'utf8');
await writeFile(join(repoRoot, 'data/jlpt/vocab-n4.ts'), writeVocabFile('N4', nextN4), 'utf8');

console.log(`Updated JLPT examples (${nextN5.length} N5, ${nextN4.length} N4)`);
