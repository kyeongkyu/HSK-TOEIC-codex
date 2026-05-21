export const getTtsRate = (level: number) => {
  return 0.5 + (level - 1) * 0.25;
};

export function safelyPrepareSpeech(synthesis: SpeechSynthesis, shouldCancel = true) {
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

export function getPreferredVoice(voices: SpeechSynthesisVoice[], targetLang: string) {
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

export function getVoicesWhenReady(synthesis: SpeechSynthesis, timeoutMs = 700) {
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
