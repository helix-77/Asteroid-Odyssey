"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, RotateCcw, SkipForward, SkipBack } from "lucide-react";

interface TimeStep {
  id: number;
  label: string;
  description: string;
}

interface SimulationControlsProps {
  isPlaying: boolean;
  timeStep: number;
  timeSteps: TimeStep[];
  playbackSpeed: number;
  hasImpact: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onTimeStepChange: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

export function SimulationControls({
  isPlaying,
  timeStep,
  timeSteps,
  playbackSpeed,
  hasImpact,
  onPlayPause,
  onReset,
  onTimeStepChange,
  onSpeedChange,
}: SimulationControlsProps) {
  const handleStepBack = () => {
    if (timeStep > 0) {
      onTimeStepChange(timeStep - 1);
    }
  };

  const handleStepForward = () => {
    if (timeStep < timeSteps.length - 1) {
      onTimeStepChange(timeStep + 1);
    }
  };

  const handleSliderChange = (values: number[]) => {
    onTimeStepChange(values[0]);
  };

  return (
    <div className="border-t border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Timeline Scrubber */}
        <div className="flex-1 max-w-2xl">
          <div className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              {timeSteps.map((step) => (
                <span
                  key={step.id}
                  className={
                    timeStep === step.id ? "text-foreground font-medium" : ""
                  }
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
          <Slider
            value={[timeStep]}
            onValueChange={handleSliderChange}
            max={timeSteps.length - 1}
            step={1}
            className="w-full"
            disabled={!hasImpact}
          />
          <div className="mt-1 text-xs text-muted-foreground text-center">
            {hasImpact
              ? timeSteps[timeStep]?.description
              : "Select an impact location to begin simulation"}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 ml-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStepBack}
            disabled={!hasImpact || timeStep === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="sm"
            onClick={onPlayPause}
            disabled={!hasImpact}
            className="min-w-[80px]"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStepForward}
            disabled={!hasImpact || timeStep === timeSteps.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!hasImpact}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-muted-foreground">Speed:</span>
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(value) => onSpeedChange(parseFloat(value))}
            disabled={!hasImpact}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.25">0.25x</SelectItem>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="4">4x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline Labels */}
      {hasImpact && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Approach</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Impact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Immediate Effects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Short-term</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Long-term</span>
              </div>
            </div>
            <div className="text-muted-foreground">
              Use keyboard: Space (play/pause), ← → (step), R (reset)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add keyboard shortcuts hook
export function useSimulationKeyboard(
  hasImpact: boolean,
  isPlaying: boolean,
  timeStep: number,
  maxTimeStep: number,
  onPlayPause: () => void,
  onReset: () => void,
  onTimeStepChange: (step: number) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasImpact) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          onPlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (timeStep > 0) onTimeStepChange(timeStep - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (timeStep < maxTimeStep) onTimeStepChange(timeStep + 1);
          break;
        case "KeyR":
          e.preventDefault();
          onReset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    hasImpact,
    isPlaying,
    timeStep,
    maxTimeStep,
    onPlayPause,
    onReset,
    onTimeStepChange,
  ]);
}
