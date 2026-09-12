export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example: string;
  difficulty: Difficulty;
  context: string;
  synonyms?: string[];
  reviewPriority: number;
}

export interface CurrentWord extends VocabWord {
  index: number;
}

export interface SessionProgress {
  current: number;
  total: number;
  correct: number;
  toReview: number;
}

export interface SessionStartResponse {
  sessionId: string;
  difficulty: Difficulty;
  totalWords: number;
  currentWord: CurrentWord;
  introduction: string;
  progress: SessionProgress;
}

export interface RespondResponse {
  reply: string;
  wordUsedCorrectly: boolean;
  readyForNext: boolean;
  currentWord: CurrentWord;
  progress: SessionProgress;
}

export interface NextWordResponse {
  currentWord: CurrentWord;
  introduction: string;
  progress: SessionProgress;
}

export interface WordResult {
  wordId: string;
  word: string;
  attempts: number;
  correct: boolean;
  needsReview: boolean;
}

export interface SessionSummary {
  sessionId: string;
  difficulty: Difficulty;
  totalWords: number;
  wordsAttempted: number;
  wordsLearned: number;
  wordsMastered: number;
  wordsToReview: string[];
  accuracy: number;
  durationMinutes: number;
  recommendation: string;
  wordResults: WordResult[];
}

export interface TranscriptEntry {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

export type SessionPhase =
  | 'home'
  | 'starting'
  | 'active'
  | 'transitioning'
  | 'ending'
  | 'summary';
