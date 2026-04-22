const fs = require('fs');

const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');

const newLines = lines.map(line => {
  const parts = line.split('|');
  if (parts.length >= 6) {
    const word = parts[1];
    if (word === '哪') {
      parts[4] = '哪一个是你的书？';
      parts[5] = '어느 것이 당신의 책입니까?';
      return parts.join('|');
    }
  }
  return line;
});

const newRawData = newLines.join('\n');
const newHskContent = hskContent.replace(rawData, newRawData);

fs.writeFileSync('./data/hsk.ts', newHskContent);
console.log("Updated data/hsk.ts for '哪'");
