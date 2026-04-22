const fs = require('fs');

const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');
const dict = new Set();

lines.forEach(line => {
  const parts = line.split('|');
  if (parts.length >= 6) {
    dict.add(parts[1]);
  }
});

const grammarContent = fs.readFileSync('./data/grammar.ts', 'utf-8');
const examples = [];
const regex = /chinese:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(grammarContent)) !== null) {
  examples.push(match[1]);
}

const PUNCTUATION = /^[\u3002\uFF0C\uFF1F\uFF01\u201C\u201D\u3001\uFF1A\uFF1B\s]+$/;

examples.forEach(sentence => {
  let i = 0;
  let unsegmented = [];
  while (i < sentence.length) {
    let matched = null;
    for (let len = 5; len > 0; len--) {
      const sub = sentence.substring(i, i + len);
      if (dict.has(sub)) {
        matched = sub;
        break;
      }
    }
    if (matched) {
      i += matched.length;
    } else {
      const char = sentence[i];
      if (!PUNCTUATION.test(char)) {
        unsegmented.push(char);
      }
      i++;
    }
  }
  if (unsegmented.length > 0) {
    console.log(`Unsegmented in "${sentence}": ${unsegmented.join(', ')}`);
  }
});
