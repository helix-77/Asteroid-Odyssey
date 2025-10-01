"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Info, MapPin, Rocket, Play, Clock } from "lucide-react";
import { useState } from "react";

export default function SimulatorGuide() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 h-12 w-12 rounded-full shadow-lg"
      >
        <Info className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 p-6 max-w-md bg-background/95 backdrop-blur border-2 shadow-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Quick Guide
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold mb-1">1. Select Asteroid</div>
              <p className="text-muted-foreground text-xs">
                Choose an asteroid from the dropdown. Each has different size, velocity, and composition.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold mb-1">2. Pick Impact Location</div>
              <p className="text-muted-foreground text-xs">
                Click anywhere on the map to set where the asteroid will strike Earth.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold mb-1">3. Run Simulation</div>
              <p className="text-muted-foreground text-xs">
                Click "Launch Simulation" to calculate all impact effects using scientific models.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold mb-1">4. Explore Timeline</div>
              <p className="text-muted-foreground text-xs">
                Use the timeline to see how the disaster unfolds from impact to 10 years later.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> All metrics include accuracy indicators showing if values are measured, calculated, estimated, or probability-based.
          </p>
        </div>
      </div>
    </Card>
  );
}
