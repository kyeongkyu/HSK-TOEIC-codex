const fs = require('fs');

// Read HSK words
const hskContent = fs.readFileSync('data/hsk.ts', 'utf-8');
const words = [];
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');

lines.forEach(line => {
  const parts = line.split('|');
  if (parts.length >= 4) {
    words.push({
      level: parts[0],
      word: parts[1],
      pinyin: parts[2],
      meaning: parts[3]
    });
  }
});

// Hardcoded HSK 1 and 2 categories (exactly as seen in Turn 1)
const hsk1_cats = [
  {
    id: 'hsk1-people',
    name: '사람과 가족',
    words: ['爸爸', '妈妈', '儿子', '女儿', '老师', '学生', '同学', '朋友', '医生', '先生', '小姐', '我', '你', '他', '她', '我们', '谁', '什么', '哪', '名字', '认识']
  },
  {
    id: 'hsk1-numbers',
    name: '숫자와 시간',
    words: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '几', '多少', '岁', '年', '月', '日', '星期', '点', '分钟', '现在', '时候', '오늘', '明天', '昨天', '上午', '中午', '下午']
  },
  {
    id: 'hsk1-activities',
    name: '일상 활동',
    words: ['是', '有', '做', '买', '开', '坐', '住', '学习', '工作', '睡觉', '打电话', '来', '回', '去', '吃', '喝', '读', '写', '说话', '看', '听', '看见', '叫', '请', '想', '会', '能']
  },
  {
    id: 'hsk1-places',
    name: '장소와 위치',
    words: ['家', '学校', '饭店', '商店', '医院', '火车站', '中国', '北京', '电影院', '哪儿', '这里', '那儿', '上', '下', '前', '后', '里']
  },
  {
    id: 'hsk1-objects',
    name: '사물과 자연',
    words: ['钱', '衣服', '水', '菜', '米饭', '水果', '苹果', '茶', '杯子', '电视', '电脑', '电影', '飞机', '出租车', '书', '汉语', '字', '桌子', '椅子', '猫', '狗', '天气', '下雨']
  },
  {
    id: 'hsk1-states',
    name: '상태와 수식',
    words: ['大', '小', '多', '少', '冷', '热', '好', '漂亮', '高兴', '很', '太', '都', '不', '没', '마', '呢', '了', '的', '和', '在', '个', '本', '些', '块', '怎么', '怎么样']
  }
];

// Re-checking HSK 1 words for correctness
hsk1_cats[1].words[21] = '今天'; // 오늘 -> 今天
hsk1_cats[5].words[13] = '吗'; // 마 -> 吗

const hsk2_cats = [
  {
    id: 'hsk2-people',
    name: '사람과 대인관계',
    words: ['弟弟', '哥哥', '姐姐', '妹妹', '丈夫', '妻子', '孩子', '大家', '服务员', '姓', '男', '女', '您', '介绍', '欢迎', '告诉', '懂', '帮助', '让', '送', '找', '事情']
  },
  {
    id: 'hsk2-daily',
    name: '일상 생활',
    words: ['报纸', '咖啡', '鸡蛋', '羊肉', '牛奶', '西瓜', '鱼', '面条', '药', '身体', '眼睛', '手表', '手机', '门', '房间', '颜色', '穿', '洗', '起床', '休息', '完', '正在', '运动']
  },
  {
    id: 'hsk2-hobbies',
    name: '취미와 활동',
    words: ['跑步', '游泳', '打篮球', '踢足球', '唱歌', '跳舞', '旅游', '玩', '考试', '课', '说话', '笑', '回答', '问题', '题', '希望', '意思', '准备']
  },
  {
    id: 'hsk2-transport',
    name: '장소와 교통',
    words: ['宾馆', '机场', '教室', '离', '远', '近', '进', '出', '到', '公共汽车', '自行车', '路', '走', '旁边', '左边', '右边', '外', '门']
  },
  {
    id: 'hsk2-time',
    name: '시간과 날씨',
    words: ['小时', '去年', '已经', '开始', '准备', '晴', '阴', '雪', '시간', '早上', '晚上', '生日', '每']
  },
  {
    id: 'hsk2-states',
    name: '상태와 성질',
    words: ['觉得', '知道', '卖', '给', '问', '笑', '累', '忙', '快乐', '高', '贵', '便宜', '慢', '快', '长', '新', '漂亮', '白', '黑', '红', '错', '对', '好吃', '颜色']
  },
  {
    id: 'hsk2-grammar',
    name: '부사 및 문법',
    words: ['非常', '就', '也', '还', '真', '最', '比', '别', '为什么', ' because ', '所以', '虽然', '吧', '呢', '了', '过', '得', '件', '次', '下', '제일', '一下', '一起', '再', '可能', '可以', '要', '正在']
  }
];

