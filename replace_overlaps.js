const fs = require('fs');

const replacements = [
  "4|暗|àn|어둡다|天暗下来了。|날이 어두워졌다.",
  "4|包括|bāokuò|포함하다|这包括在内。|이것은 포함되어 있다.",
  "4|报道|bàodào|보도하다|新闻报道。|뉴스 보도.",
  "4|表示|biǎoshì|표시하다|表示感谢。|감사를 표시하다.",
  "4|表演|biǎoyǎn|공연하다|看表演。|공연을 보다.",
  "4|功夫|gōngfu|쿵푸, 시간|中国功夫。|중국 쿵푸.",
  "4|国籍|guójí|국적|你的国籍是什么？|너의 국적은 무엇이니?",
  "4|果汁|guǒzhī|과일 주스|喝果汁。|과일 주스를 마시다."
];

const overlaps = ['得', '等', '对', '发', '个子', '过', '航班', '后来'];

let hskContent = fs.readFileSync('./data/hsk.ts', 'utf8');
let lines = hskContent.split('\n');

let replacedCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('4|')) {
    const word = lines[i].split('|')[1];
    if (overlaps.includes(word)) {
      lines[i] = replacements[replacedCount];
      replacedCount++;
      if (replacedCount >= replacements.length) break;
    }
  }
}

fs.writeFileSync('./data/hsk.ts', lines.join('\n'));
console.log(`Replaced ${replacedCount} overlapping words.`);
