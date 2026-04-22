const fs = require('fs');

const data = fs.readFileSync('data/hsk-categories.ts', 'utf-8');

// I will just redefine the entire object because it only has 1, 2, 3, and 4
const hsk1Match = data.match(/'1': \[[^]*?\](?:,|(?=\s*\}))/);
const hsk2Match = data.match(/'2': \[[^]*?\](?:,|(?=\s*\}))/);
const hsk3Match = data.match(/'3': \[[^]*?\](?:,|(?=\s*\}))/);

// Get the new HSK 4 content generated previously
// Wait, my previous script generated the string `tsOutput` correctly. Let's just generate it again here!

const hskText = fs.readFileSync('data/hsk.ts', 'utf-8');
const rawDataMatch = hskText.match(/const rawData = `([^`]+)`/);
const lines = rawDataMatch[1].trim().split('\n');
const hsk4 = [];
for (const line of lines) {
  const parts = line.split('|');
  if (parts[0].trim() === '4') {
    hsk4.push({ word: parts[1], meaning: parts[3] });
  }
}

const topics = [
  { id: 'hsk4-people', name: '사람, 직업, 관계', keywords: ['사람', '직업', '친구', '가족', '할머니', '할아버지', '손자', '친척', '고객', '기자', '경찰', '변호사', '관객', '주인', '아내', '남편', '결혼', '사랑', '관계', '성별', '나이', '어린이', '어른'], words: [] },
  { id: 'hsk4-life', name: '일상, 생활, 쇼핑', keywords: ['생활', '습관', '쇼핑', '가격', '비싸다', '싸다', '할인', '영수증', '포장', '사다', '팔다', '신발', '양말', '모자', '안경', '가방', '가구', '열쇠', '쓰레기'], words: [] },
  { id: 'hsk4-food', name: '음식, 요리, 맛', keywords: ['음식', '요리', '식당', '메뉴', '사과', '바나나', '포도', '수박', '감자', '고기', '소고기', '돼지고기', '닭고기', '음료', '커피', '맥주'], words: [] },
  { id: 'hsk4-nature', name: '자연, 날씨, 환경', keywords: ['자연', '환경', '날씨', '바람', '구름', '태양', '고양이', '동물', '계절', '여름', '가을', '겨울', '기온'], words: [] },
  { id: 'hsk4-place', name: '장소, 방향, 교통', keywords: ['장소', '방향', '교통', '도착', '왼쪽', '오른쪽', '거리', '건물', '화장실', '창문', '학교', '병원', '공항', '정류장', '버스', '기차', '비행기', '자전거'], words: [] },
  { id: 'hsk4-time', name: '시간, 날짜, 과정', keywords: ['시간', '날짜', '기간', '과정', '요일', '아침', '점심', '저녁', '오늘', '내일', '어제', '과거', '현재', '미래', '처음', '마지막', '시작', '나중에', '갑자기', '항상', '가끔'], words: [] },
  { id: 'hsk4-work', name: '업무, 회사, 경제', keywords: ['업무', '출근', '퇴근', '지각', '야근', '휴가', '월급', '경제', '회사', '직장', '회의', '계획', '성공', '실패', '책임', '노력', '경쟁', '발전', '수입', '수출', '시장', '투자', '은행', '통장', '계좌'], words: [] },
  { id: 'hsk4-study', name: '학습, 학교, 언어', keywords: ['학습', '공부', '선생님', '학생', '수업', '숙제', '시험', '성적', '졸업', '언어', '단어', '문장', '문법', '사전', '읽다', '이해하다', '질문', '대답', '연습', '설명'], words: [] },
  { id: 'hsk4-emotion', name: '감정, 성격, 태도', keywords: ['감정', '성격', '태도', '기쁘다', '슬프다', '화나다', '우울하다', '외롭다', '걱정', '무섭다', '놀라다', '웃다', '울다', '좋아하다', '싫어하다', '착하다', '친절하다', '나쁘다', '똑똑하다', '바보', '부지런하다', '게으르다', '자신감', '용기', '인내'], words: [] },
  { id: 'hsk4-culture', name: '문화, 예술, 취미', keywords: ['문화', '예술', '음악', '미술', '영화', '연극', '노래', '악기', '취미', '운동', '스포츠', '축구', '농구', '야구', '수영', '등산', '여행', '게임', '사진', '컴퓨터', '인터넷', '블로그', '뉴스', '신문', '잡지', '방송'], words: [] },
  { id: 'hsk4-grammar_verb', name: '주요 동사', keywords: ['시키다', '비교하다', '보이다', '느끼다', '모르다', '돕다', '필요하다', '기다리다', '가져오다', '버리다', '찾다', '잃다', '당기다', '밀다', '고르다', '결정하다'], words: [] },
  { id: 'hsk4-grammar_adj', name: '주요 형용사', keywords: ['많다', '적다', '높다', '낮다', '짧다', '넓다', '좁다', '깊다', '얕다', '무겁다', '가볍다', '빠르다', '느리다', '아름답다', '못생기다', '깨끗하다', '더럽다', '복잡하다', '단순하다', '위험하다', '안전하다', '비슷하다', '다르다', '중요하다', '편리하다'], words: [] },
  { id: 'hsk4-grammar_adv', name: '주요 부사 및 기타어', keywords: ['매우', '아주', '조금', '약간', '모두', '전부', '함께', '혼자', '스스로', '가장', '제일', '만약', '만일', '비록', '하지만', '그러나', '그래서', '그러므로', '왜냐하면', '어쩌면', '아마도', '반드시', '물론', '당연히', '게다가', '오히려'], words: [] },
  { id: 'hsk4-general', name: '기본 어휘 및 기타', keywords: [], words: [] }
];

for (const it of hsk4) {
  let matched = false;
  for (const topic of topics) {
    if (topic.keywords.length > 0 && topic.keywords.some(k => ` ${it.meaning} `.indexOf(` ${k} `) !== -1 || it.meaning.includes(k))) {
      topic.words.push(it.word);
      matched = true;
      break; 
    }
  }
  if (!matched) {
    topics.find(t => t.id === 'hsk4-general').words.push(it.word);
  }
}

const finalCategories = [];
for (const topic of topics) {
  if (topic.words.length === 0) continue;
  
  if (topic.words.length > 35) {
     const chunkSize = Math.ceil(topic.words.length / Math.ceil(topic.words.length / 30));
     for (let i = 0; i < topic.words.length; i += chunkSize) {
       finalCategories.push({
         id: `${topic.id}-${i / chunkSize + 1}`,
         name: `${topic.name} ${i / chunkSize + 1}`,
         words: topic.words.slice(i, i + chunkSize)
       });
     }
  } else {
    finalCategories.push({
      id: topic.id,
      name: topic.name,
      words: topic.words
    });
  }
}

let tsOutput = "'4': [\\n";
for (let i = 0; i < finalCategories.length; i++) {
  const cat = finalCategories[i];
  tsOutput += `    {\n      id: '${cat.id}',\n      name: '${cat.name}',\n      words: ${JSON.stringify(cat.words).replace(/"/g, "'")}\n    }`;
  if (i < finalCategories.length - 1) tsOutput += ",";
  tsOutput += "\\n";
}
tsOutput += "  ]";

const fullNewFile = `
export interface HSKCategory {
  id: string;
  name: string;
  words: string[];
}

export const HSK_CATEGORIES: Record<string, HSKCategory[]> = {
  \${hsk1Match[0]},
  \${hsk2Match[0]},
  \${hsk3Match[0]},
  \${tsOutput}
};
`;

fs.writeFileSync('data/hsk-categories.ts', fullNewFile.trim() + '\\n');
console.log("Successfully rebuilt data/hsk-categories.ts");
