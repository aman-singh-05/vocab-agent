import type {
  Difficulty,
  SessionStartResponse,
  RespondResponse,
  NextWordResponse,
  SessionSummary,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(data.error || `Request failed with status ${res.status}`, res.status);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 408);
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError('Cannot connect to the server. Make sure the backend is running.', 0);
    }
    throw new ApiError('An unexpected error occurred.', 500);
  }
}

export const api = {
  startSession: (difficulty: Difficulty, wordCount = 5) =>
    request<SessionStartResponse>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ difficulty, wordCount }),
    }),

  respond: (sessionId: string, userMessage: string) =>
    request<RespondResponse>(`/sessions/${sessionId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ userMessage }),
    }),

  nextWord: (sessionId: string) =>
    request<NextWordResponse>(`/sessions/${sessionId}/next-word`, {
      method: 'POST',
    }),

  endSession: (sessionId: string) =>
    request<SessionSummary>(`/sessions/${sessionId}/end`, {
      method: 'POST',
    }),

  health: () =>
    request<{ status: string; openai: boolean }>('/health'.replace('/api', '')),
};

export { ApiError };
