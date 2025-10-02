"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ImpactMap } from "@/components/impact-simulator/impact-map";
import { ImpactStats } from "@/components/impact-simulator/impact-stats";
import { SimulationControls } from "@/components/impact-simulator/simulation-controls";
import { AsteroidSelector } from "@/components/impact-simulator/asteroid-selector";
import { LayerControls } from "@/components/impact-simulator/layer-controls";
import { MapLegend } from "@/components/impact-simulator/map-legend";
import { RegionSelector } from "@/components/impact-simulator/region-selector";
import { computeImpactBundle, type TargetType } from "@/lib/calculations";
import {
  type ImpactLocation,
  type SimulationState,
} from "@/components/impact-simulator/types";
import asteroids from "@/data/asteroids.json";

const TIME_STEPS = [
  { id: 0, label: "Pre-Impact", description: "Asteroid approaching" },
  { id: 1, label: "Impact", description: "Moment of impact" },
  { id: 2, label: "1 Day", description: "24 hours after impact" },
  { id: 3, label: "1 Week", description: "7 days after impact" },
  { id: 4, label: "1 Year", description: "365 days after impact" },
];

export default function ImpactSimulatorPage() {
  const [state, setState] = useState<SimulationState>({
    selectedAsteroidId: asteroids.asteroids[0].id,
    impactLocation: null,
    isPlaying: false,
    timeStep: 0,
    playbackSpeed: 1,
    activeLayer: "population",
    selectedRegion: "global",
  });

  const [impactResults, setImpactResults] = useState<any>(null);
  const [animationProgress, setAnimationProgress] = useState(0); // 0-1 within current timestep

  const selectedAsteroid = asteroids.asteroids.find(
    (a) => a.id === state.selectedAsteroidId
  )!;

  // Animation loop
  useEffect(() => {
    if (!state.isPlaying || !state.impactLocation) return;

    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        const increment = 0.02 * state.playbackSpeed;
        if (prev >= 1) {
          // Move to next timestep
          setState((s) => {
            if (s.timeStep >= TIME_STEPS.length - 1) {
              return { ...s, isPlaying: false };
            }
            return { ...s, timeStep: s.timeStep + 1 };
          });
          return 0;
        }
        return prev + increment;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [state.isPlaying, state.impactLocation, state.playbackSpeed]);

  const handleMapClick = useCallback(
    (lat: number, lon: number, terrain: TargetType) => {
      // Estimate population density based on location (simplified)
      const populationDensity =
        terrain === "land"
          ? Math.max(50, Math.random() * 2000) // 50-2050 per km²
          : 0;

      const location: ImpactLocation = {
        lat,
        lon,
        terrain,
        populationDensity,
      };

      setState((s) => ({
        ...s,
        impactLocation: location,
        timeStep: 0,
        isPlaying: false,
      }));
      setAnimationProgress(0);

      // Calculate impact results
      const results = computeImpactBundle({
        massKg: selectedAsteroid.mass,
        velocityMps: selectedAsteroid.velocity * 1000, // km/s to m/s
        target: terrain,
        avgPopPerKm2: populationDensity,
        shelterFactor: 0.15,
        localWaterDepthM: terrain === "water" ? 4000 : 0,
      });

      setImpactResults(results);
    },
    [selectedAsteroid]
  );

  const handlePlayPause = useCallback(() => {
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }));
  }, []);

  const handleReset = useCallback(() => {
    setState((s) => ({
      ...s,
      impactLocation: null,
      isPlaying: false,
      timeStep: 0,
    }));
    setAnimationProgress(0);
    setImpactResults(null);
  }, []);

  const handleTimeStepChange = useCallback((step: number) => {
    setState((s) => ({ ...s, timeStep: step, isPlaying: false }));
    setAnimationProgress(0);
  }, []);

  const handleAsteroidChange = useCallback(
    (asteroidId: string) => {
      setState((s) => ({ ...s, selectedAsteroidId: asteroidId }));

      // Recalculate if we have an impact location
      if (state.impactLocation) {
        const asteroid = asteroids.asteroids.find((a) => a.id === asteroidId)!;
        const results = computeImpactBundle({
          massKg: asteroid.mass,
          velocityMps: asteroid.velocity * 1000,
          target: state.impactLocation.terrain,
          avgPopPerKm2: state.impactLocation.populationDensity,
          shelterFactor: 0.15,
          localWaterDepthM: state.impactLocation.terrain === "water" ? 4000 : 0,
        });
        setImpactResults(results);
      }
    },
    [state.impactLocation]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Asteroid Impact Simulator</h1>
            <p className="text-sm text-muted-foreground">
              Scientific 2D impact modeling with real-time visualization
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RegionSelector
              selectedRegion={state.selectedRegion}
              onRegionChange={(region) =>
                setState((s) => ({ ...s, selectedRegion: region }))
              }
            />
            <AsteroidSelector
              asteroids={asteroids.asteroids}
              selectedId={state.selectedAsteroidId}
              onSelect={handleAsteroidChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          <ImpactMap
            impactLocation={state.impactLocation}
            impactResults={impactResults}
            activeLayer={state.activeLayer}
            selectedRegion={state.selectedRegion}
            timeStep={state.timeStep}
            animationProgress={animationProgress}
            onMapClick={handleMapClick}
          />

          {/* Overlay Controls */}
          <LayerControls
            activeLayer={state.activeLayer}
            onLayerChange={(layer) =>
              setState((s) => ({ ...s, activeLayer: layer }))
            }
          />
          <MapLegend
            activeLayer={state.activeLayer}
            showImpactEffects={state.impactLocation !== null}
          />

          {/* Instructions */}
          {!state.impactLocation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl max-w-md">
                <h3 className="font-semibold mb-2">How to Use</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Select an asteroid from the dropdown above</li>
                  <li>Choose a region or use global view</li>
                  <li>Click anywhere on the map to simulate an impact</li>
                  <li>Use timeline controls to see effects over time</li>
                  <li>Toggle layers to view different data overlays</li>
                </ol>
                <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">⚠️ Scientific Accuracy</p>
                  <p className="text-muted-foreground">
                    Calculations based on established impact models with clear
                    provenance indicators
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <ImpactStats
          asteroid={selectedAsteroid}
          impactLocation={state.impactLocation}
          impactResults={impactResults}
          timeStep={state.timeStep}
          animationProgress={animationProgress}
        />
      </div>

      {/* Timeline Controls */}
      <SimulationControls
        isPlaying={state.isPlaying}
        timeStep={state.timeStep}
        timeSteps={TIME_STEPS}
        playbackSpeed={state.playbackSpeed}
        hasImpact={state.impactLocation !== null}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onTimeStepChange={handleTimeStepChange}
        onSpeedChange={(speed) =>
          setState((s) => ({ ...s, playbackSpeed: speed }))
        }
      />
    </div>
  );
}
