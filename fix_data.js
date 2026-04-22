const fs = require('fs');
let content = fs.readFileSync('data/hsk-categories.ts', 'utf8');

// Fix HSK 1 Numbers
content = content.replace(/'点',.*'明天'/, "'点', '分钟', '现在', '今天', '明天'");

// Fix HSK 1 States
content = content.replace(/'吗', '마'/, "'吗'");
content = content.replace(/'의', '和'/, "'的', '和'");

// Fix HSK 2 Grammar
content = content.replace(/'제일', '一下'/, "'一下'");

fs.writeFileSync('data/hsk-categories.ts', content);
console.log('Fixed HSK 1 & 2');
