import { useState, useEffect } from 'react';
import { ImpactMap } from './components/ImpactMap';
import { ImpactStats } from './components/ImpactStats';
import { AsteroidSelector } from './components/AsteroidSelector';
import { SimulationControls } from './components/SimulationControls';
import { LayerControls } from './components/LayerControls';
import { MapLegend } from './components/MapLegend';
import { asteroidData } from './data/asteroids';
import {
  calculateImpact,
  estimateCasualties,
  estimateInfrastructureDamage,
  estimateEconomicDamage,
  estimateClimateEffects,
  type Asteroid,
  type ImpactLocation,
} from './lib/calculations';

export default function App() {
  const [selectedAsteroidId, setSelectedAsteroidId] = useState(asteroidData.asteroids[1].id); // Default to Apophis
  const [impactLocation, setImpactLocation] = useState<ImpactLocation | null>(null);
  const [impactResults, setImpactResults] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0); // 0-100
  const [activeLayer, setActiveLayer] = useState('population');

  const selectedAsteroid = asteroidData.asteroids.find(a => a.id === selectedAsteroidId) as Asteroid;

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !impactLocation) return;

    const interval = setInterval(() => {
      setAnimationProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 0.5; // Slow progression for detailed observation
      });
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [isPlaying, impactLocation]);

  const handleMapClick = (lat: number, lon: number, terrain: 'land' | 'water') => {
    // Mock population density (in reality, would query a database)
    const populationDensity = terrain === 'land' 
      ? Math.random() * 5000 + 100 // 100-5100 per km²
      : 0;

    const location: ImpactLocation = {
      lat,
      lon,
      terrain,
      populationDensity,
      elevation: terrain === 'land' ? 200 : -1000,
    };

    setImpactLocation(location);

    // Calculate impact
    const results = calculateImpact(selectedAsteroid, location);
    
    // Calculate additional effects
    const casualties = estimateCasualties(location, results.airblastRadius, {
      firstDegree: results.thermalRadiusFirstDegree,
      thirdDegree: results.thermalRadiusThirdDegree,
    });
    
    const infrastructure = estimateInfrastructureDamage(
      results.airblastRadius,
      Math.PI * Math.pow(results.airblastRadius.overpressure_5psi, 2)
    );
    
    const economicDamage = estimateEconomicDamage(casualties, results.airblastRadius, location);
    
    const climateEffects = estimateClimateEffects(results.megatonsTNT, results.dustEjected);
    
    // Calculate habitable land lost (simplified)
    const totalDestructionArea = Math.PI * Math.pow(results.airblastRadius.overpressure_5psi, 2);
    const earthLandArea = 148940000; // km²
    const habitableLandLost = Math.min((totalDestructionArea / earthLandArea) * 100, 95);

    setImpactResults({
      ...results,
      casualties,
      infrastructure,
      economicDamage,
      habitableLandLost,
      climateChange: climateEffects,
    });

    // Reset and start animation
    setAnimationProgress(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setImpactLocation(null);
    setImpactResults(null);
    setAnimationProgress(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (value: number) => {
    setAnimationProgress(value);
  };

  const tsunamiGenerated = impactResults?.tsunamiGenerated || false;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Asteroid Impact Simulator</h1>
            <p className="text-sm text-muted-foreground">
              Simulate near-Earth asteroid impacts with scientific accuracy
            </p>
          </div>
          <div className="w-80">
            <AsteroidSelector
              asteroids={asteroidData.asteroids}
              selectedId={selectedAsteroidId}
              onSelect={setSelectedAsteroidId}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          <ImpactMap
            impactLocation={impactLocation}
            craterDiameter={impactResults?.craterDiameter || 0}
            airblastRadii={impactResults?.airblastRadius || null}
            thermalRadius={impactResults?.thermalRadiusThirdDegree || 0}
            seismicRadius={impactResults?.seismicRadius || 0}
            activeLayer={activeLayer}
            showTsunami={tsunamiGenerated}
            animationProgress={animationProgress / 100}
            onMapClick={handleMapClick}
          />
          
          {/* Overlay Controls */}
          <LayerControls activeLayer={activeLayer} onLayerChange={setActiveLayer} />
          <MapLegend showImpactEffects={impactLocation !== null} />

          {/* Instructions */}
          {!impactLocation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl max-w-md">
                <h3 className="font-semibold mb-2">How to Use</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Select an asteroid from the dropdown above</li>
                  <li>Click anywhere on the map to simulate an impact</li>
                  <li>Watch the real-time animation of destruction</li>
                  <li>Review detailed statistics in the sidebar</li>
                </ol>
                <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">⚠️ Scientific Accuracy</p>
                  <p className="text-muted-foreground">
                    Calculations based on NASA NEO assessment models and Earth Impact Effects Program (Collins et al., 2005)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <ImpactStats
          asteroid={selectedAsteroid}
          results={impactResults}
          tsunamiGenerated={tsunamiGenerated}
        />
      </div>

      {/* Timeline Controls */}
      <SimulationControls
        isPlaying={isPlaying}
        progress={animationProgress}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onProgressChange={handleProgressChange}
        hasImpact={impactLocation !== null}
      />
    </div>
  );
}