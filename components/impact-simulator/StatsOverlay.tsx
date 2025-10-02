"use client";

import React from "react";

interface StatsOverlayProps {
  data: {
    casualties?: number;
    temperature?: number;
    co2Level?: number;
    sunlightReduction?: number;
    habitability?: number;
    agriculturalCapacity?: number;
  } | null;
  timeYears: number;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({ data, timeYears }) => {
  if (!data) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const formatTime = (years: number): string => {
    if (years < 0) {
      const months = Math.abs(years * 12);
      return `T-${months.toFixed(0)} months`;
    } else if (years === 0) {
      return "IMPACT";
    } else if (years < 1) {
      const months = years * 12;
      return `T+${months.toFixed(1)} months`;
    } else {
      return `T+${years.toFixed(1)} years`;
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="space-y-2 text-sm">
        <div className="text-lg font-bold border-b border-white pb-2 mb-2">
          {formatTime(timeYears)}
        </div>
        
        {data.casualties !== undefined && data.casualties > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Casualties:</span>
            <span className="font-bold text-red-400">{formatNumber(data.casualties)}</span>
          </div>
        )}
        
        {data.temperature !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Global Temp:</span>
            <span className={`font-bold ${data.temperature < 10 ? 'text-blue-400' : 'text-orange-400'}`}>
              {data.temperature.toFixed(1)}°C
            </span>
          </div>
        )}
        
        {data.co2Level !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">CO₂ Level:</span>
            <span className="font-bold text-yellow-400">{data.co2Level.toFixed(0)} ppm</span>
          </div>
        )}
        
        {data.sunlightReduction !== undefined && data.sunlightReduction > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Sunlight:</span>
            <span className="font-bold text-purple-400">
              {(100 - data.sunlightReduction).toFixed(0)}%
            </span>
          </div>
        )}
        
        {data.habitability !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Habitability:</span>
            <span className={`font-bold ${data.habitability > 60 ? 'text-green-400' : data.habitability > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.habitability.toFixed(0)}%
            </span>
          </div>
        )}
        
        {data.agriculturalCapacity !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Agriculture:</span>
            <span className={`font-bold ${data.agriculturalCapacity > 60 ? 'text-green-400' : data.agriculturalCapacity > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.agriculturalCapacity.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
