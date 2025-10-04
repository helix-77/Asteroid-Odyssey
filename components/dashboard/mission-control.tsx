"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Target,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  asteroidDataManager,
  UnifiedAsteroidData,
} from "@/lib/data/asteroid-manager";
import {
  DataCompletenessIndicator,
  DataSourceBadge,
} from "@/components/ui/data-completeness-indicator";

interface MissionControlProps {
  selectedAsteroid: UnifiedAsteroidData | null;
  onAsteroidSelect: (asteroid: UnifiedAsteroidData | null) => void;
  simulationMode: "tracking" | "impact" | "deflection";
  onModeChange: (mode: "tracking" | "impact" | "deflection") => void;
}

const deflectionStrategies = [
  { id: "kinetic", name: "Kinetic Impactor", cost: 500, successRate: 85 },
  { id: "gravity", name: "Gravity Tractor", cost: 800, successRate: 95 },
  { id: "nuclear", name: "Nuclear Pulse", cost: 1200, successRate: 90 },
];

export default function MissionControl({
  selectedAsteroid,
  onAsteroidSelect,
  simulationMode,
  onModeChange,
}: MissionControlProps) {
  const [asteroids, setAsteroids] = useState<UnifiedAsteroidData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactParams, setImpactParams] = useState({
    size: [150],
    velocity: [15.5],
    angle: [45],
  });
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");

  const parseYear = (value?: string): number | null => {
    if (!value) return null;
    const match = value.match(/\d{4}/);
    if (!match) return null;
    const year = parseInt(match[0], 10);
    return isNaN(year) ? null : year;
  };

  // Load asteroid data on component mount
  useEffect(() => {
    const loadAsteroids = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const asteroidData = await asteroidDataManager.getAllAsteroids();
        const filtered = asteroidData.filter((a) => {
          const year = parseYear(a.nextApproach);
          return year !== null && year >= 2025 && year <= 2070;
        });
        setAsteroids(filtered);

        // Check data quality and show warnings if needed
        const qualityReport = asteroidDataManager.getDataQualityReport();
        if (qualityReport.hasErrors) {
          console.warn(
            "Asteroid data loading had errors:",
            qualityReport.loadErrors
          );
        }
        if (qualityReport.dataSourceBreakdown.fallback > 0) {
          console.warn(
            `Using ${qualityReport.dataSourceBreakdown.fallback} fallback asteroids`
          );
        }
      } catch (err) {
        console.error("Failed to load asteroid data:", err);
        setError(
          err instanceof Error && "type" in err
            ? `Data loading error: ${err.message}`
            : "Failed to load asteroid data. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAsteroids();
  }, []);

  // Retry loading function
  const retryLoading = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await asteroidDataManager.retryDataLoading();
      const asteroidData = await asteroidDataManager.getAllAsteroids();
      const filtered = asteroidData.filter((a) => {
        const year = parseYear(a.nextApproach);
        return year !== null && year >= 2025 && year <= 2070;
      });
      setAsteroids(filtered);
    } catch (err) {
      console.error("Retry failed:", err);
      setError("Retry failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  const handleAsteroidSelect = (asteroidId: string) => {
    const asteroid = asteroids.find((a) => a.id === asteroidId) || null;
    onAsteroidSelect(asteroid);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Asteroid Selector */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            <span>Asteroid Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white mr-2" />
              <span className="text-white">Loading asteroid data...</span>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="text-red-400 text-sm p-4 bg-red-900/20 rounded border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Data Loading Error</span>
                </div>
                <p>{error}</p>
              </div>
              <Button
                onClick={retryLoading}
                variant="outline"
                className="w-full bg-transparent border-red-500/50 text-red-300 hover:bg-red-900/30"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </div>
          ) : (
            <>
              <Select
                value={selectedAsteroid?.id || ""}
                onValueChange={handleAsteroidSelect}
              >
                <SelectTrigger className="space-gradient border-white/20 text-white h-12 rounded-xl px-4">
                  <SelectValue placeholder="Select an asteroid to track">
                    {selectedAsteroid ? selectedAsteroid.name : "Select an asteroid to track"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="space-gradient border-white/20">
                  {asteroids.map((asteroid) => (
                    <SelectItem
                      key={asteroid.id}
                      value={asteroid.id}
                      className="text-white hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start">
                          <span>{asteroid.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <DataSourceBadge source={asteroid.source} />
                            <Badge
                              variant={getThreatColor(asteroid.threatLevel) as any}
                            >
                              {asteroid.threatLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAsteroid && (
                <div className="space-y-3 text-sm">
                  {/* Data Quality Overview */}
                  {/* <div className="p-3 bg-black/30 rounded-lg border border-white/10">
                    <DataCompletenessIndicator
                      asteroid={selectedAsteroid}
                      showDetails={true}
                    />
                  </div> */}

                  {/* Asteroid Properties */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Next Approach:</span>
                      <span className="text-white font-semibold text-xs">
                        {selectedAsteroid.nextApproach}
                      </span>
                    </div>
                  </div>


                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Impact Parameters (shown in impact mode) */}
      {
        simulationMode === "impact" && (
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Target className="h-5 w-5" />
                <span>Impact Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Size (meters)
                </label>
                <Slider
                  value={impactParams.size}
                  onValueChange={(value) =>
                    setImpactParams((prev) => ({ ...prev, size: value }))
                  }
                  max={500}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="text-xs text-gray-200 text-right font-semibold">
                  {impactParams.size[0]}m
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Velocity (km/s)
                </label>
                <Slider
                  value={impactParams.velocity}
                  onValueChange={(value) =>
                    setImpactParams((prev) => ({ ...prev, velocity: value }))
                  }
                  max={30}
                  min={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-gray-200 text-right font-semibold">
                  {impactParams.velocity[0]} km/s
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Impact Angle (degrees)
                </label>
                <Slider
                  value={impactParams.angle}
                  onValueChange={(value) =>
                    setImpactParams((prev) => ({ ...prev, angle: value }))
                  }
                  max={90}
                  min={15}
                  step={5}
                  className="w-full"
                />
                <div className="text-xs text-gray-200 text-right font-semibold">
                  {impactParams.angle[0]}°
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Deflection Strategy (shown in deflection mode) */}
      {
        simulationMode === "deflection" && (
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Shield className="h-5 w-5" />
                <span>Deflection Strategy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedStrategy}
                onValueChange={setSelectedStrategy}
              >
                <SelectTrigger className="bg-black/30 border-white/20 text-white h-12 rounded-xl px-4">
                  <SelectValue placeholder="Choose deflection method" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/20">
                  {deflectionStrategies.map((strategy) => (
                    <SelectItem
                      key={strategy.id}
                      value={strategy.id}
                      className="text-white hover:bg-white/10"
                    >
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedStrategy && (
                <div className="space-y-2 text-sm">
                  {deflectionStrategies
                    .filter((s) => s.id === selectedStrategy)
                    .map((strategy) => (
                      <div key={strategy.id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Cost:</span>
                          <span className="text-white font-semibold">
                            ${strategy.cost}M
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Success Rate:</span>
                          <span className="text-white font-semibold">
                            {strategy.successRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      <Separator className="bg-white/20" />
    </div >
  );
}
