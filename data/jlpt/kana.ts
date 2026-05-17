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
  exampleRomaji: string;
  exampleSentenceJa: string;
  exampleSentenceKo: string;
  exampleSentenceRomaji: string;
};

type KanaSeed = {
  hiragana: string;
  katakana: string;
  romaji: string;
  row: string;
  group: JlptKanaGroup;
  exampleHiragana: string;
  exampleKatakana: string;
  exampleKoHiragana: string;
  exampleKoKatakana: string;
  exampleRomajiHiragana: string;
  exampleRomajiKatakana: string;
  sentenceHiragana: string;
  sentenceKatakana: string;
  sentenceKoHiragana: string;
  sentenceKoKatakana: string;
  sentenceRomajiHiragana: string;
  sentenceRomajiKatakana: string;
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
  a: { exampleHiragana: 'あさ', exampleKatakana: 'アニメ', exampleKoHiragana: '아침', exampleKoKatakana: '애니메이션', exampleRomajiHiragana: 'asa', exampleRomajiKatakana: 'anime', sentenceHiragana: 'あさにみずをのみます。', sentenceKatakana: 'アニメをみます。', sentenceRomajiHiragana: 'asa ni mizu o nomimasu', sentenceRomajiKatakana: 'anime o mimasu', sentenceKoHiragana: '아침에 물을 마십니다.', sentenceKoKatakana: '애니메이션을 봅니다.' },
  i: { exampleHiragana: 'いぬ', exampleKatakana: 'インク', exampleKoHiragana: '개', exampleKoKatakana: '잉크', exampleRomajiHiragana: 'inu', exampleRomajiKatakana: 'inku', sentenceHiragana: 'いぬがいます。', sentenceKatakana: 'インクをかいます。', sentenceRomajiHiragana: 'inu ga imasu', sentenceRomajiKatakana: 'inku o kaimasu', sentenceKoHiragana: '개가 있습니다.', sentenceKoKatakana: '잉크를 삽니다.' },
  u: { exampleHiragana: 'うみ', exampleKatakana: 'ウール', exampleKoHiragana: '바다', exampleKoKatakana: '울', exampleRomajiHiragana: 'umi', exampleRomajiKatakana: 'uuru', sentenceHiragana: 'うみへいきます。', sentenceKatakana: 'ウールのふくです。', sentenceRomajiHiragana: 'umi e ikimasu', sentenceRomajiKatakana: 'uuru no fuku desu', sentenceKoHiragana: '바다에 갑니다.', sentenceKoKatakana: '울 옷입니다.' },
  e: { exampleHiragana: 'えき', exampleKatakana: 'エアコン', exampleKoHiragana: '역', exampleKoKatakana: '에어컨', exampleRomajiHiragana: 'eki', exampleRomajiKatakana: 'eakon', sentenceHiragana: 'えきでまちます。', sentenceKatakana: 'エアコンをつけます。', sentenceRomajiHiragana: 'eki de machimasu', sentenceRomajiKatakana: 'eakon o tsukemasu', sentenceKoHiragana: '역에서 기다립니다.', sentenceKoKatakana: '에어컨을 켭니다.' },
  o: { exampleHiragana: 'おと', exampleKatakana: 'オレンジ', exampleKoHiragana: '소리', exampleKoKatakana: '오렌지', exampleRomajiHiragana: 'oto', exampleRomajiKatakana: 'orenji', sentenceHiragana: 'おとがきこえます。', sentenceKatakana: 'オレンジをたべます。', sentenceRomajiHiragana: 'oto ga kikoemasu', sentenceRomajiKatakana: 'orenji o tabemasu', sentenceKoHiragana: '소리가 들립니다.', sentenceKoKatakana: '오렌지를 먹습니다.' },
  ka: { exampleHiragana: 'かさ', exampleKatakana: 'カメラ', exampleKoHiragana: '우산', exampleKoKatakana: '카메라', exampleRomajiHiragana: 'kasa', exampleRomajiKatakana: 'kamera', sentenceHiragana: 'かさをもっています。', sentenceKatakana: 'カメラでとります。', sentenceRomajiHiragana: 'kasa o motte imasu', sentenceRomajiKatakana: 'kamera de torimasu', sentenceKoHiragana: '우산을 가지고 있습니다.', sentenceKoKatakana: '카메라로 찍습니다.' },
  ki: { exampleHiragana: 'きた', exampleKatakana: 'キロ', exampleKoHiragana: '북쪽', exampleKoKatakana: '킬로', exampleRomajiHiragana: 'kita', exampleRomajiKatakana: 'kiro', sentenceHiragana: 'きたへいきます。', sentenceKatakana: 'キロであらわします。', sentenceRomajiHiragana: 'kita e ikimasu', sentenceRomajiKatakana: 'kiro de arawashimasu', sentenceKoHiragana: '북쪽으로 갑니다.', sentenceKoKatakana: '킬로로 나타냅니다.' },
  ku: { exampleHiragana: 'くつ', exampleKatakana: 'クラス', exampleKoHiragana: '신발', exampleKoKatakana: '반', exampleRomajiHiragana: 'kutsu', exampleRomajiKatakana: 'kurasu', sentenceHiragana: 'くつをはきます。', sentenceKatakana: 'クラスにいます。', sentenceRomajiHiragana: 'kutsu o hakimasu', sentenceRomajiKatakana: 'kurasu ni imasu', sentenceKoHiragana: '신발을 신습니다.', sentenceKoKatakana: '반에 있습니다.' },
  ke: { exampleHiragana: 'けさ', exampleKatakana: 'ケーキ', exampleKoHiragana: '오늘 아침', exampleKoKatakana: '케이크', exampleRomajiHiragana: 'kesa', exampleRomajiKatakana: 'keeki', sentenceHiragana: 'けさべんきょうしました。', sentenceKatakana: 'ケーキをたべます。', sentenceRomajiHiragana: 'kesa benkyou shimashita', sentenceRomajiKatakana: 'keeki o tabemasu', sentenceKoHiragana: '오늘 아침 공부했습니다.', sentenceKoKatakana: '케이크를 먹습니다.' },
  ko: { exampleHiragana: 'こえ', exampleKatakana: 'コップ', exampleKoHiragana: '목소리', exampleKoKatakana: '컵', exampleRomajiHiragana: 'koe', exampleRomajiKatakana: 'koppu', sentenceHiragana: 'こえがきれいです。', sentenceKatakana: 'コップをあらいます。', sentenceRomajiHiragana: 'koe ga kirei desu', sentenceRomajiKatakana: 'koppu o araimasu', sentenceKoHiragana: '목소리가 예쁩니다.', sentenceKoKatakana: '컵을 씻습니다.' },
  sa: { exampleHiragana: 'さかな', exampleKatakana: 'サラダ', exampleKoHiragana: '생선', exampleKoKatakana: '샐러드', exampleRomajiHiragana: 'sakana', exampleRomajiKatakana: 'sarada', sentenceHiragana: 'さかなをたべます。', sentenceKatakana: 'サラダをつくります。', sentenceRomajiHiragana: 'sakana o tabemasu', sentenceRomajiKatakana: 'sarada o tsukurimasu', sentenceKoHiragana: '생선을 먹습니다.', sentenceKoKatakana: '샐러드를 만듭니다.' },
  shi: { exampleHiragana: 'しお', exampleKatakana: 'シャツ', exampleKoHiragana: '소금', exampleKoKatakana: '셔츠', exampleRomajiHiragana: 'shio', exampleRomajiKatakana: 'shatsu', sentenceHiragana: 'しおをいれます。', sentenceKatakana: 'シャツをきます。', sentenceRomajiHiragana: 'shio o iremasu', sentenceRomajiKatakana: 'shatsu o kimasu', sentenceKoHiragana: '소금을 넣습니다.', sentenceKoKatakana: '셔츠를 입습니다.' },
  su: { exampleHiragana: 'すし', exampleKatakana: 'スープ', exampleKoHiragana: '초밥', exampleKoKatakana: '수프', exampleRomajiHiragana: 'sushi', exampleRomajiKatakana: 'suupu', sentenceHiragana: 'すしがすきです。', sentenceKatakana: 'スープをのみます。', sentenceRomajiHiragana: 'sushi ga suki desu', sentenceRomajiKatakana: 'suupu o nomimasu', sentenceKoHiragana: '초밥을 좋아합니다.', sentenceKoKatakana: '수프를 마십니다.' },
  se: { exampleHiragana: 'せんせい', exampleKatakana: 'セーター', exampleKoHiragana: '선생님', exampleKoKatakana: '스웨터', exampleRomajiHiragana: 'sensei', exampleRomajiKatakana: 'seetaa', sentenceHiragana: 'せんせいにききます。', sentenceKatakana: 'セーターをきます。', sentenceRomajiHiragana: 'sensei ni kikimasu', sentenceRomajiKatakana: 'seetaa o kimasu', sentenceKoHiragana: '선생님께 묻습니다.', sentenceKoKatakana: '스웨터를 입습니다.' },
  so: { exampleHiragana: 'そら', exampleKatakana: 'ソファ', exampleKoHiragana: '하늘', exampleKoKatakana: '소파', exampleRomajiHiragana: 'sora', exampleRomajiKatakana: 'sofa', sentenceHiragana: 'そらをみます。', sentenceKatakana: 'ソファにすわります。', sentenceRomajiHiragana: 'sora o mimasu', sentenceRomajiKatakana: 'sofa ni suwarimasu', sentenceKoHiragana: '하늘을 봅니다.', sentenceKoKatakana: '소파에 앉습니다.' },
  ta: { exampleHiragana: 'たこ', exampleKatakana: 'タクシー', exampleKoHiragana: '문어', exampleKoKatakana: '택시', exampleRomajiHiragana: 'tako', exampleRomajiKatakana: 'takushii', sentenceHiragana: 'たこをたべます。', sentenceKatakana: 'タクシーにのります。', sentenceRomajiHiragana: 'tako o tabemasu', sentenceRomajiKatakana: 'takushii ni norimasu', sentenceKoHiragana: '문어를 먹습니다.', sentenceKoKatakana: '택시를 탑니다.' },
  chi: { exampleHiragana: 'ちず', exampleKatakana: 'チーズ', exampleKoHiragana: '지도', exampleKoKatakana: '치즈', exampleRomajiHiragana: 'chizu', exampleRomajiKatakana: 'chiizu', sentenceHiragana: 'ちずをみます。', sentenceKatakana: 'チーズをたべます。', sentenceRomajiHiragana: 'chizu o mimasu', sentenceRomajiKatakana: 'chiizu o tabemasu', sentenceKoHiragana: '지도를 봅니다.', sentenceKoKatakana: '치즈를 먹습니다.' },
  tsu: { exampleHiragana: 'つき', exampleKatakana: 'ツアー', exampleKoHiragana: '달', exampleKoKatakana: '투어', exampleRomajiHiragana: 'tsuki', exampleRomajiKatakana: 'tsuaa', sentenceHiragana: 'つきがみえます。', sentenceKatakana: 'ツアーにいきます。', sentenceRomajiHiragana: 'tsuki ga miemasu', sentenceRomajiKatakana: 'tsuaa ni ikimasu', sentenceKoHiragana: '달이 보입니다.', sentenceKoKatakana: '투어에 갑니다.' },
  te: { exampleHiragana: 'て', exampleKatakana: 'テスト', exampleKoHiragana: '손', exampleKoKatakana: '시험', exampleRomajiHiragana: 'te', exampleRomajiKatakana: 'tesuto', sentenceHiragana: 'てをあらいます。', sentenceKatakana: 'テストがあります。', sentenceRomajiHiragana: 'te o araimasu', sentenceRomajiKatakana: 'tesuto ga arimasu', sentenceKoHiragana: '손을 씻습니다.', sentenceKoKatakana: '시험이 있습니다.' },
  to: { exampleHiragana: 'とけい', exampleKatakana: 'トマト', exampleKoHiragana: '시계', exampleKoKatakana: '토마토', exampleRomajiHiragana: 'tokei', exampleRomajiKatakana: 'tomato', sentenceHiragana: 'とけいをみます。', sentenceKatakana: 'トマトをたべます。', sentenceRomajiHiragana: 'tokei o mimasu', sentenceRomajiKatakana: 'tomato o tabemasu', sentenceKoHiragana: '시계를 봅니다.', sentenceKoKatakana: '토마토를 먹습니다.' },
};

