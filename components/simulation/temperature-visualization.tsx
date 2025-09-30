"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

interface TemperatureVisualizationProps {
  impactLocation: { lat: number; lng: number };
  currentTimeline?: any;
  currentTimeIndex: number;
  enhancedResults?: any;
  activeFilter: string;
}

export default function TemperatureVisualization({ 
  impactLocation, 
  currentTimeline, 
  currentTimeIndex,
  enhancedResults,
  activeFilter 
}: TemperatureVisualizationProps) {
  const map = useMap();
  const [temperatureOverlay, setTemperatureOverlay] = useState<string>('');

  useEffect(() => {
    if (!currentTimeline || !enhancedResults || activeFilter !== 'climate') {
      setTemperatureOverlay('');
      return;
    }

    const timeInDays = currentTimeline.time / 86400;
    const maxCooling = Math.abs(enhancedResults.climate?.temperatureChange || 15); // Default 15°C cooling
    
    // Calculate cooling progression
    let coolingIntensity = 0;
    if (timeInDays > 1) { // Cooling starts after 1 day
      coolingIntensity = Math.min(1, (timeInDays - 1) / 30); // Reaches max cooling over 30 days
    }
    
    const currentCooling = coolingIntensity * maxCooling;
    
    // Create temperature gradient overlay
    const centerLat = ((impactLocation.lat + 90) / 180) * 100; // Convert to percentage
    const centerLng = ((impactLocation.lng + 180) / 360) * 100; // Convert to percentage
    
    // Different cooling zones
    const immediateZone = Math.min(0.8, coolingIntensity * 0.9); // Very cold near impact
    const regionalZone = Math.min(0.6, coolingIntensity * 0.7);  // Cold in region
    const globalZone = Math.min(0.4, coolingIntensity * 0.5);    // Mild cooling globally
    
    const gradient = `
      radial-gradient(circle at ${centerLng}% ${centerLat}%, 
        rgba(0, 100, 255, ${immediateZone}) 0%, 
        rgba(50, 150, 255, ${regionalZone}) 20%, 
        rgba(100, 200, 255, ${globalZone}) 40%, 
        rgba(150, 220, 255, ${globalZone * 0.5}) 70%, 
        transparent 100%
      )
    `;
    
    setTemperatureOverlay(gradient);
  }, [currentTimeline, impactLocation, enhancedResults, activeFilter, currentTimeIndex]);

  if (!temperatureOverlay || activeFilter !== 'climate') {
    return null;
  }

  return (
    <>
      {/* Temperature overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: temperatureOverlay,
          mixBlendMode: 'multiply'
        }}
      />
      
      {/* Temperature data display */}
      {currentTimeline && (
        <div className="absolute bottom-4 left-4 bg-blue-900 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="font-bold text-sm">🌡️ TEMPERATURE CHANGE</div>
          <div className="text-xs mt-1">
            Global cooling: -{Math.round((currentTimeline.time / 86400) * 0.5)}°C<br/>
            Impact zone: -{Math.round((currentTimeline.time / 86400) * 2)}°C<br/>
            Nuclear winter: {currentTimeline.time > 2592000 ? 'Active' : 'Developing'}
          </div>
        </div>
      )}
    </>
  );
}
