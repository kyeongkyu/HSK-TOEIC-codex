const fs = require('fs');

const hskText = fs.readFileSync('data/hsk.ts', 'utf-8');
const rawDataMatch = hskText.match(/const rawData = `([^`]+)`/);
const lines = rawDataMatch[1].trim().split('\n');
const wordsByLevel = { '1': [], '2': [], '3': [], '4': [] };

for (const line of lines) {
  const parts = line.split('|');
  const level = parts[0].trim();
  if (wordsByLevel[level]) {
    wordsByLevel[level].push({ word: parts[1], meaning: parts[3] });
  }
}

const getTopics = (levelStr) => [
  { id: 'hsk' + levelStr + '-people', name: '사람, 직업, 관계', keywords: ['사람', '직업', '친구', '가족', '할머니', '할아버지', '손자', '친척', '고객', '기자', '경찰', '변호사', '관객', '주인', '아내', '남편', '결혼', '사랑', '관계', '성별', '나이', '어린이', '어른', '아빠', '엄마', '아들', '딸', '의사', '선생님', '학생', '너', '나', '그', '그녀', '우리', '누구', '이름', '형', '누나', '오빠', '언니', '동생', '남', '여'], words: [] },
  { id: 'hsk' + levelStr + '-life', name: '일상, 생활, 쇼핑', keywords: ['생활', '습관', '쇼핑', '가격', '비싸다', '싸다', '돈', '동전', '지폐', '카드', '할인', '영수증', '포장', '사다', '팔다', '신발', '양말', '모자', '안경', '가방', '가구', '열쇠', '쓰레기', '옷', '물건'], words: [] },
  { id: 'hsk' + levelStr + '-food', name: '음식, 요리, 맛', keywords: ['음식', '요리', '식당', '메뉴', '사과', '바나나', '포도', '수박', '과일', '감자', '고기', '소고기', '돼지고기', '닭고기', '음료', '커피', '맥주', '밥', '물', '차', '마시다', '먹다', '달다', '맵다', '짜다'], words: [] },
  { id: 'hsk' + levelStr + '-nature', name: '자연, 날씨, 환경', keywords: ['자연', '환경', '날씨', '바람', '구름', '비', '눈', '태양', '달', '별', '산', '개', '고양이', '동물', '계절', '여름', '가을', '겨울', '봄', '기온', '꽃', '나무'], words: [] },
  { id: 'hsk' + levelStr + '-place', name: '장소, 방향, 교통', keywords: ['장소', '방향', '교통', '도착', '왼쪽', '오른쪽', '앞', '뒤', '위', '아래', '안', '밖', '거리', '건물', '화장실', '창문', '학교', '병원', '공항', '정류장', '버스', '기차', '비행기', '자전거', '택시', '가다', '오다', '역', '식당', '상점', '집', '방', '어디', '여기', '저기'], words: [] },
  { id: 'hsk' + levelStr + '-time', name: '시간, 날짜, 과정', keywords: ['시간', '날짜', '기간', '과정', '요일', '아침', '점심', '저녁', '오늘', '내일', '어제', '과거', '현재', '미래', '처음', '마지막', '시작', '나중에', '갑자기', '항상', '가끔', '년', '월', '일', '시', '분', '초', '때', '지금'], words: [] },
  { id: 'hsk' + levelStr + '-work', name: '업무, 회사, 경제', keywords: ['업무', '출근', '퇴근', '지각', '야근', '휴가', '월급', '경제', '회사', '직장', '회의', '계획', '성공', '실패', '책임', '노력', '경쟁', '발전', '수입', '수출', '시장', '투자', '은행', '일하다'], words: [] },
  { id: 'hsk' + levelStr + '-study', name: '학습, 학교, 언어', keywords: ['학습', '공부', '선생님', '학생', '수업', '숙제', '시험', '성적', '졸업', '언어', '단어', '문장', '문법', '사전', '읽다', '이해하다', '질문', '대답', '연습', '설명', '글자', '듣다', '책'], words: [] },
  { id: 'hsk' + levelStr + '-emotion', name: '감정, 성격, 태도', keywords: ['감정', '성격', '태도', '기쁘다', '슬프다', '화나다', '우울하다', '외롭다', '걱정', '무섭다', '놀라다', '웃다', '울다', '좋아하다', '싫어하다', '착하다', '친절하다', '나쁘다', '똑똑하다', '바보', '부지런하다', '게으르다', '자신감', '용기', '인내'], words: [] },
  { id: 'hsk' + levelStr + '-culture', name: '문화, 예술, 취미', keywords: ['문화', '예술', '음악', '미술', '영화', '연극', '노래', '춤', '악기', '취미', '운동', '스포츠', '축구', '농구', '야구', '수영', '등산', '여행', '게임', '사진', '컴퓨터', '인터넷', '블로그', '뉴스', '신문', '잡지', '방송', '텔레비전'], words: [] },
  { id: 'hsk' + levelStr + '-grammar_verb', name: '주요 동사', keywords: ['시키다', '비교하다', '보이다', '느끼다', '모르다', '알다', '돕다', '필요하다', '기다리다', '가져오다', '버리다', '찾다', '잃다', '당기다', '밀다', '고르다', '결정하다', '하다', '주다', '받다', '보다'], words: [] },
  { id: 'hsk' + levelStr + '-grammar_adj', name: '주요 형용사', keywords: ['많다', '적다', '크다', '작다', '높다', '낮다', '길다', '짧다', '넓다', '좁다', '깊다', '얕다', '무겁다', '가볍다', '빠르다', '느리다', '아름답다', '못생기다', '깨끗하다', '더럽다', '복잡하다', '단순하다', '위험하다', '안전하다', '비슷하다', '다르다', '중요하다', '편리하다', '좋다', '덥다', '춥다'], words: [] },
  { id: 'hsk' + levelStr + '-grammar_adv', name: '대명사/부사 등 기타 필수어', keywords: ['매우', '아주', '조금', '약간', '모두', '전부', '함께', '혼자', '스스로', '가장', '제일', '만약', '만일', '비록', '하지만', '그러나', '그래서', '그러므로', '왜냐하면', '어쩌면', '아마도', '반드시', '물론', '당연히', '게다가', '오히려', '이', '그', '저', '무엇', '어떤', '몇', '안', '못', '다'], words: [] },
  { id: 'hsk' + levelStr + '-general', name: '기본 어휘', keywords: [], words: [] }
];

let finalOutput = "export interface HSKCategory {\n  id: string;\n  name: string;\n  words: string[];\n}\n\nexport const HSK_CATEGORIES: Record<string, HSKCategory[]> = {\n";

for (const level of ['1', '2', '3', '4']) {
  const topics = getTopics(level);
  for (const it of wordsByLevel[level]) {
    let matched = false;
    for (const topic of topics) {
      if (topic.keywords.length > 0 && topic.keywords.some(k => (' ' + it.meaning + ' ').indexOf(' ' + k + ' ') !== -1 || it.meaning.includes(k))) {
        topic.words.push(it.word);
        matched = true;
        break;
      }
    }
    if (!matched) {
      topics.find(t => t.id === 'hsk' + level + '-general').words.push(it.word);
    }
  }

  const finalCategories = [];
  for (const topic of topics) {
    if (topic.words.length === 0) continue;
    if (topic.words.length > 30 && topic.words.length <= 40) {
      finalCategories.push({ id: topic.id, name: topic.name, words: topic.words });
    } else if (topic.words.length > 30) {
       const chunks = Math.ceil(topic.words.length / 25);
       const chunkSize = Math.ceil(topic.words.length / chunks);
       for (let i = 0; i < topic.words.length; i += chunkSize) {
         finalCategories.push({
           id: topic.id + '-' + (i / chunkSize + 1),
           name: chunks === 1 ? topic.name : topic.name + ' ' + (i / chunkSize + 1),
           words: topic.words.slice(i, i + chunkSize)
         });
       }
    } else {
      finalCategories.push({ id: topic.id, name: topic.name, words: topic.words });
    }
  }

  let tsOutput = "  '" + level + "': [\n";
  for (let i = 0; i < finalCategories.length; i++) {
    const cat = finalCategories[i];
    tsOutput += "    {\n      id: '" + cat.id + "',\n      name: '" + cat.name + "',\n      words: " + JSON.stringify(cat.words).replace(/"/g, "'") + "\n    }";
    if (i < finalCategories.length - 1) tsOutput += ",\n";
    else tsOutput += "\n";
  }
  tsOutput += "  ]";
  if (level !== '4') tsOutput += ",\n";
  finalOutput += tsOutput;
}

finalOutput += "\n};\n";
fs.writeFileSync('data/hsk-categories.ts', finalOutput);
console.log("Successfully recreated data/hsk-categories.ts");
