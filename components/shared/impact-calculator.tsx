"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Target,
  Flame,
  Gauge,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  calculateEnhancedImpact,
  type EnhancedImpactResults,
} from "@/lib/calculations/impact";
import { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";
import {
  EstimationIndicator,
  DataCompletenessIndicator,
} from "@/components/ui/data-completeness-indicator";

interface ImpactCalculatorProps {
  asteroid: UnifiedAsteroidData | any; // Support both UnifiedAsteroidData and NEOData
  angle?: number;
  location?: {
    populationDensity: number;
    totalPopulation: number;
    gdpPerCapita?: number;
    infrastructureValue?: number;
  };
  showDataQuality?: boolean;
  compact?: boolean;
}

// Convert NEO data format to UnifiedAsteroidData format
function normalizeAsteroidData(asteroid: any): UnifiedAsteroidData {
  // If already UnifiedAsteroidData, return as is
  if (asteroid.dataCompleteness !== undefined) {
    return asteroid as UnifiedAsteroidData;
  }

  // Convert NEO format to UnifiedAsteroidData
  const diameter =
    asteroid.diameter ||
    (asteroid.est_diameter_min_m + asteroid.est_diameter_max_m) / 2 ||
    asteroid.size ||
    150;

  const velocity =
    asteroid.velocity ||
    (asteroid.relative_velocity_km_s
      ? parseFloat(asteroid.relative_velocity_km_s)
      : 20);

  // Calculate mass from diameter and assumed density
  const density = 2700; // Default stony asteroid density
  const radius = diameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const mass = asteroid.mass || volume * density;

  return {
    id: asteroid.id || asteroid.neo_reference_id || "unknown",
    name: asteroid.name || "Unknown Asteroid",
    diameter,
    mass,
    density: asteroid.density || density,
    composition: asteroid.composition || "stony",
    velocity,
    threatLevel: asteroid.threat_level || asteroid.hazard_level || "medium",
    discoveryDate: asteroid.discovery_date || "Unknown",
    orbit: asteroid.orbit || {
      semi_major_axis: 1.0,
      eccentricity: 0.1,
      inclination: 0,
      ascending_node: 0,
      perihelion: 0,
      mean_anomaly: 0,
    },
    source: asteroid.source || "local",
    dataCompleteness: asteroid.dataCompleteness || 0.5,
    estimatedFields: asteroid.estimatedFields || [
      "mass",
      "composition",
      "density",
    ],
    impactProbability: asteroid.impact_probability || 0.0001,
    closeApproach: asteroid.close_approach || asteroid.closest_approach_date ? {
      date: asteroid.close_approach?.date || asteroid.closest_approach_date || "Unknown",
      distance: asteroid.close_approach?.distance || (asteroid.miss_distance_km ? parseFloat(asteroid.miss_distance_km) / 149597870.7 : 0.05),
      velocity: asteroid.close_approach?.velocity || velocity,
    } : undefined,
  };
}

function formatNumber(num: number | undefined, decimals = 2): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

export function ImpactCalculator({
  asteroid,
  angle = 45,
  location = {
    populationDensity: 100,
    totalPopulation: 1000000,
    gdpPerCapita: 65000,
    infrastructureValue: 1e12,
  },
  showDataQuality = true,
  compact = false,
}: ImpactCalculatorProps) {
  const normalizedAsteroid = useMemo(
    () => normalizeAsteroidData(asteroid),
    [asteroid]
  );

  const impactResults: EnhancedImpactResults | null = useMemo(() => {
    try {
      return calculateEnhancedImpact(normalizedAsteroid, angle, location);
    } catch (error) {
      console.error("Impact calculation error:", error);
      return null;
    }
  }, [normalizedAsteroid, angle, location]);

  if (!impactResults) {
    return (
      <Card className="p-4 bg-red-900/20 border-red-500/30">
        <div className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Unable to calculate impact effects</span>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">
            {formatNumber(impactResults.tntEquivalent)}
          </p>
          <p className="text-xs text-gray-300">MT TNT</p>
        </div>
        <div className="text-center">
          <Target className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">
            {(impactResults.crater.diameter / 1000).toFixed(2)}
          </p>
          <p className="text-xs text-gray-300">Crater (km)</p>
        </div>
        <div className="text-center">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">
            {impactResults.effects.fireballRadius.toFixed(2)}
          </p>
          <p className="text-xs text-gray-300">Fireball (km)</p>
        </div>
        <div className="text-center">
          <Gauge className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">
            {impactResults.effects.seismicMagnitude.toFixed(1)}
          </p>
          <p className="text-xs text-gray-300">Richter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Energy Analysis */}
      <Card className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-red-400" />
          <h4 className="font-semibold text-white">Energy Analysis</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-200">Kinetic Energy:</span>
            <span className="font-bold text-red-400">
              {formatNumber(impactResults.kineticEnergy)} J
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-200">TNT Equivalent:</span>
            <span className="font-bold text-red-300">
              {formatNumber(impactResults.tntEquivalent)} kt TNT
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-red-200">
          Based on {normalizedAsteroid.composition} composition (density:{" "}
          {normalizedAsteroid.density} kg/m³)
        </div>
      </Card>

      {/* Crater Formation */}
      <Card className="bg-orange-900/20 p-4 rounded-lg border border-orange-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-orange-400" />
          <h4 className="font-semibold text-white">Crater Formation</h4>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-orange-400">
              {(impactResults.crater.diameter / 1000).toFixed(2)}Km
            </div>
            <div className="text-orange-200 text-xs">Diameter</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-400">
              {formatNumber(impactResults.crater.depth)}m
            </div>
            <div className="text-orange-200 text-xs">Depth</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-400">
              {formatNumber(impactResults.crater.volume)}m³
            </div>
            <div className="text-orange-200 text-xs">Volume</div>
          </div>
        </div>
      </Card>

      {/* Blast Effects */}
      <Card className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-purple-400" />
          <h4 className="font-semibold text-white">Blast Effects</h4>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold text-purple-400">
              {impactResults.effects.fireballRadius.toFixed(2)} km
            </div>
            <div className="text-purple-200 text-xs">Fireball Radius</div>
          </div>
          <div>
            <div className="font-bold text-purple-400">
              {impactResults.effects.airblastRadius.toFixed(2)} km
            </div>
            <div className="text-purple-200 text-xs">Airblast Radius</div>
          </div>
          <div>
            <div className="font-bold text-purple-400">
              {impactResults.effects.thermalRadiation.toFixed(2)} km
            </div>
            <div className="text-purple-200 text-xs">Thermal Radiation</div>
          </div>
          <div>
            <div className="font-bold text-purple-400">
              {impactResults.effects.seismicMagnitude.toFixed(1)}
            </div>
            <div className="text-purple-200 text-xs">Seismic Magnitude</div>
          </div>
        </div>
      </Card>

      {/* Data Quality Indicator */}
      {showDataQuality && (
        <Card className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-5 w-5 text-blue-400" />
            <h4 className="font-semibold text-white">Calculation Details</h4>
          </div>

          <div className="space-y-2 text-xs text-blue-200">
            <div className="flex items-center justify-between">
              <span>Mass:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono">
                  {formatNumber(normalizedAsteroid.mass)} kg
                </span>
                <EstimationIndicator
                  isEstimated={normalizedAsteroid.estimatedFields.includes(
                    "mass"
                  )}
                  fieldName="Mass"
                  confidence={
                    normalizedAsteroid.estimatedFields.includes("mass")
                      ? "medium"
                      : "high"
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Velocity:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono">
                  {(normalizedAsteroid.velocity || 0).toFixed(2)} km/s
                </span>
                <EstimationIndicator
                  isEstimated={normalizedAsteroid.estimatedFields.includes(
                    "velocity"
                  )}
                  fieldName="Velocity"
                  confidence={
                    normalizedAsteroid.estimatedFields.includes("velocity")
                      ? "medium"
                      : "high"
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Diameter:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono">
                  {(normalizedAsteroid.diameter || 0).toFixed(0)} m
                </span>
                <EstimationIndicator
                  isEstimated={normalizedAsteroid.estimatedFields.includes(
                    "diameter"
                  )}
                  fieldName="Diameter"
                  confidence={
                    normalizedAsteroid.estimatedFields.includes("diameter")
                      ? "medium"
                      : "high"
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Composition:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono capitalize">
                  {normalizedAsteroid.composition}
                </span>
                <EstimationIndicator
                  isEstimated={normalizedAsteroid.estimatedFields.includes(
                    "composition"
                  )}
                  fieldName="Composition"
                  confidence={
                    normalizedAsteroid.estimatedFields.includes("composition")
                      ? "low"
                      : "high"
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-500/20">
            <DataCompletenessIndicator
              asteroid={normalizedAsteroid}
              compact={true}
            />
          </div>

          {normalizedAsteroid.estimatedFields.length > 0 && (
            <div className="mt-3 text-xs">
              <div className="flex items-center gap-1 text-yellow-300">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  Results based on {normalizedAsteroid.estimatedFields.length}{" "}
                  estimated parameter(s)
                </span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Export a hook for calculations without rendering
export function useImpactCalculation(
  asteroid: any,
  angle: number = 45,
  location = {
    populationDensity: 100,
    totalPopulation: 1000000,
    gdpPerCapita: 65000,
    infrastructureValue: 1e12,
  }
): EnhancedImpactResults | null {
  return useMemo(() => {
    try {
      const normalizedAsteroid = normalizeAsteroidData(asteroid);
      return calculateEnhancedImpact(normalizedAsteroid, angle, location);
    } catch (error) {
      console.error("Impact calculation error:", error);
      return null;
    }
  }, [asteroid, angle, location]);
}
