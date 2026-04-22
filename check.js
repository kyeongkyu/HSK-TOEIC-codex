const fs = require('fs');

const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
if (!rawDataMatch) {
  console.log("Could not find rawData");
  process.exit(1);
}

const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');
const dict = new Set();
const words = [];

lines.forEach(line => {
  const parts = line.split('|');
  if (parts.length >= 6) {
    dict.add(parts[1]);
    words.push({ word: parts[1], example: parts[4] });
  }
});

const PUNCTUATION = /^[\u3002\uFF0C\uFF1F\uFF01\u201C\u201D\u3001\uFF1A\uFF1B\s]+$/;
let unrecognized = new Set();

words.forEach(w => {
  if (!w.example) return;
  let i = 0;
  const sentence = w.example;
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
        unrecognized.add(char);
      }
      i++;
    }
  }
});

console.log("Unrecognized characters:", Array.from(unrecognized).join(''));
