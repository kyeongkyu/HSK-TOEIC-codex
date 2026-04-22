const { translate } = require('@vitalets/google-translate-api');

async function test() {
  const words = ['唉', '爱护', '爱惜', '爱心', '安慰'];
  for (const w of words) {
    const res = await translate(w, { from: 'zh-CN', to: 'ko' });
    console.log(`${w} -> ${res.text}`);
  }
}

test();