hsk2_cats[4].words[8] = '时间'; // 시간 -> 时间
hsk2_cats[6].words[9] = '因为'; // because -> 因为
hsk2_cats[6].words[19] = '第一'; // 제일 -> 第一

// HSK 3 and 4 Categorization
const hsk3Words = words.filter(w => w.level === '3');
const hsk4Words = words.filter(w => w.level === '4');

const topics = [
  { id: 'people', name: '사람, 직업, 관계', keywords: ['사람', '직업', '친구', '가족', '동료', '성격', '태도', '부부', '아이', '전문가', '의사', '선생님', '사장', '직원', '경찰', '변호사', '기자', '작가', '배우', '가수', '운동선수', '손님', '사람', '인사', '소개', '관계', '우리', '그', '그녀'], words: [] },
  { id: 'life', name: '일상, 생활, 쇼핑', keywords: ['일상', '생활', '하루', '아침', '점심', '저녁', '밤', '식사', '집안일', '청소', '쇼핑', '구매', '가격', '돈', '선물', '편지', '휴대폰', '전화', '컴퓨터', '인터넷', '카드', '현금', '물건', '가구', '옷', '신발', '안경', '가방', '열쇠'], words: [] },
  { id: 'food', name: '음식, 요리, 맛', keywords: ['음식', '요리', '식당', '맛', '맵다', '달다', '짜다', '시다', '쓰다', '채소', '과일', '고기', '생선', '빵', '밥', '국', '음료', '차', '커피', '술', '맥주', '우유', '물', '달걀', '사과', '바나나', '포도', '수박', '배'], words: [] },
  { id: 'nature', name: '자연, 날씨, 동식물', keywords: ['자연', '날씨', '계절', '봄', '여름', '가을', '겨울', '하늘', '해', '달', '별', '구름', '비', '눈', '바람', '바다', '산', '강', '나무', '꽃', '풀', '동물', '개', '고양이', '판다', '새', '물고기', '곤충', '환경'], words: [] },
  { id: 'place', name: '장소, 방향, 교통', keywords: ['장소', '위치', '방향', '앞', '뒤', '옆', '위', '아래', '안', '밖', '오른쪽', '왼쪽', '근처', '도시', '나라', '학교', '회사', '병원', '은행', '공원', '공항', '역', '지하철', '버스', '택시', '비행기', '지도', '길', '거리'], words: [] },
  { id: 'time', name: '시간, 날짜, 수사', keywords: ['시간', '날짜', '어제', '오늘', '내일', '주말', '달', '년', '시', '분', '초', '오전', '오후', '일찍', '늦게', '과거', '현재', '미래', '갑자기', '방금', '드디어', '숫자', '첫째'], words: [] },
  { id: 'work', name: '직장, 사무, 업무', keywords: ['직장', '회사', '업무', '일', '회의', '보고', '계획', '결정', '성공', '실패', '경제', '돈', '급여', '면접', '지원', '합격', '취직', '퇴직', '경험', '능력', '기술', '컴퓨터', '메일'], words: [] },
  { id: 'study', name: '학업, 교육, 지식', keywords: ['학업', '공부', '학교', '대학', '수업', '시험', '성적', '전공', '언어', '영어', '중국어', '한자', '역사', '수학', '과학', '문화', '예술', '도서관', '과제', '사전', '책', '노트'], words: [] },
  { id: 'emotion', name: '감정, 성격, 태도', keywords: ['감정', '마음', '기분', '웃음', '울음', '슬픔', '기쁨', '행복', '걱정', '두려움', '화', '용기', '친절', '성실', '게으름', '조용', '시끄러움', '똑똑', '바보', '예쁘다', '멋지다'], words: [] },
  { id: 'culture', name: '문화, 여가, 스포츠', keywords: ['문화', '예술', '음악', '노래', '영화', '연극', '취미', '여행', '운동', '스포츠', '축구', '농구', '수영', '공연', '박물관', '게임', '그림', '사진', '카메라', '휴가'], words: [] },
  { id: 'grammar_verb', name: '주요 동사', keywords: ['동사', '하다', '주다', '받다', '보다', '듣다', '말하다', '쓰다', '가다', '오다', '먹다', '마시다', '자다', '일어나다', '웃다', '울다', '알다', '모르다', '생각하다', '믿다'], words: [] },
  { id: 'grammar_adj', name: '주요 형용사', keywords: ['형용사', '크다', '작다', '많다', '적다', '길다', '짧다', '높다', '낮다', '빠르다', '느리다', '어렵다', '쉽다', '좋다', '나쁘다', '뜨겁다', '춥다', '비싸다', '싸다'], words: [] },
  { id: 'grammar_adv', name: '부사 및 접속사', keywords: ['부사', '매우', '가장', '더', '함께', '다시', '자주', '접속사', '그래서', '그러나', '하지만', '만약', '왜냐하면', '그리고', '또는'], words: [] },
  { id: 'general', name: '기타 일반', keywords: [], words: [] }
];

