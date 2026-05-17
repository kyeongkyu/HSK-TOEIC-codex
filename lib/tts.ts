export const getTtsRate = (level: number) => {
  return 0.5 + (level - 1) * 0.25;
};

function safelyPrepareSpeech(synthesis: SpeechSynthesis, shouldCancel = true) {
  try {
    if (shouldCancel) synthesis.cancel();
  } catch {
    // Some mobile browsers throw while resuming from a suspended PWA state.
  }

  try {
    synthesis.resume();
  } catch {
    // Resume is best-effort; speak() still works on browsers that ignore it.
  }
}

function getPreferredVoice(voices: SpeechSynthesisVoice[], targetLang: string) {
  const normalizedLang = targetLang.toLowerCase();

  if (normalizedLang.includes('zh')) {
    return voices.find((voice) => {
      const lang = voice.lang.toLowerCase();
      const name = voice.name.toLowerCase();
      return (
        lang.includes('zh-cn') ||
        lang.includes('zh-hans') ||
        lang.includes('zh-hk') ||
        lang.includes('zh-tw') ||
        name.includes('chinese') ||
        name.includes('mandarin')
      );
    }) ?? null;
  }

  if (normalizedLang.includes('ja')) {
    return voices.find((voice) => {
      const lang = voice.lang.toLowerCase();
      const name = voice.name.toLowerCase();
      return lang.includes('ja-jp') || lang === 'ja' || name.includes('japanese') || name.includes('kyoko');
    }) ?? null;
  }

  if (normalizedLang.includes('en')) {
    return voices.find((voice) => {
      const lang = voice.lang.toLowerCase();
      const name = voice.name.toLowerCase();
      return lang.includes('en-us') || lang.includes('en-gb') || name.includes('english');
    }) ?? null;
  }

  return null;
}

function getVoicesWhenReady(synthesis: SpeechSynthesis, timeoutMs = 350) {
  const voices = synthesis.getVoices();
  if (voices.length > 0) return Promise.resolve(voices);

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let didResolve = false;

    const finish = () => {
      if (didResolve) return;
      didResolve = true;
      synthesis.removeEventListener?.('voiceschanged', finish);
      resolve(synthesis.getVoices());
    };

    synthesis.addEventListener?.('voiceschanged', finish, { once: true });
    window.setTimeout(finish, timeoutMs);
  });
}

const JAPANESE_TEXT_PATTERN = /[\u3040-\u30ff\u3400-\u9fff々〆ヵヶー]/;
const JAPANESE_TEXT_MATCHER = /[\u3040-\u30ff\u3400-\u9fff々〆ヵヶー]/g;
const NON_JAPANESE_SPEECH_CHARS = /[A-Za-z\uac00-\ud7af]/g;

function countJapaneseCharacters(text: string) {
  return text.match(JAPANESE_TEXT_MATCHER)?.length ?? 0;
}

