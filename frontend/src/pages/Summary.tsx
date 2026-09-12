import { useSession } from '../context/SessionContext';
import type { Difficulty } from '../types';

interface SummaryProps {
  onRestart: (difficulty: Difficulty) => void;
  onHome: () => void;
}

const difficultyUp: Record<Difficulty, Difficulty> = {
  beginner: 'intermediate',
  intermediate: 'advanced',
  advanced: 'advanced',
};

export function Summary({ onRestart, onHome }: SummaryProps) {
  const { state } = useSession();
  const { summary } = state;

  if (!summary) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <p className="text-gray-400">Loading summary…</p>
      </div>
    );
  }

  const {
    difficulty,
    wordsLearned,
    wordsMastered,
    wordsToReview,
    wordsAttempted,
    accuracy,
    durationMinutes,
    recommendation,
    wordResults,
  } = summary;

  const harderDifficulty = difficultyUp[difficulty];
  const showTryHarder = difficulty !== 'advanced' && accuracy >= 70;

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="px-6 py-5 max-w-2xl mx-auto w-full">
        <span className="text-lg font-display font-bold text-gray-900">Lingo</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Heading */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="text-4xl mb-3">{accuracy >= 70 ? '🎉' : '📚'}</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Session complete
          </h1>
          <p className="text-gray-500">
            {durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'} ·{' '}
            <span className="capitalize">{difficulty}</span>
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-8 animate-slide-up">
          <StatCard value={wordsAttempted} label="Words practiced" />
          <StatCard value={wordsLearned} label="Used correctly" color="text-emerald-600" />
          <StatCard value={wordsMastered} label="First try" color="text-amber-500" />
          <StatCard value={`${accuracy}%`} label="Accuracy" color={accuracy >= 70 ? 'text-emerald-600' : 'text-red-500'} />
        </div>

        {/* Words to review */}
        {wordsToReview.length > 0 && (
          <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-5 mb-6 animate-fade-in">
            <h2 className="text-sm font-semibold text-amber-700 mb-2">Review these words</h2>
            <div className="flex flex-wrap gap-2">
              {wordsToReview.map((w) => (
                <span
                  key={w}
                  className="px-3 py-1 bg-white border border-amber-200 text-amber-800 text-sm rounded-full font-medium"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 animate-fade-in">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Lingo says
          </h2>
          <p className="text-gray-700 leading-relaxed">{recommendation}</p>
        </div>

        {/* Word-by-word breakdown */}
        <div className="w-full mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Word breakdown</h2>
          <div className="space-y-2">
            {wordResults.map((r) => (
              <div
                key={r.wordId}
                className="flex items-center justify-between py-2.5 px-4 bg-white rounded-xl border border-gray-100"
              >
                <div>
                  <span className="font-medium text-gray-900">{r.word}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {r.attempts} {r.attempts === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    r.correct
                      ? 'bg-emerald-100 text-emerald-700'
                      : r.attempts === 0
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {r.correct ? 'Correct' : r.attempts === 0 ? 'Skipped' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onRestart(difficulty)}
            className="flex-1 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Practice again
          </button>
          {showTryHarder && (
            <button
              onClick={() => onRestart(harderDifficulty)}
              className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              Try {harderDifficulty} words →
            </button>
          )}
          <button
            onClick={onHome}
            className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Home
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  value,
  label,
  color = 'text-gray-900',
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-xs text-gray-400 font-medium">{label}</div>
    </div>
  );
}
