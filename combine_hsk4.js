const fs = require('fs');

let allWords = [];
for (let i = 1; i <= 6; i++) {
  const content = fs.readFileSync(`./hsk4_${i}.txt`, 'utf8');
  const lines = content.trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      allWords.push(line.trim());
    }
  }
}

// Deduplicate based on the word (2nd column)
const uniqueWords = [];
const seen = new Set();
for (const line of allWords) {
  const parts = line.split('|');
  if (parts.length >= 2) {
    const word = parts[1];
    if (!seen.has(word)) {
      seen.add(word);
      uniqueWords.push(line);
    }
  }
}

console.log(`Found ${uniqueWords.length} unique words.`);

// Take exactly 600 words
const finalWords = uniqueWords.slice(0, 600);
console.log(`Taking ${finalWords.length} words.`);

// Read existing hsk.ts
let hskContent = fs.readFileSync("./data/hsk.ts", "utf-8");

// Remove existing HSK 4 words
const lines = hskContent.split("\n");
const nonHsk4Lines = lines.filter(line => !line.startsWith("4|"));

// Find where to insert (before the export const hskWords)
const exportIndex = nonHsk4Lines.findIndex(line => line.includes("export const hskWords"));

// Insert the final words
nonHsk4Lines.splice(exportIndex - 1, 0, finalWords.join("\n"));

fs.writeFileSync("./data/hsk.ts", nonHsk4Lines.join("\n"));
console.log("Successfully updated ./data/hsk.ts with exactly 600 HSK 4 words.");
