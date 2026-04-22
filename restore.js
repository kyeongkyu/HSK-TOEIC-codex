const { execSync } = require('child_process');
execSync('git checkout data/hsk-categories.ts');
console.log('Restored map');
