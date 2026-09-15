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

  // Stable ref — lets handleTranscript call speak() before voice is declared
  const speakRef = useRef<(text: string, onEnd?: () => void) => void>(() => {});

  // Also keep sessionId + currentWord in refs so callbacks never go stale
  const sessionIdRef = useRef(sessionId);
  const currentWordRef = useRef(currentWord);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);

  // ── handleTranscript ──────────────────────────────────────────────────────
  const handleTranscript = useCallback(async (text: string) => {
    const sid = sessionIdRef.current;
    const word = currentWordRef.current;
    if (!sid || !word) return;

    addTranscript('user', text);
    dispatch({ type: 'SET_LOADING', payload: true });
    setLocalVoiceState('processing');
    dispatch({ type: 'SET_VOICE_STATE', payload: 'processing' });

    try {
      const data = await api.respond(sid, text);

      addTranscript('assistant', data.reply);
      dispatch({ type: 'SET_READY_FOR_NEXT', payload: data.readyForNext });
      dispatch({ type: 'SET_LAST_WORD_CORRECT', payload: data.wordUsedCorrectly });
      dispatch({ type: 'SET_LOADING', payload: false });

      speakRef.current(data.reply, () => {
        setLocalVoiceState('idle');
        dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' });
      });
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const msg = err instanceof ApiError ? err.message : 'Failed to get a response. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      setLocalVoiceState('idle');
      dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' });
    }
  // No deps needed — everything is accessed via stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Voice hook ────────────────────────────────────────────────────────────
  const voice = useVoice({
    onTranscript: handleTranscript,
    onStateChange: useCallback((s: VoiceState) => {
      setLocalVoiceState(s);
      dispatch({ type: 'SET_VOICE_STATE', payload: s });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  });

  // Keep speakRef current
  useEffect(() => { speakRef.current = voice.speak; }, [voice.speak]);

  // ── Speak word introduction when transcript first arrives ─────────────────
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

  // Reset intro flag on word change
  useEffect(() => { hasIntroduced.current = false; }, [currentWord?.id]);

  // ── End session (defined before handleNextWord so it's always fresh) ──────
  const handleEndSession = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    voice.cancelSpeech();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const summary = await api.endSession(sid);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      onEnd();
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const msg = err instanceof ApiError ? err.message : 'Failed to end session.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEnd]);

  // Keep a ref to handleEndSession so handleNextWord can call it without stale closure
  const handleEndSessionRef = useRef(handleEndSession);
  useEffect(() => { handleEndSessionRef.current = handleEndSession; }, [handleEndSession]);

  // ── Next word ─────────────────────────────────────────────────────────────
  const handleNextWord = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    if (progress.current >= progress.total) {
      handleEndSessionRef.current();
      return;
    }

    voice.cancelSpeech();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const data = await api.nextWord(sid);
      dispatch({ type: 'WORD_UPDATED', payload: { currentWord: data.currentWord, progress: data.progress } });
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
  }, [progress.current, progress.total]);

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

  // ── Derived ───────────────────────────────────────────────────────────────
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
      {/* Header */}
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

      <main className="flex-1 flex flex-col items-center px-6 py-8 gap-8 max-w-2xl mx-auto w-full">
        {/* Word */}
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

        {/* Mic interaction */}
        <div className="flex flex-col items-center gap-4">
          <MicButton
            voiceState={localVoiceState}
            onClick={handleMicClick}
            disabled={isInteractionDisabled}
          />

          {(readyForNext || isLastWord) && !isInteractionDisabled && (
            <button
              onClick={handleNextWord}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm rounded-xl transition-colors duration-200 shadow-sm animate-scale-in focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              {isLastWord ? 'Finish session →' : 'Next word →'}
            </button>
          )}

          {!readyForNext && !isLastWord && transcript.length >= 4 && !isInteractionDisabled && (
            <button
              onClick={handleNextWord}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Skip to next word
            </button>
          )}
        </div>

        {/* Transcript */}
        <Transcript
          entries={transcript}
          isLoading={isLoading && localVoiceState === 'processing'}
        />
      </main>

      {/* Browser warning */}
      {!voice.isSupported && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 shadow-md max-w-sm text-center">
          Voice features require Chrome or Edge on desktop. Safari and Firefox are not supported.
        </div>
      )}
    </div>
  );
}

function StatusDot({ voiceState }: { voiceState: VoiceState }) {
  const config: Record<VoiceState, { color: string; label: string }> = {
    idle:       { color: 'bg-gray-300',                  label: 'Ready'      },
    listening:  { color: 'bg-red-500 animate-pulse',     label: 'Listening'  },
    processing: { color: 'bg-amber-400 animate-pulse',   label: 'Thinking'   },
    speaking:   { color: 'bg-emerald-500 animate-pulse', label: 'Speaking'   },
    error:      { color: 'bg-red-600',                   label: 'Error'      },
  };
  const { color, label } = config[voiceState] ?? config.idle;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
