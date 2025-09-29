"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateDeflection,
  compareStrategies,
  calculateLaunchWindow,
} from "@/lib/calculations/deflection";
import type { Asteroid } from "@/lib/types";
import {
  Rocket,
  Zap,
  Magnet,
  Sun,
  AlertTriangle,
  Clock,
  DollarSign,
  Target,
} from "lucide-react";

interface DeflectionCalculatorProps {
  selectedAsteroid: Asteroid | null;
  onCalculate: (results: any) => void;
}

export function DeflectionCalculator({
  selectedAsteroid,
  onCalculate,
}: DeflectionCalculatorProps) {
  const [warningTime, setWarningTime] = useState([10]); // years
  const [impactProbability, setImpactProbability] = useState([0.01]); // 1%
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeStrategy, setActiveStrategy] = useState("kinetic");

  // Define deflection strategies with realistic parameters
  const strategies = {
    kinetic: {
      id: "kinetic_impactor",
      name: "Kinetic Impactor",
      deltaV: 0.001, // m/s
      leadTime: 5, // years
      cost: 5e8, // $500M
      successRate: 0.85,
      massRequired: 500, // kg
      description:
        "High-speed spacecraft impacts asteroid to change trajectory",
    },
    nuclear: {
      id: "nuclear_deflection",
      name: "Nuclear Deflection",
      deltaV: 0.05, // m/s
      leadTime: 3, // years
      cost: 3e9, // $3B
      successRate: 0.75,
      massRequired: 1500, // kg
      description: "Nuclear device detonated near asteroid surface",
    },
    gravity: {
      id: "gravity_tractor",
      name: "Gravity Tractor",
      deltaV: 0.0002, // m/s
      leadTime: 15, // years
      cost: 1.5e9, // $1.5B
      successRate: 0.9,
      massRequired: 800, // kg
      description:
        "Spacecraft uses gravitational attraction to slowly deflect asteroid",
    },
    solar: {
      id: "solar_sail",
      name: "Solar Radiation Pressure",
      deltaV: 0.0001, // m/s
      leadTime: 20, // years
      cost: 8e8, // $800M
      successRate: 0.7,
      massRequired: 200, // kg
      description:
        "Modify asteroid's surface to enhance solar radiation pressure",
    },
  };

  const runDeflectionCalculation = async () => {
    if (!selectedAsteroid) return;

    setIsCalculating(true);

    // Simulate calculation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Convert asteroid data for deflection calculation
    const asteroidForDeflection = {
      mass: selectedAsteroid.mass,
      velocity: selectedAsteroid.velocity * 1000, // Convert km/s to m/s
      size: selectedAsteroid.diameter,
      distanceToEarth: 1.5, // AU (simplified)
      impactProbability: impactProbability[0],
    };

    // Calculate all strategies
    const strategyList = Object.values(strategies);
    const comparison = compareStrategies(
      strategyList,
      asteroidForDeflection,
      warningTime[0]
    );

    // Calculate individual strategy details
    const strategyResults = {};
    for (const [key, strategy] of Object.entries(strategies)) {
      const result = calculateDeflection(
        strategy,
        asteroidForDeflection,
        warningTime[0]
      );
      const launchWindow = calculateLaunchWindow(strategy, warningTime[0]);

      strategyResults[key] = {
        ...result,
        launchWindow,
        strategy,
      };
    }

    const calculationResults = {
      comparison,
      strategies: strategyResults,
      asteroid: asteroidForDeflection,
      warningTime: warningTime[0],
      impactProbability: impactProbability[0],
    };

    setResults(calculationResults);
    onCalculate(calculationResults);
    setIsCalculating(false);
  };

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case "kinetic":
        return <Rocket className="h-5 w-5" />;
      case "nuclear":
        return <Zap className="h-5 w-5" />;
      case "gravity":
        return <Magnet className="h-5 w-5" />;
      case "solar":
        return <Sun className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getSuccessColor = (success: boolean) => {
    return success ? "text-green-600" : "text-red-600";
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    return `$${(value / 1e3).toFixed(0)}K`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Deflection Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!selectedAsteroid ? (
          <div className="text-center text-muted-foreground py-8">
            Select an asteroid to calculate deflection strategies
          </div>
        ) : (
          <>
            {/* Asteroid Info */}
            <div className="space-y-2">
              <h4 className="font-semibold">{selectedAsteroid.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Diameter: {selectedAsteroid.diameter}m</div>
                <div>
                  Mass: {(selectedAsteroid.mass / 1e12).toFixed(2)}T tons
                </div>
                <div>Velocity: {selectedAsteroid.velocity} km/s</div>
                <div>Type: {selectedAsteroid.composition}</div>
              </div>
            </div>

            {/* Mission Parameters */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Warning Time: {warningTime[0]} years
                </label>
                <Slider
                  value={warningTime}
                  onValueChange={setWarningTime}
                  max={30}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Impact Probability: {(impactProbability[0] * 100).toFixed(1)}%
                </label>
                <Slider
                  value={impactProbability}
                  onValueChange={setImpactProbability}
                  max={0.1}
                  min={0.001}
                  step={0.001}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={runDeflectionCalculation}
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating
                ? "Calculating Deflection..."
                : "Calculate Deflection Strategies"}
            </Button>

            {/* Calculation Progress */}
            {isCalculating && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Analyzing deflection options...
                </div>
                <Progress value={75} className="w-full" />
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-purple-600">
                  Deflection Analysis
                </h4>

                <Tabs
                  value={activeStrategy}
                  onValueChange={setActiveStrategy}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="kinetic" className="text-xs">
                      Kinetic
                    </TabsTrigger>
                    <TabsTrigger value="nuclear" className="text-xs">
                      Nuclear
                    </TabsTrigger>
                    <TabsTrigger value="gravity" className="text-xs">
                      Gravity
                    </TabsTrigger>
                    <TabsTrigger value="solar" className="text-xs">
                      Solar
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(results.strategies).map(
                    ([key, strategyResult]: [string, any]) => (
                      <TabsContent key={key} value={key} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {getStrategyIcon(key)}
                            <h5 className="font-semibold">
                              {strategyResult.strategy.name}
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {strategyResult.strategy.description}
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="bg-white p-3 rounded">
                                <div className="font-medium">
                                  Trajectory Change
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {(
                                    strategyResult.trajectoryChange * 1000
                                  ).toFixed(2)}{" "}
                                  mrad
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded">
                                <div className="font-medium">
                                  Impact Reduction
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                  {(
                                    strategyResult.impactProbabilityReduction *
                                    100
                                  ).toFixed(2)}
                                  %
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="bg-white p-3 rounded">
                                <div className="font-medium">
                                  Mission Success
                                </div>
                                <div
                                  className={`text-2xl font-bold ${getSuccessColor(
                                    strategyResult.missionSuccess
                                  )}`}
                                >
                                  {strategyResult.missionSuccess
                                    ? "SUCCESS"
                                    : "RISK"}
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded">
                                <div className="font-medium">
                                  Cost Effectiveness
                                </div>
                                <div className="text-2xl font-bold text-purple-600">
                                  {strategyResult.costEffectiveness.toFixed(0)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium">Cost</div>
                                <div>
                                  {formatCurrency(strategyResult.strategy.cost)}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">Lead Time</div>
                                <div>
                                  {strategyResult.timeToImplement} years
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">Launch Window</div>
                                <div>
                                  {strategyResult.launchWindow.optimal.getFullYear()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {strategyResult.riskFactors.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="font-medium text-red-600 mb-1">
                                Risk Factors:
                              </div>
                              <ul className="text-sm text-red-600 list-disc list-inside">
                                {strategyResult.riskFactors.map(
                                  (risk: string, index: number) => (
                                    <li key={index}>{risk}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    )
                  )}
                </Tabs>

                {/* Strategy Ranking */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-3">
                    Strategy Ranking
                  </h5>
                  <div className="space-y-2">
                    {results.comparison
                      .slice(0, 3)
                      .map((strategy: any, index: number) => (
                        <div
                          key={strategy.strategy.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="font-medium">
                              {strategy.strategy.name}
                            </span>
                          </div>
                          <div className="text-sm text-blue-700">
                            Cost Effectiveness:{" "}
                            {strategy.costEffectiveness.toFixed(0)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