const fallbackByGroup: Record<JlptKanaGroup, Omit<KanaSeed, 'hiragana' | 'katakana' | 'romaji' | 'row' | 'group'>> = {
  basic: examples.a,
  dakuten: { exampleHiragana: 'がっこう', exampleKatakana: 'ゲーム', exampleKoHiragana: '학교', exampleKoKatakana: '게임', exampleRomajiHiragana: 'gakkou', exampleRomajiKatakana: 'geemu', sentenceHiragana: 'がっこうへいきます。', sentenceKatakana: 'ゲームをします。', sentenceRomajiHiragana: 'gakkou e ikimasu', sentenceRomajiKatakana: 'geemu o shimasu', sentenceKoHiragana: '학교에 갑니다.', sentenceKoKatakana: '게임을 합니다.' },
  handakuten: { exampleHiragana: 'ぱん', exampleKatakana: 'ペン', exampleKoHiragana: '빵', exampleKoKatakana: '펜', exampleRomajiHiragana: 'pan', exampleRomajiKatakana: 'pen', sentenceHiragana: 'ぱんをたべます。', sentenceKatakana: 'ペンでかきます。', sentenceRomajiHiragana: 'pan o tabemasu', sentenceRomajiKatakana: 'pen de kakimasu', sentenceKoHiragana: '빵을 먹습니다.', sentenceKoKatakana: '펜으로 씁니다.' },
  yoon: { exampleHiragana: 'きょう', exampleKatakana: 'ジュース', exampleKoHiragana: '오늘', exampleKoKatakana: '주스', exampleRomajiHiragana: 'kyou', exampleRomajiKatakana: 'juusu', sentenceHiragana: 'きょうはやすみです。', sentenceKatakana: 'ジュースをのみます。', sentenceRomajiHiragana: 'kyou wa yasumi desu', sentenceRomajiKatakana: 'juusu o nomimasu', sentenceKoHiragana: '오늘은 쉽니다.', sentenceKoKatakana: '주스를 마십니다.' },
  small: { exampleHiragana: 'きって', exampleKatakana: 'バッグ', exampleKoHiragana: '우표', exampleKoKatakana: '가방', exampleRomajiHiragana: 'kitte', exampleRomajiKatakana: 'baggu', sentenceHiragana: 'きってをかいます。', sentenceKatakana: 'バッグをもっています。', sentenceRomajiHiragana: 'kitte o kaimasu', sentenceRomajiKatakana: 'baggu o motte imasu', sentenceKoHiragana: '우표를 삽니다.', sentenceKoKatakana: '가방을 가지고 있습니다.' },
  special: { exampleHiragana: 'おばあさん', exampleKatakana: 'コーヒー', exampleKoHiragana: '할머니', exampleKoKatakana: '커피', exampleRomajiHiragana: 'obaasan', exampleRomajiKatakana: 'koohii', sentenceHiragana: 'おばあさんにあいます。', sentenceKatakana: 'コーヒーをのみます。', sentenceRomajiHiragana: 'obaasan ni aimasu', sentenceRomajiKatakana: 'koohii o nomimasu', sentenceKoHiragana: '할머니를 만납니다.', sentenceKoKatakana: '커피를 마십니다.' },
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
  exampleKo: seed.exampleKoHiragana,
  exampleRomaji: seed.exampleRomajiHiragana,
  exampleSentenceJa: seed.sentenceHiragana,
  exampleSentenceKo: seed.sentenceKoHiragana,
  exampleSentenceRomaji: seed.sentenceRomajiHiragana,
}));

export const jlptKatakana: JlptKanaItem[] = seeds.map((seed, index) => ({
  id: `katakana-${String(index + 1).padStart(3, '0')}`,
  script: 'katakana',
  kana: seed.katakana,
  romaji: seed.romaji,
  row: seed.row,
  group: seed.group,
  example: seed.exampleKatakana,
  exampleKo: seed.exampleKoKatakana,
  exampleRomaji: seed.exampleRomajiKatakana,
  exampleSentenceJa: seed.sentenceKatakana,
  exampleSentenceKo: seed.sentenceKoKatakana,
  exampleSentenceRomaji: seed.sentenceRomajiKatakana,
}));

export function getJlptKana(script: JlptKanaScript) {
  return script === 'katakana' ? jlptKatakana : jlptHiragana;
}