export function normalizeJapaneseForTTS(text: string) {
  const trimmed = text
    .normalize('NFKC')
    .replace(/[｜|]/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  if (!trimmed) return '';

  const bestJapaneseSegment = trimmed
    .split(/\s*[/／]\s*/)
    .map(segment => segment.trim())
    .filter(Boolean)
    .sort((a, b) => countJapaneseCharacters(b) - countJapaneseCharacters(a))[0] ?? trimmed;

  if (!JAPANESE_TEXT_PATTERN.test(bestJapaneseSegment)) return '';

  return bestJapaneseSegment
    .replace(NON_JAPANESE_SPEECH_CHARS, '')
    .replace(/\s+/g, '')
    .replace(/[，]/g, '、')
    .replace(/[．]/g, '。')
    .trim();
}

function isClearlyNonJapaneseVoice(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  return (
    lang.startsWith('en') ||
    lang.startsWith('zh') ||
    lang.startsWith('ko') ||
    name.includes('english') ||
    name.includes('chinese') ||
    name.includes('korean') ||
    name.includes('mandarin')
  );
}

function scoreJapaneseVoice(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  let score = 0;

  if (isClearlyNonJapaneseVoice(voice)) score -= 100;
  if (lang === 'ja-jp') score += 100;
  if (lang.startsWith('ja')) score += 70;
  if (name.includes('日本') || name.includes('にほん')) score += 45;
  if (name.includes('japanese')) score += 40;
  if (/(kyoko|otoya|haruka|ichiro|ayumi|nanami|sayaka|takumi|mizuki)/.test(name)) score += 30;
  if (name.includes('google')) score += 18;
  if (name.includes('microsoft')) score += 16;
  if (name.includes('natural') || name.includes('enhanced') || name.includes('premium')) score += 10;
  if (voice.localService) score += 6;
  if (voice.default) score += 4;

  return score;
}

export function pickBestJapaneseVoice(voices: SpeechSynthesisVoice[]) {
  const candidates = voices
    .map(voice => ({ voice, score: scoreJapaneseVoice(voice) }))
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.voice ?? null;
}

function getJapaneseRate(level: number) {
  const rates: Record<number, number> = {
    1: 0.72,
    2: 0.84,
    3: 0.94,
    4: 1.04,
    5: 1.14,
  };

  return rates[Math.min(Math.max(Math.round(level), 1), 5)] ?? 0.94;
}

function warnMissingJapaneseVoiceOnce(voices: SpeechSynthesisVoice[]) {
  if (process.env.NODE_ENV !== 'development') return;
  const globalWindow = window as Window & { __jlptMissingJapaneseVoiceWarningShown?: boolean };
  if (globalWindow.__jlptMissingJapaneseVoiceWarningShown) return;
  globalWindow.__jlptMissingJapaneseVoiceWarningShown = true;
  console.warn(
    '[JLPT TTS] Japanese voice was not found. Browser fallback will be used.',
    voices.map(voice => `${voice.name} (${voice.lang})`),
  );
}

export const speakJapanese = (text: string, level: number = 3, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const normalizedText = normalizeJapaneseForTTS(text);
  if (!normalizedText) {
    onEnd?.();
    return;
  }

  const synthesis = window.speechSynthesis;

  void getVoicesWhenReady(synthesis, 2200).then((voices) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    safelyPrepareSpeech(synthesis);

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    const preferredVoice = pickBestJapaneseVoice(voices);

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang || 'ja-JP';
    } else {
      utterance.lang = 'ja-JP';
      warnMissingJapaneseVoiceOnce(voices);
    }

    utterance.rate = getJapaneseRate(level);
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    try {
      synthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  });
};

function speakWithVoices(text: string, level: number, targetLang: string, voices: SpeechSynthesisVoice[], onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const synthesis = window.speechSynthesis;
  safelyPrepareSpeech(synthesis);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = targetLang;
  utterance.rate = getTtsRate(level);
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  const preferredVoice = getPreferredVoice(voices, targetLang);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  }

  try {
    synthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

export const speak = (text: string, level: number = 3, targetLang: string = 'zh-CN', onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) {
    onEnd?.();
    return;
  }

  const synthesis = window.speechSynthesis;

  void getVoicesWhenReady(synthesis).then((voices) => {
    speakWithVoices(text, level, targetLang, voices, onEnd);
  });
};

export type TtsVoiceProfile = {
  gender?: 'female' | 'male' | 'neutral';
  locale?: 'US' | 'UK' | 'AU' | 'CA' | 'neutral';
};

export type LcTtsDifficulty = 'easy' | 'medium' | 'hard';
export type LcTtsQuestionType =
  | 'who'
  | 'when'
  | 'where'
  | 'why'
  | 'how'
  | 'yes_no'
  | 'suggestion_request'
  | 'statement_response'
  | 'confirmation';

export type LcUtteranceOptions = {
  voice?: SpeechSynthesisVoice | null;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  pauseMs?: number;
  cancelCurrent?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
};

const TTS_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\bR&D\b/g, 'R and D'],
  [/\bHR\b/g, 'H R'],
  [/\bETA\b/g, 'E T A'],
  [/\ba\.m\.\b/gi, 'A M'],
  [/\bp\.m\.\b/gi, 'P M'],
  [/\bMr\.\b/g, 'Mister'],
  [/\bMs\.\b/g, 'Miz'],
  [/\bDr\.\b/g, 'Doctor'],
  [/&/g, ' and '],
];

export function getEnglishVoices(voices?: SpeechSynthesisVoice[]) {
  const sourceVoices = voices ?? (
    typeof window !== 'undefined' && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : []
  );

  return sourceVoices.filter((voice) => {
    const lang = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();
    return lang.startsWith('en') || name.includes('english');
  });
}

