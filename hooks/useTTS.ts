'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildUtteranceOptions,
  getEnglishVoices,
  pickBestVoice,
  speakText,
  stopSpeaking,
  LcTtsDifficulty,
  LcTtsQuestionType,
  TtsVoiceProfile,
} from '@/lib/tts';

type PlayLcPromptOptions = {
  difficulty: LcTtsDifficulty;
  questionType?: LcTtsQuestionType;
  text: string;
};

const DEFAULT_VOICE_PROFILE: TtsVoiceProfile = { locale: 'US', gender: 'neutral' };

export function useTTS(preferredProfile: TtsVoiceProfile = DEFAULT_VOICE_PROFILE) {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  const clearRetry = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      const unsupportedTimeoutId = window.setTimeout(() => {
        setIsSupported(false);
        setIsLoadingVoices(false);
        setError('This browser does not support speech synthesis.');
      }, 0);
      return () => {
        isMountedRef.current = false;
        window.clearTimeout(unsupportedTimeoutId);
      };
    }

    const synthesis = window.speechSynthesis;
    let initialLoadTimeoutId: number | null = null;

    const loadVoices = (attempt = 0) => {
      const nextVoices = getEnglishVoices(synthesis.getVoices());

      if (!isMountedRef.current) return;

      setVoices(nextVoices);
      setSelectedVoice(pickBestVoice(nextVoices, preferredProfile));

      if (nextVoices.length > 0) {
        setError(null);
        setIsLoadingVoices(false);
        clearRetry();
        return;
      }

      if (attempt < 6) {
        retryTimeoutRef.current = window.setTimeout(() => loadVoices(attempt + 1), 180 + attempt * 120);
        return;
      }

      setIsLoadingVoices(false);
      setError('No English voice is available in this browser.');
    };

    const handleVoicesChanged = () => loadVoices();

    initialLoadTimeoutId = window.setTimeout(() => {
      setIsSupported(true);
      loadVoices();
    }, 0);
    synthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      isMountedRef.current = false;
      clearRetry();
      if (initialLoadTimeoutId !== null) {
        window.clearTimeout(initialLoadTimeoutId);
      }
      synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      stopSpeaking();
    };
  }, [clearRetry, preferredProfile]);

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const playLcPrompt = useCallback(async ({ text, difficulty, questionType }: PlayLcPromptOptions) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('This browser does not support speech synthesis.');
      return false;
    }

    setError(null);
    const utteranceOptions = buildUtteranceOptions(difficulty, questionType, selectedVoice);

    try {
      await speakText(text, {
        ...utteranceOptions,
        cancelCurrent: true,
        onStart: () => {
          if (!isMountedRef.current) return;
          setIsSpeaking(true);
          setPlayCount((count) => count + 1);
        },
        onEnd: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
      });
      return true;
    } catch {
      if (!isMountedRef.current) return false;
      setError('Speech playback failed. Please try again.');
      setIsSpeaking(false);
      return false;
    }
  }, [selectedVoice]);

  return {
    isSupported,
    isLoadingVoices,
    voices,
    selectedVoice,
    isSpeaking,
    playCount,
    error,
    playLcPrompt,
    stop,
  };
}
