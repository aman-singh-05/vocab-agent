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
    .replace(/[*_`#[\]]/g, '')
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
  const [isSupported] = useState<boolean>(() => {
    // Evaluated once at mount — avoids flicker on re-renders
    return (
      !!getSpeechRecognitionCtor() &&
      typeof window !== 'undefined' &&
      !!window.speechSynthesis
    );
  });

  // Keep latest callbacks in refs — recognition handlers always see the
  // current version without being re-registered
  const onTranscriptRef = useRef(onTranscript);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const listeningRef = useRef(false);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable — only uses refs internally
  const updateState = useCallback((state: VoiceState) => {
    setVoiceState(state);
    onStateChangeRef.current?.(state);
  }, []);

  // ── Init speech recognition once ─────────────────────────────────────────
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
      updateState('processing');
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onTranscriptRef.current(transcript);
      } else {
        setError('No speech detected. Please speak clearly and try again.');
        updateState('idle');
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setError(
            'Microphone blocked. Click the 🔒 icon in your browser address bar, ' +
            'set Microphone to "Allow", then refresh the page.'
          );
          break;
        case 'no-speech':
          setError('Nothing heard. Click the mic and speak clearly.');
          break;
        case 'audio-capture':
          setError('No microphone detected. Please connect one and try again.');
          break;
        case 'network':
          setError('Speech recognition needs an internet connection.');
          break;
        case 'aborted':
          break; // deliberate stop, no message
        default:
          setError(`Mic error: ${event.error}. Please try again.`);
      }
      updateState('idle');
    };

    rec.onend = () => {
      listeningRef.current = false;
      // Don't overwrite 'processing' — onresult already set it
      setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    recognitionRef.current = rec;
    synthRef.current = window.speechSynthesis;

    return () => {
      rec.abort();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [updateState]);

  // ── startListening ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported. Please use Chrome or Edge on desktop.');
      return;
    }

    // Mute any TTS so the mic doesn't echo the speaker
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      onEndCallbackRef.current = null;
    }

    setError(null);

    try {
      if (listeningRef.current) {
        recognitionRef.current.stop();
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch { /* ignore */ }
        }, 300);
      } else {
        recognitionRef.current.start();
      }
    } catch (e) {
      console.error('[startListening]', e);
      setError('Could not start microphone. Please try again.');
      updateState('idle');
    }
  }, [updateState]);

  // ── stopListening ─────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current && listeningRef.current) {
      recognitionRef.current.stop();
      listeningRef.current = false;
    }
    updateState('idle');
  }, [updateState]);

  // ── speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    const synth = synthRef.current;
    if (!synth) { onEnd?.(); return; }

    // Kill any existing speech and keepalive
    synth.cancel();
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }

    const cleanText = cleanForSpeech(text);
    if (!cleanText) { onEnd?.(); return; }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.93;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick a natural-sounding English voice
    const selectVoice = () => {
      const voices = synth.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Daniel') ||
            v.name.includes('Moira') ||
            v.name.includes('Serena') ||
            v.name.includes('Arthur') ||
            v.name.includes('Alex'))
      );
      if (preferred) utterance.voice = preferred;
    };

    if (synth.getVoices().length > 0) {
      selectVoice();
    } else {
      synth.addEventListener('voiceschanged', selectVoice, { once: true });
    }

    const handleDone = () => {
      if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
      updateState('idle');
      const cb = onEndCallbackRef.current;
      onEndCallbackRef.current = null;
      cb?.();
    };

    onEndCallbackRef.current = onEnd ?? null;
    utterance.onstart = () => updateState('speaking');
    utterance.onend = handleDone;
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('[TTS]', e.error);
      }
      handleDone();
    };

    updateState('speaking');
    synth.speak(utterance);

    // Chrome bug: speechSynthesis silently stops after ~15 s.
    // Keepalive: pause/resume every 10 s to prevent it.
    keepAliveRef.current = setInterval(() => {
      if (!synth.speaking) {
        clearInterval(keepAliveRef.current!);
        keepAliveRef.current = null;
      } else if (!synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
  }, [updateState]);

  // ── cancelSpeech ──────────────────────────────────────────────────────────
  const cancelSpeech = useCallback(() => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
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
