"use client";

import { Suspense } from "react";
import AdvancedEarth3D from "./advanced-earth-3d";
import { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";

interface Earth3DProps {
  selectedAsteroid: UnifiedAsteroidData | null;
  simulationMode: "tracking" | "impact" | "deflection";
}

export default function Earth3D({
  selectedAsteroid,
  simulationMode,
}: Earth3DProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AdvancedEarth3D
        selectedAsteroid={selectedAsteroid}
        simulationMode={simulationMode}
        showOrbits={true}
        showLabels={true}
        timeScale={1}
      />
    </Suspense>
  );
}
