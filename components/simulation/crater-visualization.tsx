"use client";

import { Circle, Marker } from "react-leaflet";
import L from "leaflet";

interface CraterVisualizationProps {
  impactLocation: { lat: number; lng: number };
  currentTimeline?: any;
  enhancedResults?: any;
  simulationResults?: any;
}

export default function CraterVisualization({ 
  impactLocation, 
  currentTimeline, 
  enhancedResults,
  simulationResults 
}: CraterVisualizationProps) {
  
  if (!currentTimeline) return null;

  // Calculate actual crater radius in meters
  const craterDiameterKm = enhancedResults?.geological?.craterDiameter || 
                          (simulationResults?.crater?.diameter / 1000) || 
                          1; // Default 1km
  
  const craterRadiusMeters = (craterDiameterKm * 1000) / 2;

  // Create a properly scaled crater icon
  const craterIcon = L.divIcon({
    className: 'crater-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: radial-gradient(circle, #8B4513 0%, #654321 30%, #2F1B14 70%, #000000 100%);
        border: 3px solid #654321;
        box-shadow: 
          inset 0 0 10px rgba(0,0,0,0.8),
          0 0 20px rgba(139,69,19,0.6);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #000000;
          border-radius: 50%;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.9);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return (
    <>
      {/* Crater center marker */}
      <Marker position={[impactLocation.lat, impactLocation.lng]} icon={craterIcon} />
      
      {/* Actual crater circle - shows true scale */}
      <Circle
        center={[impactLocation.lat, impactLocation.lng]}
        radius={craterRadiusMeters}
        pathOptions={{
          fillColor: "#2F1B14",
          fillOpacity: 0.8,
          color: "#654321",
          weight: 2,
          opacity: 1,
        }}
      />
      
      {/* Crater rim - slightly larger */}
      <Circle
        center={[impactLocation.lat, impactLocation.lng]}
        radius={craterRadiusMeters * 1.2}
        pathOptions={{
          fillColor: "#8B4513",
          fillOpacity: 0.4,
          color: "#A0522D",
          weight: 1,
          opacity: 0.8,
        }}
      />
      
      {/* Ejecta field - much larger */}
      <Circle
        center={[impactLocation.lat, impactLocation.lng]}
        radius={craterRadiusMeters * 5}
        pathOptions={{
          fillColor: "#D2B48C",
          fillOpacity: 0.2,
          color: "#CD853F",
          weight: 1,
          opacity: 0.6,
          dashArray: "5, 10",
        }}
      />
      
      {/* Crater info display */}
      <div className="absolute top-4 left-4 bg-amber-900 text-white p-3 rounded-lg shadow-lg z-50">
        <div className="font-bold text-sm">🕳️ IMPACT CRATER</div>
        <div className="text-xs mt-1">
          Diameter: {craterDiameterKm.toFixed(1)} km<br/>
          Depth: {(craterDiameterKm * 0.2).toFixed(1)} km<br/>
          Ejecta radius: {(craterDiameterKm * 2.5).toFixed(1)} km
        </div>
      </div>
    </>
  );
}
