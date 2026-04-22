
const fs = require('fs');

const content = fs.readFileSync('/data/hsk.ts', 'utf8');
const lines = content.split('\n');

const wordsByLevel = {
  1: [],
  2: [],
  3: [],
  4: []
};

lines.forEach(line => {
  const match = line.match(/^\d+: (\d+)\|([^|]+)\|([^|]+)\|([^|]+)\|/);
  if (match) {
    const level = parseInt(match[1]);
    const word = match[2];
    const pinyin = match[3];
    const meaning = match[4];
    if (wordsByLevel[level]) {
      wordsByLevel[level].push({ word, pinyin, meaning });
    }
  }
});

Object.keys(wordsByLevel).forEach(level => {
  console.log(`Level ${level}: ${wordsByLevel[level].length} words`);
});

// Save to a temp file for me to analyze
fs.writeFileSync('/tmp/hsk_words.json', JSON.stringify(wordsByLevel, null, 2));
