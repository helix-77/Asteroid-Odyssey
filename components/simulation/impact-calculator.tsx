"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  calculateImpact,
  type ImpactParameters,
} from "@/lib/calculations/impact";
import type { Asteroid, ImpactResults } from "@/lib/types";

interface ImpactCalculatorProps {
  selectedAsteroid: Asteroid | null;
  onSimulate: (results: ImpactResults) => void;
}

export function ImpactCalculator({
  selectedAsteroid,
  onSimulate,
}: ImpactCalculatorProps) {
  const [impactAngle, setImpactAngle] = useState([45]);
  const [impactVelocity, setImpactVelocity] = useState([20]);
  const [targetLocation, setTargetLocation] = useState({
    lat: 40.7128,
    lng: -74.006,
    name: "New York City",
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<ImpactResults | null>(null);

  const locations = [
    { lat: 40.7128, lng: -74.006, name: "New York City" },
    { lat: 51.5074, lng: -0.1278, name: "London" },
    { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
    { lat: -33.8688, lng: 151.2093, name: "Sydney" },
    { lat: 48.8566, lng: 2.3522, name: "Paris" },
  ];

  const runSimulation = async () => {
    if (!selectedAsteroid) return;

    setIsSimulating(true);

    // Simulate calculation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Calculate asteroid mass from diameter and density
    const diameter = selectedAsteroid.size || selectedAsteroid.diameter;
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const asteroidMass = volume * (selectedAsteroid.density || 3000); // Default density if not provided

    const impactParams: ImpactParameters = {
      asteroidMass,
      velocity: impactVelocity[0] * 1000, // Convert km/s to m/s
      angle: impactAngle[0],
      density: selectedAsteroid.density,
      diameter: diameter,
    };

    // Estimate population data for target location (simplified)
    const locationData = {
      populationDensity: 8000, // people per km²
      totalPopulation: 8500000, // approximate for major cities
      gdpPerCapita: 65000,
      infrastructureValue: 1e12,
    };

    const impactResults = calculateImpact(impactParams, locationData);

    setResults(impactResults);
    onSimulate(impactResults);
    setIsSimulating(false);
  };

  const getThreatLevel = () => {
    if (!selectedAsteroid) return "unknown";
    const diameter = selectedAsteroid.size || selectedAsteroid.diameter;
    if (diameter > 1000) return "extinction";
    if (diameter > 500) return "global";
    if (diameter > 100) return "regional";
    return "local";
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "extinction":
        return "bg-red-600";
      case "global":
        return "bg-orange-600";
      case "regional":
        return "bg-yellow-600";
      case "local":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Impact Calculator
          {selectedAsteroid && (
            <Badge className={getThreatColor(getThreatLevel())}>
              {getThreatLevel().toUpperCase()} THREAT
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!selectedAsteroid ? (
          <div className="text-center text-muted-foreground py-8">
            Select an asteroid to begin impact simulation
          </div>
        ) : (
          <>
            {/* Asteroid Info */}
            <div className="space-y-2">
              <h4 className="font-semibold">{selectedAsteroid.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  Diameter: {selectedAsteroid.size || selectedAsteroid.diameter}
                  m
                </div>
                <div>
                  Mass: {(selectedAsteroid.mass / 1e12).toFixed(2)}T tons
                </div>
                <div>Density: {selectedAsteroid.density || 3000} kg/m³</div>
                <div>Type: {selectedAsteroid.composition}</div>
              </div>
            </div>

            {/* Impact Parameters */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Impact Angle: {impactAngle[0]}°
                </label>
                <Slider
                  value={impactAngle}
                  onValueChange={setImpactAngle}
                  max={90}
                  min={15}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Impact Velocity: {impactVelocity[0]} km/s
                </label>
                <Slider
                  value={impactVelocity}
                  onValueChange={setImpactVelocity}
                  max={50}
                  min={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Target Location</label>
                <select
                  className="w-full mt-2 p-2 border rounded"
                  value={targetLocation.name}
                  onChange={(e) => {
                    const location = locations.find(
                      (l) => l.name === e.target.value
                    );
                    if (location) setTargetLocation(location);
                  }}
                >
                  {locations.map((location) => (
                    <option key={location.name} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulation Button */}
            <Button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full"
            >
              {isSimulating ? "Simulating Impact..." : "Run Impact Simulation"}
            </Button>

            {/* Simulation Progress */}
            {isSimulating && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Calculating impact effects...
                </div>
                <Progress value={66} className="w-full" />
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-red-600">Impact Results</h4>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-red-50 p-3 rounded">
                    <div className="font-medium">Crater Diameter</div>
                    <div className="text-2xl font-bold text-red-600">
                      {(results.crater.diameter / 1000).toFixed(1)} km
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 rounded">
                    <div className="font-medium">Blast Radius</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {results.effects.airblastRadius.toFixed(1)} km
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="font-medium">Energy Released</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {(results.tntEquivalent / 1000).toFixed(1)} MT
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium">Seismic Magnitude</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {results.effects.seismicMagnitude.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Estimated casualties:{" "}
                  {results.casualties.immediate.toLocaleString()}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
