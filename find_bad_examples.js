const fs = require('fs');

const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');
const dict = new Set();
const words = [];

lines.forEach(line => {
  const parts = line.split('|');
  if (parts.length >= 6) {
    dict.add(parts[1]);
    words.push({ lineNum: words.length + 1, word: parts[1], example: parts[4], fullLine: line });
  }
});

const PUNCTUATION = /^[\u3002\uFF0C\uFF1F\uFF01\u201C\u201D\u3001\uFF1A\uFF1B\s]+$/;

words.forEach(w => {
  if (!w.example) return;
  let i = 0;
  const sentence = w.example;
  let hasUnrecognized = false;
  let unrecChars = [];
  while (i < sentence.length) {
    let match = null;
    for (let len = 5; len > 0; len--) {
      const sub = sentence.substring(i, i + len);
      if (dict.has(sub)) {
        match = sub;
        break;
      }
    }
    if (match) {
      i += match.length;
    } else {
      const char = sentence[i];
      if (!PUNCTUATION.test(char)) {
        hasUnrecognized = true;
        unrecChars.push(char);
      }
      i++;
    }
  }
  if (hasUnrecognized) {
    console.log(`Line ${w.lineNum}: ${w.word} -> ${w.example}`);
    console.log(`   Unrecognized: ${unrecChars.join('')}`);
  }
});
