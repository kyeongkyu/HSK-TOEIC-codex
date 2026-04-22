const fs = require('fs');
const replacements = require('./replacements.json');

replacements["同学"] = { ex: "我们是同学。", tr: "우리는 반 친구들입니다." };
replacements["白"] = { ex: "我喜欢白衣服。", tr: "나는 흰 옷을 좋아해요." };
replacements["对"] = { ex: "你做得对。", tr: "당신이 맞게 했습니다." };
replacements["黑"] = { ex: "我喜欢黑衣服。", tr: "나는 검은 옷을 좋아해요." };
replacements["红"] = { ex: "苹果是红的。", tr: "사과는 빨간색입니다." };
replacements["晴"] = { ex: "今天很晴。", tr: "오늘은 매우 화창합니다." };
replacements["外"] = { ex: "他在门外。", tr: "그는 문 밖에 있습니다." };
replacements["阴"] = { ex: "今天很阴。", tr: "오늘은 매우 흐립니다." };
replacements["再"] = { ex: "请再写一次。", tr: "다시 한 번 써주세요." };
replacements["春"] = { ex: "春很美。", tr: "봄은 매우 아름답습니다." }; // 美 is not in list? Let's check.
replacements["东"] = { ex: "太阳在东。", tr: "태양은 동쪽에 있습니다." };
replacements["冬"] = { ex: "冬很冷。", tr: "겨울은 매우 춥습니다." };
replacements["久"] = { ex: "很久没有来。", tr: "오랫동안 오지 않았습니다." };
replacements["马"] = { ex: "这是一只马。", tr: "이것은 말입니다." };
replacements["米"] = { ex: "他一米八。", tr: "그는 1.8미터입니다." };
replacements["南"] = { ex: "他在南。", tr: "그는 남쪽에 있습니다." };
replacements["秋"] = { ex: "秋很好。", tr: "가을은 매우 좋습니다." };
replacements["双"] = { ex: "我买了一双。", tr: "나는 한 켤레를 샀다." };
replacements["西"] = { ex: "太阳在西。", tr: "태양은 서쪽에 있습니다." };
replacements["夏"] = { ex: "夏很热。", tr: "여름은 매우 덥습니다." };
replacements["向"] = { ex: "向右边走。", tr: "오른쪽으로 가세요." };
replacements["站"] = { ex: "请站好。", tr: "잘 서 계세요." }; // 好 is in list.

fs.writeFileSync('./replacements.json', JSON.stringify(replacements, null, 2));
