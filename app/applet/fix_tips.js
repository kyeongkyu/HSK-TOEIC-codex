const fs = require('fs');
const content = fs.readFileSync('/app/applet/data/tips.ts', 'utf8');

// The duplication starts at the first '点' and repeats.
// But there's also corruption.

// Let's try to fix the duplication by finding the repeated block and removing it.
// And specifically target the corrupted line 38.

const lines = fs.readFileSync('/app/applet/data/tips.ts', 'utf8').split('\n');

// Clean line 38 specifically if it matches the pattern
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'喝'") && lines[i].includes(' 것)"')) {
    // This is a guess on how the bytes render in the script environment
    lines[i] = "  '喝': \"口(입 구) - 마시다 / 목이 말라 '허(hē)' 하고 물을 마십니다. / 喝水 (물을 마시다)\",";
  }
  // Try matching without the corrupted part if it's visible as something else
  if (lines[i].includes("'喝'") && lines[i].includes('것)"')) {
     lines[i] = "  '喝': \"口(입 구) - 마시다 / 목이 말라 '허(hē)' 하고 물을 마십니다. / 喝水 (물을 마시다)\",";
  }
}

// Remove the duplicated block (39-60)
// We know lines 39-60 are duplicates of 17-38.
// Since we might have shifted things, let's find the second '点' entry.
let firstDotIndex = -1;
let secondDotIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'点':")) {
    if (firstDotIndex === -1) {
      firstDotIndex = i;
    } else if (secondDotIndex === -1) {
      secondDotIndex = i;
      break;
    }
  }
}

if (firstDotIndex !== -1 && secondDotIndex !== -1) {
    // The duplication goes from index secondDotIndex to line entry '和' or similar.
    // Let's just remove the 22 lines starting from secondDotIndex
    lines.splice(secondDotIndex, 22);
}

// Now handle the corruption at '里' (around line 79)
// 79: '里': "밭(田) + 흙(土) = 마을 / 마을 안으로 '
// 80: '睡觉': "1. 부수: ...
// 81:  가볍게 문장을 끝낼 때...

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("'里'") && lines[i].includes('마을 안으로')) {
        lines[i] = "  '里': \"밭(田) + 흙(土) = 마을 / 마을 안으로 '리(lǐ)' 들어갑니다. / 家里 (집 안)\",";
    }
    if (lines[i].includes("'睡觉'") && lines[i].includes('1. 부수')) {
        lines[i] = "  '睡觉': \"目(눈 목) / 눈(目)을 감고 '슈이쨔오(shuìjiào)' 푹 자세요. / 去睡觉 (자러 가다)\",";
    }
    if (lines[i].includes('가볍게 문장을 끝낼 때')) {
         lines[i] = "  '呢': \"口(입 구) / 너'느(ne)'? 하고 가볍게 문장을 끝낼 때. / 你呢 (너는?)\",";
    }
}

fs.writeFileSync('/app/applet/data/tips.ts', lines.join('\n'));
console.log('File cleaned successfully');
