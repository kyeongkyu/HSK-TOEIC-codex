import fs from 'fs';

const urls = [
  'https://raw.githubusercontent.com/clem109/hsk-vocabulary/master/hsk_5.json',
  'https://raw.githubusercontent.com/clem109/hsk-vocabulary/master/data/hsk_5.json',
  'https://raw.githubusercontent.com/clem109/hsk-vocabulary/master/hsk5.json',
  'https://raw.githubusercontent.com/clem109/hsk-vocabulary/master/data/hsk5.json',
  'https://raw.githubusercontent.com/krmanik/HSK-Words-with-audio/master/data/HSK5.json',
  'https://raw.githubusercontent.com/krmanik/HSK-Words-with-audio/master/hsk5.json',
  'https://raw.githubusercontent.com/glxxyz/hskhsk.com/main/data/HSK%202012/HSK5.txt',
  'https://raw.githubusercontent.com/gigacool/hanyu-shuiping-kaoshi/master/hsk.json',
  'https://raw.githubusercontent.com/Gigacool/hanyu-shuiping-kaoshi/master/hsk.json'
];

async function checkUrls() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`FOUND: ${url}`);
        const text = await res.text();
        console.log(`Starts with: ${text.substring(0, 100)}`);
        return;
      } else {
        console.log(`Failed: ${url}`);
      }
    } catch(e) {}
  }
}

checkUrls();
