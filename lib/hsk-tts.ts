import type {
  HskListeningActivityType,
  HskListeningLevel,
  HskListeningQuestion,
  HskListeningSkill,
} from '@/data/hsk-listening';

export type HskTtsVoiceProfileId = 'standard' | 'clear' | 'warm';
export type HskTtsVoiceLocale = 'CN' | 'TW' | 'HK' | 'neutral';
export type HskTtsVoiceGender = 'female' | 'male' | 'neutral';

export type HskTtsVoicePreference = {
  id?: HskTtsVoiceProfileId;
  locale?: HskTtsVoiceLocale;
  gender?: HskTtsVoiceGender;
};

export type HskTtsVoiceProfile = {
  id: HskTtsVoiceProfileId;
  label: string;
  locale: HskTtsVoiceLocale;
  gender: HskTtsVoiceGender;
  voice: SpeechSynthesisVoice | null;
  rateOffset: number;
  pitchOffset: number;
};

export type HskTtsSegment = {
  text: string;
  pauseMs?: number;
  reason?: 'punctuation' | 'number_time' | 'location' | 'enumeration' | 'natural';
};

export type HskTtsOptions = {
  voice?: SpeechSynthesisVoice | null;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  pauseMs?: number;
  cancelCurrent?: boolean;
  onStart?: () => void;
  onSegmentStart?: (segment: HskTtsSegment, index: number) => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
};

const PROFILE_IDS: HskTtsVoiceProfileId[] = ['standard', 'clear', 'warm'];
const CHINESE_DIGITS = ['\u96f6', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u4e03', '\u516b', '\u4e5d'];
const TEN = '\u5341';
const HUNDRED = '\u767e';
const TWO_FOR_COUNTING = '\u4e24';

const PROFILE_BLUEPRINTS: Array<Omit<HskTtsVoiceProfile, 'voice'>> = [
  {
    id: 'standard',
    label: 'Standard',
    locale: 'CN',
    gender: 'neutral',
    rateOffset: 0,
    pitchOffset: 0,
  },
  {
    id: 'clear',
    label: 'Clear',
    locale: 'CN',
    gender: 'female',
    rateOffset: -0.006,
    pitchOffset: 0,
  },
  {
    id: 'warm',
    label: 'Warm',
    locale: 'CN',
    gender: 'male',
    rateOffset: -0.003,
    pitchOffset: 0,
  },
];

function hashString(value: string) {
  return value.split('').reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);
}

function deterministicOffset(id: string) {
  return ((hashString(id) % 5) - 2) * 0.002;
}

function numberToChinese(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return String(value);
  if (parsed < 10) return CHINESE_DIGITS[parsed];
  if (parsed === 10) return TEN;
  if (parsed < 20) return `${TEN}${CHINESE_DIGITS[parsed % 10]}`;
  if (parsed < 100) {
    const tens = Math.floor(parsed / 10);
    const ones = parsed % 10;
    return `${CHINESE_DIGITS[tens]}${TEN}${ones === 0 ? '' : CHINESE_DIGITS[ones]}`;
  }
  if (parsed < 1000) {
    const hundreds = Math.floor(parsed / 100);
    const rest = parsed % 100;
    if (rest === 0) return `${CHINESE_DIGITS[hundreds]}${HUNDRED}`;
    return `${CHINESE_DIGITS[hundreds]}${HUNDRED}${rest < 10 ? CHINESE_DIGITS[0] : ''}${numberToChinese(rest)}`;
  }
  return String(value);
}

function readDigitsIndividually(value: string) {
  return value.split('').map((digit) => CHINESE_DIGITS[Number.parseInt(digit, 10)] ?? digit).join(' ');
}

function readMinute(value: string) {
  if (value.startsWith('0') && value.length === 2) {
    return `${CHINESE_DIGITS[0]}${CHINESE_DIGITS[Number.parseInt(value[1], 10)]}`;
  }
  return numberToChinese(value);
}

