import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  Difficulty,
  CurrentWord,
  SessionProgress,
  TranscriptEntry,
  SessionSummary,
  SessionPhase,
  VoiceState,
} from '../types';

interface SessionState {
  phase: SessionPhase;
  sessionId: string | null;
  difficulty: Difficulty;
  currentWord: CurrentWord | null;
  progress: SessionProgress;
  transcript: TranscriptEntry[];
  summary: SessionSummary | null;
  voiceState: VoiceState;
  error: string | null;
  isLoading: boolean;
  readyForNext: boolean;
  lastWordCorrect: boolean | null;
}

type Action =
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_PHASE'; payload: SessionPhase }
  | { type: 'SESSION_STARTED'; payload: { sessionId: string; currentWord: CurrentWord; progress: SessionProgress } }
  | { type: 'WORD_UPDATED'; payload: { currentWord: CurrentWord; progress: SessionProgress } }
  | { type: 'ADD_TRANSCRIPT'; payload: TranscriptEntry }
  | { type: 'SET_SUMMARY'; payload: SessionSummary }
  | { type: 'SET_VOICE_STATE'; payload: VoiceState }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_READY_FOR_NEXT'; payload: boolean }
  | { type: 'SET_LAST_WORD_CORRECT'; payload: boolean | null }
  | { type: 'RESET' };

const initialProgress: SessionProgress = { current: 0, total: 0, correct: 0, toReview: 0 };

const initialState: SessionState = {
  phase: 'home',
  sessionId: null,
  difficulty: 'intermediate',
  currentWord: null,
  progress: initialProgress,
  transcript: [],
  summary: null,
  voiceState: 'idle',
  error: null,
  isLoading: false,
  readyForNext: false,
  lastWordCorrect: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SESSION_STARTED':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        currentWord: action.payload.currentWord,
        progress: action.payload.progress,
        transcript: [],
        phase: 'active',
        readyForNext: false,
        lastWordCorrect: null,
        error: null,
      };
    case 'WORD_UPDATED':
      return {
        ...state,
        currentWord: action.payload.currentWord,
        progress: action.payload.progress,
        transcript: [],
        readyForNext: false,
        lastWordCorrect: null,
        phase: 'active',
      };
    case 'ADD_TRANSCRIPT':
      return { ...state, transcript: [...state.transcript, action.payload] };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload, phase: 'summary' };
    case 'SET_VOICE_STATE':
      return { ...state, voiceState: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_READY_FOR_NEXT':
      return { ...state, readyForNext: action.payload };
    case 'SET_LAST_WORD_CORRECT':
      return { ...state, lastWordCorrect: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  addTranscript: (role: 'assistant' | 'user', content: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addTranscript = useCallback((role: 'assistant' | 'user', content: string) => {
    dispatch({
      type: 'ADD_TRANSCRIPT',
      payload: { role, content, timestamp: Date.now() },
    });
  }, []);

  return (
    <SessionContext.Provider value={{ state, dispatch, addTranscript }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
