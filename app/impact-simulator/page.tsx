"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, RotateCcw } from "lucide-react";
import AsteroidSelector from "@/components/impact-simulator/AsteroidSelector";
import ImpactMap from "@/components/impact-simulator/ImpactMapWrapper";
import ImpactTimeline from "@/components/impact-simulator/ImpactTimeline";
import ImpactDataSidebar from "@/components/impact-simulator/ImpactDataSidebar";
import {
  calculateComprehensiveImpact,
  type ComprehensiveImpactResults,
  type ImpactLocation,
} from "@/lib/calculations/comprehensive-impact";
import { getLocationInfo } from "@/lib/utils/location-data";
import { convertToUnifiedAsteroid } from "@/lib/utils/asteroid-converter";

interface AsteroidData {
  id: string;
  name: string;
  size: number;
  velocity: number;
  mass: number;
  composition: string;
  threat_level: string;
}

export default function ImpactSimulatorPage() {
  const [asteroids, setAsteroids] = useState<AsteroidData[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<AsteroidData | null>(
    null
  );
  const [impactLocation, setImpactLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [impactResults, setImpactResults] =
    useState<ComprehensiveImpactResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load asteroids from JSON
  useEffect(() => {
    const loadAsteroids = async () => {
      try {
        // Import the JSON file directly to avoid fetch issues
        const asteroidsData = await import("@/data/asteroids.json");
        setAsteroids(asteroidsData.asteroids || []);
      } catch (error) {
        console.error("Failed to load asteroids:", error);
        // Fallback to empty array if loading fails
        setAsteroids([]);
      } finally {
        setLoading(false);
      }
    };

    loadAsteroids();
  }, []);

  // Handle location selection
  const handleLocationSelect = (lat: number, lng: number) => {
    setImpactLocation({ lat, lng });
  };

  // Run simulation
  const runSimulation = async () => {
    if (!selectedAsteroid || !impactLocation) return;

    setIsSimulating(true);
    setShowAnimation(true);

    try {
      // Convert to unified asteroid data
      const unifiedAsteroid = convertToUnifiedAsteroid(selectedAsteroid);

      // Get location information
      const locationInfo = getLocationInfo(
        impactLocation.lat,
        impactLocation.lng
      );

      // Calculate comprehensive impact
      const results = calculateComprehensiveImpact(
        unifiedAsteroid,
        locationInfo,
        45
      );

      // Simulate calculation delay for effect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setImpactResults(results);
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Failed to run simulation. Please try again.");
    } finally {
      setIsSimulating(false);
      setTimeout(() => setShowAnimation(false), 3000);
    }
  };

  // Reset simulation
  const resetSimulation = () => {
    setImpactLocation(null);
    setImpactResults(null);
    setShowAnimation(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Asteroid Impact Simulator</h1>
            <p className="text-sm text-muted-foreground">
              Scientifically accurate impact modeling and visualization
            </p>
          </div>
          {impactResults && (
            <Button
              onClick={resetSimulation}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Simulation
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Asteroid Selection */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4 bg-background/50 backdrop-blur">
              <h3 className="font-bold text-lg mb-4">Select Asteroid</h3>
              <AsteroidSelector
                asteroids={asteroids}
                selectedAsteroid={selectedAsteroid}
                onSelect={setSelectedAsteroid}
              />
            </Card>

            {selectedAsteroid && (
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50">
                <h3 className="font-bold text-sm mb-2">Selected Asteroid</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-semibold">{selectedAsteroid.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-semibold">{selectedAsteroid.size}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velocity:</span>
                    <span className="font-semibold">{selectedAsteroid.velocity} km/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Composition:</span>
                    <span className="font-semibold capitalize">{selectedAsteroid.composition}</span>
                  </div>
                </div>
              </Card>
            )}

            {selectedAsteroid && impactLocation && !impactResults && (
              <Button
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-lg py-6"
                size="lg"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Simulating Impact...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Launch Simulation
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Center - Map and Timeline */}
          <div className="lg:col-span-6 space-y-6">
            {/* Map */}
            <Card className="p-4 bg-background/50 backdrop-blur border-2 border-border">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-lg">Impact Visualization</h3>
                {impactResults && (
                  <div className="text-xs text-muted-foreground">
                    Real-time satellite imagery
                  </div>
                )}
              </div>
              <div className="h-[600px] rounded-lg overflow-hidden border-2 border-border/50">
                <ImpactMap
                  impactLocation={impactLocation}
                  onLocationSelect={handleLocationSelect}
                  craterRadius={
                    impactResults?.geological?.crater?.diameter
                      ? impactResults.geological.crater.diameter / 2
                      : undefined
                  }
                  destructionZones={
                    impactResults
                      ? {
                          total:
                            impactResults.geological.impactRegion
                              .totalDestructionRadius,
                          severe:
                            impactResults.geological.impactRegion
                              .severeDestructionRadius,
                          moderate:
                            impactResults.geological.impactRegion
                              .moderateDestructionRadius,
                        }
                      : undefined
                  }
                  showAnimation={showAnimation}
                  tsunamiData={
                    impactResults?.naturalDisasters.tsunami.triggered
                      ? impactResults.naturalDisasters.tsunami
                      : undefined
                  }
                />
              </div>
            </Card>

            {/* Timeline */}
            {impactResults && (
              <ImpactTimeline timeline={impactResults.timeline} />
            )}

            {/* Instructions */}
            {!impactResults && (
              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎯</span> How to Use
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">1.</span>
                    <div>
                      <div className="font-semibold">Select an Asteroid</div>
                      <div className="text-muted-foreground">Choose from real near-Earth asteroids</div>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">2.</span>
                    <div>
                      <div className="font-semibold">Choose Impact Location</div>
                      <div className="text-muted-foreground">Click anywhere on the satellite map</div>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">3.</span>
                    <div>
                      <div className="font-semibold">Launch Simulation</div>
                      <div className="text-muted-foreground">Watch the impact animation and view results</div>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">4.</span>
                    <div>
                      <div className="font-semibold">Explore Timeline</div>
                      <div className="text-muted-foreground">See how effects evolve over time</div>
                    </div>
                  </li>
                </ol>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Impact Data */}
          <div className="lg:col-span-3">
            {impactResults ? (
              <div className="sticky top-4">
                <ImpactDataSidebar results={impactResults} />
              </div>
            ) : (
              <Card className="p-6 bg-background/50 backdrop-blur">
                <h3 className="font-bold text-lg mb-3">Impact Data</h3>
                <p className="text-sm text-muted-foreground">
                  Run a simulation to see detailed impact analysis including:
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Geological destruction</li>
                  <li>• Population casualties</li>
                  <li>• Infrastructure damage</li>
                  <li>• Climate effects</li>
                  <li>• Natural disasters</li>
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <div className="border-t border-border/50 bg-background/30 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-xs text-muted-foreground text-center">
            <p className="font-semibold mb-2">Scientific Accuracy Notice</p>
            <p>
              This simulator uses scientific models and calculations based on
              asteroid impact physics. Results are estimates and actual impacts
              may vary based on numerous factors including atmospheric
              conditions, terrain composition, and asteroid properties. All
              calculations include accuracy indicators (measured, calculated,
              estimated, or probability-based).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
