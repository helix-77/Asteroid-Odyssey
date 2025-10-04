"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Target,
  Zap,
  Info,
  AlertTriangle,
  Database,
} from "lucide-react";
import {
  calculateKineticEnergy,
  energyToTNT,
  calculateCrater,
  calculateBlastEffects,
} from "@/lib/calculations/impact";
import {
  safeCalculateEnhancedImpact,
  validateAsteroidForCalculations,
  formatCalculationError,
  type CalculationException,
} from "@/lib/calculations/enhanced-impact";
import {
  UnifiedAsteroidData,
  COMPOSITION_DENSITIES,
} from "@/lib/data/asteroid-manager";
import {
  DataCompletenessIndicator,
  EstimationIndicator,
  DataSourceBadge,
  MissingDataWarning,
} from "@/components/ui/data-completeness-indicator";

interface PhysicsShowcaseProps {
  selectedAsteroid?: UnifiedAsteroidData | null;
  showEngineOnly?: boolean;
  showCalculationsOnly?: boolean;
}

interface EnhancedCalculations {
  kineticEnergy: number;
  tntEquivalent: number;
  mass: number;
  velocity: number;
  diameter: number;
  density: number;
  composition: string;
  crater: {
    diameter: number;
    depth: number;
    volume: number;
  };
  effects: {
    fireballRadius: number;
    airblastRadius: number;
    thermalRadiation: number;
    seismicMagnitude: number;
  };
  dataQuality: {
    completeness: number;
    estimatedFields: string[];
    source: string;
  };
}

