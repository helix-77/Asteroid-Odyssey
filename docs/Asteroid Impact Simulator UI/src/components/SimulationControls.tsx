import { Play, Pause, RotateCcw } from 'lucide-react@0.487.0';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card, CardContent } from './ui/card';

interface SimulationControlsProps {
  isPlaying: boolean;
  progress: number; // 0-100
  onPlayPause: () => void;
  onReset: () => void;
  onProgressChange: (value: number) => void;
  hasImpact: boolean;
}

export function SimulationControls({
  isPlaying,
  progress,
  onPlayPause,
  onReset,
  onProgressChange,
  hasImpact,
}: SimulationControlsProps) {
  const getTimeLabel = (progress: number) => {
    // Simulate time progression (e.g., seconds to hours)
    if (progress < 25) return `T+${Math.floor(progress * 4)} seconds`;
    if (progress < 50) return `T+${Math.floor((progress - 25) * 2)} minutes`;
    if (progress < 75) return `T+${Math.floor((progress - 50))} hours`;
    return `T+${Math.floor((progress - 75) / 5)} days`;
  };

  return (
    <Card className="border-t rounded-none border-x-0 border-b-0">
      <CardContent className="py-3">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onPlayPause}
            disabled={!hasImpact}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Reset Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={!hasImpact}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Timeline Slider */}
          <div className="flex-1 flex items-center gap-3">
            <Slider
              value={[progress]}
              onValueChange={([value]) => onProgressChange(value)}
              max={100}
              step={1}
              disabled={!hasImpact || isPlaying}
              className="flex-1"
            />
            <div className="text-sm text-muted-foreground min-w-[100px] text-right">
              {hasImpact ? getTimeLabel(progress) : 'No impact'}
            </div>
          </div>
        </div>

        {/* Timeline markers */}
        {hasImpact && (
          <div className="mt-2 flex justify-between text-xs text-muted-foreground px-10">
            <span>Impact</span>
            <span>Immediate Effects</span>
            <span>Secondary Effects</span>
            <span>Long-term</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}