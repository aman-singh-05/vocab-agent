import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { api, ApiError } from '../services/api';
import { useVoice } from '../hooks/useVoice';
import { WordCard } from '../components/WordCard';
import { MicButton } from '../components/MicButton';
import { Transcript } from '../components/Transcript';
import { ErrorBanner } from '../components/ErrorBanner';
import type { VoiceState } from '../types';

interface SessionPageProps {
  onEnd: () => void;
}

export function Session({ onEnd }: SessionPageProps) {
  const { state, dispatch, addTranscript } = useSession();
  const { sessionId, currentWord, progress, transcript, isLoading, readyForNext, error } = state;

  const [localVoiceState, setLocalVoiceState] = useState<VoiceState>('idle');
  const hasIntroduced = useRef(false);

  // Stable ref so handleTranscript can call speak without a circular dependency
  const speakRef = useRef<(text: string, onEnd?: () => void) => void>(() => {});

  // ── handleTranscript uses speakRef.current to avoid ordering issues ──────
  const handleTranscript = useCallback(
    async (text: string) => {
      if (!sessionId || !currentWord) return;

      addTranscript('user', text);
      dispatch({ type: 'SET_LOADING', payload: true });
      setLocalVoiceState('processing');
      dispatch({ type: 'SET_VOICE_STATE', payload: 'processing' });

      try {
        const data = await api.respond(sessionId, text);

        addTranscript('assistant', data.reply);
        dispatch({ type: 'SET_READY_FOR_NEXT', payload: data.readyForNext });
        dispatch({ type: 'SET_LAST_WORD_CORRECT', payload: data.wordUsedCorrectly });
        dispatch({ type: 'SET_LOADING', payload: false });

        // Speak reply through the stable ref
        speakRef.current(data.reply, () => {
          setLocalVoiceState('idle');
          dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' });
        });
      } catch (err) {
        dispatch({ type: 'SET_LOADING', payload: false });
        const msg =
          err instanceof ApiError ? err.message : 'Failed to get a response. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: msg });
        setLocalVoiceState('idle');
        dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, currentWord?.id]
  );

  // ── Voice hook ────────────────────────────────────────────────────────────
  const voice = useVoice({
    onTranscript: handleTranscript,
    onStateChange: (s) => {
      setLocalVoiceState(s);
      dispatch({ type: 'SET_VOICE_STATE', payload: s });
    },
  });

  // Keep speakRef in sync with the latest speak function
  useEffect(() => {
    speakRef.current = voice.speak;
  }, [voice.speak]);

  // ── Speak introduction when a new word's first assistant message arrives ──
  useEffect(() => {
    if (!currentWord || hasIntroduced.current) return;
    const lastEntry = transcript[transcript.length - 1];
    if (lastEntry?.role === 'assistant') {
      hasIntroduced.current = true;
      setLocalVoiceState('speaking');
      dispatch({ type: 'SET_VOICE_STATE', payload: 'speaking' });
      voice.speak(lastEntry.content, () => {
        setLocalVoiceState('idle');
        dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // Reset intro flag when word changes
  useEffect(() => {
    hasIntroduced.current = false;
  }, [currentWord?.id]);

  // ── Mic button ────────────────────────────────────────────────────────────
  const handleMicClick = () => {
    if (localVoiceState === 'listening') {
      voice.stopListening();
    } else if (localVoiceState === 'idle') {
      voice.clearError();
      dispatch({ type: 'SET_ERROR', payload: null });
      voice.startListening();
    }
  };

  // ── Next word ─────────────────────────────────────────────────────────────
  const handleNextWord = useCallback(async () => {
    if (!sessionId) return;

    if (progress.current >= progress.total) {
      handleEndSession();
      return;
    }

    voice.cancelSpeech();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const data = await api.nextWord(sessionId);
      dispatch({
        type: 'WORD_UPDATED',
        payload: { currentWord: data.currentWord, progress: data.progress },
      });
      addTranscript('assistant', data.introduction);
      dispatch({ type: 'SET_LOADING', payload: false });

      setLocalVoiceState('speaking');
      dispatch({ type: 'SET_VOICE_STATE', payload: 'speaking' });
      voice.speak(data.introduction, () => {
        setLocalVoiceState('idle');
        dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' });
      });
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const msg = err instanceof ApiError ? err.message : 'Failed to load next word.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, progress.current, progress.total]);

  // ── End session ───────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;

    voice.cancelSpeech();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const summary = await api.endSession(sessionId);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      onEnd();
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const msg = err instanceof ApiError ? err.message : 'Failed to end session.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, onEnd]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isInteractionDisabled =
    localVoiceState === 'processing' || localVoiceState === 'speaking' || isLoading;
  const isLastWord = progress.current >= progress.total;

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <p className="text-gray-400">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between max-w-2xl mx-auto w-full border-b border-gray-100">
        <span className="text-lg font-display font-bold text-gray-900">Lingo</span>
        <div className="flex items-center gap-3">
          <StatusDot voiceState={localVoiceState} />
          <button
            onClick={handleEndSession}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
          >
            End session
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 py-8 gap-8 max-w-2xl mx-auto w-full">
        {/* Vocabulary word card */}
        <WordCard word={currentWord} progress={progress} />

        {/* Errors */}
        {(error || voice.error) && (
          <ErrorBanner
            message={(error || voice.error)!}
            onDismiss={() => {
              dispatch({ type: 'SET_ERROR', payload: null });
              voice.clearError();
            }}
          />
        )}

        {/* Voice interaction */}
        <div className="flex flex-col items-center gap-4">
          <MicButton
            voiceState={localVoiceState}
            onClick={handleMicClick}
            disabled={isInteractionDisabled}
          />

          {/* Advance buttons */}
          {(readyForNext || isLastWord) && !isInteractionDisabled && (
            <button
              onClick={handleNextWord}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm rounded-xl transition-colors duration-200 shadow-sm animate-scale-in focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              {isLastWord ? 'Finish session →' : 'Next word →'}
            </button>
          )}

          {/* Manual skip after enough exchanges */}
          {!readyForNext && !isLastWord && transcript.length >= 4 && !isInteractionDisabled && (
            <button
              onClick={handleNextWord}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Skip to next word
            </button>
          )}
        </div>

        {/* Conversation transcript */}
        <Transcript
          entries={transcript}
          isLoading={isLoading && localVoiceState === 'processing'}
        />
      </main>

      {/* Browser support warning */}
      {!voice.isSupported && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 shadow-md max-w-sm text-center">
          Your browser doesn't fully support voice features. Try Chrome or Edge for the best experience.
        </div>
      )}
    </div>
  );
}

function StatusDot({ voiceState }: { voiceState: VoiceState }) {
  const config: Record<VoiceState, { color: string; label: string }> = {
    idle: { color: 'bg-gray-300', label: 'Ready' },
    listening: { color: 'bg-red-500 animate-pulse', label: 'Listening' },
    processing: { color: 'bg-amber-400 animate-pulse', label: 'Thinking' },
    speaking: { color: 'bg-emerald-500 animate-pulse', label: 'Speaking' },
    error: { color: 'bg-red-600', label: 'Error' },
  };

  const { color, label } = config[voiceState] ?? config.idle;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
