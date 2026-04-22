const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    const raw = fs.readFileSync('words_L5.txt', 'utf8').split('\n').filter(l => l.trim());
    let data = [];
    if (fs.existsSync('hsk5_data.json')) {
        const content = fs.readFileSync('hsk5_data.json', 'utf8');
        if (content.trim()) data = JSON.parse(content);
    }
    
    const start = data.length;
    // Increase batch for first run to see how it goes
    const end = Math.min(start + 80, raw.length); 
    
    console.log(`Processing HSK 5: ${start} to ${end} (Total: ${raw.length})`);
    
    for (let i = start; i < end; i++) {
        const line = raw[i];
        if (!line) continue;
        const parts = line.split('|');
        if (parts.length < 3) continue;
        const [hanzi, pinyin, eng] = parts;

        try {
            const res = await translate(eng, { from: 'en', to: 'ko' });
            let ko = res.text.split(/[,;(]/)[0].trim();
            
            let senCn = `${hanzi}这个。`;
            const senRes = await translate(senCn, { from: 'zh-CN', to: 'ko' });
            let senKo = senRes.text;
            
            data.push({ hanzi, pinyin, meaning: ko, senCn, senKo });
            console.log(`${i+1}: ${hanzi} -> ${ko}`);
            
            // Save every 10 to be safe
            if ((i + 1) % 10 === 0) {
                 fs.writeFileSync('hsk5_data.json', JSON.stringify(data, null, 2));
            }
            
            await sleep(2000); 
        } catch (e) {
            console.error(`Error at index ${i}:`, e.message);
            if (e.message.includes('Too Many Requests')) {
                console.log("Rate limited. Exiting.");
                break;
            }
            // Other errors, try to skip or wait
            await sleep(5000);
        }
    }
    fs.writeFileSync('hsk5_data.json', JSON.stringify(data, null, 2));
    console.log("Batch finished.");
}
run();
