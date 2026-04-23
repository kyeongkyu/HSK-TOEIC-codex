export type HskListeningLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HskListeningTopic =
  | 'daily_life'
  | 'school_learning'
  | 'work_business'
  | 'people_relationships'
  | 'shopping_services'
  | 'transport_travel'
  | 'health'
  | 'public_places'
  | 'culture_society';

export type HskListeningContentType = 'word' | 'sentence' | 'dialogue' | 'short_passage';
export type HskListeningActivityType =
  | 'practice'
  | 'multiple_choice'
  | 'fill_blank'
  | 'dictation'
  | 'shadowing'
  | 'repeat_listening';

export type HskListeningSkill =
  | 'tone_discrimination'
  | 'number_time_listening'
  | 'keyword_catching'
  | 'dictation'
  | 'shadowing'
  | 'similar_sound_discrimination'
  | 'sequence_understanding';

export type HskListeningDifficulty = 'easy' | 'medium' | 'hard';
export type HskListeningReviewFilter = 'incorrect_only' | 'frequently_missed' | 'replayed_often' | 'bookmarked';
export type HskListeningErrorTag =
  | 'tone_related'
  | 'number_time_related'
  | 'character_omission'
  | 'similar_sound_confusion';

export type HskListeningQuestion = {
  id: string;
  level: HskListeningLevel;
  section: 'listening';
  topic: HskListeningTopic;
  subtopics: string[];
  contentType: HskListeningContentType;
  activityType: HskListeningActivityType;
  promptText: string;
  ttsText?: string;
  answer: string;
  choices?: string[];
  transcript: string;
  pinyin: string;
  translation: string;
  explanation: string;
  tags: string[];
  listeningSkill: HskListeningSkill;
  difficulty: HskListeningDifficulty;
  speedProfile?: 'slow' | 'normal' | 'fast';
  patternTags?: string[];
};

export type HskListeningAttempt = {
  questionId: string;
  selectedAnswer?: string;
  typedAnswer?: string;
  correct: boolean;
  playedCount: number;
  solvedAt: string;
  durationMs: number;
  level: HskListeningLevel;
  topic: HskListeningTopic;
  contentType: HskListeningContentType;
  activityType: HskListeningActivityType;
  listeningSkill: HskListeningSkill;
  errorTags?: HskListeningErrorTag[];
};

export const HSK_LISTENING_TOPIC_META: Record<HskListeningTopic, { label: string; description: string }> = {
  daily_life: { label: 'Daily Life', description: 'Daily routines, meals, weather, and time expressions.' },
  school_learning: { label: 'School & Learning', description: 'Classes, homework, exams, and learning habits.' },
  work_business: { label: 'Work & Business', description: 'Office tasks, meetings, schedules, and reports.' },
  people_relationships: { label: 'People & Relationships', description: 'Family, friends, invitations, and feelings.' },
  shopping_services: { label: 'Shopping & Services', description: 'Prices, orders, stores, and customer service.' },
  transport_travel: { label: 'Transport & Travel', description: 'Buses, stations, hotels, directions, and trips.' },
  health: { label: 'Health', description: 'Symptoms, hospitals, exercise, and healthy routines.' },
  public_places: { label: 'Public Places', description: 'Banks, libraries, parks, museums, and offices.' },
  culture_society: { label: 'Culture & Society', description: 'Festivals, customs, news, and social topics.' },
};

export const HSK_LISTENING_REVIEW_META: Record<HskListeningReviewFilter, { label: string; description: string }> = {
  incorrect_only: { label: 'Incorrect Only', description: 'Review questions you answered incorrectly.' },
  frequently_missed: { label: 'Frequently Missed', description: 'Focus on questions missed two or more times.' },
  replayed_often: { label: 'Replayed Often', description: 'Practice questions you had to replay several times.' },
  bookmarked: { label: 'Bookmarked', description: 'Return to saved listening questions.' },
};

const TOPIC_ORDER = Object.keys(HSK_LISTENING_TOPIC_META) as HskListeningTopic[];
const LEVELS: HskListeningLevel[] = [1, 2, 3, 4, 5, 6];

type Example = {
  text: string;
  pinyin: string;
  translation: string;
  keyword: string;
  subtopics: string[];
  patternTags?: string[];
};

