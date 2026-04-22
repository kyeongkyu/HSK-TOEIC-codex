const fs = require('fs');

const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');

const newLines = lines.map(line => {
  const parts = line.split('|');
  if (parts.length >= 6) {
    const word = parts[1];
    if (word === '医生') {
      parts[4] = '他是医生。';
      parts[5] = '그는 의사입니다.';
      return parts.join('|');
    }
    if (word === '关系') {
      parts[4] = '我们的关系很好。';
      parts[5] = '우리의 관계는 매우 좋습니다.';
      return parts.join('|');
    }
  }
  return line;
});

const newRawData = newLines.join('\n');
const newHskContent = hskContent.replace(rawData, newRawData);

fs.writeFileSync('./data/hsk.ts', newHskContent);
console.log("Updated data/hsk.ts for '医生' and '关系'");
