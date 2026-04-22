const fs = require('fs');
const hskContent = fs.readFileSync('./data/hsk.ts', 'utf-8');
const rawDataMatch = hskContent.match(/const rawData = `([\s\S]*?)`;/);
const rawData = rawDataMatch[1];
const lines = rawData.trim().split('\n');
const hsk1 = lines.filter(l => l.startsWith('1|')).map(l => l.split('|')[1]);
console.log(hsk1.join(', '));