const EXAMPLES: Record<HskListeningTopic, Record<HskListeningLevel, Example>> = {
  daily_life: {
    1: { text: '我早上七点起床。', pinyin: 'wo3 zao3shang qi1 dian3 qi3chuang2.', translation: '나는 아침 7시에 일어납니다.', keyword: '七点', subtopics: ['daily_routine', 'time_expression'], patternTags: ['time_point'] },
    2: { text: '今天下午三点四十分下雨。', pinyin: 'jin1tian1 xia4wu3 san1 dian3 si4 shi2 fen1 xia4 yu3.', translation: '오늘 오후 3시 40분에 비가 옵니다.', keyword: '三点四十分', subtopics: ['weather', 'time_expression'], patternTags: ['time_weather'] },
    3: { text: '我每天吃完早饭以后去跑步。', pinyin: 'wo3 mei3tian1 chi1 wan2 zao3fan4 yi3hou4 qu4 pao3bu4.', translation: '나는 매일 아침을 먹은 후 달리러 갑니다.', keyword: '以后', subtopics: ['daily_routine', 'sequence'], patternTags: ['after_action'] },
    4: { text: '如果晚上不加班，我通常会自己做饭。', pinyin: 'ru2guo3 wan3shang bu4 jia1ban1, wo3 tong1chang2 hui4 zi4ji3 zuo4 fan4.', translation: '저녁에 야근하지 않으면 나는 보통 직접 밥을 합니다.', keyword: '通常', subtopics: ['daily_routine', 'food'], patternTags: ['conditional'] },
    5: { text: '养成规律的作息习惯，对提高学习效率很有帮助。', pinyin: 'yang3cheng2 gui1lü4 de zuo4xi2 xi2guan4, dui4 ti2gao1 xue2xi2 xiao4lü4 hen3 you3 bang1zhu4.', translation: '규칙적인 생활 습관을 기르는 것은 학습 효율을 높이는 데 도움이 됩니다.', keyword: '作息习惯', subtopics: ['daily_routine', 'habit'], patternTags: ['abstract_noun'] },
    6: { text: '现代人的生活节奏越来越快，因此更需要主动安排休息时间。', pinyin: 'xian4dai4 ren2 de sheng1huo2 jie2zou4 yue4lai2yue4 kuai4, yin1ci3 geng4 xu1yao4 zhu3dong4 an1pai2 xiu1xi2 shi2jian1.', translation: '현대인의 생활 리듬은 점점 빨라지므로, 더 적극적으로 휴식 시간을 배치해야 합니다.', keyword: '生活节奏', subtopics: ['lifestyle', 'time_management'], patternTags: ['cause_effect'] },
  },
  school_learning: {
    1: { text: '老师在教室里等学生。', pinyin: 'lao3shi1 zai4 jiao4shi4 li3 deng3 xue2sheng.', translation: '선생님은 교실에서 학생을 기다립니다.', keyword: '教室', subtopics: ['classroom'], patternTags: ['location'] },
    2: { text: '明天上午十点有汉语考试。', pinyin: 'ming2tian1 shang4wu3 shi2 dian3 you3 han4yu3 kao3shi4.', translation: '내일 오전 10시에 중국어 시험이 있습니다.', keyword: '考试', subtopics: ['exam', 'time_expression'], patternTags: ['schedule'] },
    3: { text: '这道题有点难，我想再听一遍。', pinyin: 'zhe4 dao4 ti2 you3dian3 nan2, wo3 xiang3 zai4 ting1 yi2 bian4.', translation: '이 문제는 조금 어려워서 한 번 더 듣고 싶습니다.', keyword: '再听一遍', subtopics: ['study_strategy'], patternTags: ['repeat_action'] },
    4: { text: '为了准备口语考试，她每天跟同学练习对话。', pinyin: 'wei4le zhun3bei4 kou3yu3 kao3shi4, ta1 mei3tian1 gen1 tong2xue2 lian4xi2 dui4hua4.', translation: '말하기 시험을 준비하기 위해 그녀는 매일 친구와 대화를 연습합니다.', keyword: '口语考试', subtopics: ['speaking', 'exam'], patternTags: ['purpose'] },
    5: { text: '只靠背单词不够，还要理解词语在句子里的用法。', pinyin: 'zhi3 kao4 bei4 dan1ci2 bu2 gou4, hai2 yao4 li3jie3 ci2yu3 zai4 ju4zi li3 de yong4fa3.', translation: '단어 암기만으로는 부족하고, 단어가 문장 안에서 쓰이는 법도 이해해야 합니다.', keyword: '用法', subtopics: ['vocabulary', 'grammar'], patternTags: ['contrast'] },
    6: { text: '语言学习的关键不在于短时间突击，而在于长期稳定的输入和输出。', pinyin: 'yu3yan2 xue2xi2 de guan1jian4 bu2 zai4yu2 duan3 shi2jian1 tu1ji1, er2 zai4yu2 chang2qi1 wen3ding4 de shu1ru4 he2 shu1chu1.', translation: '언어 학습의 핵심은 단기간 벼락치기가 아니라 장기적이고 안정적인 입력과 출력에 있습니다.', keyword: '输入和输出', subtopics: ['learning_method'], patternTags: ['not_a_but_b'] },
  },
  work_business: {
    1: { text: '爸爸今天去公司工作。', pinyin: 'ba4ba jin1tian1 qu4 gong1si1 gong1zuo4.', translation: '아빠는 오늘 회사에 일하러 갑니다.', keyword: '公司', subtopics: ['office'], patternTags: ['go_to_place'] },
    2: { text: '经理九点半开会。', pinyin: 'jing1li3 jiu3 dian3 ban4 kai1hui4.', translation: '매니저는 9시 반에 회의를 합니다.', keyword: '九点半', subtopics: ['meeting', 'time_expression'], patternTags: ['meeting_time'] },
    3: { text: '请把这份文件放在桌子上。', pinyin: 'qing3 ba3 zhe4 fen4 wen2jian4 fang4 zai4 zhuo1zi shang4.', translation: '이 서류를 책상 위에 놓아 주세요.', keyword: '文件', subtopics: ['office_task'], patternTags: ['ba_sentence'] },
    4: { text: '会议推迟到下午两点半，请大家准时参加。', pinyin: 'hui4yi4 tui1chi2 dao4 xia4wu3 liang3 dian3 ban4, qing3 da4jia1 zhun3shi2 can1jia1.', translation: '회의는 오후 2시 반으로 연기되었으니 모두 제시간에 참석해 주세요.', keyword: '推迟', subtopics: ['meeting', 'schedule_change'], patternTags: ['passive_schedule'] },
    5: { text: '这份市场报告需要在十二月三日以前交给客户。', pinyin: 'zhe4 fen4 shi4chang3 bao4gao4 xu1yao4 zai4 shi2er4 yue4 san1 ri4 yi3qian2 jiao1 gei3 ke4hu4.', translation: '이 시장 보고서는 12월 3일 이전에 고객에게 제출해야 합니다.', keyword: '十二月三日', subtopics: ['deadline', 'date_expression'], patternTags: ['deadline'] },
    6: { text: '公司决定调整销售策略，以应对不断变化的市场需求。', pinyin: 'gong1si1 jue2ding4 tiao2zheng3 xiao1shou4 ce4lüe4, yi3 ying4dui4 bu2duan4 bian4hua4 de shi4chang3 xu1qiu2.', translation: '회사는 변화하는 시장 수요에 대응하기 위해 판매 전략을 조정하기로 결정했습니다.', keyword: '销售策略', subtopics: ['strategy', 'market'], patternTags: ['purpose_formal'] },
  },
  people_relationships: {
    1: { text: '我妈妈有三个朋友。', pinyin: 'wo3 ma1ma you3 san1 ge peng2you.', translation: '우리 엄마는 친구가 세 명 있습니다.', keyword: '朋友', subtopics: ['family', 'friend'], patternTags: ['measure_word'] },
    2: { text: '妹妹给爷爷打电话。', pinyin: 'mei4mei gei3 ye2ye da3 dian4hua4.', translation: '여동생은 할아버지께 전화합니다.', keyword: '打电话', subtopics: ['family', 'phone'], patternTags: ['give_to'] },
    3: { text: '他邀请同事周末来家里吃饭。', pinyin: 'ta1 yao1qing3 tong2shi4 zhou1mo4 lai2 jia1li chi1fan4.', translation: '그는 동료를 주말에 집으로 식사하러 초대했습니다.', keyword: '邀请', subtopics: ['invitation', 'colleague'], patternTags: ['invite'] },
    4: { text: '虽然我们很久没见面，但是一直保持联系。', pinyin: 'sui1ran2 wo3men hen3 jiu3 mei2 jian4mian4, dan4shi4 yi4zhi2 bao3chi2 lian2xi4.', translation: '우리는 오랫동안 만나지 못했지만 계속 연락을 유지하고 있습니다.', keyword: '保持联系', subtopics: ['friendship'], patternTags: ['although_but'] },
    5: { text: '良好的沟通能减少误会，也能让关系更加稳定。', pinyin: 'liang2hao3 de gou1tong1 neng2 jian3shao3 wu4hui4, ye3 neng2 rang4 guan1xi geng4jia1 wen3ding4.', translation: '좋은 소통은 오해를 줄이고 관계를 더 안정적으로 만들 수 있습니다.', keyword: '沟通', subtopics: ['communication'], patternTags: ['parallel_result'] },
    6: { text: '在人际交往中，尊重差异往往比急于表达观点更重要。', pinyin: 'zai4 ren2ji4 jiao1wang3 zhong1, zun1zhong4 cha1yi4 wang3wang3 bi3 ji2yu2 biao3da2 guan1dian3 geng4 zhong4yao4.', translation: '인간관계에서는 차이를 존중하는 것이 의견을 서둘러 표현하는 것보다 더 중요할 때가 많습니다.', keyword: '尊重差异', subtopics: ['communication', 'values'], patternTags: ['comparison'] },
  },
  shopping_services: {
    1: { text: '这个杯子二十三块。', pinyin: 'zhe4 ge bei1zi er4shi2san1 kuai4.', translation: '이 컵은 23위안입니다.', keyword: '二十三块', subtopics: ['price', 'shopping'], patternTags: ['price'] },
    2: { text: '请给我一杯热茶。', pinyin: 'qing3 gei3 wo3 yi4 bei1 re4 cha2.', translation: '뜨거운 차 한 잔 주세요.', keyword: '一杯', subtopics: ['ordering', 'measure_word'], patternTags: ['polite_request'] },
    3: { text: '这件衣服打八五折。', pinyin: 'zhe4 jian4 yi1fu da3 ba1 wu3 zhe2.', translation: '이 옷은 15% 할인합니다.', keyword: '八五折', subtopics: ['discount', 'shopping'], patternTags: ['discount'] },
    4: { text: '如果不满意，可以在七天以内退货。', pinyin: 'ru2guo3 bu4 man3yi4, ke3yi3 zai4 qi1 tian1 yi3nei4 tui4huo4.', translation: '만족하지 않으면 7일 이내에 반품할 수 있습니다.', keyword: '退货', subtopics: ['service', 'return'], patternTags: ['conditional'] },
    5: { text: '客服说订单已经发出，预计明天上午送到。', pinyin: 'ke4fu2 shuo1 ding4dan1 yi3jing1 fa1chu1, yu4ji4 ming2tian1 shang4wu3 song4dao4.', translation: '고객센터는 주문이 이미 발송되었고 내일 오전 도착 예정이라고 말했습니다.', keyword: '订单', subtopics: ['customer_service', 'delivery'], patternTags: ['reported_speech'] },
    6: { text: '消费者越来越重视服务质量，而不仅仅关注价格高低。', pinyin: 'xiao1fei4zhe3 yue4lai2yue4 zhong4shi4 fu2wu4 zhi4liang4, er2 bu4 jin3jin3 guan1zhu4 jia4ge2 gao1di1.', translation: '소비자들은 가격뿐 아니라 서비스 품질을 점점 더 중시합니다.', keyword: '服务质量', subtopics: ['consumer', 'service'], patternTags: ['not_only'] },
  },
  transport_travel: {
    1: { text: '公共汽车来了。', pinyin: 'gong1gong4 qi4che1 lai2 le.', translation: '버스가 왔습니다.', keyword: '公共汽车', subtopics: ['bus'], patternTags: ['arrival'] },
    2: { text: '地铁二号线到火车站。', pinyin: 'di4tie3 er4 hao4 xian4 dao4 huo3che1 zhan4.', translation: '지하철 2호선은 기차역에 갑니다.', keyword: '二号线', subtopics: ['subway_line', 'station'], patternTags: ['route_number'] },
    3: { text: '从学校到机场大概要四十分钟。', pinyin: 'cong2 xue2xiao4 dao4 ji1chang3 da4gai4 yao4 si4shi2 fen1zhong1.', translation: '학교에서 공항까지 대략 40분 걸립니다.', keyword: '四十分钟', subtopics: ['duration', 'travel'], patternTags: ['from_to'] },
    4: { text: '请在前面的路口向右拐，然后一直走。', pinyin: 'qing3 zai4 qian2mian de lu4kou3 xiang4 you4 guai3, ran2hou4 yi4zhi2 zou3.', translation: '앞쪽 교차로에서 오른쪽으로 돌고 계속 걸어가세요.', keyword: '向右拐', subtopics: ['direction'], patternTags: ['direction_sequence'] },
    5: { text: '因为航班取消，我们不得不把酒店改到明天。', pinyin: 'yin1wei4 hang2ban1 qu3xiao1, wo3men bu4de2bu4 ba3 jiu3dian4 gai3 dao4 ming2tian1.', translation: '항공편이 취소되어 우리는 호텔 예약을 내일로 바꿀 수밖에 없었습니다.', keyword: '航班取消', subtopics: ['flight', 'hotel'], patternTags: ['because_result'] },
    6: { text: '完善的公共交通系统能够显著降低城市居民的出行成本。', pinyin: 'wan2shan4 de gong1gong4 jiao1tong1 xi4tong3 neng2gou4 xian3zhu4 jiang4di1 cheng2shi4 ju1min2 de chu1xing2 cheng2ben3.', translation: '완비된 대중교통 시스템은 도시 주민의 이동 비용을 크게 낮출 수 있습니다.', keyword: '公共交通系统', subtopics: ['public_transport', 'society'], patternTags: ['formal_effect'] },
  },
  health: {
    1: { text: '我今天不太舒服。', pinyin: 'wo3 jin1tian1 bu2 tai4 shu1fu.', translation: '나는 오늘 몸이 좀 불편합니다.', keyword: '不太舒服', subtopics: ['symptom'], patternTags: ['degree'] },
    2: { text: '医生说我要多喝水。', pinyin: 'yi1sheng1 shuo1 wo3 yao4 duo1 he1 shui3.', translation: '의사는 내가 물을 많이 마셔야 한다고 말했습니다.', keyword: '多喝水', subtopics: ['doctor', 'advice'], patternTags: ['reported_advice'] },
    3: { text: '他感冒了，所以没有去上课。', pinyin: 'ta1 gan3mao4 le, suo3yi3 mei2you3 qu4 shang4ke4.', translation: '그는 감기에 걸려서 수업에 가지 않았습니다.', keyword: '感冒', subtopics: ['illness'], patternTags: ['cause_result'] },
    4: { text: '饭后散步半个小时，对身体有好处。', pinyin: 'fan4 hou4 san4bu4 ban4 ge xiao3shi2, dui4 shen1ti3 you3 hao3chu4.', translation: '식후 30분 산책은 몸에 좋습니다.', keyword: '半个小时', subtopics: ['exercise', 'duration'], patternTags: ['benefit'] },
    5: { text: '长期缺少运动可能会影响睡眠质量。', pinyin: 'chang2qi1 que1shao3 yun4dong4 ke3neng2 hui4 ying3xiang3 shui4mian2 zhi4liang4.', translation: '장기간 운동이 부족하면 수면의 질에 영향을 줄 수 있습니다.', keyword: '睡眠质量', subtopics: ['sleep', 'exercise'], patternTags: ['possibility'] },
    6: { text: '保持心理健康和保持身体健康一样值得重视。', pinyin: 'bao3chi2 xin1li3 jian4kang1 he2 bao3chi2 shen1ti3 jian4kang1 yi2yang4 zhi2de2 zhong4shi4.', translation: '정신 건강을 유지하는 것은 신체 건강을 유지하는 것만큼 중요하게 여길 만합니다.', keyword: '心理健康', subtopics: ['mental_health'], patternTags: ['as_as'] },
  },
  public_places: {
    1: { text: '银行在学校旁边。', pinyin: 'yin2hang2 zai4 xue2xiao4 pang2bian1.', translation: '은행은 학교 옆에 있습니다.', keyword: '旁边', subtopics: ['location', 'bank'], patternTags: ['place_position'] },
    2: { text: '图书馆在三楼。', pinyin: 'tu2shu1guan3 zai4 san1 lou2.', translation: '도서관은 3층에 있습니다.', keyword: '三楼', subtopics: ['floor', 'library'], patternTags: ['floor_number'] },
    3: { text: '我们在A座门口见面。', pinyin: 'wo3men zai4 A zuo4 men2kou3 jian4mian4.', translation: '우리는 A동 입구에서 만납니다.', keyword: 'A座', subtopics: ['building', 'meeting_place'], patternTags: ['building_code'] },
    4: { text: '博物馆周一不开门，请明天再来。', pinyin: 'bo2wu4guan3 zhou1yi1 bu4 kai1men2, qing3 ming2tian1 zai4 lai2.', translation: '박물관은 월요일에 열지 않으니 내일 다시 오세요.', keyword: '周一', subtopics: ['museum', 'opening_hours'], patternTags: ['schedule'] },
    5: { text: '这个社区中心为老人和孩子提供免费的活动。', pinyin: 'zhe4 ge she4qu1 zhong1xin1 wei4 lao3ren2 he2 hai2zi ti2gong1 mian3fei4 de huo2dong4.', translation: '이 커뮤니티 센터는 노인과 아이들에게 무료 활동을 제공합니다.', keyword: '社区中心', subtopics: ['community', 'service'], patternTags: ['provide_for'] },
    6: { text: '公共空间的设计应该兼顾便利性、安全性和文化特色。', pinyin: 'gong1gong4 kong1jian1 de she4ji4 ying1gai1 jian1gu4 bian4li4xing4, an1quan2xing4 he2 wen2hua4 te4se4.', translation: '공공 공간의 설계는 편리성, 안전성, 문화적 특색을 함께 고려해야 합니다.', keyword: '公共空间', subtopics: ['urban_space'], patternTags: ['enumeration'] },
  },
  culture_society: {
    1: { text: '今天是中国新年。', pinyin: 'jin1tian1 shi4 zhong1guo2 xin1nian2.', translation: '오늘은 중국의 새해입니다.', keyword: '新年', subtopics: ['festival'], patternTags: ['date_event'] },
    2: { text: '我们星期六去看京剧。', pinyin: 'wo3men xing1qi1liu4 qu4 kan4 jing1ju4.', translation: '우리는 토요일에 경극을 보러 갑니다.', keyword: '京剧', subtopics: ['performance', 'weekday'], patternTags: ['plan'] },
    3: { text: '春节的时候，很多人回家看父母。', pinyin: 'chun1jie2 de shi2hou, hen3 duo1 ren2 hui2 jia1 kan4 fu4mu3.', translation: '춘절 때 많은 사람들이 부모님을 뵈러 집에 갑니다.', keyword: '春节', subtopics: ['festival', 'family'], patternTags: ['when_clause'] },
    4: { text: '这个城市每年都会举办音乐节，吸引很多游客。', pinyin: 'zhe4 ge cheng2shi4 mei3 nian2 dou1 hui4 ju3ban4 yin1yue4 jie2, xi1yin3 hen3 duo1 you2ke4.', translation: '이 도시는 매년 음악제를 열어 많은 관광객을 끌어들입니다.', keyword: '音乐节', subtopics: ['festival', 'tourism'], patternTags: ['annual_event'] },
    5: { text: '随着互联网的发展，人们获取新闻的方式发生了很大变化。', pinyin: 'sui2zhe5 hu4lian2wang3 de fa1zhan3, ren2men huo4qu3 xin1wen2 de fang1shi4 fa1sheng1 le hen3 da4 bian4hua4.', translation: '인터넷의 발전에 따라 사람들이 뉴스를 얻는 방식은 크게 변했습니다.', keyword: '互联网', subtopics: ['media', 'society'], patternTags: ['with_development'] },
    6: { text: '传统文化并不是一成不变的，它会在现代社会中不断产生新的表达方式。', pinyin: 'chuan2tong3 wen2hua4 bing4 bu2 shi4 yi4cheng2bu2bian4 de, ta1 hui4 zai4 xian4dai4 she4hui4 zhong1 bu2duan4 chan3sheng1 xin1 de biao3da2 fang1shi4.', translation: '전통문화는 결코 변하지 않는 것이 아니라 현대 사회 속에서 끊임없이 새로운 표현 방식을 만들어 냅니다.', keyword: '传统文化', subtopics: ['tradition', 'society'], patternTags: ['not_fixed'] },
  },
};

