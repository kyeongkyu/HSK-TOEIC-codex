import type { ResumeTaskKey } from '@/lib/resume-task';

export type JlptHomeMode = 'vocab-n5' | 'vocab-n4' | 'kana-hiragana' | 'kana-katakana';

export type JlptMenuItem =
  | { label: string; disabled: true }
  | { label: string; disabled: false; mode: JlptHomeMode; level?: 'N5' | 'N4' };

export type JlptHomeConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  statLabel: string;
  statValue: string | number;
  buttonLabel: string;
  route: string;
  taskKey: ResumeTaskKey;
  resumeLabel: string;
};

export const jlptMenuItems: JlptMenuItem[] = [
  { label: 'JLPT N1', disabled: true },
  { label: 'JLPT N2', disabled: true },
  { label: 'JLPT N3', disabled: true },
  { label: 'JLPT N4', disabled: false, mode: 'vocab-n4', level: 'N4' },
  { label: 'JLPT N5', disabled: false, mode: 'vocab-n5', level: 'N5' },
  { label: 'Hiragana', disabled: false, mode: 'kana-hiragana' },
  { label: 'Katakana', disabled: false, mode: 'kana-katakana' },
];

export function getJlptHomeConfig(
  mode: JlptHomeMode,
  selectedJlptLevel: 'N5' | 'N4',
  jlptVocabCount: number,
): JlptHomeConfig {
  const configs: Record<JlptHomeMode, JlptHomeConfig> = {
    'vocab-n4': {
      eyebrow: 'Vocabulary',
      title: 'JLPT N4',
      subtitle: '\uAE30\uCD08\uC5D0\uC11C \uC911\uAE09\uC73C\uB85C',
      description: 'N5 \uC774\uD6C4 \uD544\uC694\uD55C \uD575\uC2EC \uC5B4\uD718\uC640 \uAD8C\uC7A5 \uC5B4\uD718\uB97C \uCE74\uB4DC\uB85C \uC775\uD788\uACE0 \uC77C\uBCF8\uC5B4 \uC608\uBB38 \uBC1C\uC74C\uC744 \uD568\uAED8 \uD655\uC778\uD558\uC138\uC694.',
      statLabel: 'Words',
      statValue: selectedJlptLevel === 'N4' ? jlptVocabCount : 'N4',
      buttonLabel: 'N4 \uB2E8\uC5B4 \uD559\uC2B5\uD558\uAE30',
      route: '/jlpt/vocab',
      taskKey: 'jlpt-vocab',
      resumeLabel: 'JLPT N4 Vocabulary',
    },
    'vocab-n5': {
      eyebrow: 'Vocabulary',
      title: 'JLPT N5',
      subtitle: '\uCC98\uC74C \uC77C\uBCF8\uC5B4 \uC5B4\uD718',
      description: '\uD788\uB77C\uAC00\uB098 \uBC1C\uC74C, \uB73B, \uC608\uBB38\uC744 \uCE74\uB4DC\uC5D0\uC11C \uD655\uC778\uD558\uBA70 N5 \uAE30\uBCF8 \uC5B4\uD718\uB97C \uC775\uD600\uBCF4\uC138\uC694.',
      statLabel: 'Words',
      statValue: selectedJlptLevel === 'N5' ? jlptVocabCount : 'N5',
      buttonLabel: 'N5 \uB2E8\uC5B4 \uD559\uC2B5\uD558\uAE30',
      route: '/jlpt/vocab',
      taskKey: 'jlpt-vocab',
      resumeLabel: 'JLPT N5 Vocabulary',
    },
    'kana-hiragana': {
      eyebrow: 'Kana',
      title: 'Hiragana',
      subtitle: '\u3072\u3089\u304C\u306A',
      description: '\uAE30\uBCF8\uC74C, \uD0C1\uC74C, \uC694\uC74C\uAE4C\uC9C0 \uD788\uB77C\uAC00\uB098 \uC804\uCCB4 \uD45C\uB97C \uBCF4\uACE0 \uAE00\uC790\uBCC4 \uCE74\uB4DC\uB85C \uBC1C\uC74C\uACFC \uC608\uC2DC\uB97C \uD559\uC2B5\uD558\uC138\uC694.',
      statLabel: 'Kana Set',
      statValue: 'Chart',
      buttonLabel: '\uD788\uB77C\uAC00\uB098 \uD559\uC2B5\uD558\uAE30',
      route: '/jlpt/kana?script=hiragana',
      taskKey: 'jlpt-kana-hiragana',
      resumeLabel: 'Hiragana',
    },
    'kana-katakana': {
      eyebrow: 'Kana',
      title: 'Katakana',
      subtitle: '\u30AB\u30BF\u30AB\u30CA',
      description: '\uC678\uB798\uC5B4\uC640 \uAC15\uC870 \uD45C\uD604\uC5D0 \uC790\uC8FC \uC4F0\uC774\uB294 \uAC00\uD0C0\uCE74\uB098\uB97C \uD45C\uC640 \uCE74\uB4DC \uC911\uC2EC\uC73C\uB85C \uC775\uD600\uBCF4\uC138\uC694.',
      statLabel: 'Kana Set',
      statValue: 'Chart',
      buttonLabel: '\uAC00\uD0C0\uCE74\uB098 \uD559\uC2B5\uD558\uAE30',
      route: '/jlpt/kana?script=katakana',
      taskKey: 'jlpt-kana-katakana',
      resumeLabel: 'Katakana',
    },
  };

  return configs[mode];
}