function normalizeMixedNumbers(text: string) {
  return text
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, hour: string, minute: string) => `${numberToChinese(hour)}\u70b9${readMinute(minute)}\u5206`)
    .replace(/\b(\d{1,2})\u6708(\d{1,2})[\u65e5\u53f7]\b/g, (_, month: string, day: string) => `${numberToChinese(month)}\u6708${numberToChinese(day)}\u65e5`)
    .replace(/\b(\d+)%/g, (_, percent: string) => `${HUNDRED}\u5206\u4e4b${numberToChinese(percent)}`)
    .replace(/\b(\d+)([\u5757\u5143])\b/g, (_, amount: string, unit: string) => `${numberToChinese(amount)}${unit}`)
    .replace(/\b(\d+)([\u697c\u5c42])\b/g, (_, floor: string, unit: string) => `${numberToChinese(floor)}${unit}`)
    .replace(/\b(\d+)(\u53f7\u7ebf)\b/g, (_, line: string, unit: string) => `${numberToChinese(line)}${unit}`)
    .replace(/\b(\d+)([\u8def\u53f7])\b/g, (_, number: string, unit: string) => `${number.length >= 3 ? readDigitsIndividually(number) : numberToChinese(number)}${unit}`)
    .replace(/\b(\d+)([\u5ba4\u623f\u95f4])\b/g, (_, room: string, unit: string) => `${readDigitsIndividually(room)}${unit}`)
    .replace(/\b(\d{3,})\b/g, (_, digits: string) => readDigitsIndividually(digits))
    .replace(/\b([A-F])\u5ea7\b/g, (_, letter: string) => `${letter}\u5ea7`);
}