function difficultyFor(level: HskListeningLevel, activityType: HskListeningActivityType): HskListeningDifficulty {
  if (level <= 2 && activityType !== 'dictation') return 'easy';
  if (level >= 5 || activityType === 'dictation' || activityType === 'shadowing') return 'hard';
  return 'medium';
}

function skillFor(topic: HskListeningTopic, activityType: HskListeningActivityType): HskListeningSkill {
  if (activityType === 'dictation') return 'dictation';
  if (activityType === 'shadowing') return 'shadowing';
  if (topic === 'transport_travel' || topic === 'work_business' || topic === 'shopping_services' || topic === 'public_places') {
    return 'number_time_listening';
  }
  if (topic === 'people_relationships') return 'similar_sound_discrimination';
  if (activityType === 'repeat_listening') return 'sequence_understanding';
  return 'keyword_catching';
}

function contentTypeFor(level: HskListeningLevel, activityType: HskListeningActivityType): HskListeningContentType {
  if (activityType === 'shadowing' && level >= 5) return 'short_passage';
  if (activityType === 'multiple_choice' && level >= 3) return 'dialogue';
  if (activityType === 'practice' && level <= 2) return 'word';
  return 'sentence';
}

function speedProfileFor(level: HskListeningLevel): 'slow' | 'normal' | 'fast' {
  if (level <= 2) return 'slow';
  if (level >= 5) return 'fast';
  return 'normal';
}

