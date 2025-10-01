import React from "react";
import asteroidData from "@/data/asteroids.json";
import type { Asteroid } from "@/lib/types";

interface AsteroidSelectorProps {
  onSelect: (asteroid: Asteroid) => void;
  selected: Asteroid | null;
}

export const AsteroidSelector: React.FC<AsteroidSelectorProps> = ({ onSelect, selected }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600" style={{ color: '#4b5563' }}>Select Asteroid:</label>
      <select
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        style={{ color: '#000', backgroundColor: '#fff' }}
        value={selected?.id || ""}
        onChange={(e) => {
          const asteroid = asteroidData.asteroids.find(a => a.id === e.target.value);
          if (asteroid) onSelect(asteroid);
        }}
      >
        <option value="">Choose an asteroid...</option>
        {asteroidData.asteroids.map((asteroid) => (
          <option key={asteroid.id} value={asteroid.id}>
            {asteroid.name} ({asteroid.size || asteroid.diameter}m, {asteroid.composition})
          </option>
        ))}
      </select>
    </div>
  );
};
