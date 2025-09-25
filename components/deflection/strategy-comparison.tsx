"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock, DollarSign } from "lucide-react";
import type { Asteroid } from "@/lib/types";
import deflectionData from "@/data/deflection_strategies.json";

interface StrategyComparisonProps {
  selectedAsteroid: Asteroid | null;
}

export function StrategyComparison({
  selectedAsteroid,
}: StrategyComparisonProps) {
  // Map strategy IDs to types
  const getStrategyType = (
    id: string
  ): "kinetic" | "nuclear" | "gravity" | "solar" => {
    if (id.includes("kinetic") || id.includes("impactor")) return "kinetic";
    if (id.includes("nuclear") || id.includes("pulse")) return "nuclear";
    if (id.includes("gravity") || id.includes("tractor")) return "gravity";
    if (id.includes("solar") || id.includes("sail") || id.includes("ion"))
      return "solar";
    return "kinetic"; // default
  };

  // Transform JSON data to match DeflectionStrategy interface
  const transformStrategy = (rawStrategy: any): any => ({
    id: rawStrategy.id,
    name: rawStrategy.name,
    type: getStrategyType(rawStrategy.id),
    description: rawStrategy.description,
    effectiveness: rawStrategy.success_rate || 0.5,
    cost: Math.round((rawStrategy.cost || 0) / 1000000), // Convert to millions
    timeRequired: rawStrategy.lead_time || rawStrategy.mission_duration || 1,
    technicalReadiness: rawStrategy.technology_readiness || 5,
    risks: rawStrategy.disadvantages || [],
    requirements: {
      mass: rawStrategy.mass_required || 1000,
      power: 100, // Default value as it's not in JSON
      deltaV: (rawStrategy.delta_v || 0.001) * 1000, // Convert to m/s
    },
  });

  if (!selectedAsteroid) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Strategy Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select an asteroid to compare deflection strategies
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top strategies based on effectiveness for this asteroid
  const strategies = deflectionData.strategies
    .map(transformStrategy)
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, 4);

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 0.8) return "bg-green-600";
    if (effectiveness >= 0.6) return "bg-yellow-600";
    if (effectiveness >= 0.4) return "bg-orange-600";
    return "bg-red-600";
  };

  const getReadinessColor = (trl: number) => {
    if (trl >= 7) return "bg-green-600";
    if (trl >= 5) return "bg-yellow-600";
    if (trl >= 3) return "bg-orange-600";
    return "bg-red-600";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Strategy Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare deflection options for {selectedAsteroid.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asteroid Characteristics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Target Characteristics</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Diameter: {selectedAsteroid.diameter}m</div>
            <div>Mass: {(selectedAsteroid.mass / 1e12).toFixed(2)}T tons</div>
            <div>Composition: {selectedAsteroid.composition}</div>
            <div>Velocity: {selectedAsteroid.velocity} km/s</div>
          </div>
        </div>

        {/* Strategy Rankings */}
        <div className="space-y-4">
          <h4 className="font-medium">Recommended Strategies</h4>
          {strategies.map((strategy, index) => (
            <div key={strategy.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{strategy.name}</span>
                </div>
                <Badge
                  className={getReadinessColor(strategy.technicalReadiness)}
                >
                  TRL {strategy.technicalReadiness}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Effectiveness</span>
                    <span>{(strategy.effectiveness * 100).toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={strategy.effectiveness * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Cost Efficiency</span>
                    <span>
                      {Math.max(0, 100 - strategy.cost / 10).toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.max(0, 100 - strategy.cost / 10)}
                    className="h-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {strategy.timeRequired} years
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />${strategy.cost}M
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {strategy.type}
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-medium text-green-600 mb-1">
                      Advantages
                    </div>
                    <div className="text-muted-foreground">
                      {strategy.effectiveness > 0.7 && "High success rate"}
                      {strategy.technicalReadiness >= 7 &&
                        ", Proven technology"}
                      {strategy.cost < 1000 && ", Cost effective"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600 mb-1">Risks</div>
                    <div className="text-muted-foreground">
                      {strategy.risks && strategy.risks.length > 0
                        ? strategy.risks[0]
                        : "No major risks identified"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Recommendation */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Recommendation</h4>
          <p className="text-sm text-blue-700">
            For {selectedAsteroid.name}, the{" "}
            <strong>{strategies[0]?.name}</strong> approach offers the best
            balance of effectiveness (
            {(strategies[0]?.effectiveness * 100).toFixed(0)}%) and technical
            readiness (TRL {strategies[0]?.technicalReadiness}). Consider a
            multi-mission approach for critical threats.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
