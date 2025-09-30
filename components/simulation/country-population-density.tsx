"use client";

import { useEffect, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";

interface CountryPopulationDensityProps {
  populationData: any[];
  currentTimeline?: any;
  impactLocation: { lat: number; lng: number };
  activeFilter: string;
}

// Country population density data (simplified for demo)
const COUNTRY_POPULATION_DENSITY = {
  "United States": 36,
  "Canada": 4,
  "Mexico": 66,
  "Brazil": 25,
  "Argentina": 16,
  "United Kingdom": 281,
  "France": 119,
  "Germany": 240,
  "Italy": 206,
  "Spain": 94,
  "Russia": 9,
  "China": 153,
  "India": 464,
  "Japan": 347,
  "Australia": 3,
  "South Africa": 49,
  "Egypt": 103,
  "Nigeria": 226,
  "Kenya": 94,
  "Morocco": 83,
};

export default function CountryPopulationDensity({ 
  populationData, 
  currentTimeline,
  impactLocation,
  activeFilter 
}: CountryPopulationDensityProps) {
  const map = useMap();
  const [worldGeoJSON, setWorldGeoJSON] = useState<any>(null);

  // Load world boundaries GeoJSON
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch('/data/world-boundaries-simple.json');
        const data = await response.json();
        setWorldGeoJSON(data);
      } catch (error) {
        console.error('Failed to load world GeoJSON:', error);
      }
    };
    
    loadWorldData();
  }, []);

  // Get color based on population density
  const getPopulationDensityColor = (density: number): string => {
    if (density > 300) return '#8B0000'; // Dark red - very high
    if (density > 150) return '#DC143C'; // Red - high  
    if (density > 75) return '#FF6347';  // Orange-red - medium-high
    if (density > 25) return '#FFA500';  // Orange - medium
    if (density > 10) return '#FFD700';  // Gold - low-medium
    return '#90EE90'; // Light green - low
  };

  // Get opacity based on impact effects
  const getOpacity = (countryName: string): number => {
    if (!currentTimeline || activeFilter !== 'casualties') return 0.6;
    
    // Calculate if this country is affected by the impact
    // This is a simplified calculation - in reality you'd need more precise country boundary checks
    const density = COUNTRY_POPULATION_DENSITY[countryName as keyof typeof COUNTRY_POPULATION_DENSITY] || 50;
    
    // Countries with higher population density show more prominently during casualty filter
    return Math.min(0.8, 0.3 + (density / 500));
  };

  // Style function for GeoJSON
  const geoJSONStyle = (feature: any) => {
    const countryName = feature.properties.name;
    const density = COUNTRY_POPULATION_DENSITY[countryName as keyof typeof COUNTRY_POPULATION_DENSITY] || 50;
    
    let fillColor = getPopulationDensityColor(density);
    let opacity = getOpacity(countryName);
    
    // Special styling during simulation
    if (currentTimeline && activeFilter === 'casualties') {
      // Calculate distance from impact to country (simplified)
      const tempGeoJSON = L.geoJSON(feature);
      const countryBounds = tempGeoJSON.getBounds();
      const countryCenter = countryBounds.getCenter();
      const distance = map.distance([impactLocation.lat, impactLocation.lng], [countryCenter.lat, countryCenter.lng]);
      
      // Countries closer to impact show more intense colors
      if (distance < currentTimeline.damageRadius) {
        fillColor = '#FF0000'; // Bright red for heavily affected
        opacity = 0.8;
      } else if (distance < currentTimeline.damageRadius * 2) {
        fillColor = '#FF4500'; // Orange-red for moderately affected
        opacity = 0.6;
      }
    }
    
    return {
      fillColor,
      weight: 1,
      opacity: 0.8,
      color: '#333333',
      fillOpacity: opacity,
    };
  };

  // Only render if we have data and the casualties filter is active
  if (!worldGeoJSON || activeFilter !== 'casualties') {
    return null;
  }

  return (
    <GeoJSON
      data={worldGeoJSON}
      style={geoJSONStyle}
      onEachFeature={(feature, layer) => {
        const countryName = feature.properties.name;
        const density = COUNTRY_POPULATION_DENSITY[countryName as keyof typeof COUNTRY_POPULATION_DENSITY] || 'Unknown';
        
        layer.bindPopup(`
          <div class="text-sm">
            <div class="font-semibold">${countryName}</div>
            <div>Population Density: ${density} people/km²</div>
            ${currentTimeline ? `<div class="mt-2 font-bold text-red-600">Impact Effects: ${
              layer.getBounds().contains([impactLocation.lat, impactLocation.lng]) ? 'DIRECT HIT' : 'Secondary Effects'
            }</div>` : ''}
          </div>
        `);
      }}
    />
  );
}
