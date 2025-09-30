"use client";

import { useEffect, useState } from "react";
import { Circle, useMap } from "react-leaflet";

interface TsunamiVisualizationProps {
  impactLocation: { lat: number; lng: number };
  currentTimeline?: any;
  currentTimeIndex: number;
  enhancedResults?: any;
}

export default function TsunamiVisualization({ 
  impactLocation, 
  currentTimeline, 
  currentTimeIndex,
  enhancedResults 
}: TsunamiVisualizationProps) {
  const map = useMap();
  const [tsunamiWaves, setTsunamiWaves] = useState<Array<{
    radius: number;
    opacity: number;
    color: string;
  }>>([]);

  useEffect(() => {
    if (!currentTimeline || !enhancedResults) return;

    // Check if impact is near water (simplified check)
    const isNearWater = Math.abs(impactLocation.lat) < 60; // Most coastlines are within 60° latitude
    
    if (!isNearWater || currentTimeline.time < 1800) { // Wait 30 minutes for tsunami to form
      setTsunamiWaves([]);
      return;
    }

    // Calculate tsunami propagation
    const timeInHours = currentTimeline.time / 3600;
    const tsunamiSpeed = 800; // km/h average tsunami speed
    const maxRadius = timeInHours * tsunamiSpeed * 1000; // Convert to meters

    // Create multiple wave fronts
    const waves = [];
    const waveCount = Math.min(5, Math.floor(timeInHours));
    
    for (let i = 0; i < waveCount; i++) {
      const waveDelay = i * 0.5; // 30-minute intervals between waves
      const waveRadius = Math.max(0, (timeInHours - waveDelay) * tsunamiSpeed * 1000);
      
      if (waveRadius > 0) {
        waves.push({
          radius: waveRadius,
          opacity: Math.max(0.1, 0.6 - (i * 0.1)), // Fade subsequent waves
          color: i === 0 ? '#0066CC' : '#4A90E2', // First wave darker blue
        });
      }
    }

    setTsunamiWaves(waves);
  }, [currentTimeline, impactLocation, enhancedResults]);

  if (!currentTimeline || tsunamiWaves.length === 0) {
    return null;
  }

  return (
    <>
      {tsunamiWaves.map((wave, index) => (
        <Circle
          key={`tsunami-${index}`}
          center={[impactLocation.lat, impactLocation.lng]}
          radius={wave.radius}
          pathOptions={{
            fillColor: "transparent",
            color: wave.color,
            weight: 3,
            opacity: wave.opacity,
            dashArray: index === 0 ? undefined : "10, 5", // Solid line for main wave, dashed for others
          }}
        />
      ))}
      
      {/* Tsunami warning overlay */}
      {tsunamiWaves.length > 0 && (
        <div className="absolute top-4 right-4 bg-blue-900 text-white p-3 rounded-lg shadow-lg z-50 max-w-xs">
          <div className="font-bold text-sm">🌊 TSUNAMI WARNING</div>
          <div className="text-xs mt-1">
            Wave speed: ~800 km/h<br/>
            Max radius: {Math.round(tsunamiWaves[0]?.radius / 1000)} km<br/>
            Time since impact: {Math.round(currentTimeline.time / 3600)}h
          </div>
        </div>
      )}
    </>
  );
}
