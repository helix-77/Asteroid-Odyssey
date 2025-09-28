"use client";

import { useState } from "react";
import { ImpactCalculator } from "@/components/simulation/impact-calculator";
import { ImpactTimeline } from "@/components/simulation/impact-timeline";
import { DamageAssessment } from "@/components/simulation/damage-assessment";
import { ImpactHeatmap } from "@/components/simulation/impact-heatmap";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Asteroid, ImpactResults } from "@/lib/types";
import asteroidData from "@/data/asteroids.json";

export default function SimulationPage() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(
    null
  );
  const [impactResults, setImpactResults] = useState<ImpactResults | null>(
    null
  );
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [isAsteroidSelectorCollapsed, setIsAsteroidSelectorCollapsed] =
    useState(false);
  const [targetLocation, setTargetLocation] = useState({
    lat: 40.7128,
    lng: -74.006,
    name: "New York City",
  });

  const handleAsteroidSelect = (asteroid: Asteroid) => {
    setSelectedAsteroid(asteroid);
    setImpactResults(null);
  };

  const handleSimulationResults = (results: ImpactResults) => {
    setImpactResults(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6">
        <div className="relative mb-6">
          {/* Collapsible Asteroid Selection - Side Panel */}
          <div
            className={`fixed left-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm border-r border-white/20 transform transition-transform duration-300 z-50 ${
              isAsteroidSelectorCollapsed
                ? "-translate-x-full"
                : "translate-x-0"
            }`}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Select Asteroid</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsAsteroidSelectorCollapsed(!isAsteroidSelectorCollapsed)
                  }
                  className="text-white hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto mb-4">
                {asteroidData.asteroids.map((asteroid) => (
                  <button
                    key={asteroid.id}
                    onClick={() => handleAsteroidSelect(asteroid)}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selectedAsteroid?.id === asteroid.id
                        ? "border-blue-400 bg-blue-500/20"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-medium text-white">
                      {asteroid.name}
                    </div>
                    <div className="text-sm text-blue-200">
                      {asteroid.size || asteroid.diameter}m •{" "}
                      {asteroid.composition}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex-shrink-0">
                <ImpactCalculator
                  selectedAsteroid={selectedAsteroid}
                  onSimulate={handleSimulationResults}
                />
              </div>
            </div>
          </div>

          {/* Toggle Button - Always Visible */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setIsAsteroidSelectorCollapsed(!isAsteroidSelectorCollapsed)
            }
            className={`fixed left-4 top-20 z-50 transition-all duration-300 ${
              isAsteroidSelectorCollapsed ? "translate-x-0" : "translate-x-80"
            }`}
          >
            {isAsteroidSelectorCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
            {isAsteroidSelectorCollapsed ? "Asteroids" : ""}
          </Button>

          {/* 2D Heatmap Visualization - Full Width */}
          <div
            className={`transition-all duration-300 ${
              isAsteroidSelectorCollapsed ? "ml-0" : "ml-80"
            }`}
          >
            <ImpactHeatmap
              selectedAsteroid={selectedAsteroid}
              onSimulate={handleSimulationResults}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImpactTimeline
            impactResults={impactResults}
            isPlaying={isTimelinePlaying}
            onPlayStateChange={setIsTimelinePlaying}
          />

          <DamageAssessment
            impactResults={impactResults}
            targetLocation={targetLocation}
          />
        </div>
      </div>
    </div>
  );
}