export function pickBestVoice(voices: SpeechSynthesisVoice[], preferredProfile: TtsVoiceProfile = {}) {
  const englishVoices = getEnglishVoices(voices);
  if (englishVoices.length === 0) return null;

  const profileLocale = preferredProfile.locale ?? 'US';
  const naturalVoiceNames = [
    'aria',
    'jenny',
    'guy',
    'samantha',
    'daniel',
    'karen',
    'moira',
    'google',
    'microsoft',
    'premium',
    'enhanced',
    'natural',
  ];

  return [...englishVoices].sort((a, b) => {
    const scoreVoice = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      let score = 0;

      if (profileLocale === 'US' && lang.includes('en-us')) score += 30;
      if (profileLocale === 'UK' && lang.includes('en-gb')) score += 30;
      if (profileLocale === 'AU' && lang.includes('en-au')) score += 20;
      if (profileLocale === 'CA' && lang.includes('en-ca')) score += 20;
      if (voice.default) score += 8;
      if (naturalVoiceNames.some((keyword) => name.includes(keyword))) score += 12;
      if (preferredProfile.gender === 'female' && /(aria|jenny|samantha|karen|moira|zira)/.test(name)) score += 5;
      if (preferredProfile.gender === 'male' && /(guy|daniel|david|mark|alex)/.test(name)) score += 5;

      return score;
    };

    return scoreVoice(b) - scoreVoice(a);
  })[0];
}

export function normalizeForTTS(text: string) {
  return TTS_NORMALIZATION_RULES.reduce(
    (normalized, [pattern, replacement]) => normalized.replace(pattern, replacement),
    text,
  ).replace(/\s+/g, ' ').trim();
}

export function buildUtteranceOptions(
  difficulty: LcTtsDifficulty,
  questionType?: LcTtsQuestionType,
  voice?: SpeechSynthesisVoice | null,
): Required<Pick<LcUtteranceOptions, 'lang' | 'rate' | 'pitch' | 'volume' | 'pauseMs'>> & { voice?: SpeechSynthesisVoice | null } {
  const baseRateByDifficulty: Record<LcTtsDifficulty, number> = {
    easy: 0.94,
    medium: 1,
    hard: 1.05,
  };
  const rhythmAdjustment: Partial<Record<LcTtsQuestionType, number>> = {
    who: -0.01,
    when: -0.01,
    where: -0.01,
    suggestion_request: -0.02,
    statement_response: -0.015,
  };
  const variation = (Math.random() - 0.5) * 0.04;
  const rate = Number((baseRateByDifficulty[difficulty] + (rhythmAdjustment[questionType ?? 'how'] ?? 0) + variation).toFixed(2));

  return {
    voice,
    lang: voice?.lang ?? 'en-US',
    rate,
    pitch: 1,
    volume: 1,
    pauseMs: questionType === 'statement_response' || questionType === 'suggestion_request' ? 420 : 320,
  };
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Best-effort cleanup for browsers that throw after PWA resume.
  }
}

function splitForNaturalPauses(text: string) {
  return normalizeForTTS(text)
    .split(/(?<=[.?!])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function speakText(text: string, options: LcUtteranceOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onEnd?.();
    return Promise.resolve();
  }

  const segments = splitForNaturalPauses(text);
  const {
    voice,
    lang = voice?.lang ?? 'en-US',
    rate = 1,
    pitch = 1,
    volume = 1,
    pauseMs = 320,
    cancelCurrent = true,
  } = options;

  safelyPrepareSpeech(window.speechSynthesis, cancelCurrent);

  return new Promise<void>((resolve, reject) => {
    let index = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      options.onEnd?.();
      resolve();
    };

    const fail = (event: SpeechSynthesisErrorEvent) => {
      if (finished) return;
      finished = true;
      options.onError?.(event);
      reject(event);
    };

    const playNext = () => {
      const segment = segments[index];
      if (!segment) {
        finish();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.voice = voice ?? null;
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      if (index === 0) {
        utterance.onstart = () => options.onStart?.();
      }
      utterance.onerror = fail;
      utterance.onend = () => {
        index += 1;
        if (index >= segments.length) {
          finish();
          return;
        }
        window.setTimeout(playNext, pauseMs);
      };

      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        fail(error as SpeechSynthesisErrorEvent);
      }
    };

    playNext();
  });
}
