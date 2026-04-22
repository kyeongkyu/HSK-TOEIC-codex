export interface GrammarExample {
  chinese: string;
  translation: string;
}

export interface GrammarPoint {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  pattern: string;
  explanation: string;
  examples: GrammarExample[];
}

export const grammarData: GrammarPoint[] = [
  // HSK 1
  {
    id: 'hsk1-shi',
    level: 1,
    title: '是 (shì) 동사문',
    pattern: 'A + 是 + B',
    explanation: "'是'는 '~이다'라는 뜻으로, 주어와 명사(보어)를 연결하여 신분, 직업, 국적 등을 나타냅니다.",
    examples: [
      { chinese: '我是学生。', translation: '나는 학생입니다.' },
      { chinese: '他是老师。', translation: '그는 선생님입니다.' }
    ]
  },
  {
    id: 'hsk1-you',
    level: 1,
    title: '有 (yǒu) 동사문',
    pattern: 'A + 有 + B',
    explanation: "'有'는 '가지고 있다' 또는 '~이 있다'라는 뜻으로, 소유를 나타내거나 특정 장소에 사람/사물이 존재함을 나타냅니다.",
    examples: [
      { chinese: '我有钱。', translation: '나는 돈이 있습니다.' },
      { chinese: '他有一个女儿。', translation: '그는 딸이 한 명 있습니다.' }
    ]
  },
  {
    id: 'hsk1-bu',
    level: 1,
    title: '不 (bù) 부정문',
    pattern: '不 + 동사/형용사',
    explanation: "'不'는 동사나 형용사 앞에 쓰여 부정을 나타냅니다. '是'나 일반 동사를 부정할 때 쓰이며, '有'의 부정은 '没'를 사용합니다.",
    examples: [
      { chinese: '我不是老师。', translation: '나는 선생님이 아닙니다.' },
      { chinese: '他不吃米饭。', translation: '그는 밥을 먹지 않습니다.' }
    ]
  },
  {
    id: 'hsk1-ma',
    level: 1,
    title: '吗 (ma) 의문문',
    pattern: '평서문 + 吗？',
    explanation: "평서문 끝에 '吗'를 붙여 '~입니까?', '~하나요?'라는 의문문을 만듭니다.",
    examples: [
      { chinese: '你是学生吗？', translation: '당신은 학생입니까?' },
      { chinese: '你爱我吗？', translation: '당신은 나를 사랑하나요?' }
    ]
  },

  // HSK 2
  {
    id: 'hsk2-le',
    level: 2,
    title: '了 (le) 완료태',
    pattern: '동사 + 了',
    explanation: "동사 뒤에 쓰여 동작이나 상태가 이미 완료되었음을 나타냅니다.",
    examples: [
      { chinese: '我吃米饭了。', translation: '나는 밥을 먹었습니다.' },
      { chinese: '他买了一本书。', translation: '그는 책을 한 권 샀습니다.' }
    ]
  },
  {
    id: 'hsk2-zai',
    level: 2,
    title: '在 (zài) 진행태',
    pattern: '在 + 동사',
    explanation: "동사 앞에 쓰여 동작이 현재 진행 중임을 나타냅니다. '~하고 있는 중이다'로 해석합니다.",
    examples: [
      { chinese: '我在看书。', translation: '나는 책을 읽고 있습니다.' },
      { chinese: '他在睡觉。', translation: '그는 자고 있습니다.' }
    ]
  },
  {
    id: 'hsk2-bi',
    level: 2,
    title: '比 (bǐ) 비교문',
    pattern: 'A + 比 + B + 형용사',
    explanation: "두 대상을 비교할 때 사용합니다. 'A가 B보다 ~하다'라는 뜻입니다.",
    examples: [
      { chinese: '哥哥比我高。', translation: '형이 나보다 큽니다.' },
      { chinese: '今天比昨天热。', translation: '오늘이 어제보다 덥습니다.' }
    ]
  },
  {
    id: 'hsk2-guo',
    level: 2,
    title: '过 (guò) 경험태',
    pattern: '동사 + 过',
    explanation: "동사 뒤에 쓰여 과거의 경험을 나타냅니다. '~한 적이 있다'로 해석합니다.",
    examples: [
      { chinese: '我去过中国。', translation: '나는 중국에 가본 적이 있습니다.' },
      { chinese: '我看过这本书。', translation: '나는 이 책을 본 적이 있습니다.' }
    ]
  },

  // HSK 3
  {
    id: 'hsk3-ba',
    level: 3,
    title: '把 (bǎ) 처치문',
    pattern: '주어 + 把 + 목적어 + 동사 + 기타성분',
    explanation: "목적어를 동사 앞으로 끌어내어, 그 목적어에 어떤 동작을 가해 결과를 발생시킴을 강조합니다.",
    examples: [
      { chinese: '我把书放下了。', translation: '나는 책을 내려놓았습니다.' },
      { chinese: '他把苹果吃了。', translation: '그는 사과를 먹어버렸습니다.' }
    ]
  },
  {
    id: 'hsk3-bei',
    level: 3,
    title: '被 (bèi) 피동문',
    pattern: '주어 + 被 + 행위자 + 동사 + 기타성분',
    explanation: "주어가 어떤 동작을 당함을 나타냅니다. 행위자는 생략될 수 있습니다.",
    examples: [
      { chinese: '苹果被他吃了。', translation: '사과는 그에 의해 먹혔습니다.' },
      { chinese: '衣服被洗了。', translation: '옷이 세탁되었습니다.' }
    ]
  },
  {
    id: 'hsk3-suiran',
    level: 3,
    title: '虽然... 但是... (양보 구문)',
    pattern: '虽然 + 상황1, 但是 + 상황2',
    explanation: "'비록 ~이지만, 그러나 ~하다'라는 뜻으로 상반되는 두 가지 상황을 연결하는 접속사입니다.",
    examples: [
      { chinese: '虽然下雨，但是我们去爬山。', translation: '비록 비가 오지만, 우리는 등산을 갑니다.' },
      { chinese: '虽然他很累，但是他很高兴。', translation: '비록 그는 피곤하지만, 그는 매우 기쁩니다.' }
    ]
  },
  {
    id: 'hsk3-yuelaiyue',
    level: 3,
    title: '越来越 (yùeláiyùe) 점층 구문',
    pattern: '越来越 + 형용사/심리동사',
    explanation: "시간이 지남에 따라 정도가 심해짐을 나타냅니다. '점점 더 ~해지다'로 해석합니다.",
    examples: [
      { chinese: '天气越来越热。', translation: '날씨가 점점 더워집니다.' },
      { chinese: '他越来越胖。', translation: '그는 점점 뚱뚱해집니다.' }
    ]
  },
  {
    id: 'hsk3-ruguo',
    level: 3,
    title: '如果... 就... (가정 구문)',
    pattern: '如果 + 가정, (주어) + 就 + 결과',
    explanation: "'만약 ~라면, 곧 ~하다'라는 뜻으로 가정을 나타내는 접속사입니다.",
    examples: [
      { chinese: '如果明天下雨，我们就不去。', translation: '만약 내일 비가 온다면, 우리는 가지 않겠습니다.' },
      { chinese: '如果你有钱，就买吧。', translation: '만약 당신에게 돈이 있다면, 사세요.' }
    ]
  },
  // HSK 4
  {
    id: 'hsk4-suiran',
    level: 4,
    title: '虽然... 但是... (suīrán... dànshì...) 양보 구문',
    pattern: '虽然 + A, 但是 + B',
    explanation: "'비록 ~하지만, 그러나 ~하다'라는 뜻으로 상반되는 두 가지 상황을 연결합니다.",
    examples: [
      { chinese: '虽然他很累，但是还在工作。', translation: '그는 비록 피곤하지만, 여전히 일하고 있습니다.' },
      { chinese: '虽然下雨了，但是我们还是去了。', translation: '비록 비가 왔지만, 우리는 그래도 갔습니다.' }
    ]
  },
  {
    id: 'hsk4-budan',
    level: 4,
    title: '不但... 而且... (búdàn... érqiě...) 점층 구문',
    pattern: '不但 + A, 而且 + B',
    explanation: "'~일 뿐만 아니라, 게다가 ~하다'라는 뜻으로 점층적인 관계를 나타냅니다.",
    examples: [
      { chinese: '他不但聪明，而且很努力。', translation: '그는 똑똑할 뿐만 아니라, 게다가 매우 노력합니다.' },
      { chinese: '这道菜不但好看，而且好吃。', translation: '이 요리는 보기 좋을 뿐만 아니라, 맛도 좋습니다.' }
    ]
  },

  // HSK 5
  {
    id: 'hsk5-lian-dou',
    level: 5,
    title: '连... 都/也... (심지어 구문)',
    pattern: '连 + A + 都/也 + B',
    explanation: "'심지어 A조차도 B하다'라는 뜻으로, 극단적인 예시를 들어 어떤 사실을 강조할 때 사용합니다.",
    examples: [
      { chinese: '他太忙了，连吃饭的时间都没有。', translation: '그는 너무 바빠서 심지어 밥 먹을 시간조차 없습니다.' },
      { chinese: '这个问题连小孩子都知道。', translation: '이 문제는 심지어 어린아이조차도 압니다.' }
    ]
  },
  {
    id: 'hsk5-jishi',
    level: 5,
    title: '即使... 也... (가정 양보 구문)',
    pattern: '即使 + A, 也 + B',
    explanation: "'설령 A하더라도, 역시 B하다'라는 뜻으로, 가상의 상황을 제시하고 그 상황이 결과에 영향을 미치지 않음을 나타냅니다.",
    examples: [
      { chinese: '即使下大雨，我也要去。', translation: '설령 큰 비가 내리더라도, 나는 갈 것입니다.' },
      { chinese: '即使你不想听，我也要说。', translation: '설령 당신이 듣고 싶지 않더라도, 나는 말할 것입니다.' }
    ]
  },
  {
    id: 'hsk5-wulun',
    level: 5,
    title: '无论... 都/也... (조건 양보 구문)',
    pattern: '无论 + 조건/의문문, 都/也 + 결과',
    explanation: "'~를 막론하고 모두 ~하다'라는 뜻으로, 어떠한 조건 하에서도 동일한 결과가 나타남을 강조합니다.",
    examples: [
      { chinese: '无论遇到什么困难，他都不放弃。', translation: '어떤 어려움을 만나든 막론하고, 그는 포기하지 않습니다.' },
      { chinese: '无论你去哪里，我都会支持你。', translation: '당신이 어디를 가든, 나는 모두 당신을 지지할 것입니다.' }
    ]
  },
  {
    id: 'hsk5-ningke',
    level: 5,
    title: '宁可... 也不... (선택 구문)',
    pattern: '宁可 + A, 也不 + B',
    explanation: "두 가지 불리한 상황 중에서 '차라리 A할지언정, B하지는 않겠다'는 강한 의지를 나타냅니다.",
    examples: [
      { chinese: '我宁可穷，也不做坏事。', translation: '나는 차라리 가난할지언정, 나쁜 일은 하지 않겠습니다.' },
      { chinese: '他宁可走路，也不坐那辆车。', translation: '그는 차라리 걸어갈지언정, 그 차는 타지 않겠습니다.' }
    ]
  },
  {
    id: 'hsk5-jiran',
    level: 5,
    title: '既然... 就... (기정 사실 구문)',
    pattern: '既然 + 기정사실, 就 + 결론/제안',
    explanation: "'기왕 이렇게 된 바에야 ~하다'라는 뜻으로, 이미 발생하거나 알려진 사실을 전제로 결론이나 제안을 이끌어냅니다.",
    examples: [
      { chinese: '既然你来了，就吃完饭再走吧。', translation: '기왕 당신이 왔으니, 밥을 다 먹고 가세요.' },
      { chinese: '既然大家都没意见，那就这么办吧。', translation: '모두 의견이 없으시니, 그럼 이렇게 처리합시다.' }
    ]
  },

  // HSK 6
  {
    id: 'hsk6-napa',
    level: 6,
    title: '哪怕... 也/都... (가정 양보 구문)',
    pattern: '哪怕 + A, 也/都 + B',
    explanation: "'설령 A하더라도, 역시 B하다'라는 뜻으로, '即使... 也...'와 비슷하지만 극단적인 가정을 더 강하게 나타냅니다.",
    examples: [
      { chinese: '哪怕只有一线希望，我也要试试。', translation: '설령 일말의 희망밖에 없을지라도, 나는 시도해 볼 것입니다.' },
      { chinese: '哪怕再困难，我们也要完成任务。', translation: '설령 아무리 어렵더라도, 우리는 임무를 완수해야 합니다.' }
    ]
  },
  {
    id: 'hsk6-fanshi',
    level: 6,
    title: '凡是... 都... (무조건 구문)',
    pattern: '凡是 + 특정 범위/조건, (주어) + 都 + 결론',
    explanation: "'무릇 ~한 것은 모두 ~하다'라는 뜻으로, 어떤 범위 내의 모든 예외 없는 상황을 강조할 때 사용됩니다.",
    examples: [
      { chinese: '凡是认识他的人，都说他是个好人。', translation: '그를 아는 사람은 무릇 모두 그를 좋은 사람이라고 말합니다.' },
      { chinese: '凡是不符合规定的产品，都不能出厂。', translation: '규정에 부합하지 않는 제품은 무릇 모두 출고될 수 없습니다.' }
    ]
  },
  {
    id: 'hsk6-yuqi',
    level: 6,
    title: '与其... 不如... (비교 선택 구문)',
    pattern: '与其 + A, 不如 + B',
    explanation: "'A하느니 차라리 B하는 것이 낫다'라는 뜻으로, 두 가지 상황을 비교한 후 뒤의 상황(B)을 선택함을 확고하게 나타냅니다.",
    examples: [
      { chinese: '与其在家里睡觉，不如出去运动。', translation: '집에서 잠을 자느니 차라리 나가서 운동하는 것이 낫습니다.' },
      { chinese: '与其抱怨，不如想办法解决。', translation: '불평하느니 차라리 해결 방법을 생각하는 것이 낫습니다.' }
    ]
  },
  {
    id: 'hsk6-chufei',
    level: 6,
    title: '除非... 才/否则... (유일 조건 구문)',
    pattern: '除非 + 유일한 조건, 才/否则 + 결과',
    explanation: "'~해야만 비로소 ~하다' 또는 '~하지 않으면 안 된다'라는 뜻으로, 어떤 일이 발생하기 위한 유일하고 필수적인 조건을 나타냅니다.",
    examples: [
      { chinese: '除非你亲自去，他才会答应。', translation: '당신이 직접 가야만, 비로소 그가 승낙할 것입니다.' },
      { chinese: '除非马上出发，否则我们会迟到的。', translation: '당장 출발하지 않으면, 우리는 지각할 것입니다.' }
    ]
  },
  {
    id: 'hsk6-guran',
    level: 6,
    title: '固然... 但是/也... (부분 인정 구문)',
    pattern: 'A + 固然 + 인정하는 점, 但是/也要 + B',
    explanation: "'물론 ~하긴 하지만, 그러나 ~하다'라는 뜻으로, 앞의 사실을 인정하면서도 뒤의 내용이 더 중요하거나 다른 측면이 있음을 강조합니다.",
    examples: [
      { chinese: '赚钱固然重要，但是健康更重要。', translation: '돈을 버는 것도 물론 중요하지만, 건강이 더 중요합니다.' },
      { chinese: '这种方法固然好，也存在一些风险。', translation: '이 방법이 물론 좋기는 하지만, 일부 위험도 존재합니다.' }
    ]
  }
];
