const fs = require('fs');

function extract(level) {
    const data = JSON.parse(fs.readFileSync(`hsk-vocabulary-repo/hsk-vocab-json/hsk-level-${level}.json`, 'utf8'));
    const words = data.map(item => {
        let first = item.translations[0];
        first = first.replace(/\(.*\)/g, '').trim();
        first = first.split('CL:')[0].split('[')[0].trim();
        return `${item.hanzi}|${item.pinyin}|${first}`;
    });
    fs.writeFileSync(`words_L${level}.txt`, words.join('\n'), 'utf8');
}

extract(5);
extract(6);
