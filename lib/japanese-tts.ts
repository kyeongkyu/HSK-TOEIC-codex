import { hasLocalJlptKanaAudio } from '@/lib/jlpt-kana-audio';
import { getVoicesWhenReady, safelyPrepareSpeech } from './tts-core';

let japaneseVoicePromise: Promise<SpeechSynthesisVoice[]> | null = null;
let japaneseRequestId = 0;
let currentJapaneseAudio: HTMLAudioElement | null = null;
let lastKanaRequest: { key: string; timestamp: number } | null = null;

export function preloadJapaneseVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve([]);
  if (!japaneseVoicePromise) {
    japaneseVoicePromise = getVoicesWhenReady(window.speechSynthesis, 2500).then((voices) => {
      if (voices.length > 0) return voices;
      return getVoicesWhenReady(window.speechSynthesis, 2500);
    });
  }
  return japaneseVoicePromise;
}

const JAPANESE_TEXT_PATTERN = /[\u3040-\u30ff\u3400-\u9fff々〆ヵヶー]/;
const JAPANESE_TEXT_MATCHER = /[\u3040-\u30ff\u3400-\u9fff々〆ヵヶー]/g;
const NON_JAPANESE_SPEECH_CHARS = /[A-Za-z\uac00-\ud7af]/g;
const JAPANESE_PUNCTUATION_NORMALIZER: Array<[RegExp, string]> = [
  [/[，､]/g, '、'],
  [/[．｡]/g, '。'],
  [/[!！]+/g, '。'],
  [/[?？]+/g, '。'],
  [/[「」『』（）()[\]{}]/g, ''],
];

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

  const withoutNonJapanese = bestJapaneseSegment
    .replace(NON_JAPANESE_SPEECH_CHARS, '')
    .replace(/\s+/g, '');

  return JAPANESE_PUNCTUATION_NORMALIZER.reduce(
    (normalized, [pattern, replacement]) => normalized.replace(pattern, replacement),
    withoutNonJapanese,
  ).trim();
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

  if (isClearlyNonJapaneseVoice(voice)) score -= 200;
  if (lang === 'ja-jp') score += 140;
  if (lang.startsWith('ja')) score += 100;
  if (name.includes('\u65e5\u672c\u8a9e') || name.includes('\u65e5\u672c')) score += 70;
  if (name.includes('japanese')) score += 65;
  if (/(nanami|haruka|ichiro|ayumi|kyoko|otoya|sayaka|takumi|mizuki)/.test(name)) score += 45;
  if (name.includes('google')) score += 25;
  if (name.includes('microsoft')) score += 24;
  if (name.includes('natural') || name.includes('enhanced') || name.includes('premium')) score += 12;
  if (voice.localService) score += 6;
  if (voice.default && lang.startsWith('ja')) score += 4;

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
    2: 0.82,
    3: 0.92,
    4: 1.02,
    5: 1.12,
  };

  return rates[Math.min(Math.max(Math.round(level), 1), 5)] ?? 0.92;
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

function getKanaAudioKey(romaji?: string, kana?: string) {
  const normalized = romaji?.toLowerCase().replace(/^small\s+/, '').trim();
  if (!normalized || normalized.includes(' ')) return null;
  if (normalized === 'ji' && (kana === '\u3062' || kana === '\u30c2')) return 'di';
  if (normalized === 'zu' && (kana === '\u3065' || kana === '\u30c5')) return 'du';
  if (/^[a-z]+$/.test(normalized)) return normalized;
  return null;
}

function stopJapaneseAudio() {
  if (!currentJapaneseAudio) return;
  try {
    currentJapaneseAudio.pause();
    currentJapaneseAudio.currentTime = 0;
  } catch {
    // Best-effort cleanup only.
  }
  currentJapaneseAudio = null;
}

export function stopJapaneseSpeech() {
  stopJapaneseAudio();
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Best-effort cleanup for browsers that throw after PWA resume.
  }
}

type JapaneseKanaSpeechItem = {
  kana?: string;
  romaji?: string;
  audioKey?: string;
};

type JapaneseTextSpeechOptions = {
  requireJapaneseVoice?: boolean;
  rate?: number;
};

function playJapaneseAudioSource(src: string, requestId: number, onEnd?: () => void) {
  const audio = new Audio(src);
  currentJapaneseAudio = audio;
  audio.preload = 'auto';
  audio.volume = 1;

  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      if (requestId === japaneseRequestId) onEnd?.();
      resolve();
    };
    audio.onerror = () => reject(new Error('Japanese audio failed'));

    void audio.play().catch(reject);
  });
}

export const speakJapaneseText = (
  text: string,
  level: number = 3,
  onEnd?: () => void,
  options: JapaneseTextSpeechOptions = {},
) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const normalizedText = normalizeJapaneseForTTS(text);
  if (!normalizedText) {
    onEnd?.();
    return;
  }

  const requestId = ++japaneseRequestId;
  stopJapaneseSpeech();

  void preloadJapaneseVoices().then((voices) => {
    if (requestId !== japaneseRequestId) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    const synthesis = window.speechSynthesis;
    safelyPrepareSpeech(synthesis, false);

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    const preferredVoice = pickBestJapaneseVoice(voices);

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang || 'ja-JP';
    } else {
      if (options.requireJapaneseVoice) {
        warnMissingJapaneseVoiceOnce(voices);
        onEnd?.();
        return;
      }
      utterance.lang = 'ja-JP';
      warnMissingJapaneseVoiceOnce(voices);
    }

    utterance.rate = options.rate ?? getJapaneseRate(level);
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

export const speakJapaneseKana = (item: JapaneseKanaSpeechItem | string, level: number = 3, onEnd?: () => void) => {
  if (typeof window === 'undefined') {
    onEnd?.();
    return;
  }

  const kanaItem: JapaneseKanaSpeechItem = typeof item === 'string' ? { kana: item } : item;
  const key = kanaItem.audioKey ?? getKanaAudioKey(kanaItem.romaji, kanaItem.kana);
  const fallbackText = kanaItem.kana ?? '';
  const dedupeKey = `${key ?? 'fallback'}:${fallbackText}`;
  const now = Date.now();

  if (lastKanaRequest?.key === dedupeKey && now - lastKanaRequest.timestamp < 180) {
    return;
  }

  lastKanaRequest = { key: dedupeKey, timestamp: now };
  const requestId = ++japaneseRequestId;

  stopJapaneseSpeech();

  if (!key) {
    speakJapaneseText(fallbackText, level, onEnd, { requireJapaneseVoice: true, rate: 0.78 });
    return;
  }

  if (!hasLocalJlptKanaAudio(key)) {
    speakJapaneseText(fallbackText, level, onEnd, { requireJapaneseVoice: true, rate: 0.78 });
    return;
  }

  void playJapaneseAudioSource(`/jlpt-audio/kana/${encodeURIComponent(key)}.ogg`, requestId, onEnd).catch(() => {
    if (requestId !== japaneseRequestId) return;
    currentJapaneseAudio = null;
    speakJapaneseText(fallbackText, level, onEnd, { requireJapaneseVoice: true, rate: 0.78 });
  });
};

export const speakJapanese = speakJapaneseText;
