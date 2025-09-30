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
  Target,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Asteroid, DeflectionStrategy } from "@/lib/types";
import deflectionData from "@/data/deflection_strategies.json";

interface StrategyVisualizerProps {
  selectedAsteroid: Asteroid | null;
  selectedStrategy: DeflectionStrategy | null;
  onStrategySelect: (strategy: DeflectionStrategy) => void;
  deflectionResults: any;
}

interface StrategyEffectiveness {
  strategy: any;
  effectiveness: number;
  suitability: "optimal" | "good" | "fair" | "poor";
  reasons: string[];
}

export function StrategyVisualizer({
  selectedAsteroid,
  selectedStrategy,
  onStrategySelect,
  deflectionResults,
}: StrategyVisualizerProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Transform strategy data
  const transformStrategy = (rawStrategy: any): DeflectionStrategy & { advantages?: string[]; disadvantages?: string[] } => ({
    id: rawStrategy.id,
    name: rawStrategy.name,
    type: rawStrategy.id.includes("kinetic")
      ? "kinetic"
      : rawStrategy.id.includes("nuclear")
      ? "nuclear"
      : rawStrategy.id.includes("gravity")
      ? "gravity"
      : "solar",
    description: rawStrategy.description,
    effectiveness: rawStrategy.success_rate,
    cost: Math.round(rawStrategy.cost / 1000000),
    timeRequired: rawStrategy.lead_time,
    technicalReadiness: rawStrategy.technology_readiness,
    risks: rawStrategy.disadvantages || [],
    advantages: rawStrategy.advantages,
    disadvantages: rawStrategy.disadvantages,
    requirements: {
      mass: rawStrategy.mass_required || 1000,
      power: 100,
      deltaV: (rawStrategy.delta_v || 0.001) * 1000,
    },
  });

  // Analyze strategy effectiveness for selected asteroid
  const strategyAnalysis: StrategyEffectiveness[] = selectedAsteroid
    ? deflectionData.strategies.map((rawStrategy) => {
        const strategy = transformStrategy(rawStrategy);
        
        // Calculate effectiveness based on asteroid properties
        let effectiveness = strategy.effectiveness;
        const reasons: string[] = [];
        let suitability: "optimal" | "good" | "fair" | "poor" = "good";

        // Size considerations
        const asteroidSize = (selectedAsteroid as any).size || 100;
        if (strategy.type === "kinetic") {
          if (asteroidSize > 500) {
            effectiveness *= 0.7;
            reasons.push("Large asteroid reduces kinetic effectiveness");
            suitability = "fair";
          } else if (asteroidSize < 100) {
            effectiveness *= 1.2;
            reasons.push("Small asteroid ideal for kinetic impact");
            suitability = "optimal";
          }
        }

        if (strategy.type === "nuclear") {
          if (asteroidSize > 1000) {
            effectiveness *= 1.1;
            reasons.push("Nuclear effective on large asteroids");
            suitability = "optimal";
          } else if (asteroidSize < 50) {
            effectiveness *= 0.6;
            reasons.push("Overkill for small asteroid");
            suitability = "poor";
          }
        }

        // Warning time considerations
        const warningTime = deflectionResults?.warningTime || 10;
        if (strategy.timeRequired > warningTime) {
          effectiveness *= 0.3;
          reasons.push("Insufficient warning time");
          suitability = "poor";
        }

        // Update suitability based on final effectiveness
        if (effectiveness > 0.8) suitability = "optimal";
        else if (effectiveness > 0.6) suitability = "good";
        else if (effectiveness > 0.4) suitability = "fair";
        else suitability = "poor";

        return {
          strategy,
          effectiveness: Math.min(effectiveness, 1),
          suitability,
          reasons,
        };
      }).sort((a, b) => b.effectiveness - a.effectiveness)
    : [];

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

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case "optimal":
        return "bg-green-600";
      case "good":
        return "bg-blue-600";
      case "fair":
        return "bg-yellow-600";
      case "poor":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case "optimal":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "fair":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "poor":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!selectedAsteroid) {
    return (
      <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Strategy Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-purple-200 py-8">
            Select an asteroid to analyze deflection strategies
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          Strategy Analysis for {selectedAsteroid.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="comparison">Compare</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Top 3 Recommendations */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Top Recommendations</h4>
              {strategyAnalysis.slice(0, 3).map((analysis, index) => (
                <div
                  key={analysis.strategy.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStrategy?.id === analysis.strategy.id
                      ? "border-purple-400 bg-purple-500/20"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => onStrategySelect(analysis.strategy)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-white">
                        #{index + 1}
                      </Badge>
                      {getStrategyIcon(analysis.strategy.type)}
                      <span className="text-white font-medium">
                        {analysis.strategy.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSuitabilityIcon(analysis.suitability)}
                      <Badge className={getSuitabilityColor(analysis.suitability)}>
                        {analysis.suitability}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center">
                      <div className="text-xs text-purple-200">Effectiveness</div>
                      <div className="text-white font-semibold">
                        {(analysis.effectiveness * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-200">Cost</div>
                      <div className="text-white font-semibold">
                        ${analysis.strategy.cost}M
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-200">Time</div>
                      <div className="text-white font-semibold">
                        {analysis.strategy.timeRequired}y
                      </div>
                    </div>
                  </div>

                  <Progress
                    value={analysis.effectiveness * 100}
                    className="h-2 mb-2"
                  />

                  {analysis.reasons.length > 0 && (
                    <div className="text-xs text-purple-200">
                      Key factor: {analysis.reasons[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4 mt-4">
            {selectedStrategy ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  {getStrategyIcon(selectedStrategy.type)}
                  <h4 className="text-white font-semibold text-lg">
                    {selectedStrategy.name}
                  </h4>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2">Description</h5>
                  <p className="text-purple-200 text-sm">{selectedStrategy.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-2">Performance</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-purple-200 text-sm">Effectiveness:</span>
                        <span className="text-white">
                          {(selectedStrategy.effectiveness * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200 text-sm">TRL:</span>
                        <span className="text-white">{selectedStrategy.technicalReadiness}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-2">Resources</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-purple-200 text-sm">Cost:</span>
                        <span className="text-white">${selectedStrategy.cost}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200 text-sm">Lead Time:</span>
                        <span className="text-white">{selectedStrategy.timeRequired}y</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedStrategy as any).advantages && (
                  <div className="bg-green-900/20 rounded-lg p-3">
                    <h5 className="text-green-400 font-medium mb-2">Advantages</h5>
                    <ul className="text-green-200 text-sm list-disc list-inside">
                      {(selectedStrategy as any).advantages.map((advantage: string, i: number) => (
                        <li key={i}>{advantage}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedStrategy as any).disadvantages && (
                  <div className="bg-red-900/20 rounded-lg p-3">
                    <h5 className="text-red-400 font-medium mb-2">Risks & Limitations</h5>
                    <ul className="text-red-200 text-sm list-disc list-inside">
                      {(selectedStrategy as any).disadvantages.map((disadvantage: string, i: number) => (
                        <li key={i}>{disadvantage}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-purple-200 py-8">
                Select a strategy to view detailed analysis
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-white font-semibold">All Strategies</h4>
              {strategyAnalysis.map((analysis) => (
                <div
                  key={analysis.strategy.id}
                  className="bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStrategyIcon(analysis.strategy.type)}
                      <span className="text-white font-medium">
                        {analysis.strategy.name}
                      </span>
                    </div>
                    <Badge className={getSuitabilityColor(analysis.suitability)}>
                      {(analysis.effectiveness * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-purple-200">Cost</div>
                      <div className="text-white">${analysis.strategy.cost}M</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-200">Time</div>
                      <div className="text-white">{analysis.strategy.timeRequired}y</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-200">TRL</div>
                      <div className="text-white">{analysis.strategy.technicalReadiness}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-200">Suitability</div>
                      <div className="text-white">{analysis.suitability}</div>
                    </div>
                  </div>

                  <Progress
                    value={analysis.effectiveness * 100}
                    className="h-1 mt-2"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}