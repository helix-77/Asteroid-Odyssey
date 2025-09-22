"use client";

import { useState } from "react";
import { StrategySelector } from "@/components/deflection/strategy-selector";
import { MissionPlanner } from "@/components/deflection/mission-planner";
import { StrategyComparison } from "@/components/deflection/strategy-comparison";
import DeflectionTrajectory from "@/components/3d/deflection-trajectory";
import type { Asteroid, DeflectionStrategy } from "@/lib/types";
import asteroidData from "@/data/asteroids.json";

export default function DeflectionPage() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<any>(null);
  const [selectedStrategy, setSelectedStrategy] =
    useState<DeflectionStrategy | null>(null);
  const [missionPlan, setMissionPlan] = useState<any>(null);

  const handleAsteroidSelect = (asteroid: any) => {
    setSelectedAsteroid(asteroid);
    setSelectedStrategy(null);
    setMissionPlan(null);
  };

  const handleStrategySelect = (strategy: DeflectionStrategy) => {
    setSelectedStrategy(strategy);
    setMissionPlan(null);
  };

  const handleMissionPlan = (plan: any) => {
    setMissionPlan(plan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Planetary Defense Center
          </h1>
          <p className="text-purple-200">
            Design and plan missions to deflect potentially hazardous asteroids
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Asteroid Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-white mb-3">Select Target</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {asteroidData.asteroids
                  .filter((asteroid) => asteroid.threat_level !== "low")
                  .map((asteroid) => (
                    <button
                      key={asteroid.id}
                      onClick={() => handleAsteroidSelect(asteroid)}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        selectedAsteroid?.id === asteroid.id
                          ? "border-purple-400 bg-purple-500/20"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-medium text-white">
                        {asteroid.name}
                      </div>
                      <div className="text-sm text-purple-200">
                        {asteroid.size}m •{" "}
                        {asteroid.threat_level?.toUpperCase() || "UNKNOWN"}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <StrategySelector
              selectedAsteroid={selectedAsteroid}
              onStrategySelect={handleStrategySelect}
              selectedStrategy={selectedStrategy}
            />
          </div>

          {/* 3D Visualization */}
          <div className="lg:col-span-2">
            <div
              className="bg-black rounded-lg overflow-hidden"
              style={{ height: "600px" }}
            >
              {selectedAsteroid && selectedStrategy ? (
                <DeflectionTrajectory
                  originalPath={[]}
                  deflectedPath={[]}
                  interceptPoint={{ x: 0, y: 0, z: 0 } as any}
                  strategy={selectedStrategy.name || "unknown"}
                  visible={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <h3 className="text-xl mb-2">
                      Select an asteroid and deflection strategy
                    </h3>
                    <p className="text-gray-400">
                      Choose a target and method to see the trajectory
                      visualization
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mission Planning */}
          <div className="lg:col-span-1">
            <MissionPlanner
              selectedAsteroid={selectedAsteroid}
              selectedStrategy={selectedStrategy}
              onMissionPlan={handleMissionPlan}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <StrategyComparison selectedAsteroid={selectedAsteroid} />
        </div>
      </div>
    </div>
  );
}
