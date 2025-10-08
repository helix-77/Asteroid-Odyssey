"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Database } from "lucide-react";
import { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";
import {
  DataCompletenessIndicator,
  EstimationIndicator,
  DataSourceBadge,
} from "@/components/ui/data-completeness-indicator";

interface PhysicsShowcaseProps {
  selectedAsteroid?: UnifiedAsteroidData | null;
}

export function PhysicsShowcase({ selectedAsteroid }: PhysicsShowcaseProps) {
  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // Determine if a field is estimated
  const isFieldEstimated = (fieldName: string): boolean => {
    return selectedAsteroid?.estimatedFields?.includes(fieldName) || false;
  };

  // Get data confidence level based on completeness and source
  const getConfidenceLevel = (): {
    level: string;
    color: string;
    description: string;
  } => {
    if (!selectedAsteroid) {
      return {
        level: "Demo",
        color: "text-gray-400",
        description: "Demo data for illustration",
      };
    }

    const completeness = selectedAsteroid.dataCompleteness;
    const source = selectedAsteroid.source;

    if (completeness >= 0.8 && source === "local") {
      return {
        level: "High",
        color: "text-green-400",
        description: "Complete data from verified sources",
      };
    } else if (completeness >= 0.6) {
      return {
        level: "Medium",
        color: "text-yellow-400",
        description: "Good data with some estimates",
      };
    } else {
      return {
        level: "Low",
        color: "text-red-400",
        description: "Limited data with many estimates",
      };
    }
  };

  const confidence = getConfidenceLevel();

  return (
    <div className="space-y-6">
      <Card className="space-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calculator className="h-6 w-6 text-blue-400" />
            Physics Engine
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-blue-200 text-xs">
              {selectedAsteroid
                ? `Real-time calculations for ${selectedAsteroid.name}`
                : "Select an asteroid to see real calculations"}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {selectedAsteroid ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-bold text-white">
                      {Number(selectedAsteroid.diameter).toFixed(4)}m
                    </div>
                    <EstimationIndicator
                      isEstimated={isFieldEstimated("diameter")}
                      fieldName="Diameter"
                      confidence={
                        isFieldEstimated("diameter") ? "medium" : "high"
                      }
                      source={
                        selectedAsteroid.source === "nasa"
                          ? "NASA estimates"
                          : "Measured"
                      }
                    />
                  </div>
                  <div className="text-xs text-blue-200">Diameter</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-bold text-white">
                      {formatNumber(selectedAsteroid.mass)}
                    </div>
                    <EstimationIndicator
                      isEstimated={isFieldEstimated("mass")}
                      fieldName="Mass"
                      confidence={isFieldEstimated("mass") ? "medium" : "high"}
                      source={
                        isFieldEstimated("mass")
                          ? "Calculated from size/composition"
                          : "Measured"
                      }
                    />
                  </div>
                  <div className="text-xs text-blue-200">Mass (kg)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-bold text-white">
                      {Number(selectedAsteroid.velocity).toFixed(4)} km/s
                    </div>
                    <EstimationIndicator
                      isEstimated={isFieldEstimated("velocity")}
                      fieldName="Velocity"
                      confidence={
                        isFieldEstimated("velocity") ? "medium" : "high"
                      }
                      source={
                        selectedAsteroid.source === "nasa"
                          ? "Orbital calculations"
                          : "Measured"
                      }
                    />
                  </div>
                  <div className="text-xs text-blue-200">Velocity</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-bold text-white capitalize">
                      {selectedAsteroid.composition}
                    </div>
                    <EstimationIndicator
                      isEstimated={isFieldEstimated("composition")}
                      fieldName="Composition"
                      confidence={
                        isFieldEstimated("composition") ? "low" : "high"
                      }
                      source={
                        isFieldEstimated("composition")
                          ? "Spectral classification"
                          : "Laboratory analysis"
                      }
                    />
                  </div>
                  <div className="text-xs text-blue-200">Composition</div>
                </div>
              </div>

              <div className="bg-blue-900/10 p-3 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-300">
                      Data Quality
                    </span>
                  </div>
                  <DataSourceBadge source={selectedAsteroid.source} />
                </div>

                <DataCompletenessIndicator
                  asteroid={selectedAsteroid}
                  showDetails={true}
                />

                <div className="mt-3 text-xs">
                  <div className={`${confidence.color} font-medium`}>
                    {confidence.description}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No asteroid selected</div>
              <div className="text-xs text-gray-500">
                Select an asteroid from Mission Control to see real physics
                calculations
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
