'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HskListeningQuestion } from '@/data/hsk-listening';
import {
  buildHskProsodyOptions,
  buildHskVoiceProfiles,
  getHskVoiceProfileForQuestion,
  getChineseVoices,
  getQuestionTtsText,
  HskTtsVoicePreference,
  HskTtsVoiceProfile,
  playQuestionWithPause,
  segmentChineseForListening,
  stopHskSpeaking,
} from '@/lib/hsk-tts';

const DEFAULT_PREFERENCE: HskTtsVoicePreference = { locale: 'CN', gender: 'neutral' };

export function useHskTTS(preferredProfile: HskTtsVoicePreference = DEFAULT_PREFERENCE) {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceProfiles, setVoiceProfiles] = useState<HskTtsVoiceProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<HskTtsVoiceProfile | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
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
      const timeoutId = window.setTimeout(() => {
        setIsSupported(false);
        setIsLoadingVoices(false);
        setError('This browser does not support Chinese speech synthesis.');
      }, 0);
      return () => {
        isMountedRef.current = false;
        window.clearTimeout(timeoutId);
      };
    }

    const synthesis = window.speechSynthesis;
    let initialLoadTimeoutId: number | null = null;

    const loadVoices = (attempt = 0) => {
      const allVoices = synthesis.getVoices();
      const nextVoices = getChineseVoices(allVoices);
      const nextProfiles = buildHskVoiceProfiles(nextVoices.length > 0 ? nextVoices : allVoices, preferredProfile);
      if (!isMountedRef.current) return;

      setVoices(nextVoices);
      setVoiceProfiles(nextProfiles);
      setSelectedProfile((profile) => (
        profile
          ? nextProfiles.find((candidate) => candidate.id === profile.id) ?? nextProfiles[0] ?? null
          : nextProfiles[0] ?? null
      ));
      setSelectedVoice((voice) => voice ?? nextProfiles[0]?.voice ?? null);

      if (nextVoices.length > 0) {
        setError(null);
        setIsLoadingVoices(false);
        clearRetry();
        return;
      }

      if (attempt < 8) {
        retryTimeoutRef.current = window.setTimeout(() => loadVoices(attempt + 1), 180 + attempt * 140);
        return;
      }

      setIsLoadingVoices(false);
      setError(null);
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
      if (initialLoadTimeoutId !== null) window.clearTimeout(initialLoadTimeoutId);
      synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      stopHskSpeaking();
    };
  }, [clearRetry, preferredProfile]);

  const stop = useCallback(() => {
    stopHskSpeaking();
    setIsSpeaking(false);
    setActiveSegmentIndex(null);
  }, []);

  const playQuestion = useCallback(async (question: HskListeningQuestion, speed: 'normal' | 'slow' = 'normal') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('This browser does not support Chinese speech synthesis.');
      return false;
    }

    setError(null);
    const profile = getHskVoiceProfileForQuestion(question.id, voiceProfiles);
    const segments = segmentChineseForListening(getQuestionTtsText(question), question);
    const utteranceOptions = buildHskProsodyOptions(question, profile, profile.voice, speed);
    setSelectedProfile(profile);
    setSelectedVoice(profile.voice);

    try {
      await playQuestionWithPause(segments, {
        ...utteranceOptions,
        cancelCurrent: true,
        onStart: () => {
          if (!isMountedRef.current) return;
          setIsSpeaking(true);
          setPlayCount((count) => count + 1);
        },
        onSegmentStart: (_segment, index) => {
          if (isMountedRef.current) setActiveSegmentIndex(index);
        },
        onEnd: () => {
          if (!isMountedRef.current) return;
          setIsSpeaking(false);
          setActiveSegmentIndex(null);
        },
        onError: () => {
          if (!isMountedRef.current) return;
          setIsSpeaking(false);
          setActiveSegmentIndex(null);
        },
      });
      return true;
    } catch {
      if (!isMountedRef.current) return false;
      setError('Chinese speech playback failed. Please try again.');
      setIsSpeaking(false);
      setActiveSegmentIndex(null);
      return false;
    }
  }, [voiceProfiles]);

  return {
    isSupported,
    isLoadingVoices,
    voices,
    voiceProfiles,
    selectedProfile,
    selectedVoice,
    isSpeaking,
    playCount,
    activeSegmentIndex,
    error,
    playQuestion,
    stop,
  };
}
