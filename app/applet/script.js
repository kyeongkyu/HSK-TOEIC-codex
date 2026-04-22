const fs = require('fs');

const hskText = fs.readFileSync('data/hsk.ts', 'utf8');
const lines = hskText.split('\n');
const words4 = [];
lines.forEach(line => {
  if (line.match(/^4\|/)) {
    words4.push(line.split('|')[1]);
  }
});

const chunkSize = 20;
const chunks = [];
for (let i = 0; i < words4.length; i += chunkSize) {
  chunks.push(words4.slice(i, i + chunkSize));
}

let code = `\n  '4': [\n`;
chunks.forEach((chunk, index) => {
  const num = String(index + 1).padStart(2, '0');
  const wordsStr = chunk.map(w => `'${w}'`).join(', ');
  code += `    {
      id: 'hsk4-part-${index + 1}',
      name: 'HSK 4급 필수 단어 ${index + 1}',
      words: [${wordsStr}]
    }${index === chunks.length - 1 ? '' : ','}\n`;
});
code += `  ]`;

let catText = fs.readFileSync('data/hsk-categories.ts', 'utf8');

const targetStr = `    }
  ]
};`;

if(catText.includes(targetStr)) {
  const newEnding = `    }
  ],` + code + `\n};\n`;
  catText = catText.replace(targetStr, newEnding);
  fs.writeFileSync('data/hsk-categories.ts', catText);
  console.log('Successfully wrote new categories');
} else {
  console.error('Target string not found in data/hsk-categories.ts');
  console.log(catText.slice(-50));
}
