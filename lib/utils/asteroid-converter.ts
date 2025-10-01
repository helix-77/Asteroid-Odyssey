// Utility to convert asteroid data formats
import type { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";

interface SimpleAsteroidData {
  id: string;
  name: string;
  size: number;
  velocity: number;
  mass: number;
  composition: string;
  threat_level: string;
}

// Composition-based density mapping (kg/m³)
const COMPOSITION_DENSITIES: Record<string, number> = {
  stony: 2700,
  metallic: 7800,
  carbonaceous: 1300,
  "stony-iron": 5200,
  basaltic: 2900,
  unknown: 2500,
};

// Convert simple asteroid data to UnifiedAsteroidData
export function convertToUnifiedAsteroid(asteroid: SimpleAsteroidData): UnifiedAsteroidData {
  const density = COMPOSITION_DENSITIES[asteroid.composition.toLowerCase()] || COMPOSITION_DENSITIES.unknown;
  
  return {
    id: asteroid.id,
    name: asteroid.name,
    diameter: asteroid.size, // size is diameter in meters
    mass: asteroid.mass,
    density,
    composition: asteroid.composition,
    velocity: asteroid.velocity,
    threatLevel: asteroid.threat_level as "low" | "medium" | "high" | "critical",
    discoveryDate: "Unknown",
    nextApproach: "Unknown",
    minDistance: 0.01,
    orbitalElements: {
      semiMajorAxis: 1.0,
      eccentricity: 0.1,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
    },
    source: "local",
    dataCompleteness: 0.7,
    estimatedFields: ["orbitalElements", "nextApproach"],
    impactProbability: 0.001,
  };
}