export function PhysicsShowcase({ selectedAsteroid, showEngineOnly, showCalculationsOnly }: PhysicsShowcaseProps) {
  const [calculations, setCalculations] = useState<EnhancedCalculations | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationErrors, setCalculationErrors] = useState<
    CalculationException[]
  >([]);
  const [calculationWarnings, setCalculationWarnings] = useState<string[]>([]);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // Get composition-specific density with fallback
  const getCompositionDensity = (composition: string): number => {
    const normalizedComposition = composition.toLowerCase();
    return (
      COMPOSITION_DENSITIES[normalizedComposition] ||
      COMPOSITION_DENSITIES.unknown ||
      2500
    );
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

  const runCalculations = async () => {
    if (!selectedAsteroid) {
      return; // Don't run calculations without real asteroid data
    }

    setIsCalculating(true);
    setCalculationErrors([]);
    setCalculationWarnings([]);
    setFallbackUsed(false);

    try {
      // Validate asteroid data before calculations
      const validation = validateAsteroidForCalculations(selectedAsteroid);

      if (!validation.isValid && !validation.canProceedWithFallbacks) {
        setCalculationErrors([
          {
            type: "INVALID_INPUT" as any,
            message: `Cannot calculate: ${validation.errors.join(", ")}`,
            fallbackUsed: false,
            name: "ValidationError",
          } as CalculationException,
        ]);
        setIsCalculating(false);
        return;
      }

      // Perform safe calculations with enhanced error handling
      const result = await safeCalculateEnhancedImpact(
        selectedAsteroid,
        45, // Default impact angle
        {
          populationDensity: 100, // Default population density
          totalPopulation: 1000000, // Default population
          gdpPerCapita: 65000,
          infrastructureValue: 1e12,
        }
      );

      setCalculationErrors(result.errors);
      setCalculationWarnings(result.warnings);
      setFallbackUsed(result.fallbackUsed);

      if (result.results) {
        // Convert enhanced results to our display format
        const enhancedResults = result.results;

        setCalculations({
          kineticEnergy: enhancedResults.kineticEnergy,
          tntEquivalent: enhancedResults.tntEquivalent,
          mass: selectedAsteroid.mass,
          velocity: selectedAsteroid.velocity,
          diameter: selectedAsteroid.diameter,
          density: getCompositionDensity(selectedAsteroid.composition),
          composition: selectedAsteroid.composition,
          crater: enhancedResults.crater,
          effects: enhancedResults.effects,
          dataQuality: {
            completeness: selectedAsteroid.dataCompleteness,
            estimatedFields: selectedAsteroid.estimatedFields,
            source: selectedAsteroid.source,
          },
        });
      } else {
        // Fallback to basic calculations if enhanced calculations fail
        try {
          const mass = selectedAsteroid.mass;
          const velocity = selectedAsteroid.velocity * 1000; // Convert to m/s
          const diameter = selectedAsteroid.diameter;
          const composition = selectedAsteroid.composition;

          // Get composition-specific density
          const density = getCompositionDensity(composition);

          // Calculate basic energy
          const kineticEnergy = calculateKineticEnergy(mass, velocity);
          const tntEquivalent = energyToTNT(kineticEnergy);

          // Calculate crater dimensions using composition-specific parameters
          const crater = calculateCrater(kineticEnergy, 45); // Assume 45-degree impact angle

          // Calculate blast effects
          const effects = calculateBlastEffects(kineticEnergy);

          setCalculations({
            kineticEnergy,
            tntEquivalent,
            mass,
            velocity: velocity / 1000, // Convert back to km/s for display
            diameter,
            density,
            composition,
            crater,
            effects,
            dataQuality: {
              completeness: selectedAsteroid.dataCompleteness,
              estimatedFields: selectedAsteroid.estimatedFields,
              source: selectedAsteroid.source,
            },
          });

          setCalculationWarnings((prev) => [
            ...prev,
            "Using basic calculations due to enhanced calculation failure",
          ]);
          setFallbackUsed(true);
        } catch (basicError) {
          setCalculationErrors((prev) => [
            ...prev,
            {
              type: "CALCULATION_ERROR" as any,
              message: `All calculations failed: ${basicError.message}`,
              fallbackUsed: true,
              name: "BasicCalculationError",
            } as CalculationException,
          ]);
        }
      }
    } catch (error) {
      setCalculationErrors([
        {
          type: "CALCULATION_ERROR" as any,
          message: `Unexpected error: ${error.message || error}`,
          fallbackUsed: false,
          name: "UnexpectedError",
        } as CalculationException,
      ]);
    } finally {
      setIsCalculating(false);
    }
  };

  const confidence = getConfidenceLevel();

  // Render only Physics Engine card for left panel
  if (showEngineOnly) {
    return (
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
                  <div className="font-bold text-white">
                    {Number(selectedAsteroid.diameter).toFixed(1)}m
                  </div>
                  <div className="text-xs text-gray-400">Diameter</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">
                    {(selectedAsteroid.mass / 1e9).toFixed(2)}T
                  </div>
                  <div className="text-xs text-gray-400">Mass (kg)</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">
                    {selectedAsteroid.velocity.toFixed(1)} km/s
                  </div>
                  <div className="text-xs text-gray-400">Velocity</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white capitalize">
                    {selectedAsteroid.composition}
                  </div>
                  <div className="text-xs text-gray-400">Composition</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No asteroid selected</div>
              <div className="text-xs text-gray-500">
                Select an asteroid to see real calculations
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render only Physics Calculations card for right panel  
  if (showCalculationsOnly) {
    return (
      <Card className="space-gradient min-h-[600px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Physics Calculations</CardTitle>
            <Button
              onClick={runCalculations}
              disabled={isCalculating || !selectedAsteroid}
              variant="outline"
              className="text-blue-500 border-blue-500/20 shadow-2xl shadow-blue-200/20"
            >
              {isCalculating ? "Calculating..." : "Calculate Impact"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {calculationErrors.length > 0 && (
            <div className="mb-4 space-y-2">
              {calculationErrors.map((error, index) => {
                const formatted = formatCalculationError(error);
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${formatted.severity === "error"
                      ? "bg-red-900/20 border-red-500/30 text-red-200"
                      : "bg-yellow-900/20 border-yellow-500/30 text-yellow-200"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">{formatted.title}</span>
                    </div>
                    <p className="text-xs mb-2">{formatted.message}</p>
                    {formatted.suggestions.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {formatted.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Content continues with rest of calculations... */}
          {!selectedAsteroid ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No asteroid selected</p>
              <p>Select an asteroid to run physics calculations</p>
            </div>
          ) : isCalculating ? (
            <div className="text-center py-8">
              <p>Running composition-specific physics calculations...</p>
            </div>
          ) : calculations ? (
            <div className="space-y-4">
              {/* Calculation Warnings */}
              {calculationWarnings.length > 0 && (
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Calculation Warnings</span>
                  </div>
                  <ul className="text-xs text-yellow-300 space-y-1">
                    {calculationWarnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Energy Analysis */}
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-red-400" />
                  <h3 className="text-white font-semibold text-lg">Energy Analysis</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-300">Kinetic Energy:</div>
                    <div className="text-2xl font-bold text-red-400">
                      {(calculations.kineticEnergy / 1e15).toFixed(2)}T J
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-300">TNT Equivalent:</div>
                    <div className="text-2xl font-bold text-red-400">
                      {(calculations.tntEquivalent / 1e6).toFixed(2)}B kt TNT
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-3">
                    Based on {calculations.composition} composition (density: {calculations.density} kg/m³)
                  </div>
                </div>
              </div>

              {/* Crater Formation */}
              <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-orange-400" />
                  <h3 className="text-white font-semibold text-lg">Crater Formation</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400">
                      {(calculations.crater.diameter / 1000).toFixed(2)}Km
                    </div>
                    <div className="text-xs text-gray-400">Diameter</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400">
                      {calculations.crater.depth.toFixed(1)}m
                    </div>
                    <div className="text-xs text-gray-400">Depth</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400">
                      {(calculations.crater.volume / 1e9).toFixed(2)}Bm³
                    </div>
                    <div className="text-xs text-gray-400">Volume</div>
                  </div>
                </div>
              </div>

              {/* Blast Effects */}
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h3 className="text-white font-semibold text-lg">Blast Effects</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {(calculations.effects.fireballRadius / 1000).toFixed(2)} km
                    </div>
                    <div className="text-xs text-gray-400">Fireball Radius</div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {(calculations.effects.airblastRadius / 1000).toFixed(2)} km
                    </div>
                    <div className="text-xs text-gray-400">Airblast Radius</div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {(calculations.effects.thermalRadiation / 1000).toFixed(2)} km
                    </div>
                    <div className="text-xs text-gray-400">Thermal Radiation</div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {calculations.effects.seismicMagnitude.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">Seismic Magnitude</div>
                  </div>
                </div>
              </div>

              {/* Calculation Details */}
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-blue-400" />
                  <h3 className="text-white font-semibold text-lg">Calculation Details</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Mass:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {(calculations.mass / 1e12).toFixed(2)}T kg
                      </span>
                      {isFieldEstimated("mass") && (
                        <span className="text-yellow-400 text-xs">●</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Velocity:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {calculations.velocity.toFixed(8)} km/s
                      </span>
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Diameter:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {calculations.diameter.toFixed(10)} m
                      </span>
                      {isFieldEstimated("diameter") && (
                        <span className="text-yellow-400 text-xs">●</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Composition:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold capitalize">
                        {calculations.composition}
                      </span>
                      {isFieldEstimated("composition") && (
                        <span className="text-red-400 text-xs">⚠</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Click "Calculate Impact" to run simulations</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default: Render both cards (original behavior)
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

      <Card className="space-gradient min-h-[600px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Physics Calculations</CardTitle>
            <Button
              onClick={runCalculations}
              disabled={isCalculating || !selectedAsteroid}
              variant="outline"
              className="text-blue-500 border-blue-500/20 shadow-2xl shadow-blue-200/20"

            >
              {isCalculating ? "Calculating..." : "Calculate Impact"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {calculationErrors.length > 0 && (
            <div className="mb-4 space-y-2">
              {calculationErrors.map((error, index) => {
                const formatted = formatCalculationError(error);
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${formatted.severity === "error"
                      ? "bg-red-900/20 border-red-500/30 text-red-200"
                      : "bg-yellow-900/20 border-yellow-500/30 text-yellow-200"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">{formatted.title}</span>
                    </div>
                    <p className="text-xs mb-2">{formatted.message}</p>
                    {formatted.suggestions.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {formatted.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Warning Display */}
          {calculationWarnings.length > 0 && (
            <div className="mb-4">
              <div className="p-3 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Calculation Warnings</span>
                </div>
                <ul className="text-xs space-y-1">
                  {calculationWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Fallback Notice */}
          {fallbackUsed && (
            <div className="mb-4">
              <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-500/30 text-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Fallback Data Used</span>
                </div>
                <p className="text-xs">
                  Some calculations used estimated or default values due to
                  missing asteroid data. Results may have higher uncertainty.
                </p>
              </div>
            </div>
          )}

          {!selectedAsteroid ? (
            <div className="text-center text-white py-8">
              <p>Select an asteroid to run physics calculations</p>
            </div>
          ) : isCalculating ? (
            <div className="text-center text-white py-8">
              <p>Running composition-specific physics calculations...</p>
            </div>
          ) : calculations ? (
            <div className="space-y-4">
              <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-red-400" />
                  <h4 className="font-semibold text-white">Energy Analysis</h4>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <div className="text-xs text-red-200">Kinetic Energy: </div>
                    <div className="font-bold text-red-400">
                      {formatNumber(calculations.kineticEnergy)} J
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <div className="text-xs text-red-200">TNT Equivalent: </div>
                    <div className="font-bold text-red-300">
                      {formatNumber(calculations.tntEquivalent)} kt TNT
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-red-200">
                  Based on {calculations.composition} composition (density:{" "}
                  {calculations.density} kg/m³)
                </div>
              </div>

              <div className="bg-orange-900/5 p-4 rounded-lg border border-orange-500/30 ">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-orange-400" />
                  <h4 className="font-semibold text-white">Crater Formation</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-orange-400">
                      {formatNumber(calculations.crater.diameter)}m
                    </div>
                    <div className="text-orange-200">Diameter</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-400">
                      {formatNumber(calculations.crater.depth)}m
                    </div>
                    <div className="text-orange-200">Depth</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-400">
                      {formatNumber(calculations.crater.volume)}m³
                    </div>
                    <div className="text-orange-200">Volume</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-900/5 p-4 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h4 className="font-semibold text-white">Blast Effects</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-bold text-purple-400">
                      {calculations.effects.fireballRadius.toFixed(2)} km
                    </div>
                    <div className="text-purple-200">Fireball Radius</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-400">
                      {calculations.effects.airblastRadius.toFixed(2)} km
                    </div>
                    <div className="text-purple-200">Airblast Radius</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-400">
                      {calculations.effects.thermalRadiation.toFixed(2)} km
                    </div>
                    <div className="text-purple-200">Thermal Radiation</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-400">
                      {calculations.effects.seismicMagnitude.toFixed(1)}
                    </div>
                    <div className="text-purple-200">Seismic Magnitude</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-400" />
                  <h4 className="font-semibold text-white">
                    Calculation Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs text-blue-200 mb-3">
                  <div className="flex items-center justify-between">
                    <span>Mass:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">
                        {formatNumber(calculations.mass)} kg
                      </span>
                      <EstimationIndicator
                        isEstimated={calculations.dataQuality.estimatedFields.includes(
                          "mass"
                        )}
                        fieldName="Mass"
                        confidence={
                          calculations.dataQuality.estimatedFields.includes(
                            "mass"
                          )
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
                        {calculations.velocity} km/s
                      </span>
                      <EstimationIndicator
                        isEstimated={calculations.dataQuality.estimatedFields.includes(
                          "velocity"
                        )}
                        fieldName="Velocity"
                        confidence={
                          calculations.dataQuality.estimatedFields.includes(
                            "velocity"
                          )
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
                        {calculations.diameter} m
                      </span>
                      <EstimationIndicator
                        isEstimated={calculations.dataQuality.estimatedFields.includes(
                          "diameter"
                        )}
                        fieldName="Diameter"
                        confidence={
                          calculations.dataQuality.estimatedFields.includes(
                            "diameter"
                          )
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
                        {calculations.composition}
                      </span>
                      <EstimationIndicator
                        isEstimated={calculations.dataQuality.estimatedFields.includes(
                          "composition"
                        )}
                        fieldName="Composition"
                        confidence={
                          calculations.dataQuality.estimatedFields.includes(
                            "composition"
                          )
                            ? "low"
                            : "high"
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-blue-200 mb-3">
                  <div className="flex items-center justify-between">
                    <span>Density:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">
                        {calculations.density} kg/m³
                      </span>
                      <EstimationIndicator
                        isEstimated={
                          calculations.dataQuality.estimatedFields.includes(
                            "density"
                          ) ||
                          calculations.dataQuality.estimatedFields.includes(
                            "composition"
                          )
                        }
                        fieldName="Density"
                        confidence={
                          calculations.dataQuality.estimatedFields.includes(
                            "composition"
                          )
                            ? "medium"
                            : "high"
                        }
                        source="Composition-based lookup"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      <span className="text-xs">Calculation Confidence:</span>
                    </div>
                    <DataCompletenessIndicator
                      asteroid={selectedAsteroid!}
                      compact={true}
                    />
                  </div>

                  {calculations.dataQuality.estimatedFields.length > 0 && (
                    <div className="text-xs">
                      <div className="flex items-center gap-1 text-yellow-300">
                        <AlertTriangle className="h-3 w-3" />
                        <span>
                          Results based on{" "}
                          {calculations.dataQuality.estimatedFields.length}{" "}
                          estimated parameter(s)
                        </span>
                      </div>
                      <div className="text-yellow-200 mt-1">
                        Consider using asteroids with higher data completeness
                        for critical analyses.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-white py-8">
              <p>
                Click "Calculate Impact" to run composition-specific physics
                analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
