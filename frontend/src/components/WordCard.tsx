import type { CurrentWord, SessionProgress } from '../types';

interface WordCardProps {
  word: CurrentWord;
  progress: SessionProgress;
}

const difficultyColors = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

export function WordCard({ word, progress }: WordCardProps) {
  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="w-full max-w-xl animate-slide-up">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          {progress.current} / {progress.total}
        </span>
      </div>

      {/* Word */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-5xl font-display font-bold text-gray-900 leading-tight tracking-tight">
            {word.word}
          </h1>
          <span
            className={`mt-2 text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${
              difficultyColors[word.difficulty]
            }`}
          >
            {word.difficulty}
          </span>
        </div>

        {/* Definition */}
        <p className="text-lg text-gray-600 leading-relaxed mt-3">
          {word.definition}
        </p>
      </div>

      {/* Example */}
      <div className="border-l-4 border-amber-300 pl-4 py-1 mb-5">
        <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">
          Example
        </p>
        <p className="text-gray-700 italic leading-relaxed">
          "{word.example}"
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <StatPill label="Learned" value={progress.correct} color="text-emerald-600" />
        <StatPill label="To review" value={progress.toReview} color="text-amber-600" />
        {word.synonyms && word.synonyms.length > 0 && (
          <div className="ml-auto">
            <span className="text-xs text-gray-400">
              Also: <span className="text-gray-600">{word.synonyms.slice(0, 2).join(', ')}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-base font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
