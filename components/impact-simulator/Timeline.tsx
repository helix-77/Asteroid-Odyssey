import React from "react";

interface TimelineProps {
  currentTime: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  isPlaying,
  onTimeChange,
  onPlayPause,
  onReset,
  disabled = false,
}) => {
  const getTimeLabel = (time: number) => {
    if (time === 0) return "Impact";
    if (time <= 1) return `${time} hour`;
    if (time <= 24) return `${time} hours`;
    if (time <= 168) return `${Math.floor(time / 24)} days`;
    if (time <= 730) return `${Math.floor(time / 168)} weeks`;
    return `${Math.floor(time / 730)} years`;
  };

  return (
    <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          disabled={disabled}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={disabled}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-500 text-white hover:bg-gray-600"
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-gray-600 w-20">{getTimeLabel(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={currentTime}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            disabled={disabled}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${currentTime}%, #E5E7EB ${currentTime}%, #E5E7EB 100%)`
            }}
          />
          <span className="text-xs text-gray-600 w-16 text-right">100 years</span>
        </div>
      </div>
    </div>
  );
};
