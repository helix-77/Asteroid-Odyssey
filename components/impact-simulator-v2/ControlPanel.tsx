"use client";

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Asteroid } from '@/lib/types';

interface ControlPanelProps {
  selectedAsteroid: Asteroid | null;
  onAsteroidChange: (asteroid: Asteroid) => void;
  selectedRegion: string;
  onRegionChange: (value: string) => void;
  selectedParameter: 'population' | 'habitability' | 'tsunami' | 'tectonic';
  onParameterChange: (value: 'population' | 'habitability' | 'tsunami' | 'tectonic') => void;
  asteroids: Asteroid[];
}

export function ControlPanel({
  selectedAsteroid,
  onAsteroidChange,
  selectedRegion,
  onRegionChange,
  selectedParameter,
  onParameterChange,
  asteroids
}: ControlPanelProps) {
  return (
    <div className="bg-white border-b border-slate-200 p-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Asteroid Selection */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Asteroid:</label>
          <Select 
            value={selectedAsteroid?.id || ''} 
            onValueChange={(id) => {
              const asteroid = asteroids.find(a => a.id === id);
              if (asteroid) onAsteroidChange(asteroid);
            }}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Select asteroid" />
            </SelectTrigger>
            <SelectContent>
              {asteroids.map(asteroid => (
                <SelectItem key={asteroid.id} value={asteroid.id} className="text-xs">
                  {asteroid.name} ({(asteroid.size || asteroid.diameter || 0)}m)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region Selection */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Region:</label>
          <Select value={selectedRegion} onValueChange={onRegionChange}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Global" className="text-xs">Global</SelectItem>
              <SelectItem value="North America" className="text-xs">North America</SelectItem>
              <SelectItem value="South America" className="text-xs">South America</SelectItem>
              <SelectItem value="Europe" className="text-xs">Europe</SelectItem>
              <SelectItem value="Asia" className="text-xs">Asia</SelectItem>
              <SelectItem value="Africa" className="text-xs">Africa</SelectItem>
              <SelectItem value="Australia" className="text-xs">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parameter Selection */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">View:</label>
          <Select value={selectedParameter} onValueChange={(v) => onParameterChange(v as any)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="population" className="text-xs">Population Density</SelectItem>
              <SelectItem value="habitability" className="text-xs">Habitability</SelectItem>
              <SelectItem value="tsunami" className="text-xs">Tsunami Risk</SelectItem>
              <SelectItem value="tectonic" className="text-xs">Tectonic Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-orange-400 border border-orange-600"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-600 border border-red-800"></div>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
