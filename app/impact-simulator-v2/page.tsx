"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ControlPanel } from '@/components/impact-simulator-v2/ControlPanel';
import { DataSidebar } from '@/components/impact-simulator-v2/DataSidebar';
import { TimelapseControl } from '@/components/impact-simulator-v2/TimelapseControl';
import { calculateEnhancedImpactEffects } from '@/lib/calculations/enhanced-impact-calculator';
import { TemporalEffectsCalculator } from '@/lib/calculations/impact/temporal-effects';
import type { Asteroid } from '@/lib/types';
import type { ImpactParameters, TemporalEffects, CountryData, InfrastructurePoint } from '@/lib/calculations/impact/types';

// Dynamic import for map to avoid SSR issues
const MapVisualization = dynamic(
  () => import('@/components/impact-simulator-v2/MapVisualization').then(mod => ({ default: mod.MapVisualization })),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 animate-pulse" /> }
);

export default function ImpactSimulatorV2Page() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('Global');
  const [selectedParameter, setSelectedParameter] = useState<'population' | 'habitability' | 'tsunami' | 'tectonic'>('population');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [impactLocation, setImpactLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [impactData, setImpactData] = useState<TemporalEffects | null>(null);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructurePoint[]>([]);

  const maxTimeStep = 100; // Represents 50 years

  // Load data
  useEffect(() => {
    // Load asteroids
    fetch('/data/asteroids.json')
      .then(res => res.json())
      .then(data => {
        const loadedAsteroids = data.asteroids || [];
        setAsteroids(loadedAsteroids);
        if (loadedAsteroids.length > 0) {
          setSelectedAsteroid(loadedAsteroids[0]);
        }
      })
      .catch(err => console.error('Failed to load asteroids:', err));

    // Load countries
    fetch('/data/world_data.json')
      .then(res => res.json())
      .then(data => setCountries(data.countries || []))
      .catch(err => console.error('Failed to load countries:', err));

    // Load infrastructure
    fetch('/data/enhanced_infrastructure.json')
      .then(res => res.json())
      .then(data => setInfrastructure(data.infrastructure || []))
      .catch(err => console.error('Failed to load infrastructure:', err));
  }, []);

  // Calculate impact effects when parameters change
  useEffect(() => {
    if (!selectedAsteroid || !impactLocation) {
      setImpactData(null);
      return;
    }

    try {
      // Get composition density
      const getDensity = (composition: string): number => {
        switch(composition.toLowerCase()) {
          case 'stony': return 3000;
          case 'iron': case 'metallic': return 7800;
          case 'carbonaceous': return 2000;
          case 'stony-iron': return 5000;
          case 'basaltic': return 2900;
          default: return 3000;
        }
      };

      const params: ImpactParameters = {
        asteroidDiameter: selectedAsteroid.size || selectedAsteroid.diameter || 100,
        velocity: selectedAsteroid.velocity,
        density: selectedAsteroid.density || getDensity(selectedAsteroid.composition),
        impactAngle: 45,
        targetType: 'land',
        latitude: impactLocation.lat,
        longitude: impactLocation.lng
      };

      // Calculate base impact effects
      const baseEffects = calculateEnhancedImpactEffects(params);

      // Calculate temporal effects
      const calculator = new TemporalEffectsCalculator(
        params,
        baseEffects,
        countries,
        infrastructure
      );

      // Convert timeStep (0-100) to years (-0.5 to 50)
      const timeYears = (timeStep / maxTimeStep) * 50.5 - 0.5;
      const effects = calculator.calculateEffectsAtTime(timeYears);

      setImpactData(effects);
    } catch (error) {
      console.error('Error calculating impact effects:', error);
    }
  }, [selectedAsteroid, impactLocation, timeStep, countries, infrastructure, maxTimeStep]);

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
    if (!impactLocation) {
      alert('Please select an impact location on the map first');
      return;
    }
    if (timeStep >= maxTimeStep) {
      setTimeStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeStep(0);
  };

  const handleAsteroidChange = (asteroid: Asteroid) => {
    setSelectedAsteroid(asteroid);
    handleReset();
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!selectedAsteroid) {
      alert('Please select an asteroid first');
      return;
    }
    setImpactLocation({ lat, lng });
    handleReset();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 px-4 py-2">
        <h1 className="text-sm text-slate-800 font-medium">Asteroid Impact Simulator</h1>
      </div>

      {/* Control Panel */}
      <ControlPanel
        selectedAsteroid={selectedAsteroid}
        onAsteroidChange={handleAsteroidChange}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedParameter={selectedParameter}
        onParameterChange={setSelectedParameter}
        asteroids={asteroids}
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
            asteroid={selectedAsteroid}
            impactData={impactData}
            onMapClick={handleMapClick}
            countries={countries}
            infrastructure={infrastructure}
          />
          
          {/* Timelapse Control */}
          <div className="mt-2">
            <TimelapseControl
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              timeStep={timeStep}
              maxTimeStep={maxTimeStep}
              speed={speed}
              onSpeedChange={setSpeed}
              disabled={!impactLocation}
            />
          </div>
        </div>

        {/* Data Sidebar */}
        <DataSidebar
          timeStep={timeStep}
          selectedAsteroid={selectedAsteroid}
          impactData={impactData}
          impactLocation={impactLocation}
        />
      </div>
    </div>
  );
}
