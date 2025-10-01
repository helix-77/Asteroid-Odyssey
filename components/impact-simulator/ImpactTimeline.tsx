"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { TimelineSnapshot } from "@/lib/calculations/comprehensive-impact";

interface ImpactTimelineProps {
  timeline: {
    t0: TimelineSnapshot;
    t1Hour: TimelineSnapshot;
    t24Hours: TimelineSnapshot;
    t1Week: TimelineSnapshot;
    t1Month: TimelineSnapshot;
    t1Year: TimelineSnapshot;
    t10Years: TimelineSnapshot;
  };
  onTimeChange?: (snapshot: TimelineSnapshot) => void;
}

export default function ImpactTimeline({ timeline, onTimeChange }: ImpactTimelineProps) {
  const timelinePoints = [
    { key: "t0", label: "Impact", snapshot: timeline.t0 },
    { key: "t1Hour", label: "1 Hour", snapshot: timeline.t1Hour },
    { key: "t24Hours", label: "24 Hours", snapshot: timeline.t24Hours },
    { key: "t1Week", label: "1 Week", snapshot: timeline.t1Week },
    { key: "t1Month", label: "1 Month", snapshot: timeline.t1Month },
    { key: "t1Year", label: "1 Year", snapshot: timeline.t1Year },
    { key: "t10Years", label: "10 Years", snapshot: timeline.t10Years },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSnapshot = timelinePoints[currentIndex].snapshot;

  // Auto-play timeline
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= timelinePoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, [isPlaying, timelinePoints.length]);

  // Notify parent of time change
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(currentSnapshot);
    }
  }, [currentIndex, currentSnapshot, onTimeChange]);

  const handleSliderChange = (value: number[]) => {
    setCurrentIndex(value[0]);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  return (
    <Card className="p-6 bg-background/95 backdrop-blur">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Impact Timeline</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPause}
              className="h-8 w-8"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {timelinePoints[currentIndex].label}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentSnapshot.time}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-4">
          <Slider
            value={[currentIndex]}
            onValueChange={handleSliderChange}
            max={timelinePoints.length - 1}
            step={1}
            className="w-full"
          />
          
          {/* Timeline Labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            {timelinePoints.map((point, index) => (
              <div
                key={point.key}
                className={`text-center cursor-pointer transition-colors ${
                  index === currentIndex ? "text-primary font-semibold" : ""
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPlaying(false);
                }}
              >
                {point.label}
              </div>
            ))}
          </div>
        </div>

        {/* Current Snapshot Data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Casualties</div>
            <div className="text-2xl font-bold text-red-500">
              {currentSnapshot.casualties.toLocaleString()}
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Displaced</div>
            <div className="text-2xl font-bold text-orange-500">
              {currentSnapshot.displaced.toLocaleString()}
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Temperature Change</div>
            <div className="text-2xl font-bold text-blue-500">
              {currentSnapshot.temperature > 0 ? "+" : ""}
              {currentSnapshot.temperature.toFixed(1)}°C
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Habitable Area</div>
            <div className="text-2xl font-bold text-green-500">
              {currentSnapshot.habitableArea.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Food Production Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Food Production</span>
            <span className="font-semibold">{currentSnapshot.foodProduction.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-500"
              style={{ width: `${currentSnapshot.foodProduction}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
          <p className="text-sm leading-relaxed">{currentSnapshot.description}</p>
        </div>

        {/* Progress Visualization */}
        <div className="space-y-2">
          <div className="text-sm font-semibold mb-3">Impact Progression</div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / timelinePoints.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
