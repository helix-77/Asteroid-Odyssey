"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Asteroid {
  id: string;
  name: string;
  size: number;
  velocity: number;
  mass: number;
  threat_level: string;
  composition: string;
}

interface AsteroidSelectorProps {
  asteroids: Asteroid[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AsteroidSelector({
  asteroids,
  selectedId,
  onSelect,
}: AsteroidSelectorProps) {
  const selectedAsteroid = asteroids.find((a) => a.id === selectedId);

  return (
    <div className="w-80">
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue>
            {selectedAsteroid && (
              <div className="flex items-center justify-between w-full">
                <span>{selectedAsteroid.name}</span>
                <Badge
                  variant={getThreatVariant(selectedAsteroid.threat_level)}
                  className="ml-2"
                >
                  {selectedAsteroid.threat_level}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {asteroids.map((asteroid) => (
            <SelectItem key={asteroid.id} value={asteroid.id}>
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{asteroid.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {asteroid.size}m • {asteroid.velocity} km/s •{" "}
                    {asteroid.composition}
                  </div>
                </div>
                <Badge
                  variant={getThreatVariant(asteroid.threat_level)}
                  className="ml-2"
                >
                  {asteroid.threat_level}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getThreatVariant(level: string) {
  switch (level) {
    case "high":
      return "destructive" as const;
    case "medium":
      return "secondary" as const;
    case "low":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}
