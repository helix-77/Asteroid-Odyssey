"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Rocket,
  Zap,
  Magnet,
  Sun,
  AlertTriangle,
  Clock,
  DollarSign,
} from "lucide-react";
import type { DeflectionStrategy, Asteroid } from "@/lib/types";
import deflectionData from "@/data/deflection_strategies.json";

interface StrategySelectorProps {
  selectedAsteroid: Asteroid | null;
  onStrategySelect: (strategy: DeflectionStrategy) => void;
  selectedStrategy: DeflectionStrategy | null;
}

export function StrategySelector({
  selectedAsteroid,
  onStrategySelect,
  selectedStrategy,
}: StrategySelectorProps) {
  const [activeTab, setActiveTab] = useState("kinetic");

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
  const transformStrategy = (rawStrategy: any): DeflectionStrategy => ({
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
        return <Rocket className="h-5 w-5" />;
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 0.8) return "text-green-600";
    if (effectiveness >= 0.6) return "text-yellow-600";
    if (effectiveness >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  const getReadinessColor = (trl: number) => {
    if (trl >= 7) return "bg-green-600";
    if (trl >= 5) return "bg-yellow-600";
    if (trl >= 3) return "bg-orange-600";
    return "bg-red-600";
  };

  const strategiesByType = deflectionData.strategies.reduce(
    (acc, rawStrategy) => {
      const strategy = transformStrategy(rawStrategy);
      if (!acc[strategy.type]) acc[strategy.type] = [];
      acc[strategy.type].push(strategy);
      return acc;
    },
    {} as Record<string, DeflectionStrategy[]>
  );

  if (!selectedAsteroid) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Deflection Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select an asteroid to view deflection options
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Deflection Strategies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a method to deflect {selectedAsteroid.name}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          {Object.entries(strategiesByType).map(([type, strategies]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStrategy?.id === strategy.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onStrategySelect(strategy)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStrategyIcon(strategy.type)}
                      <h4 className="font-semibold">{strategy.name}</h4>
                    </div>
                    <Badge
                      className={getReadinessColor(strategy.technicalReadiness)}
                    >
                      TRL {strategy.technicalReadiness}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {strategy.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Effectiveness
                      </div>
                      <div
                        className={`font-semibold ${getEffectivenessColor(
                          strategy.effectiveness
                        )}`}
                      >
                        {(strategy.effectiveness * 100).toFixed(0)}%
                      </div>
                      <Progress
                        value={strategy.effectiveness * 100}
                        className="h-1 mt-1"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Cost</div>
                      <div className="font-semibold">${strategy.cost}M</div>
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
                  </div>

                  {strategy.risks && strategy.risks.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Key Risks:
                      </div>
                      <div className="text-xs text-red-600">
                        {strategy.risks.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
