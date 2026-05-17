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

function getVoicesWhenReady(synthesis: SpeechSynthesis) {
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
    window.setTimeout(finish, 350);
  });
}

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
