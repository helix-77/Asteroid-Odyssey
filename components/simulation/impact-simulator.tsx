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

// Dynamic import for D3 map to avoid SSR issues
const D3ImpactMap = dynamic(() => import("./d3-impact-map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center rounded-lg">
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold">Loading Interactive Map...</div>
        <div className="text-sm text-muted-foreground">
          Initializing D3.js components
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
  
  // Loading and error states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

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
        console.log('Loaded population data:', populationData.population_density_data);
        setAsteroids(asteroidsData.asteroids || []);
        setPopulationData(populationData.population_density_data || []);
        setInfrastructureData(infrastructureData.infrastructure_locations || []);
        setIsLoadingData(false);
        setDataError(null);
      } catch (error) {
        console.error('Failed to load data:', error);
        setDataError('Failed to load simulation data. Using fallback data.');
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
        setIsLoadingData(false);
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

  // Generate GLOBAL IMPACT timeline progression
  const generateTimeline = (results: ImpactResults, enhanced?: EnhancedImpactResults): TimelineState[] => {
    const timeline: TimelineState[] = [];
    const maxTime = 31536000; // 1 YEAR for long-term aftermath
    const steps = 100; // More detailed progression
    
    for (let i = 0; i <= steps; i++) {
      const time = (i / steps) * maxTime;
      const progress = i / steps;
      
      // Enhanced crater growth using geological data
      let craterRadius: number;
      let damageRadius: number;
      let casualties: number;
      let economicDamage: number;
      
      if (enhanced) {
        // GLOBAL IMPACT PROGRESSION over 1 year
        
        // Crater is permanent
        craterRadius = enhanced.geological.craterDiameter * 500;
        
        // GLOBAL EFFECTS that spread across continents
        const globalRadius = 20037508; // Half Earth's circumference in meters
        
        if (progress < 0.001) {
          // First 0.1% (8.7 hours) - Initial impact and immediate effects
          damageRadius = Math.min(enhanced.geological.seismicEffects.damageRadius * 1000, 500000); // Up to 500km
        } else if (progress < 0.01) {
          // Next 0.9% (3.6 days) - Regional devastation spreads
          const regionalProgress = (progress - 0.001) / 0.009;
          damageRadius = 500000 + (2000000 * regionalProgress); // Up to 2000km
        } else if (progress < 0.1) {
          // Next 9% (36 days) - Continental effects
          const continentalProgress = (progress - 0.01) / 0.09;
          damageRadius = 2000000 + (5000000 * continentalProgress); // Up to 5000km
        } else if (progress < 0.5) {
          // Next 40% (146 days) - Global climate effects
          const globalProgress = (progress - 0.1) / 0.4;
          damageRadius = 5000000 + (globalRadius * 0.5 * globalProgress); // Hemisphere
        } else {
          // Final 50% (183 days) - Worldwide aftermath
          const worldwideProgress = (progress - 0.5) / 0.5;
          damageRadius = globalRadius * 0.5 + (globalRadius * 0.5 * worldwideProgress); // Full globe
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
    }, 100); // Very fast animation - 100ms per step for dramatic effect
    
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

  // Format time after impact for display
  const formatTimeAfterImpact = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    return `${Math.round(seconds / 31536000)} years`;
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4 max-h-screen overflow-y-auto">
            {/* Asteroid Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asteroid Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataError && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm mb-2">
                    ⚠️ {dataError}
                  </div>
                )}
                
                {isLoadingData ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading asteroids...</span>
                  </div>
                ) : asteroids.length > 0 ? (
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
                  <div className="text-sm text-red-600">No asteroids available</div>
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
                  disabled={!selectedAsteroid || isSimulating || isLoadingData}
                  className="w-full"
                >
                  {isSimulating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Simulating...</span>
                    </div>
                  ) : isLoadingData ? "Loading..." : "Run Simulation"}
                </Button>

                {isSimulating && (
                  <div className="space-y-2">
                    <Progress value={66} className="w-full" />
                    <div className="text-xs text-center text-muted-foreground">
                      Calculating impact effects...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


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

          {/* Timeline Controls - Sticky Bottom */}
          {timelineState.length > 0 && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <Card className="bg-background/95 backdrop-blur-sm border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-background"
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
                        className="bg-background"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-64">
                      <div className="text-sm font-medium mb-1">
                        {currentTimeline ? formatTimeAfterImpact(currentTimeline.time) : "0 seconds"} after impact
                      </div>
                      <Slider
                        value={[currentTimeIndex]}
                        onValueChange={([value]) => {
                          setCurrentTimeIndex(value);
                          setIsPlaying(false);
                        }}
                        max={timelineState.length - 1}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Step {currentTimeIndex + 1} of {timelineState.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Map Area */}
          <div className="lg:col-span-3 relative">
            <Card className="h-[700px]">
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
                <D3ImpactMap
                  impactLocation={impactLocation}
                  onLocationChange={setImpactLocation}
                  simulationResults={simulationResults}
                  enhancedResults={enhancedResults}
                  currentTimeline={currentTimeline}
                  currentTimeIndex={currentTimeIndex}
                  activeFilter={activeFilter}
                  selectedRegion={selectedRegion}
                  populationData={populationData}
                  infrastructureData={infrastructureData}
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE PANEL - Legends and Data */}
          <div className="lg:col-span-1 max-h-screen overflow-y-auto">
            <div className="space-y-4">
              {/* Climate Data Panel - COMPACT */}
              {currentTimeline && (
                <Card className="bg-gradient-to-br from-blue-900 to-blue-950 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🌡️ Climate Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-blue-200">Global Temp</div>
                      <div className="text-lg font-bold">
                        -{Math.round((currentTimeIndex / 100) * 15)}°C
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-yellow-200">Sunlight</div>
                      <div className="text-lg font-bold">
                        -{Math.round((currentTimeIndex / 100) * 70)}%
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-gray-200">Dust/Debris</div>
                      <div className="text-lg font-bold">
                        +{Math.round((currentTimeIndex / 100) * 95)}%
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-green-200">Agriculture</div>
                      <div className="text-lg font-bold text-red-400">
                        -{Math.round((currentTimeIndex / 100) * 85)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Population Density Legend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🗺️ Map Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold mb-1">Population Density</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-800"></div>
                        <span className="text-xs">Very High (&gt;300/km²)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs">High (150-300/km²)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs">Medium (75-150/km²)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs">Low (25-75/km²)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-xs">Very Low (&lt;25/km²)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold mb-1">Effects</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span className="text-xs">🌊 Tsunami Waves</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                        <span className="text-xs">❄️ Temperature Drop</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-700"></div>
                        <span className="text-xs">🕳️ Impact Crater</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Casualty Counter - COMPACT */}
              {currentTimeline && (
                <Card className="bg-gradient-to-br from-red-900 to-red-950 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💀 Human Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div>
                      <div className="text-xl font-bold">
                        {Math.round(currentTimeline.casualties).toLocaleString()}
                      </div>
                      <div className="text-xs text-red-200">Immediate Deaths</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-300">
                        {Math.round(currentTimeline.casualties * 2.5).toLocaleString()}
                      </div>
                      <div className="text-xs text-orange-200">Injured</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-300">
                        {Math.round(currentTimeline.casualties * 10).toLocaleString()}
                      </div>
                      <div className="text-xs text-yellow-200">Displaced</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Impact Phase - COMPACT */}
              {currentTimeline && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">⏱️ Impact Phase</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm font-bold">
                      {currentTimeIndex < 5 ? "💥 Initial Impact" :
                       currentTimeIndex < 15 ? "🌋 Ejecta Spread" :
                       currentTimeIndex < 30 ? "🔥 Regional Devastation" :
                       currentTimeIndex < 60 ? "🌪️ Global Effects" :
                       "❄️ Nuclear Winter"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      T+{formatTimeAfterImpact(currentTimeline.time)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Damage radius: {(currentTimeline.damageRadius / 1000).toFixed(0)}km
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(currentTimeIndex / 100) * 100}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom padding to prevent timeline controls from covering content */}
        <div className="h-24"></div>
      </div>
    </div>
  );
}
