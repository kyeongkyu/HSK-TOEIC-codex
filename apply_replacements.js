const fs = require('fs');

const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');

const replacements = require('./replacements.json');

const newLines = lines.map(line => {
  const parts = line.split('|');
  if (parts.length >= 6) {
    const word = parts[1];
    if (replacements[word]) {
      parts[4] = replacements[word].ex;
      parts[5] = replacements[word].tr;
      return parts.join('|');
    }
  }
  return line;
});

const newRawData = newLines.join('\n');
const newHskContent = hskContent.replace(rawData, newRawData);

fs.writeFileSync('./data/hsk.ts', newHskContent);
console.log("Updated data/hsk.ts");