export function normalizeChineseForTTS(text: string) {
  return normalizeMixedNumbers(text)
    .replace(/#/g, '\u53f7')
    .replace(/&/g, '\u548c')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getChineseVoices(voices?: SpeechSynthesisVoice[]) {
  const sourceVoices = voices ?? (
    typeof window !== 'undefined' && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : []
  );

  return sourceVoices.filter((voice) => {
    const lang = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();
    return (
      lang.includes('zh') ||
      name.includes('chinese') ||
      name.includes('mandarin') ||
      name.includes('tingting') ||
      name.includes('xiaoxiao') ||
      name.includes('xiaoyi') ||
      name.includes('yunxi') ||
      name.includes('kangkang') ||
      name.includes('huihui') ||
      name.includes('mei-jia')
    );
  });
}

function localeScore(voice: SpeechSynthesisVoice, locale: HskTtsVoiceLocale) {
  const lang = voice.lang.toLowerCase();
  if (locale === 'CN' && (lang.includes('zh-cn') || lang.includes('zh-hans'))) return 42;
  if (locale === 'TW' && (lang.includes('zh-tw') || lang.includes('zh-hant'))) return 30;
  if (locale === 'HK' && lang.includes('zh-hk')) return 26;
  if (lang.includes('zh')) return 18;
  return 0;
}

function profileVoiceScore(voice: SpeechSynthesisVoice, profile: Omit<HskTtsVoiceProfile, 'voice'>, usedVoiceUris: Set<string>) {
  const name = voice.name.toLowerCase();
  let score = localeScore(voice, profile.locale);

  if (voice.default) score += 5;
  if (!usedVoiceUris.has(voice.voiceURI)) score += 18;
  if (/(natural|premium|enhanced|neural|online)/.test(name)) score += 10;

  if (profile.id === 'standard') {
    if (/(xiaoxiao|xiaoyi|tingting|huihui|mei-jia)/.test(name)) score += 12;
    if (profile.gender === 'neutral') score += 3;
  }

  if (profile.id === 'clear') {
    if (/(xiaoxiao|xiaoyi|tingting|huihui|premium|enhanced|natural)/.test(name)) score += 14;
    if (/(yunyang|yunjian|kangkang)/.test(name)) score += 4;
  }

  if (profile.id === 'warm') {
    if (/(yunxi|yunjian|kangkang|yaoyao)/.test(name)) score += 16;
    if (!/(xiaoxiao|xiaoyi)/.test(name)) score += 5;
  }

  return score;
}

export function pickChineseVoiceForProfile(
  voices: SpeechSynthesisVoice[],
  profile: Omit<HskTtsVoiceProfile, 'voice'>,
  usedVoiceUris: Set<string> = new Set(),
) {
  const chineseVoices = getChineseVoices(voices);
  if (chineseVoices.length === 0) return null;

  const uniqueCandidate = [...chineseVoices].sort((a, b) => (
    profileVoiceScore(b, profile, usedVoiceUris) - profileVoiceScore(a, profile, usedVoiceUris)
  ))[0];

  if (uniqueCandidate && !usedVoiceUris.has(uniqueCandidate.voiceURI)) return uniqueCandidate;

  return [...chineseVoices].sort((a, b) => (
    profileVoiceScore(b, profile, new Set()) - profileVoiceScore(a, profile, new Set())
  ))[0] ?? null;
}

export function buildHskVoiceProfiles(voices: SpeechSynthesisVoice[], preference: HskTtsVoicePreference = {}) {
  const usedVoiceUris = new Set<string>();

  return PROFILE_BLUEPRINTS.map((blueprint) => {
    const profile = {
      ...blueprint,
      locale: preference.locale ?? blueprint.locale,
      gender: preference.gender ?? blueprint.gender,
    };
    const voice = pickChineseVoiceForProfile(voices, profile, usedVoiceUris);
    if (voice) usedVoiceUris.add(voice.voiceURI);
    return { ...profile, voice };
  });
}

export function selectHskVoiceProfileForQuestion(questionId: string) {
  return PROFILE_IDS[hashString(questionId) % PROFILE_IDS.length];
}

export function getHskVoiceProfileForQuestion(questionId: string, profiles: HskTtsVoiceProfile[]) {
  const profileId = selectHskVoiceProfileForQuestion(questionId);
  return profiles.find((profile) => profile.id === profileId) ?? profiles[0] ?? {
    ...PROFILE_BLUEPRINTS[0],
    voice: null,
  };
}

export function pickBestChineseVoice(voices: SpeechSynthesisVoice[], preference: HskTtsVoicePreference = {}) {
  const profiles = buildHskVoiceProfiles(voices, preference);
  return profiles.find((profile) => profile.id === (preference.id ?? 'standard'))?.voice ?? profiles[0]?.voice ?? null;
}

export function buildHskProsodyOptions(
  question: Pick<HskListeningQuestion, 'id' | 'level' | 'speedProfile' | 'listeningSkill'>,
  profile: HskTtsVoiceProfile,
  voice?: SpeechSynthesisVoice | null,
  override?: 'slow' | 'normal',
): Required<Pick<HskTtsOptions, 'lang' | 'rate' | 'pitch' | 'volume' | 'pauseMs'>> & { voice?: SpeechSynthesisVoice | null } {
  const levelBaseRate: Record<HskListeningLevel, number> = {
    1: 0.88,
    2: 0.9,
    3: 0.93,
    4: 0.955,
    5: 0.98,
    6: 0.995,
  };
  const skillAdjustment: Partial<Record<HskListeningSkill, number>> = {
    tone_discrimination: -0.01,
    number_time_listening: -0.01,
    dictation: -0.018,
    shadowing: -0.008,
    similar_sound_discrimination: -0.008,
    sequence_understanding: -0.004,
  };
  const profileAdjustment = question.speedProfile === 'slow' ? -0.006 : question.speedProfile === 'fast' ? 0.004 : 0;
  const slowAdjustment = override === 'slow' ? -0.095 : 0;
  const rate = Number((
    levelBaseRate[question.level] +
    (skillAdjustment[question.listeningSkill] ?? 0) +
    profileAdjustment +
    profile.rateOffset +
    slowAdjustment +
    deterministicOffset(question.id)
  ).toFixed(3));

  return {
    voice: voice ?? profile.voice,
    lang: (voice ?? profile.voice)?.lang ?? 'zh-CN',
    rate: Math.min(1.02, Math.max(0.78, rate)),
    pitch: 1,
    volume: 1,
    pauseMs: question.listeningSkill === 'dictation' || question.listeningSkill === 'shadowing' ? 460 : 260,
  };
}

export function buildHskUtteranceOptions(
  question: Pick<HskListeningQuestion, 'id' | 'level' | 'speedProfile' | 'listeningSkill'>,
  voice?: SpeechSynthesisVoice | null,
  override?: 'slow' | 'normal',
) {
  return buildHskProsodyOptions(question, { ...PROFILE_BLUEPRINTS[0], voice: voice ?? null }, voice, override);
}

function pushSegment(segments: HskTtsSegment[], text: string, reason: HskTtsSegment['reason'] = 'natural') {
  const cleanText = text.trim();
  if (!cleanText) return;
  segments.push({
    text: cleanText,
    reason,
    pauseMs: reason === 'number_time' ? 500 : reason === 'location' ? 470 : reason === 'enumeration' ? 430 : 350,
  });
}

function segmentReason(text: string): HskTtsSegment['reason'] {
  if (/[\u697c\u5c42\u5ea7\u8def\u5ba4]|\u53f7\u7ebf|\u5411[\u5de6\u53f3\u4e1c\u897f\u5357\u5317]|\u5f80[\u5de6\u53f3\u4e1c\u897f\u5357\u5317]/.test(text)) return 'location';
  if (/\u9996\u5148|\u7136\u540e|\u6700\u540e|\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]/.test(text)) return 'enumeration';
  if (/[\u70b9\u5206\u6708\u65e5\u53f7\u5757\u5143]|\u767e\u5206\u4e4b/.test(text)) return 'number_time';
  return 'natural';
}

const MEANINGFUL_PATTERN = /([\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u4e24]+\u70b9(?:[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6]+\u5206)?|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]+\u6708[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]+[\u65e5\u53f7]|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u4e24]+(?:\u697c|\u5c42|\u5757|\u5143|\u53f7\u7ebf|\u8def|\u53f7|\u5ba4)|[A-F]\u5ea7|\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]+|\u5411[\u5de6\u53f3\u4e1c\u897f\u5357\u5317]\u62d0|\u5f80[\u5de6\u53f3\u4e1c\u897f\u5357\u5317]\u8d70|\u9996\u5148|\u7136\u540e|\u6700\u540e)/g;
const PUNCTUATION_SPLIT_PATTERN = /(?<=[\u3002\uff01\uff1f\uff1b\uff0c.!?;,])/;

