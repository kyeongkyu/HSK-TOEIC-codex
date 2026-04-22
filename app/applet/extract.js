const fs = require('fs');

const data = fs.readFileSync('data/hsk-categories.ts', 'utf-8');
const match = data.match(/'4': \[\s*([\s\S]*?)\s*\]\n};/);

if (match) {
  const hsk4Text = match[1];
  const wordRegex = /'([^']+)'/g;
  let words = [];
  let w;
  while ((w = wordRegex.exec(hsk4Text)) !== null) {
    if (!w[1].startsWith('hsk4-part') && !w[1].startsWith('HSK 4급 필수 단어')) {
      words.push(w[1]);
    }
  }
  words = [...new Set(words)];
  console.log("Total words length:", words.length);
  fs.writeFileSync('hsk4_all_words.json', JSON.stringify(words));
  fs.writeFileSync('hsk4_parts.json', hsk4Text);
} else {
  console.log("No match");
}
