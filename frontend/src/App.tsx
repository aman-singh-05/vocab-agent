import { useCallback } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import { Home } from './pages/Home';
import { Session } from './pages/Session';
import { Summary } from './pages/Summary';
import { api, ApiError } from './services/api';
import type { Difficulty } from './types';

function AppInner() {
  const { state, dispatch, addTranscript } = useSession();
  const { phase } = state;

  const handleStart = useCallback(
    async (difficulty: Difficulty, wordCount: number) => {
      dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_PHASE', payload: 'starting' });

      try {
        const data = await api.startSession(difficulty, wordCount);
        dispatch({
          type: 'SESSION_STARTED',
          payload: {
            sessionId: data.sessionId,
            currentWord: data.currentWord,
            progress: data.progress,
          },
        });
        addTranscript('assistant', data.introduction);
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : 'Failed to start session. Make sure the backend is running.';
        dispatch({ type: 'SET_ERROR', payload: msg });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_PHASE', payload: 'home' });
      }
    },
    [dispatch, addTranscript]
  );

  const handleSessionEnd = useCallback(() => {
    // Phase is already set to 'summary' by the session controller
  }, []);

  const handleRestart = useCallback(
    (difficulty: Difficulty) => {
      dispatch({ type: 'RESET' });
      // Small delay to let state settle before starting
      setTimeout(() => handleStart(difficulty, 5), 100);
    },
    [dispatch, handleStart]
  );

  const handleHome = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // Render based on phase
  if (phase === 'home' || phase === 'starting') {
    return (
      <Home
        onStart={handleStart}
        isLoading={state.isLoading}
        error={state.error}
      />
    );
  }

  if (phase === 'active' || phase === 'transitioning') {
    return <Session onEnd={handleSessionEnd} />;
  }

  if (phase === 'summary') {
    return <Summary onRestart={handleRestart} onHome={handleHome} />;
  }

  // Fallback
  return (
    <Home
      onStart={handleStart}
      isLoading={state.isLoading}
      error={state.error}
    />
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppInner />
    </SessionProvider>
  );
}
