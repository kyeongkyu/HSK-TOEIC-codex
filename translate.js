const fs = require('fs');
const path = require('path');

async function translate() {
  const filePath = path.join(process.cwd(), 'data', 'hsk.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^[123]\|/)) {
      const parts = line.split('|');
      if (parts.length === 5) {
        const example = parts[4];
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=ko&dt=t&q=${encodeURIComponent(example)}`);
          const data = await res.json();
          const translation = data[0].map(x => x[0]).join('');
          newLines.push(`${line}|${translation}`);
        } catch (e) {
          newLines.push(`${line}|(해석 오류)`);
        }
        await new Promise(r => setTimeout(r, 20));
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }
  
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  console.log('Translation complete');
}
translate();
