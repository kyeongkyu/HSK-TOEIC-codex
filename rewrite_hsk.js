const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CACHE_PATH = './hsk_cache.json';
let cache = { meanings: {}, sentences: {} };

try {
    if (fs.existsSync(CACHE_PATH)) {
        cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
} catch (e) {
    console.error("Cache load error", e);
}

function saveCache() {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

async function batchTranslate(texts, from, to, type) {
    const results = [];
    const toTranslate = [];
    const indicesToTranslate = [];

    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (cache[type][text]) {
            results[i] = cache[type][text];
        } else {
            toTranslate.push(text);
            indicesToTranslate.push(i);
        }
    }

    if (toTranslate.length === 0) return results;

    const batchSize = 10;
    for (let i = 0; i < toTranslate.length; i += batchSize) {
        const chunk = toTranslate.slice(i, i + batchSize);
        const joined = chunk.join('\n');
        process.stdout.write(`Translating ${type} ${i}/${toTranslate.length}... `);

        let retries = 5;
        while (retries > 0) {
            try {
                const res = await translate(joined, { from, to });
                const translatedLines = res.text.split('\n');

                if (translatedLines.length !== chunk.length) {
                    console.warn(`Mismatch: ${chunk.length} vs ${translatedLines.length}`);
                    for (let j = 0; j < chunk.length; j++) {
                        const val = translatedLines[j] || "error";
                        results[indicesToTranslate[i + j]] = val;
                        cache[type][chunk[j]] = val;
                    }
                } else {
                    for (let j = 0; j < chunk.length; j++) {
                        const val = translatedLines[j].trim();
                        results[indicesToTranslate[i + j]] = val;
                        cache[type][chunk[j]] = val;
                    }
                }
                process.stdout.write('Done.\n');
                saveCache();
                await sleep(3000); 
                break;
            } catch (e) {
                retries--;
                process.stdout.write(`Fail (${e.message}). Retries: ${retries}\n`);
                if (e.message.includes('Too Many Requests')) {
                    console.log("Cooling down for 60s...");
                    await sleep(60000);
                } else {
                    await sleep(10000);
                }
                if (retries === 0) {
                    chunk.forEach((txt, idx) => {
                        results[indicesToTranslate[i + idx]] = "번역 실패";
                    });
                }
            }
        }
    }
    return results;
}

function generateSentence(word, engMeaning) {
    const m = engMeaning.toLowerCase();
    if (m.startsWith('to ')) return `${word}这个。`;
    if (m.includes('adj') || m.includes('very')) return `非常${word}。`;
    return `这是${word}。`;
}

async function processLevel(level) {
    const jsonPath = `hsk-vocabulary-repo/hsk-vocab-json/hsk-level-${level}.json`;
    console.log(`Loading ${jsonPath}`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const words = data.map(item => {
        let first = item.translations[0];
        first = first.replace(/\(.*\)/g, '').trim();
        first = first.split('CL:')[0].split('[')[0].trim();
        return { hanzi: item.hanzi, pinyin: item.pinyin, eng: first };
    });

    console.log(`Step 1: Translating meanings for L${level}...`);
    const koMeanings = await batchTranslate(words.map(w => w.eng), 'en', 'ko', 'meanings');
    
    console.log(`Step 2: Generating and translating sentences for L${level}...`);
    const sentences = words.map(w => generateSentence(w.hanzi, w.eng));
    const koSentences = await batchTranslate(sentences, 'zh-CN', 'ko', 'sentences');

    const rawLines = words.map((w, i) => {
        let meaning = koMeanings[i].split(/[,;(]/)[0].trim();
        // Specific request: concise meaning
        return `${level}|${w.hanzi}|${w.pinyin}|${meaning}|${sentences[i]}|${koSentences[i]}`;
    });

    const exportName = `hsk${level}RawData`;
    const finalContent = `export const ${exportName} = \`
${rawLines.join('\n')}\`;\n`;

    fs.writeFileSync(`data/hsk-${level}.ts`, finalContent, 'utf8');
    console.log(`Completed Level ${level}`);
}

async function run() {
    const levelStr = process.argv[2];
    if (!levelStr) {
        console.error("Usage: node rewrite_hsk.js [level]");
        return;
    }
    await processLevel(parseInt(levelStr));
}

run();
