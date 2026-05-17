export type JlptKanaScript = 'hiragana' | 'katakana';
export type JlptKanaGroup = 'basic' | 'dakuten' | 'handakuten' | 'yoon' | 'small' | 'special';

export type JlptKanaItem = {
  id: string;
  script: JlptKanaScript;
  kana: string;
  romaji: string;
  row: string;
  group: JlptKanaGroup;
  example: string;
  exampleKo: string;
  exampleSentenceJa: string;
  exampleSentenceKo: string;
};

type KanaSeed = {
  hiragana: string;
  katakana: string;
  romaji: string;
  row: string;
  group: JlptKanaGroup;
  exampleHiragana: string;
  exampleKatakana: string;
  exampleKo: string;
  sentenceHiragana: string;
  sentenceKatakana: string;
  sentenceKo: string;
};

const rows: Array<{ row: string; group: JlptKanaGroup; pairs: Array<[string, string, string]> }> = [
  { row: 'vowels', group: 'basic', pairs: [['あ', 'ア', 'a'], ['い', 'イ', 'i'], ['う', 'ウ', 'u'], ['え', 'エ', 'e'], ['お', 'オ', 'o']] },
  { row: 'k', group: 'basic', pairs: [['か', 'カ', 'ka'], ['き', 'キ', 'ki'], ['く', 'ク', 'ku'], ['け', 'ケ', 'ke'], ['こ', 'コ', 'ko']] },
  { row: 's', group: 'basic', pairs: [['さ', 'サ', 'sa'], ['し', 'シ', 'shi'], ['す', 'ス', 'su'], ['せ', 'セ', 'se'], ['そ', 'ソ', 'so']] },
  { row: 't', group: 'basic', pairs: [['た', 'タ', 'ta'], ['ち', 'チ', 'chi'], ['つ', 'ツ', 'tsu'], ['て', 'テ', 'te'], ['と', 'ト', 'to']] },
  { row: 'n', group: 'basic', pairs: [['な', 'ナ', 'na'], ['に', 'ニ', 'ni'], ['ぬ', 'ヌ', 'nu'], ['ね', 'ネ', 'ne'], ['の', 'ノ', 'no']] },
  { row: 'h', group: 'basic', pairs: [['は', 'ハ', 'ha'], ['ひ', 'ヒ', 'hi'], ['ふ', 'フ', 'fu'], ['へ', 'ヘ', 'he'], ['ほ', 'ホ', 'ho']] },
  { row: 'm', group: 'basic', pairs: [['ま', 'マ', 'ma'], ['み', 'ミ', 'mi'], ['む', 'ム', 'mu'], ['め', 'メ', 'me'], ['も', 'モ', 'mo']] },
  { row: 'y', group: 'basic', pairs: [['や', 'ヤ', 'ya'], ['ゆ', 'ユ', 'yu'], ['よ', 'ヨ', 'yo']] },
  { row: 'r', group: 'basic', pairs: [['ら', 'ラ', 'ra'], ['り', 'リ', 'ri'], ['る', 'ル', 'ru'], ['れ', 'レ', 're'], ['ろ', 'ロ', 'ro']] },
  { row: 'w/n', group: 'basic', pairs: [['わ', 'ワ', 'wa'], ['を', 'ヲ', 'wo'], ['ん', 'ン', 'n']] },
  { row: 'g', group: 'dakuten', pairs: [['が', 'ガ', 'ga'], ['ぎ', 'ギ', 'gi'], ['ぐ', 'グ', 'gu'], ['げ', 'ゲ', 'ge'], ['ご', 'ゴ', 'go']] },
  { row: 'z', group: 'dakuten', pairs: [['ざ', 'ザ', 'za'], ['じ', 'ジ', 'ji'], ['ず', 'ズ', 'zu'], ['ぜ', 'ゼ', 'ze'], ['ぞ', 'ゾ', 'zo']] },
  { row: 'd', group: 'dakuten', pairs: [['だ', 'ダ', 'da'], ['ぢ', 'ヂ', 'ji'], ['づ', 'ヅ', 'zu'], ['で', 'デ', 'de'], ['ど', 'ド', 'do']] },
  { row: 'b', group: 'dakuten', pairs: [['ば', 'バ', 'ba'], ['び', 'ビ', 'bi'], ['ぶ', 'ブ', 'bu'], ['べ', 'ベ', 'be'], ['ぼ', 'ボ', 'bo']] },
  { row: 'p', group: 'handakuten', pairs: [['ぱ', 'パ', 'pa'], ['ぴ', 'ピ', 'pi'], ['ぷ', 'プ', 'pu'], ['ぺ', 'ペ', 'pe'], ['ぽ', 'ポ', 'po']] },
  { row: 'ky', group: 'yoon', pairs: [['きゃ', 'キャ', 'kya'], ['きゅ', 'キュ', 'kyu'], ['きょ', 'キョ', 'kyo']] },
  { row: 'sh', group: 'yoon', pairs: [['しゃ', 'シャ', 'sha'], ['しゅ', 'シュ', 'shu'], ['しょ', 'ショ', 'sho']] },
  { row: 'ch', group: 'yoon', pairs: [['ちゃ', 'チャ', 'cha'], ['ちゅ', 'チュ', 'chu'], ['ちょ', 'チョ', 'cho']] },
  { row: 'ny', group: 'yoon', pairs: [['にゃ', 'ニャ', 'nya'], ['にゅ', 'ニュ', 'nyu'], ['にょ', 'ニョ', 'nyo']] },
  { row: 'hy', group: 'yoon', pairs: [['ひゃ', 'ヒャ', 'hya'], ['ひゅ', 'ヒュ', 'hyu'], ['ひょ', 'ヒョ', 'hyo']] },
  { row: 'my', group: 'yoon', pairs: [['みゃ', 'ミャ', 'mya'], ['みゅ', 'ミュ', 'myu'], ['みょ', 'ミョ', 'myo']] },
  { row: 'ry', group: 'yoon', pairs: [['りゃ', 'リャ', 'rya'], ['りゅ', 'リュ', 'ryu'], ['りょ', 'リョ', 'ryo']] },
  { row: 'gy', group: 'yoon', pairs: [['ぎゃ', 'ギャ', 'gya'], ['ぎゅ', 'ギュ', 'gyu'], ['ぎょ', 'ギョ', 'gyo']] },
  { row: 'j', group: 'yoon', pairs: [['じゃ', 'ジャ', 'ja'], ['じゅ', 'ジュ', 'ju'], ['じょ', 'ジョ', 'jo']] },
  { row: 'by', group: 'yoon', pairs: [['びゃ', 'ビャ', 'bya'], ['びゅ', 'ビュ', 'byu'], ['びょ', 'ビョ', 'byo']] },
  { row: 'py', group: 'yoon', pairs: [['ぴゃ', 'ピャ', 'pya'], ['ぴゅ', 'ピュ', 'pyu'], ['ぴょ', 'ピョ', 'pyo']] },
  { row: 'small', group: 'small', pairs: [['ぁ', 'ァ', 'small a'], ['ぃ', 'ィ', 'small i'], ['ぅ', 'ゥ', 'small u'], ['ぇ', 'ェ', 'small e'], ['ぉ', 'ォ', 'small o'], ['っ', 'ッ', 'small tsu'], ['ゃ', 'ャ', 'small ya'], ['ゅ', 'ュ', 'small yu'], ['ょ', 'ョ', 'small yo']] },
  { row: 'sound mark', group: 'special', pairs: [['ー', 'ー', 'long vowel']] },
];

