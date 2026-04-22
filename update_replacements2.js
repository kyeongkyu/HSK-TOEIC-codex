const fs = require('fs');
const replacements = require('./replacements.json');

replacements["春"] = { ex: "春很漂亮。", tr: "봄은 매우 예쁩니다." };

fs.writeFileSync('./replacements.json', JSON.stringify(replacements, null, 2));
