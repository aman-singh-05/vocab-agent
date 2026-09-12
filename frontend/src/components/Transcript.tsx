import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../types';

interface TranscriptProps {
  entries: TranscriptEntry[];
  isLoading?: boolean;
}

export function Transcript({ entries, isLoading }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isLoading]);

  if (entries.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-xl">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Conversation
      </h2>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scroll-smooth">
        {entries.map((entry, i) => (
          <div
            key={i}
            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                entry.role === 'user'
                  ? 'bg-gray-900 text-white rounded-br-sm'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'
              }`}
            >
              {entry.role === 'assistant' && (
                <span className="block text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
                  Lingo
                </span>
              )}
              {entry.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="block text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
                Lingo
              </span>
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}
