const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function generateSentence(word, englishMeaning) {
  const meaning = englishMeaning.toLowerCase();
  if (meaning.startsWith('to ')) {
    // Verb
    return `我们必须${word}。`; // We must [word].
  } else if (meaning.includes('adj') || meaning.includes('adverb') || meaning.includes('very')) {
    // Adjective/Adverb
    return `这个非常${word}。`; // This is very [word].
  } else if (meaning.match(/^(a |an |the )/)) {
    // Noun
    return `这是一个${word}。`; // This is a [word].
  } else {
    // Default generic
    return `关于${word}的问题。`; // Questions about [word].
  }
}

async function batchTranslate(texts, from, to) {
  const batchSize = 100; // 100 lines to be safe
  const results = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const joined = chunk.join('\n');
    console.log(`Translating chunk ${i / batchSize + 1} / ${Math.ceil(texts.length / batchSize)} (${from}->${to})...`);
    
    let retries = 3;
    while (retries > 0) {
      try {
        const res = await translate(joined, { from, to });
        const translatedLines = res.text.split('\n');
        
        // Sometimes Google might drop a line or merge them. We do our best to map.
        if (translatedLines.length !== chunk.length) {
            console.warn(`Mismatch in chunk ${i / batchSize + 1}: expected ${chunk.length}, got ${translatedLines.length}`);
            // Fallback for mismatch: just map sequentially, pad with empty if short
            for(let j=0; j<chunk.length; j++) {
                results.push(translatedLines[j] || "번역 오류");
            }
        } else {
            results.push(...translatedLines);
        }
        await sleep(1000); // polite delay
        break;
      } catch(e) {
        retries--;
        console.error(`Error on chunk ${i / batchSize + 1}, retries left: ${retries}`, e.message);
        if (retries === 0) {
            console.warn("Out of retries, filling with blanks");
            chunk.forEach(() => results.push("번역 실패"));
        }
        await sleep(5000);
      }
    }
  }
  return results;
}

async function processFile(filePath, level, outFile) {
  console.log(`Processing ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.startsWith(`${level}|`));
  const endIdx = lines.findLastIndex(l => l.startsWith(`${level}|`));
  
  if (startIdx === -1) {
    console.log("No data found.");
    return;
  }
  
  const header = lines.slice(0, startIdx).join('\n');
  const footer = lines.slice(endIdx + 1).join('\n');
  const dataLines = lines.slice(startIdx, endIdx + 1);
  
  const parsed = dataLines.map((line, idx) => {
    const [lvl, word, pinyin, meaning, _ex, _exTrans] = line.split('|');
    if (!word) return null;
    const example = generateSentence(word, meaning);
    return { lvl, word, pinyin, meaning, example };
  }).filter(Boolean);

  // Take a small sample first to avoid extremely long execution for testing
  // Actually, we'll do the full array since we are batching 50 lines at a time.
  // 1300 lines / 50 = 26 requests (takes ~1 min)

  const englishMeanings = parsed.map(item => item.meaning);
  const chineseExamples = parsed.map(item => item.example);

  const translatedMeanings = await batchTranslate(englishMeanings, 'en', 'ko');
  const translatedExamples = await batchTranslate(chineseExamples, 'zh-CN', 'ko');

  const newLines = parsed.map((item, i) => {
    // clean up translated meanings:
    let koMeaning = translatedMeanings[i] || item.meaning;
    let koExample = translatedExamples[i] || "예문이 없습니다.";
    
    // Remove formatting weirdness if any
    koMeaning = koMeaning.replace(/\|/g, ',');
    koExample = koExample.replace(/\|/g, ',');
    
    return `${item.lvl}|${item.word}|${item.pinyin}|${koMeaning}|${item.example}|${koExample}`;
  });

  const finalContent = header + (header.length>0?'\n':'') + newLines.join('\n') + (footer.length>0?'\n':'') + footer;
  fs.writeFileSync(outFile, finalContent, 'utf8');
  console.log(`Finished ${outFile}`);
}

async function run() {
  await processFile('data/hsk-6.ts', 6, 'data/hsk-6-auto.ts');
}

run();
