"use client";

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface TimelapseControlProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  timeStep: number;
  maxTimeStep: number;
  speed: number;
  onSpeedChange: (value: number) => void;
  disabled?: boolean;
}

export function TimelapseControl({
  isPlaying,
  onPlayPause,
  onReset,
  timeStep,
  maxTimeStep,
  speed,
  onSpeedChange,
  disabled = false
}: TimelapseControlProps) {
  // Convert timeStep to human-readable format
  const formatTime = (step: number) => {
    // Assuming maxTimeStep represents 50 years
    const years = (step / maxTimeStep) * 50;
    if (years < 1) {
      const months = Math.floor(years * 12);
      return `${months}mo`;
    }
    return `${years.toFixed(1)}y`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          onClick={onPlayPause}
          size="sm"
          variant="outline"
          className="h-7 w-16 text-xs"
          disabled={disabled}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Play
            </>
          )}
        </Button>

        {/* Reset Button */}
        <Button
          onClick={onReset}
          size="sm"
          variant="outline"
          className="h-7 w-16 text-xs"
          disabled={disabled}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>

        {/* Timeline Indicator */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-slate-600 whitespace-nowrap">
            Time: {formatTime(timeStep)} / {formatTime(maxTimeStep)}
          </span>
          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(timeStep / maxTimeStep) * 100}%` }}
            />
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <FastForward className="w-3 h-3 text-slate-600" />
          <span className="text-xs text-slate-600">{speed}x</span>
          <Slider
            value={[speed]}
            onValueChange={(value) => onSpeedChange(value[0])}
            min={1}
            max={5}
            step={1}
            className="w-20"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
