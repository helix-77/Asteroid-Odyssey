"use client";

import React, { useState, useEffect, useCallback } from "react";
import { computeImpactBundle, type TargetType } from "@/lib/calculations";
import {
  type ImpactLocation,
  type SimulationState,
} from "@/components/impact-simulator/types";
import asteroids from "@/data/asteroids.json";

// Import components directly
import { ImpactMap } from "@/components/impact-simulator/impact-map-simple";
import { ImpactStats } from "@/components/impact-simulator/impact-stats";
import { SimulationControls } from "@/components/impact-simulator/simulation-controls";
import { AsteroidSelector } from "@/components/impact-simulator/asteroid-selector";
import { LayerControls } from "@/components/impact-simulator/layer-controls";
import { MapLegend } from "@/components/impact-simulator/map-legend";
import { RegionSelector } from "@/components/impact-simulator/region-selector";
import { HelpButton } from "@/components/impact-simulator/help-button";

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
  const [animationProgress, setAnimationProgress] = useState(0);

  const selectedAsteroid = asteroids.asteroids.find(
    (a) => a.id === state.selectedAsteroidId
  )!;

  // Animation loop - SINGLE IMPACT ONLY
  useEffect(() => {
    if (!state.isPlaying || !state.impactLocation) return;

    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        const increment = 0.01 * state.playbackSpeed; // SLOWER: Reduced from 0.02 to 0.01
        if (prev >= 1) {
          // SINGLE IMPACT: Stop after one complete animation
          setState((s) => ({ ...s, isPlaying: false }));
          return 1; // Keep at 100% to show final state
        }
        return prev + increment;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [state.isPlaying, state.impactLocation, state.playbackSpeed]);

  const handleMapClick = useCallback(
    (lat: number, lon: number, terrain: TargetType) => {
      const populationDensity =
        terrain === "land" ? Math.max(50, Math.random() * 2000) : 0;

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

      const results = computeImpactBundle({
        massKg: selectedAsteroid.mass,
        velocityMps: selectedAsteroid.velocity * 1000,
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

  const handleAsteroidChange = useCallback(
    (asteroidId: string) => {
      setState((s) => ({ ...s, selectedAsteroidId: asteroidId }));

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

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.impactLocation) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "KeyR":
          e.preventDefault();
          handleReset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.impactLocation, handlePlayPause, handleReset]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <LayerControls
              activeLayer={state.activeLayer}
              onLayerChange={(layer) =>
                setState((s) => ({ ...s, activeLayer: layer }))
              }
            />
          </div>
          <div className="flex items-center gap-4">
            <RegionSelector
              selectedRegion={state.selectedRegion}
              onRegionChange={(region) =>
                setState((s) => ({ ...s, selectedRegion: region }))
              }
            />
            <div className="flex flex-col gap-2">
              <AsteroidSelector
                asteroids={asteroids.asteroids}
                selectedId={state.selectedAsteroidId}
                onSelect={handleAsteroidChange}
              />
              <SimulationControls
                isPlaying={state.isPlaying}
                hasImpact={state.impactLocation !== null}
                onPlayPause={handlePlayPause}
                onReset={handleReset}
              />
            </div>
            <HelpButton />
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

          {/* Map Legend - moved to bottom right */}
          <div className="absolute bottom-4 right-4">
            <MapLegend
              activeLayer={state.activeLayer}
              showImpactEffects={state.impactLocation !== null}
            />
          </div>
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
    </div>
  );
}