const examples: Record<string, Omit<KanaSeed, 'hiragana' | 'katakana' | 'romaji' | 'row' | 'group'>> = {
  a: { exampleHiragana: 'あさ', exampleKatakana: 'アニメ', exampleKo: '아침 / 애니메이션', sentenceHiragana: 'あさにみずをのみます。', sentenceKatakana: 'アニメをみます。', sentenceKo: '아침에 물을 마십니다. / 애니메이션을 봅니다.' },
  i: { exampleHiragana: 'いぬ', exampleKatakana: 'インク', exampleKo: '개 / 잉크', sentenceHiragana: 'いぬがいます。', sentenceKatakana: 'インクをかいます。', sentenceKo: '개가 있습니다. / 잉크를 삽니다.' },
  u: { exampleHiragana: 'うみ', exampleKatakana: 'ウール', exampleKo: '바다 / 울', sentenceHiragana: 'うみへいきます。', sentenceKatakana: 'ウールのふくです。', sentenceKo: '바다에 갑니다. / 울 옷입니다.' },
  e: { exampleHiragana: 'えき', exampleKatakana: 'エアコン', exampleKo: '역 / 에어컨', sentenceHiragana: 'えきでまちます。', sentenceKatakana: 'エアコンをつけます。', sentenceKo: '역에서 기다립니다. / 에어컨을 켭니다.' },
  o: { exampleHiragana: 'おと', exampleKatakana: 'オレンジ', exampleKo: '소리 / 오렌지', sentenceHiragana: 'おとがきこえます。', sentenceKatakana: 'オレンジをたべます。', sentenceKo: '소리가 들립니다. / 오렌지를 먹습니다.' },
  ka: { exampleHiragana: 'かさ', exampleKatakana: 'カメラ', exampleKo: '우산 / 카메라', sentenceHiragana: 'かさをもっています。', sentenceKatakana: 'カメラでとります。', sentenceKo: '우산을 가지고 있습니다. / 카메라로 찍습니다.' },
  ki: { exampleHiragana: 'きた', exampleKatakana: 'キロ', exampleKo: '북쪽 / 킬로', sentenceHiragana: 'きたへいきます。', sentenceKatakana: 'キロであらわします。', sentenceKo: '북쪽으로 갑니다. / 킬로로 나타냅니다.' },
  ku: { exampleHiragana: 'くつ', exampleKatakana: 'クラス', exampleKo: '신발 / 반', sentenceHiragana: 'くつをはきます。', sentenceKatakana: 'クラスにいます。', sentenceKo: '신발을 신습니다. / 반에 있습니다.' },
  ke: { exampleHiragana: 'けさ', exampleKatakana: 'ケーキ', exampleKo: '오늘 아침 / 케이크', sentenceHiragana: 'けさべんきょうしました。', sentenceKatakana: 'ケーキをたべます。', sentenceKo: '오늘 아침 공부했습니다. / 케이크를 먹습니다.' },
  ko: { exampleHiragana: 'こえ', exampleKatakana: 'コップ', exampleKo: '목소리 / 컵', sentenceHiragana: 'こえがきれいです。', sentenceKatakana: 'コップをあらいます。', sentenceKo: '목소리가 예쁩니다. / 컵을 씻습니다.' },
  sa: { exampleHiragana: 'さかな', exampleKatakana: 'サラダ', exampleKo: '생선 / 샐러드', sentenceHiragana: 'さかなをたべます。', sentenceKatakana: 'サラダをつくります。', sentenceKo: '생선을 먹습니다. / 샐러드를 만듭니다.' },
  shi: { exampleHiragana: 'しお', exampleKatakana: 'シャツ', exampleKo: '소금 / 셔츠', sentenceHiragana: 'しおをいれます。', sentenceKatakana: 'シャツをきます。', sentenceKo: '소금을 넣습니다. / 셔츠를 입습니다.' },
  su: { exampleHiragana: 'すし', exampleKatakana: 'スープ', exampleKo: '초밥 / 수프', sentenceHiragana: 'すしがすきです。', sentenceKatakana: 'スープをのみます。', sentenceKo: '초밥을 좋아합니다. / 수프를 마십니다.' },
  se: { exampleHiragana: 'せんせい', exampleKatakana: 'セーター', exampleKo: '선생님 / 스웨터', sentenceHiragana: 'せんせいにききます。', sentenceKatakana: 'セーターをきます。', sentenceKo: '선생님께 묻습니다. / 스웨터를 입습니다.' },
  so: { exampleHiragana: 'そら', exampleKatakana: 'ソファ', exampleKo: '하늘 / 소파', sentenceHiragana: 'そらをみます。', sentenceKatakana: 'ソファにすわります。', sentenceKo: '하늘을 봅니다. / 소파에 앉습니다.' },
  ta: { exampleHiragana: 'たこ', exampleKatakana: 'タクシー', exampleKo: '문어 / 택시', sentenceHiragana: 'たこをたべます。', sentenceKatakana: 'タクシーにのります。', sentenceKo: '문어를 먹습니다. / 택시를 탑니다.' },
  chi: { exampleHiragana: 'ちず', exampleKatakana: 'チーズ', exampleKo: '지도 / 치즈', sentenceHiragana: 'ちずをみます。', sentenceKatakana: 'チーズをたべます。', sentenceKo: '지도를 봅니다. / 치즈를 먹습니다.' },
  tsu: { exampleHiragana: 'つき', exampleKatakana: 'ツアー', exampleKo: '달 / 투어', sentenceHiragana: 'つきがみえます。', sentenceKatakana: 'ツアーにいきます。', sentenceKo: '달이 보입니다. / 투어에 갑니다.' },
  te: { exampleHiragana: 'て', exampleKatakana: 'テスト', exampleKo: '손 / 시험', sentenceHiragana: 'てをあらいます。', sentenceKatakana: 'テストがあります。', sentenceKo: '손을 씻습니다. / 시험이 있습니다.' },
  to: { exampleHiragana: 'とけい', exampleKatakana: 'トマト', exampleKo: '시계 / 토마토', sentenceHiragana: 'とけいをみます。', sentenceKatakana: 'トマトをたべます。', sentenceKo: '시계를 봅니다. / 토마토를 먹습니다.' },
};

