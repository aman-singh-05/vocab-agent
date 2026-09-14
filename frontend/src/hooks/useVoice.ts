import { useRef, useState, useCallback, useEffect } from 'react';
import type { VoiceState } from '../types';

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

function cleanForSpeech(text: string): string {
  return text
    .replace(/[*_`#]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoice({ onTranscript, onStateChange }: UseVoiceOptions): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);

  // ── Stable refs ─────────────────────────────────────────────────────────
  // Keep callbacks in refs so the recognition event handlers always call the
  // latest version without needing to be re-registered on every render.
  const onTranscriptRef = useRef(onTranscript);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const listeningRef = useRef(false);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  // Derived support flag — computed once
  const isSupported =
    !!getSpeechRecognitionCtor() &&
    typeof window !== 'undefined' &&
    !!window.speechSynthesis;

  // ── updateState helper ───────────────────────────────────────────────────
  const updateState = useCallback((state: VoiceState) => {
    setVoiceState(state);
    onStateChangeRef.current?.(state);
  }, []); // stable — uses ref for callback

  // ── Initialise recognition once on mount ────────────────────────────────
  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      listeningRef.current = true;
      updateState('listening');
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // Move to processing immediately so the button disables
      updateState('processing');
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        // Always calls the latest handler via ref
        onTranscriptRef.current(transcript);
      } else {
        setError('No speech detected. Please try again.');
        updateState('idle');
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setError('Microphone access denied. Click the lock icon in your browser address bar and allow microphone access, then refresh.');
          break;
        case 'no-speech':
          setError('No speech detected. Click the microphone and speak clearly.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please connect a microphone and try again.');
          break;
        case 'network':
          setError('Speech recognition needs an internet connection.');
          break;
        case 'aborted':
          break; // intentional stop, no message
        default:
          setError(`Mic error: ${event.error}. Please try again.`);
      }
      updateState('idle');
    };

    rec.onend = () => {
      listeningRef.current = false;
      // Only drop back to idle if still in listening state —
      // don't stomp on 'processing' that onresult just set.
      setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    recognitionRef.current = rec;
    synthRef.current = window.speechSynthesis;

    return () => {
      rec.abort();
    };
  }, [updateState]); // updateState is stable

  // ── startListening ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported. Please use Chrome or Edge.');
      return;
    }

    // Cancel any TTS before listening so the mic doesn't pick up the speaker
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
      onEndCallbackRef.current = null;
    }

    setError(null);

    try {
      if (listeningRef.current) {
        // Already running — stop and restart
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 250);
      } else {
        recognitionRef.current.start();
      }
    } catch (e) {
      console.error('startListening error:', e);
      setError('Failed to start microphone. Please try again.');
      updateState('idle');
    }
  }, [updateState]);

  // ── stopListening ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current && listeningRef.current) {
      recognitionRef.current.stop();
      listeningRef.current = false;
    }
    updateState('idle');
  }, [updateState]);

  // ── speak ────────────────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      const synth = synthRef.current;
      if (!synth) {
        onEnd?.();
        return;
      }

      synth.cancel(); // stop anything already playing

      const cleanText = cleanForSpeech(text);
      if (!cleanText) {
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.93;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Pick a natural English voice when voices are available
      const selectVoice = () => {
        const voices = synth.getVoices();
        const pick = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Karen') ||
              v.name.includes('Daniel') ||
              v.name.includes('Moira') ||
              v.name.includes('Serena') ||
              v.name.includes('Arthur'))
        );
        if (pick) utterance.voice = pick;
      };

      if (synth.getVoices().length > 0) {
        selectVoice();
      } else {
        synth.addEventListener('voiceschanged', selectVoice, { once: true });
      }

      onEndCallbackRef.current = onEnd ?? null;

      utterance.onstart = () => updateState('speaking');

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

      // Chrome has a bug where speech can silently stop after ~15 s.
      // Resume it every 10 s as a keepalive.
      const keepAlive = setInterval(() => {
        if (synth.speaking && !synth.paused) {
          synth.pause();
          synth.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);

      utterance.onend = () => {
        clearInterval(keepAlive);
        updateState('idle');
        onEndCallbackRef.current?.();
        onEndCallbackRef.current = null;
      };
      utterance.onerror = (e) => {
        clearInterval(keepAlive);
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('TTS error:', e.error);
        }
        updateState('idle');
        onEndCallbackRef.current?.();
        onEndCallbackRef.current = null;
      };

      synth.speak(utterance);
    },
    [updateState]
  );

  // ── cancelSpeech ─────────────────────────────────────────────────────────
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