function categorize(wordList, levelStr, splitCount = 100) {
  const categories = JSON.parse(JSON.stringify(topics));
  const assignedWords = new Set();

  wordList.forEach(w => {
    let assigned = false;
    for (const topic of categories) {
      if (topic.keywords.some(k => w.meaning.includes(k))) {
        topic.words.push(w.word);
        assignedWords.add(w.word);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      categories.find(c => c.id === 'general').words.push(w.word);
      assignedWords.add(w.word);
    }
  });

  const finalCats = [];
  categories.forEach(cat => {
    if (cat.words.length === 0) return;
    
    if (cat.words.length > splitCount) {
      for (let i = 0; i < cat.words.length; i += splitCount) {
        const part = (i / splitCount) + 1;
        finalCats.push({
          id: `hsk${levelStr}-${cat.id}-${part}`,
          name: `${cat.name} ${part}`,
          words: cat.words.slice(i, i + splitCount)
        });
      }
    } else {
      finalCats.push({
        id: `hsk${levelStr}-${cat.id}`,
        name: cat.name,
        words: cat.words
      });
    }
  });

  return finalCats;
}

const hsk3_cats = categorize(hsk3Words, '3', 35); 
const hsk4_cats = categorize(hsk4Words, '4', 21); // User specifically asked for ~20 in HSK4

// Formatting output
function formatCats(cats) {
  return cats.map(cat => `    {
      id: '${cat.id}',
      name: '${cat.name}',
      words: [${cat.words.map(w => `'${w}'`).join(', ')}]
    }`).join(',\n');
}

const content = `export interface HSKCategory {
  id: string;
  name: string;
  words: string[];
}

export const HSK_CATEGORIES: Record<string, HSKCategory[]> = {
  '1': [
${formatCats(hsk1_cats)}
  ],
  '2': [
${formatCats(hsk2_cats)}
  ],
  '3': [
${formatCats(hsk3_cats)}
  ],
  '4': [
${formatCats(hsk4_cats)}
  ]
};
`;

fs.writeFileSync('data/hsk-categories.ts', content);
console.log('Successfully recreated data/hsk-categories.ts');
