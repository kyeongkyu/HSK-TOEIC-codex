const fs = require('fs');
const data = fs.readFileSync('data/hsk.ts', 'utf-8');

// The file has export const hskWords = [ ... ]
// Let's just require it or parse it!
// Oh wait, node doesn't natively support TS require without ts-node.
// Let's parse with RegExp from data/hsk.ts!

let words4 = [];
const wordRegex = /word:\s*'([^']+)',\s*pinyin:\s*'[^']+',\s*meaning:\s*'[^']+',\s*level:\s*'4'/g;
let match;
while ((match = wordRegex.exec(data)) !== null) {
    words4.push(match[1]);
}
console.log("Words found in HSK level 4:", words4.length);
fs.writeFileSync('hsk4_all_words.json', JSON.stringify(words4));