export function segmentChineseForListening(text: string, question?: Pick<HskListeningQuestion, 'activityType'>) {
  const normalized = normalizeChineseForTTS(text);
  const needsTrainingPauses = (
    question?.activityType === 'dictation' ||
    question?.activityType === 'shadowing' ||
    question?.activityType === 'repeat_listening'
  );

  if (!needsTrainingPauses) {
    return [{ text: normalized, pauseMs: 240, reason: 'natural' as const }];
  }

  const segments: HskTtsSegment[] = [];
  let lastIndex = 0;

  for (const match of normalized.matchAll(MEANINGFUL_PATTERN)) {
    const offset = match.index ?? 0;
    pushSegment(segments, normalized.slice(lastIndex, offset));
    pushSegment(segments, match[0], segmentReason(match[0]));
    lastIndex = offset + match[0].length;
  }

  pushSegment(segments, normalized.slice(lastIndex));

  const punctuationSplit = segments.flatMap((segment) => {
    if (segment.reason !== 'natural') return [segment];
    return segment.text
      .split(PUNCTUATION_SPLIT_PATTERN)
      .map((piece) => piece.trim())
      .filter(Boolean)
      .map((piece) => ({
        text: piece,
        reason: segmentReason(piece) === 'enumeration' ? 'enumeration' as const : 'punctuation' as const,
        pauseMs: question?.activityType === 'dictation' ? 570 : 370,
      }));
  });

  return punctuationSplit.length > 0 ? punctuationSplit : [{ text: normalized, pauseMs: 370, reason: 'natural' as const }];
}

export function stopHskSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Best-effort cleanup for mobile/PWA browsers that throw after resume.
  }
}

function safelyPrepareHskSpeech(synthesis: SpeechSynthesis, shouldCancel = true) {
  try {
    if (shouldCancel) synthesis.cancel();
  } catch {
    // Ignore cancellation errors from a stale utterance.
  }

  try {
    synthesis.resume();
  } catch {
    // Resume is best-effort; some browsers simply ignore it.
  }
}

function isSoftSpeechError(event: SpeechSynthesisErrorEvent) {
  return event.error === 'canceled' || event.error === 'interrupted';
}

export function playQuestionWithPause(segments: HskTtsSegment[], options: HskTtsOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onEnd?.();
    return Promise.resolve();
  }

  const {
    voice,
    lang = voice?.lang ?? 'zh-CN',
    rate = 0.9,
    pitch = 1,
    volume = 1,
    pauseMs = 390,
    cancelCurrent = true,
  } = options;

  const synthesis = window.speechSynthesis;
  safelyPrepareHskSpeech(synthesis, cancelCurrent);

  return new Promise<void>((resolve, reject) => {
    let index = 0;
    let finished = false;
    let pauseTimeoutId: number | null = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (pauseTimeoutId !== null) window.clearTimeout(pauseTimeoutId);
      options.onEnd?.();
      resolve();
    };

    const fail = (event: SpeechSynthesisErrorEvent) => {
      if (finished) return;
      if (isSoftSpeechError(event)) {
        finish();
        return;
      }
      finished = true;
      if (pauseTimeoutId !== null) window.clearTimeout(pauseTimeoutId);
      options.onError?.(event);
      reject(event);
    };

    const playNext = () => {
      const segment = segments[index];
      if (!segment) {
        finish();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.voice = voice ?? null;
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      if (index === 0) utterance.onstart = () => options.onStart?.();
      utterance.onerror = fail;
      utterance.onend = () => {
        index += 1;
        if (index >= segments.length) {
          finish();
          return;
        }
        pauseTimeoutId = window.setTimeout(playNext, segment.pauseMs ?? pauseMs);
      };

      options.onSegmentStart?.(segment, index);
      try {
        synthesis.resume();
        synthesis.speak(utterance);
      } catch (error) {
        const fallbackError = error instanceof Event ? error : new Event('error');
        fail(fallbackError as SpeechSynthesisErrorEvent);
      }
    };

    playNext();
  });
}

export function getQuestionTtsText(question: Pick<HskListeningQuestion, 'ttsText' | 'promptText'>) {
  return question.ttsText || question.promptText;
}

export function supportsSegmentRepeat(activityType: HskListeningActivityType) {
  return activityType === 'dictation' || activityType === 'shadowing' || activityType === 'repeat_listening';
}
