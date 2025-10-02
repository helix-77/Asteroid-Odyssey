import { useState, useEffect } from 'react';
import { MapVisualization } from './components/MapVisualization';
import { DataSidebar } from './components/DataSidebar';
import { ControlPanel } from './components/ControlPanel';
import { TimelapseControl } from './components/TimelapseControl';

// Dummy asteroid data
const ASTEROIDS = [
  {
    id: 'bennu',
    name: 'Bennu (500m)',
    diameter: 0.5,
    speed: 28,
    impactLat: 40.7128,
    impactLon: -74.0060,
    craterSize: 10,
    energy: 1200,
    baseCasualties: 8500000,
    economicDamage: 15.5
  },
  {
    id: 'apophis',
    name: 'Apophis (370m)',
    diameter: 0.37,
    speed: 30,
    impactLat: 35.6762,
    impactLon: 139.6503,
    craterSize: 7,
    energy: 750,
    baseCasualties: 12000000,
    economicDamage: 22.3
  },
  {
    id: 'chicxulub',
    name: 'Chicxulub-size (10km)',
    diameter: 10,
    speed: 20,
    impactLat: 21.3,
    impactLon: -89.5,
    craterSize: 180,
    energy: 100000,
    baseCasualties: 7500000000,
    economicDamage: 950.0
  },
  {
    id: 'tunguska',
    name: 'Tunguska (60m)',
    diameter: 0.06,
    speed: 27,
    impactLat: 60.8858,
    impactLon: 101.8939,
    craterSize: 0,
    energy: 15,
    baseCasualties: 0,
    economicDamage: 0.1
  },
  {
    id: 'chelyabinsk',
    name: 'Chelyabinsk (20m)',
    diameter: 0.02,
    speed: 19,
    impactLat: 55.1540,
    impactLon: 61.4291,
    craterSize: 0,
    energy: 0.5,
    baseCasualties: 1500,
    economicDamage: 0.03
  },
  {
    id: 'custom-la',
    name: 'Custom - Los Angeles',
    diameter: 1.0,
    speed: 25,
    impactLat: 34.0522,
    impactLon: -118.2437,
    craterSize: 15,
    energy: 2500,
    baseCasualties: 13000000,
    economicDamage: 45.0
  }
];

export default function App() {
  const [selectedAsteroid, setSelectedAsteroid] = useState('bennu');
  const [selectedRegion, setSelectedRegion] = useState('Global');
  const [selectedParameter, setSelectedParameter] = useState<'population' | 'habitability' | 'tsunami' | 'tectonic'>('population');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  const maxTimeStep = 12; // 12 hours simulation

  // Get current asteroid data
  const currentAsteroid = ASTEROIDS.find(a => a.id === selectedAsteroid) || ASTEROIDS[0];

  // Impact location
  const impactLocation = {
    lat: currentAsteroid.impactLat,
    lon: currentAsteroid.impactLon
  };

  // Crater radius based on time (grows over time until reaching full size)
  const craterRadius = timeStep > 0 ? Math.min(currentAsteroid.craterSize * 2, currentAsteroid.craterSize * 0.5 * (1 + timeStep * 0.3)) : 0;

  // Timelapse logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeStep < maxTimeStep) {
      interval = setInterval(() => {
        setTimeStep(prev => Math.min(prev + 1, maxTimeStep));
      }, 1000 / speed);
    } else if (timeStep >= maxTimeStep) {
      setIsPlaying(false);
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeStep, speed, maxTimeStep]);

  const handlePlayPause = () => {
    if (timeStep >= maxTimeStep) {
      setTimeStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeStep(0);
  };

  const handleAsteroidChange = (asteroidId: string) => {
    setSelectedAsteroid(asteroidId);
    handleReset();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 px-4 py-2">
        <h1 className="text-sm text-slate-800">Asteroid Impact Simulator</h1>
      </div>

      {/* Control Panel */}
      <ControlPanel
        selectedAsteroid={selectedAsteroid}
        onAsteroidChange={handleAsteroidChange}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedParameter={selectedParameter}
        onParameterChange={(value) => setSelectedParameter(value as any)}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        asteroids={ASTEROIDS}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 flex flex-col p-3">
          <MapVisualization
            selectedParameter={selectedParameter}
            impactLocation={impactLocation}
            timeStep={timeStep}
            selectedRegion={selectedRegion}
            craterRadius={craterRadius}
            impactData={{}}
          />
          
          {/* Timelapse Control (close to map) */}
          <div className="mt-2">
            <TimelapseControl
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              timeStep={timeStep}
              maxTimeStep={maxTimeStep}
              speed={speed}
              onSpeedChange={setSpeed}
            />
          </div>
        </div>

        {/* Data Sidebar */}
        <DataSidebar
          timeStep={timeStep}
          selectedAsteroid={currentAsteroid}
          impactData={{}}
        />
      </div>
    </div>
  );
}
