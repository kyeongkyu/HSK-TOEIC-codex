import { translate } from '@vitalets/google-translate-api';

async function test() {
  try {
    const res = await translate('Hello world!', { to: 'ko' });
    console.log(res.text);
  } catch(e) {
    console.error(e);
  }
}
test();