const fallbackByGroup: Record<JlptKanaGroup, Omit<KanaSeed, 'hiragana' | 'katakana' | 'romaji' | 'row' | 'group'>> = {
  basic: examples.a,
  dakuten: { exampleHiragana: 'がっこう', exampleKatakana: 'ゲーム', exampleKo: '학교 / 게임', sentenceHiragana: 'がっこうへいきます。', sentenceKatakana: 'ゲームをします。', sentenceKo: '학교에 갑니다. / 게임을 합니다.' },
  handakuten: { exampleHiragana: 'ぱん', exampleKatakana: 'ペン', exampleKo: '빵 / 펜', sentenceHiragana: 'ぱんをたべます。', sentenceKatakana: 'ペンでかきます。', sentenceKo: '빵을 먹습니다. / 펜으로 씁니다.' },
  yoon: { exampleHiragana: 'きょう', exampleKatakana: 'ジュース', exampleKo: '오늘 / 주스', sentenceHiragana: 'きょうはやすみです。', sentenceKatakana: 'ジュースをのみます。', sentenceKo: '오늘은 쉽니다. / 주스를 마십니다.' },
  small: { exampleHiragana: 'きって', exampleKatakana: 'バッグ', exampleKo: '우표 / 가방', sentenceHiragana: 'きってをかいます。', sentenceKatakana: 'バッグをもっています。', sentenceKo: '우표를 삽니다. / 가방을 가지고 있습니다.' },
  special: { exampleHiragana: 'おばあさん', exampleKatakana: 'コーヒー', exampleKo: '할머니 / 커피', sentenceHiragana: 'おばあさんにあいます。', sentenceKatakana: 'コーヒーをのみます。', sentenceKo: '할머니를 만납니다. / 커피를 마십니다.' },
};

