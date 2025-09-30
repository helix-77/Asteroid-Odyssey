"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: any
  ): any;
}

interface PopulationHeatmapProps {
  populationData: any[];
  currentTimeline?: any;
  impactLocation: { lat: number; lng: number };
}

export default function PopulationHeatmap({ 
  populationData, 
  currentTimeline,
  impactLocation 
}: PopulationHeatmapProps) {
  const map = useMap();

  useEffect(() => {
    console.log('PopulationHeatmap effect running', { 
      hasMap: !!map, 
      dataLength: populationData.length,
      hasHeatLayer: !!(L as any).heatLayer 
    });
    
    if (!map || populationData.length === 0) {
      console.log('Heatmap: Missing map or data');
      return;
    }

    // Check if heatLayer is available
    if (!(L as any).heatLayer) {
      console.error('leaflet.heat not loaded!');
      return;
    }

    // Create heatmap data points
    const heatPoints: Array<[number, number, number]> = [];
    
    // Add population centers with intensity based on density
    populationData.forEach(regionData => {
      regionData.coordinates?.forEach((population: any) => {
        // Base intensity from population density - MUCH HIGHER for visibility
        let intensity = Math.min(1, population.density / 5000); // More intense
        
        // If simulation is running, modify intensity based on impact
        if (currentTimeline) {
          const distanceFromImpact = Math.sqrt(
            Math.pow((impactLocation.lat - population.lat) * 111, 2) + 
            Math.pow((impactLocation.lng - population.lng) * 111 * Math.cos(population.lat * Math.PI / 180), 2)
          );
          
          if (distanceFromImpact <= (currentTimeline.damageRadius / 1000)) {
            // Affected areas become darker/hotter
            intensity = 1; // Full intensity for affected areas
          }
        }
        
        // Add multiple points for higher density areas to create better gradient
        const pointCount = Math.ceil(population.density / 1000); // More points
        for (let i = 0; i < pointCount; i++) {
          // Add slight random offset for better gradient effect
          const offsetLat = population.lat + (Math.random() - 0.5) * 0.2;
          const offsetLng = population.lng + (Math.random() - 0.5) * 0.2;
          heatPoints.push([offsetLat, offsetLng, intensity]);
        }
      });
    });

    console.log('Creating heatmap with', heatPoints.length, 'points');

    // Create the heat layer with SUBTLE colors that don't overshadow map
    const heat = (L as any).heatLayer(heatPoints, {
      radius: 25, // MUCH smaller radius - don't cover everything
      blur: 15, // Less blur - more precise
      maxZoom: 17,
      max: 1.0, 
      minOpacity: 0.1, // VERY LOW opacity - let map show through
      gradient: {
        0.0: 'rgba(0, 100, 255, 0)',      // Transparent
        0.2: 'rgba(0, 255, 150, 0.2)',    // Very light
        0.4: 'rgba(150, 255, 0, 0.3)',    // Light  
        0.6: 'rgba(255, 200, 0, 0.4)',    // Medium
        0.8: 'rgba(255, 100, 0, 0.5)',    // Medium-high
        1.0: 'rgba(200, 0, 0, 0.6)'       // Highest but still see-through
      }
    });

    heat.addTo(map);
    console.log('Heatmap added to map');

    // Cleanup on unmount or data change
    return () => {
      map.removeLayer(heat);
    };
  }, [map, populationData, currentTimeline, impactLocation]);

  return null;
}
