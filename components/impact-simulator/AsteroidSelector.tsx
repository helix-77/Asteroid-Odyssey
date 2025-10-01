"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket, AlertTriangle, Info } from "lucide-react";

interface Asteroid {
  id: string;
  name: string;
  size: number;
  velocity: number;
  mass: number;
  composition: string;
  threat_level: string;
}

interface AsteroidSelectorProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  onSelect: (asteroid: Asteroid) => void;
}

export default function AsteroidSelector({
  asteroids,
  selectedAsteroid,
  onSelect,
}: AsteroidSelectorProps) {
  const getThreatColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-2">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Select Asteroid</h2>
        </div>

        <Select
          value={selectedAsteroid?.id || ""}
          onValueChange={(value) => {
            const asteroid = asteroids.find((a) => a.id === value);
            if (asteroid) onSelect(asteroid);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an asteroid to simulate..." />
          </SelectTrigger>
          <SelectContent>
            {asteroids.map((asteroid) => (
              <SelectItem key={asteroid.id} value={asteroid.id}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{asteroid.name}</span>
                  <Badge className={getThreatColor(asteroid.threat_level)}>
                    {asteroid.threat_level}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAsteroid && (
          <div className="mt-4 space-y-3 p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{selectedAsteroid.name}</h3>
              <Badge className={getThreatColor(selectedAsteroid.threat_level)}>
                {selectedAsteroid.threat_level.toUpperCase()} THREAT
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Diameter</div>
                <div className="font-semibold">{selectedAsteroid.size} m</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Velocity</div>
                <div className="font-semibold">
                  {selectedAsteroid.velocity} km/s
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Mass</div>
                <div className="font-semibold">
                  {(selectedAsteroid.mass / 1e9).toExponential(2)} × 10⁹ kg
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Composition</div>
                <div className="font-semibold capitalize">
                  {selectedAsteroid.composition}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded border border-blue-500/50 text-xs">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-blue-500">
                Select an impact location on the map to begin simulation
              </p>
            </div>
          </div>
        )}

        {!selectedAsteroid && (
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded border border-orange-500/50 text-xs">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-orange-500">
              Please select an asteroid from the dropdown to begin
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