function choicesFor(level: HskListeningLevel, topic: HskListeningTopic) {
  const otherTopics = TOPIC_ORDER.filter((candidate) => candidate !== topic);
  return [
    EXAMPLES[topic][level].translation,
    EXAMPLES[otherTopics[(level + topic.length) % otherTopics.length]][level].translation,
    EXAMPLES[otherTopics[(level * 2 + topic.length) % otherTopics.length]][level].translation,
  ];
}

function makeQuestion(
  level: HskListeningLevel,
  topic: HskListeningTopic,
  activityType: HskListeningActivityType,
  activityIndex: number,
): HskListeningQuestion {
  const example = EXAMPLES[topic][level];
  const contentType = contentTypeFor(level, activityType);
  const id = `hsk-l${level}-${topic.replace(/_/g, '-')}-${activityType.replace(/_/g, '-')}-${activityIndex + 1}`;
  const isChoice = activityType === 'multiple_choice';
  const isFillBlank = activityType === 'fill_blank';
  const answer = isChoice ? example.translation : isFillBlank ? example.keyword : example.text;

  return {
    id,
    level,
    section: 'listening',
    topic,
    subtopics: example.subtopics,
    contentType,
    activityType,
    promptText: example.text,
    ttsText: example.text,
    answer,
    choices: isChoice ? choicesFor(level, topic) : undefined,
    transcript: example.text,
    pinyin: example.pinyin,
    translation: example.translation,
    explanation: isFillBlank
      ? `빈칸의 핵심 표현은 "${example.keyword}"입니다. 소리에서 의미 단위를 먼저 잡아 보세요.`
      : activityType === 'dictation'
        ? '받아쓰기는 한자 누락과 숫자/시간 표현을 정확히 듣는 것이 핵심입니다.'
        : `핵심 청취 포인트는 "${example.keyword}"입니다.`,
    tags: [topic, ...example.subtopics, activityType, contentType],
    listeningSkill: skillFor(topic, activityType),
    difficulty: difficultyFor(level, activityType),
    speedProfile: speedProfileFor(level),
    patternTags: example.patternTags,
  };
}

function buildQuestions() {
  const questions: HskListeningQuestion[] = [];
  const baseActivities: HskListeningActivityType[] = ['practice', 'multiple_choice', 'dictation'];
  const extraActivities: Array<{ topic: HskListeningTopic; activityType: HskListeningActivityType }> = [
    { topic: 'daily_life', activityType: 'fill_blank' },
    { topic: 'transport_travel', activityType: 'repeat_listening' },
    { topic: 'culture_society', activityType: 'shadowing' },
  ];

  LEVELS.forEach((level) => {
    TOPIC_ORDER.forEach((topic) => {
      baseActivities.forEach((activityType, index) => {
        questions.push(makeQuestion(level, topic, activityType, index));
      });
    });

    extraActivities.forEach(({ topic, activityType }, index) => {
      questions.push(makeQuestion(level, topic, activityType, baseActivities.length + index));
    });
  });

  return questions;
}

export const HSK_LISTENING_QUESTIONS = buildQuestions();

export function getHskListeningQuestions(level: HskListeningLevel, topic?: HskListeningTopic) {
  return HSK_LISTENING_QUESTIONS.filter((question) => question.level === level && (!topic || question.topic === topic));
}
