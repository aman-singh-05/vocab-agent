import { useState } from 'react';
import type { Difficulty } from '../types';

interface HomeProps {
  onStart: (difficulty: Difficulty, wordCount: number) => void;
  isLoading: boolean;
  error: string | null;
}

const difficulties: { value: Difficulty; label: string; description: string; emoji: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Everyday words to build your foundation',
    emoji: '🌱',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Expressive vocabulary for nuanced communication',
    emoji: '📖',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Sophisticated words for precise expression',
    emoji: '🎯',
  },
];

const wordCounts = [3, 5, 7, 10];

export function Home({ onStart, isLoading, error }: HomeProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [wordCount, setWordCount] = useState(5);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-gray-900">Lingo</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">Vocabulary by conversation</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 leading-tight mb-4">
            Learn words by<br />
            <span className="text-amber-500">actually using them.</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-md mx-auto">
            Lingo is a voice tutor that teaches vocabulary through real conversation — not flashcards.
            Speak a sentence, get instant feedback, move forward.
          </p>

          {/* How it works */}
          <div className="flex justify-center gap-8 mb-12 flex-wrap">
            {[
              { step: '1', text: 'Hear a word' },
              { step: '2', text: 'Use it in a sentence' },
              { step: '3', text: 'Get feedback' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>

          {/* Difficulty selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-left">Choose your level</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                    difficulty === d.value
                      ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{d.emoji}</div>
                  <div className="font-semibold text-sm">{d.label}</div>
                  <div
                    className={`text-xs mt-0.5 leading-snug ${
                      difficulty === d.value ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    {d.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Word count */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-left">Words per session</p>
            <div className="flex gap-2">
              {wordCounts.map((c) => (
                <button
                  key={c}
                  onClick={() => setWordCount(c)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                    wordCount === c
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-left">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onStart(difficulty, wordCount)}
            disabled={isLoading}
            className="w-full py-4 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-700 transition-colors duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting session…
              </span>
            ) : (
              'Start a session →'
            )}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Microphone access required · Works best in Chrome or Edge
          </p>
        </div>
      </main>
    </div>
  );
}
