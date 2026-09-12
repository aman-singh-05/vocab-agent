import type { VoiceState } from '../types';

interface MicButtonProps {
  voiceState: VoiceState;
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ voiceState, onClick, disabled }: MicButtonProps) {
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';
  const isActive = isListening || isSpeaking || isProcessing;

  const getLabel = () => {
    if (isListening) return 'Listening…';
    if (isProcessing) return 'Thinking…';
    if (isSpeaking) return 'Speaking…';
    return 'Tap to speak';
  };

  const getButtonClasses = () => {
    const base =
      'relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2';

    if (disabled || isProcessing || isSpeaking) {
      return `${base} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    if (isListening) {
      return `${base} bg-red-500 text-white shadow-lg shadow-red-200 cursor-pointer`;
    }
    return `${base} bg-gray-900 text-white hover:bg-gray-700 shadow-md cursor-pointer focus:ring-gray-400`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled || isProcessing || isSpeaking}
        className={getButtonClasses()}
        aria-label={getLabel()}
        title={getLabel()}
      >
        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            <span className="absolute inset-[-8px] rounded-full border-2 border-red-300 animate-breathe opacity-50" />
          </>
        )}

        {/* Mic icon */}
        {!isProcessing && !isSpeaking && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 relative z-10"
          >
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
            <path d="M19 10a1 1 0 0 1 2 0 9 9 0 0 1-8 8.94V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.06A9 9 0 0 1 3 10a1 1 0 0 1 2 0 7 7 0 0 0 14 0z" />
          </svg>
        )}

        {/* Spinner when processing */}
        {isProcessing && (
          <svg
            className="w-8 h-8 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}

        {/* Speaker icon when speaking */}
        {isSpeaking && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-gray-400 animate-pulse"
          >
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
          </svg>
        )}
      </button>

      <span className="text-sm text-gray-500 font-medium tracking-wide">
        {getLabel()}
      </span>
    </div>
  );
}
