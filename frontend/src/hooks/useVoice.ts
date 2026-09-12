import { useRef, useState, useCallback, useEffect } from 'react';
import type { VoiceState } from '../types';

// Ensure the custom speech types are picked up
/// <reference path="../types/speech.d.ts" />

interface UseVoiceOptions {
  onTranscript: (text: string) => void;
  onStateChange?: (state: VoiceState) => void;
}

interface UseVoiceReturn {
  voiceState: VoiceState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, onEnd?: () => void) => void;
  cancelSpeech: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  clearError: () => void;
}

/** Strips markdown and normalises whitespace before handing text to TTS. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/[*_`#]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns the SpeechRecognition constructor, or null if unsupported. */
function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoice({ onTranscript, onStateChange }: UseVoiceOptions): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  // Keep a ref to the active utterance so we can cancel it
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const listeningRef = useRef(false);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  const RecognitionConstructor = getSpeechRecognitionConstructor();
  const isSupported = !!RecognitionConstructor && typeof window !== 'undefined' && !!window.speechSynthesis;

  const updateState = useCallback(
    (state: VoiceState) => {
      setVoiceState(state);
      onStateChange?.(state);
    },
    [onStateChange]
  );

  // Initialise speech recognition once on mount
  useEffect(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;
      updateState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onTranscript(transcript);
      } else {
        setError('No speech detected. Please try again.');
        updateState('idle');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      const code = event.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (code === 'no-speech') {
        setError('No speech detected. Click the microphone and speak clearly.');
      } else if (code === 'audio-capture') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (code === 'network') {
        setError('Speech recognition requires an internet connection.');
      } else if (code === 'aborted') {
        // Intentional stop — no error to show
      } else {
        setError(`Speech recognition error: ${code}. Please try again.`);
      }
      updateState('idle');
    };

    recognition.onend = () => {
      listeningRef.current = false;
      // Only reset to idle if we're still nominally listening
      // (prevents stomping on a 'processing' state set by onresult)
      setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      recognition.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Stop any ongoing TTS before listening
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
    }

    setError(null);

    try {
      if (listeningRef.current) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 200);
      } else {
        recognitionRef.current.start();
      }
    } catch {
      setError('Failed to start microphone. Please try again.');
      updateState('idle');
    }
  }, [updateState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listeningRef.current) {
      recognitionRef.current.stop();
      listeningRef.current = false;
    }
    updateState('idle');
  }, [updateState]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synthRef.current) {
        onEnd?.();
        return;
      }

      synthRef.current.cancel();

      const cleanText = cleanForSpeech(text);
      if (!cleanText) {
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to pick a natural-sounding English voice
      const selectVoice = () => {
        const voices = synthRef.current!.getVoices();
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Karen') ||
              v.name.includes('Daniel') ||
              v.name.includes('Moira') ||
              v.name.includes('Serena'))
        );
        if (preferred) utterance.voice = preferred;
      };

      if (synthRef.current.getVoices().length > 0) {
        selectVoice();
      } else {
        synthRef.current.addEventListener('voiceschanged', selectVoice, { once: true });
      }

      onEndCallbackRef.current = onEnd ?? null;

      utterance.onstart = () => {
        updateState('speaking');
      };

      utterance.onend = () => {
        updateState('idle');
        onEndCallbackRef.current?.();
        onEndCallbackRef.current = null;
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('TTS error:', e.error);
        }
        updateState('idle');
        onEndCallbackRef.current?.();
        onEndCallbackRef.current = null;
      };

      utteranceRef.current = utterance;
      updateState('speaking');
      synthRef.current.speak(utterance);
    },
    [updateState]
  );

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel();
    onEndCallbackRef.current = null;
    updateState('idle');
  }, [updateState]);

  const clearError = useCallback(() => setError(null), []);

  return {
    voiceState,
    isSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    isSpeaking: voiceState === 'speaking',
    isListening: voiceState === 'listening',
    error,
    clearError,
  };
}
