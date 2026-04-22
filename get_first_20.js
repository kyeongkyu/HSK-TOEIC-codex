const fs = require('fs');
const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');

let hsk1Count = 0;
lines.forEach(line => {
  const parts = line.split('|');
  if (parts[0] === '1' && hsk1Count < 20) {
    console.log(`${hsk1Count + 1}. ${parts[1]} (${parts[2]}) - ${parts[3]}`);
    hsk1Count++;
  }
});