const seeds: KanaSeed[] = rows.flatMap(({ row, group, pairs }) =>
  pairs.map(([hiragana, katakana, romaji]) => ({
    hiragana,
    katakana,
    romaji,
    row,
    group,
    ...(examples[romaji] ?? fallbackByGroup[group]),
  }))
);

export const jlptHiragana: JlptKanaItem[] = seeds.map((seed, index) => ({
  id: `hiragana-${String(index + 1).padStart(3, '0')}`,
  script: 'hiragana',
  kana: seed.hiragana,
  romaji: seed.romaji,
  row: seed.row,
  group: seed.group,
  example: seed.exampleHiragana,
  exampleKo: seed.exampleKo,
  exampleSentenceJa: seed.sentenceHiragana,
  exampleSentenceKo: seed.sentenceKo,
}));

export const jlptKatakana: JlptKanaItem[] = seeds.map((seed, index) => ({
  id: `katakana-${String(index + 1).padStart(3, '0')}`,
  script: 'katakana',
  kana: seed.katakana,
  romaji: seed.romaji,
  row: seed.row,
  group: seed.group,
  example: seed.exampleKatakana,
  exampleKo: seed.exampleKo,
  exampleSentenceJa: seed.sentenceKatakana,
  exampleSentenceKo: seed.sentenceKo,
}));

export function getJlptKana(script: JlptKanaScript) {
  return script === 'katakana' ? jlptKatakana : jlptHiragana;
}
