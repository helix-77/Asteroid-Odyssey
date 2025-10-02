"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface SimulationControlsProps {
  isPlaying: boolean;
  hasImpact: boolean;
  onPlayPause: () => void;
  onReset: () => void;
}

export function SimulationControls({
  isPlaying,
  hasImpact,
  onPlayPause,
  onReset,
}: SimulationControlsProps) {
  return (
    <div className="flex items-center gap-2">
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
        onClick={onReset}
        disabled={!hasImpact}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </Button>
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
