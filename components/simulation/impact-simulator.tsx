"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, MapPin, Zap, Users, Building, Thermometer } from "lucide-react";
import { calculateImpact, type ImpactParameters, type ImpactResults } from "@/lib/calculations/impact";
import { calculateEnhancedImpact, type EnhancedImpactResults } from "@/lib/calculations/enhanced-impact-simulator";

// Dynamic import for Leaflet map to avoid SSR issues
const LeafletImpactMap = dynamic(() => import("./leaflet-impact-map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center rounded-lg">
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold">Loading Interactive Map...</div>
        <div className="text-sm text-muted-foreground">
          Initializing Leaflet components
        </div>
      </div>
    </div>
  )
});

interface Asteroid {
  id: string;
  name: string;
  size: number;
  velocity: number;
  mass: number;
  composition: string;
  threat_level: string;
  impact_probability: number;
}

interface ImpactLocation {
  lat: number;
  lng: number;
  name: string;
  region: string;
  populationDensity: number;
  totalPopulation: number;
}

interface TimelineState {
  time: number; // seconds after impact
  craterRadius: number;
  damageRadius: number;
  casualties: number;
  economicDamage: number;
}

export function ImpactSimulator() {
  // Core state
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [impactLocation, setImpactLocation] = useState<ImpactLocation>({
    lat: 40.7128,
    lng: -74.006,
    name: "New York City",
    region: "North America",
    populationDensity: 11000,
    totalPopulation: 8500000,
  });
  const [impactAngle, setImpactAngle] = useState([45]);
  const [impactVelocity, setImpactVelocity] = useState([20]);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<ImpactResults | null>(null);
  const [enhancedResults, setEnhancedResults] = useState<EnhancedImpactResults | null>(null);
  const [timelineState, setTimelineState] = useState<TimelineState[]>([]);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>("casualties");
  const [selectedRegion, setSelectedRegion] = useState<string>("global");
  
  // Data
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [populationData, setPopulationData] = useState<any[]>([]);
  const [infrastructureData, setInfrastructureData] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading asteroid data...');
        const [asteroidsRes, populationRes, infrastructureRes] = await Promise.all([
          fetch('/data/asteroids.json'),
          fetch('/data/population_density.json'),
          fetch('/data/infrastructure_locations.json')
        ]);
        
        if (!asteroidsRes.ok) {
          throw new Error(`Failed to load asteroids: ${asteroidsRes.status}`);
        }
        
        const asteroidsData = await asteroidsRes.json();
        const populationData = await populationRes.json();
        const infrastructureData = await infrastructureRes.json();
        
        console.log('Loaded asteroids:', asteroidsData.asteroids);
        setAsteroids(asteroidsData.asteroids || []);
        setPopulationData(populationData.population_density_data || []);
        setInfrastructureData(infrastructureData.infrastructure_locations || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback data if loading fails
        setAsteroids([
          {
            id: "fallback-1",
            name: "Test Asteroid",
            size: 150,
            velocity: 20,
            mass: 1.5e10,
            composition: "stony",
            threat_level: "high",
            impact_probability: 0.001,
          }
        ]);
      }
    };
    
    loadData();
  }, []);

  // Available regions for selection
  const regions = [
    { value: "global", label: "Global View" },
    { value: "North America", label: "North America" },
    { value: "Europe", label: "Europe" },
    { value: "Asia", label: "Asia" },
    { value: "Africa", label: "Africa" },
    { value: "South America", label: "South America" },
    { value: "Oceania", label: "Oceania" },
  ];

  // Filter options for map visualization
  const filterOptions = [
    { value: "casualties", label: "Population Casualties", icon: Users },
    { value: "infrastructure", label: "Infrastructure Damage", icon: Building },
    { value: "geological", label: "Geological Destruction", icon: Zap },
    { value: "climate", label: "Climate Impact", icon: Thermometer },
  ];

  // Run impact simulation
  const runSimulation = async () => {
    if (!selectedAsteroid) return;
    
    setIsSimulating(true);
    setCurrentTimeIndex(0);
    setIsPlaying(false);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate impact parameters
    const impactParams: ImpactParameters = {
      asteroidMass: selectedAsteroid.mass,
      velocity: impactVelocity[0] * 1000, // Convert km/s to m/s
      angle: impactAngle[0],
      density: getDensityByComposition(selectedAsteroid.composition),
      diameter: selectedAsteroid.size,
      composition: selectedAsteroid.composition,
    };
    
    const locationData = {
      populationDensity: impactLocation.populationDensity,
      totalPopulation: impactLocation.totalPopulation,
      gdpPerCapita: 65000,
      infrastructureValue: 1e12,
    };
    
    const results = calculateImpact(impactParams, locationData);
    setSimulationResults(results);
    
    // Calculate enhanced results
    const enhanced = calculateEnhancedImpact(
      selectedAsteroid.mass,
      impactVelocity[0] * 1000, // Convert to m/s
      impactAngle[0],
      selectedAsteroid.composition,
      { lat: impactLocation.lat, lng: impactLocation.lng },
      populationData,
      infrastructureData
    );
    setEnhancedResults(enhanced);
    
    // Generate timeline states
    const timeline = generateTimeline(results, enhanced);
    setTimelineState(timeline);
    
    setIsSimulating(false);
  };

  // Generate ACTUAL WORKING timeline progression
  const generateTimeline = (results: ImpactResults, enhanced?: EnhancedImpactResults): TimelineState[] => {
    const timeline: TimelineState[] = [];
    const maxTime = 3600; // 1 hour 
    const steps = 50; // More steps for VISIBLE animation
    
    for (let i = 0; i <= steps; i++) {
      const time = (i / steps) * maxTime;
      const progress = i / steps;
      
      // Enhanced crater growth using geological data
      let craterRadius: number;
      let damageRadius: number;
      let casualties: number;
      let economicDamage: number;
      
      if (enhanced) {
        // SIMPLE BUT VISIBLE progression that actually changes
        
        // Crater forms instantly but grows slightly over first few frames
        craterRadius = Math.max(100, enhanced.geological.craterDiameter * 500 * (0.5 + progress * 0.5));
        
        // Damage spreads outward in VISIBLE waves
        const baseRadius = 5000; // 5km base
        const maxRadius = Math.max(50000, enhanced.geological.seismicEffects.damageRadius * 1000); // Convert to meters
        
        // Create visible expanding waves
        if (progress < 0.2) {
          // First 20% - immediate blast
          damageRadius = baseRadius + (maxRadius * 0.3 * (progress / 0.2));
        } else if (progress < 0.6) {
          // Next 40% - secondary shockwave
          damageRadius = maxRadius * 0.3 + (maxRadius * 0.4 * ((progress - 0.2) / 0.4));
        } else {
          // Final 40% - full extent
          damageRadius = maxRadius * 0.7 + (maxRadius * 0.3 * ((progress - 0.6) / 0.4));
        }
        
        // Casualties accumulate in waves
        let casualtyProgress = 0;
        if (progress < 0.05) {
          // Immediate casualties from impact (first 6 minutes)
          casualtyProgress = (progress / 0.05) * 0.6; // 60% of casualties immediate
        } else if (progress < 0.2) {
          // Secondary casualties from collapse and fires (next 18 minutes)
          casualtyProgress = 0.6 + ((progress - 0.05) / 0.15) * 0.25; // Additional 25%
        } else {
          // Long-term casualties from injuries and displacement
          casualtyProgress = 0.85 + ((progress - 0.2) / 0.8) * 0.15; // Final 15%
        }
        casualties = enhanced.population.immediateCasualties * casualtyProgress;
        
        // Economic damage assessment over time
        let economicProgress = 0;
        if (progress < 0.1) {
          // Initial damage assessment (first 12 minutes)
          economicProgress = (progress / 0.1) * 0.3; // 30% immediate assessment
        } else if (progress < 0.5) {
          // Detailed damage surveys (next 48 minutes)
          economicProgress = 0.3 + ((progress - 0.1) / 0.4) * 0.5; // Additional 50%
        } else {
          // Full economic impact realization
          economicProgress = 0.8 + ((progress - 0.5) / 0.5) * 0.2; // Final 20%
        }
        economicDamage = enhanced.infrastructure.economic.directDamage * economicProgress;
        
      } else {
        // Fallback to basic calculations
        const craterGrowth = 1 - Math.exp(-progress * 5);
        craterRadius = (results.crater.diameter / 2) * craterGrowth;
        
        const damageGrowth = Math.min(1, progress * 2);
        damageRadius = results.effects.airblastRadius * 1000 * damageGrowth;
        
        const casualtyGrowth = 1 - Math.exp(-progress * 3);
        casualties = results.casualties.immediate * casualtyGrowth;
        
        const economicGrowth = Math.min(1, progress * 1.5);
        economicDamage = results.economicImpact * economicGrowth;
      }
      
      timeline.push({
        time,
        craterRadius,
        damageRadius,
        casualties,
        economicDamage,
      });
    }
    
    return timeline;
  };

  // Get density by composition
  const getDensityByComposition = (composition: string): number => {
    const densities: Record<string, number> = {
      stony: 2700,
      metallic: 7800,
      carbonaceous: 1400,
      "stony-iron": 5300,
      basaltic: 2900,
    };
    return densities[composition] || 2500;
  };

  // ACTUAL WORKING TIMELINE ANIMATION
  useEffect(() => {
    if (!isPlaying || !timelineState.length) return;
    
    const interval = setInterval(() => {
      setCurrentTimeIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= timelineState.length) {
          setIsPlaying(false);
          return timelineState.length - 1; // Stay at last frame
        }
        return nextIndex;
      });
    }, 200); // Faster animation - 200ms per step
    
    return () => clearInterval(interval);
  }, [isPlaying, timelineState.length]);

  // Get threat level color
  const getThreatColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high": return "bg-red-600";
      case "medium": return "bg-orange-600";
      case "low": return "bg-yellow-600";
      default: return "bg-gray-600";
    }
  };

  // Current timeline data
  const currentTimeline = timelineState[currentTimeIndex];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Asteroid Impact Simulator</h1>
          <p className="text-muted-foreground">
            Simulate and visualize asteroid impact effects on Earth
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Asteroid Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asteroid Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {asteroids.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 border rounded bg-background text-foreground"
                      value={selectedAsteroid?.id || ""}
                      onChange={(e) => {
                        const asteroid = asteroids.find(a => a.id === e.target.value);
                        setSelectedAsteroid(asteroid || null);
                      }}
                    >
                      <option value="">Select an asteroid</option>
                      {asteroids.map((asteroid) => (
                        <option key={asteroid.id} value={asteroid.id}>
                          {asteroid.name} ({asteroid.threat_level.toUpperCase()}) - {asteroid.size}m
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading asteroids...</div>
                )}

                {selectedAsteroid && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Size: {selectedAsteroid.size}m</div>
                      <div>Mass: {(selectedAsteroid.mass / 1e9).toFixed(1)}B kg</div>
                      <div>Velocity: {selectedAsteroid.velocity} km/s</div>
                      <div>Type: {selectedAsteroid.composition}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Impact Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impact Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <label className="text-sm font-medium">Region View</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={runSimulation}
                  disabled={!selectedAsteroid || isSimulating}
                  className="w-full"
                >
                  {isSimulating ? "Simulating..." : "Run Simulation"}
                </Button>

                {isSimulating && (
                  <Progress value={66} className="w-full" />
                )}
              </CardContent>
            </Card>

            {/* Timeline Controls */}
            {timelineState.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCurrentTimeIndex(0);
                        setIsPlaying(false);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Time: {currentTimeline ? Math.round(currentTimeline.time / 60) : 0} minutes after impact
                    </label>
                    <Slider
                      value={[currentTimeIndex]}
                      onValueChange={([value]) => {
                        setCurrentTimeIndex(value);
                        setIsPlaying(false); // Stop animation when manually adjusting
                      }}
                      max={timelineState.length - 1}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Step {currentTimeIndex + 1} of {timelineState.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Impact Data Sidebar */}
            {simulationResults && enhancedResults && currentTimeline && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Impact Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="casualties">Casualties</TabsTrigger>
                      <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Crater Diameter:</span>
                        <span className="font-medium">
                          {enhancedResults.geological.craterDiameter.toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Explosion Strength:</span>
                        <span className="font-medium">
                          {enhancedResults.geological.explosionStrength.toFixed(1)} MT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seismic Magnitude:</span>
                        <span className="font-medium">
                          {enhancedResults.geological.seismicEffects.magnitude.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Temperature Change:</span>
                        <span className="font-medium text-blue-600">
                          {enhancedResults.climate.temperatureChange.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Habitable Area Loss:</span>
                        <span className="font-medium text-orange-600">
                          {enhancedResults.climate.habitabilityImpact.habitabilityLoss.toFixed(0)}%
                        </span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="casualties" className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Immediate Deaths:</span>
                        <span className="font-medium text-red-600">
                          {enhancedResults.population.immediateCasualties.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Injured:</span>
                        <span className="font-medium text-orange-600">
                          {enhancedResults.population.injuredCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Displaced:</span>
                        <span className="font-medium text-yellow-600">
                          {enhancedResults.population.displacedPopulation.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Affected:</span>
                        <span className="font-medium">
                          {enhancedResults.population.affectedPopulation.toLocaleString()}
                        </span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="infrastructure" className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Military Facilities:</span>
                        <span className="font-medium text-red-600">
                          {enhancedResults.infrastructure.military.facilitiesDestroyed} destroyed
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nuclear Risk:</span>
                        <span className={`font-medium ${enhancedResults.infrastructure.energy.nuclearFalloutRisk ? 'text-red-600' : 'text-green-600'}`}>
                          {enhancedResults.infrastructure.energy.nuclearFalloutRisk ? 'HIGH' : 'LOW'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy Grid:</span>
                        <span className="font-medium text-orange-600">
                          {enhancedResults.infrastructure.energy.energyGridDisruption.toFixed(0)}% disrupted
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Economic Loss:</span>
                        <span className="font-medium text-red-600">
                          ${(enhancedResults.infrastructure.economic.directDamage / 1e9).toFixed(1)}B
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recovery Time:</span>
                        <span className="font-medium">
                          {enhancedResults.infrastructure.economic.recoveryTime.toFixed(0)} years
                        </span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Impact Visualization</CardTitle>
                  <div className="flex items-center gap-2">
                    {filterOptions.map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <Button
                          key={filter.value}
                          size="sm"
                          variant={activeFilter === filter.value ? "default" : "outline"}
                          onClick={() => setActiveFilter(filter.value)}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {filter.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-full p-0">
                <LeafletImpactMap
                  impactLocation={impactLocation}
                  onLocationChange={setImpactLocation}
                  simulationResults={simulationResults}
                  enhancedResults={enhancedResults}
                  currentTimeline={currentTimeline}
                  activeFilter={activeFilter}
                  selectedRegion={selectedRegion}
                  populationData={populationData}
                  infrastructureData={infrastructureData}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
