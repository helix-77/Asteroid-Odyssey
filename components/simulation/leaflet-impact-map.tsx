"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ImpactResults } from "@/lib/calculations/impact";
import type { EnhancedImpactResults } from "@/lib/calculations/enhanced-impact-simulator";
import PopulationHeatmap from "./population-heatmap";
import CountryPopulationDensity from "./country-population-density";
import TsunamiVisualization from "./tsunami-visualization";
import TemperatureVisualization from "./temperature-visualization";
import CraterVisualization from "./crater-visualization";

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface ImpactLocation {
  lat: number;
  lng: number;
  name: string;
  region: string;
  populationDensity: number;
  totalPopulation: number;
}

interface TimelineState {
  time: number;
  craterRadius: number;
  damageRadius: number;
  casualties: number;
  economicDamage: number;
}

interface LeafletImpactMapProps {
  impactLocation: ImpactLocation;
  onLocationChange: (location: ImpactLocation) => void;
  simulationResults: ImpactResults | null;
  enhancedResults: EnhancedImpactResults | null;
  currentTimeline: TimelineState | null;
  currentTimeIndex: number;
  activeFilter: string;
  selectedRegion: string;
  populationData: any[];
  infrastructureData: any[];
}

// Custom icons for different infrastructure types
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const infrastructureIcons = {
  military: createCustomIcon('#dc2626'), // red
  energy: createCustomIcon('#ea580c'), // orange
  cultural: createCustomIcon('#7c3aed'), // purple
  civilian: createCustomIcon('#16a34a'), // green
};

// Impact marker icon
const impactIcon = L.divIcon({
  className: 'impact-marker',
  html: `<div style="
    background-color: #dc2626;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
    position: relative;
  ">
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background-color: white;
      border-radius: 50%;
    "></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Map click handler component
function MapClickHandler({ onLocationChange, populationData }: { 
  onLocationChange: (location: ImpactLocation) => void;
  populationData: any[];
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      // Find nearest population center for realistic data
      let nearestLocation = {
        lat,
        lng,
        name: `Impact Site (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        region: "Unknown",
        populationDensity: 1000, // Default density
        totalPopulation: 500000, // Default population
      };

      // Find the closest population center within reasonable distance
      let minDistance = Infinity;
      populationData.forEach(regionData => {
        regionData.coordinates?.forEach((coord: any) => {
          const distance = Math.sqrt(
            Math.pow(lat - coord.lat, 2) + Math.pow(lng - coord.lng, 2)
          );
          if (distance < minDistance && distance < 5) { // Within ~500km
            minDistance = distance;
            nearestLocation = {
              lat,
              lng,
              name: `Near ${coord.name}`,
              region: regionData.region,
              populationDensity: coord.density,
              totalPopulation: coord.density * 1000, // Estimate based on density
            };
          }
        });
      });

      onLocationChange(nearestLocation);
    },
  });

  return null;
}

// Region bounds for map centering
const regionBounds: Record<string, [[number, number], [number, number]]> = {
  "North America": [[25, -130], [70, -60]],
  "Europe": [[35, -10], [70, 40]],
  "Asia": [[10, 60], [70, 150]],
  "Africa": [[-35, -20], [35, 50]],
  "South America": [[-55, -85], [15, -35]],
  "Oceania": [[-50, 110], [0, 180]],
  "global": [[-60, -180], [85, 180]],
};

// Format time after impact for display
const formatTimeAfterImpact = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  return `${Math.round(seconds / 31536000)} years`;
};

export default function LeafletImpactMap({
  impactLocation,
  onLocationChange,
  simulationResults,
  enhancedResults,
  currentTimeline,
  currentTimeIndex,
  activeFilter,
  selectedRegion,
  populationData,
  infrastructureData,
}: LeafletImpactMapProps) {
  const [worldGeoJSON, setWorldGeoJSON] = useState<any>(null);
  const mapRef = useRef<L.Map>(null);

  // Load world boundaries GeoJSON
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch('/data/world-boundaries-simple.json');
        const data = await response.json();
        setWorldGeoJSON(data);
      } catch (error) {
        console.error('Failed to load world GeoJSON:', error);
        // Fallback: create a simple world outline
        const fallbackData = {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: { name: "World" },
            geometry: {
              type: "Polygon",
              coordinates: [[[-180, -60], [-180, 85], [180, 85], [180, -60], [-180, -60]]]
            }
          }]
        };
        setWorldGeoJSON(fallbackData);
      }
    };
    
    loadWorldData();
  }, []);

  // Update map view when region changes and CONSTRAIN bounds
  useEffect(() => {
    if (mapRef.current && regionBounds[selectedRegion]) {
      const bounds = regionBounds[selectedRegion];
      mapRef.current.fitBounds(bounds);
      
      // Set max bounds to prevent panning outside region
      if (selectedRegion !== "global") {
        mapRef.current.setMaxBounds(bounds);
      } else {
        // Remove constraints for global view
        const globalBounds = regionBounds.global;
        mapRef.current.setMaxBounds(globalBounds);
      }
    }
  }, [selectedRegion]);

  // Get infrastructure markers based on active filter
  const getInfrastructureMarkers = () => {
    if (activeFilter !== "infrastructure") return [];
    
    return infrastructureData.flatMap(category => 
      category.locations?.map((location: any) => ({
        ...location,
        type: category.type,
      })) || []
    );
  };

  // Get population markers based on active filter
  const getPopulationMarkers = () => {
    if (activeFilter !== "casualties") return [];
    
    return populationData.flatMap(regionData => 
      regionData.coordinates?.map((coord: any) => ({
        ...coord,
        region: regionData.region,
      })) || []
    );
  };

  // Get circle color based on active filter
  const getCircleColor = (filter: string): string => {
    switch (filter) {
      case "casualties": return "#dc2626"; // red
      case "infrastructure": return "#ea580c"; // orange
      case "geological": return "#7c2d12"; // brown
      case "climate": return "#1e40af"; // blue
      default: return "#6b7280"; // gray
    }
  };

  // Map bounds based on selected region
  const mapBounds = regionBounds[selectedRegion] || regionBounds.global;
  const center: [number, number] = [
    (mapBounds[0][0] + mapBounds[1][0]) / 2,
    (mapBounds[0][1] + mapBounds[1][1]) / 2,
  ];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={selectedRegion === "global" ? 2 : 4}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
        maxBounds={regionBounds[selectedRegion]}
        maxBoundsViscosity={1.0}
        minZoom={selectedRegion === "global" ? 1 : 3}
        maxZoom={selectedRegion === "global" ? 10 : 8}
      >
        {/* Base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* World boundaries */}
        {worldGeoJSON && (
          <GeoJSON
            data={worldGeoJSON}
            style={{
              fillColor: "transparent",
              weight: 1,
              opacity: 0.6,
              color: "#64748b",
              fillOpacity: 0,
            }}
          />
        )}

        {/* Map click handler */}
        <MapClickHandler 
          onLocationChange={onLocationChange}
          populationData={populationData}
        />

        {/* Impact location marker */}
        <Marker position={[impactLocation.lat, impactLocation.lng]} icon={impactIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{impactLocation.name}</div>
              <div>Region: {impactLocation.region}</div>
              <div>Population Density: {impactLocation.populationDensity.toLocaleString()}/km²</div>
              <div>Total Population: {impactLocation.totalPopulation.toLocaleString()}</div>
            </div>
          </Popup>
        </Marker>

        {/* INCOMING ASTEROID IMAGE - Shows BEFORE simulation runs */}
        {simulationResults && !currentTimeline && (
          <Marker
            position={[impactLocation.lat, impactLocation.lng]}
            icon={L.icon({
              iconUrl: '/incoming_2.png',
              iconSize: [80, 80],
              iconAnchor: [40, 40],
            })}
          />
        )}

        {/* ENHANCED CRATER VISUALIZATION - Properly scaled */}
        <CraterVisualization
          impactLocation={impactLocation}
          currentTimeline={currentTimeline}
          enhancedResults={enhancedResults}
          simulationResults={simulationResults}
        />

        {/* ANIMATED SHOCKWAVE EFFECT */}
        {currentTimeline && currentTimeIndex < 10 && (
          <>
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={currentTimeIndex * 50000} // Rapidly expanding shockwave
              pathOptions={{
                fillColor: "transparent",
                color: "#ff6b6b",
                weight: 3,
                opacity: Math.max(0, 1 - (currentTimeIndex / 10)),
              }}
            />
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={currentTimeIndex * 30000} // Secondary shockwave
              pathOptions={{
                fillColor: "transparent",
                color: "#ffa500",
                weight: 2,
                opacity: Math.max(0, 0.8 - (currentTimeIndex / 10)),
              }}
            />
          </>
        )}

        {/* EJECTA DEBRIS VISUALIZATION */}
        {currentTimeline && currentTimeIndex > 2 && currentTimeIndex < 20 && (
          <Circle
            center={[impactLocation.lat, impactLocation.lng]}
            radius={Math.min(currentTimeIndex * 10000, 200000)} // Ejecta spread
            pathOptions={{
              fillColor: "#8b4513",
              fillOpacity: 0.3 * (1 - currentTimeIndex / 20),
              color: "#654321",
              weight: 1,
              dashArray: "5, 10",
            }}
          />
        )}

        {/* INFRASTRUCTURE DAMAGE VISUALIZATION */}
        {getInfrastructureMarkers().map((infrastructure, index) => {
          const distanceFromImpact = Math.sqrt(
            Math.pow((impactLocation.lat - infrastructure.lat) * 111, 2) + 
            Math.pow((impactLocation.lng - infrastructure.lng) * 111 * Math.cos(infrastructure.lat * Math.PI / 180), 2)
          );
          
          // Calculate damage based on distance and timeline
          let damageLevel = "intact";
          let iconColor = infrastructureIcons[infrastructure.type as keyof typeof infrastructureIcons];
          
          if (currentTimeline && distanceFromImpact <= (currentTimeline.damageRadius / 1000)) {
            const damageSeverity = Math.max(0, 1 - (distanceFromImpact / (currentTimeline.damageRadius / 1000)));
            
            if (damageSeverity > 0.8) {
              damageLevel = "destroyed";
              iconColor = createCustomIcon("#000000"); // Black for destroyed
            } else if (damageSeverity > 0.5) {
              damageLevel = "severe";
              iconColor = createCustomIcon("#7f1d1d"); // Dark red for severe
            } else if (damageSeverity > 0.2) {
              damageLevel = "damaged";
              iconColor = createCustomIcon("#dc2626"); // Red for damaged
            } else {
              damageLevel = "affected";
              iconColor = createCustomIcon("#ea580c"); // Orange for affected
            }
          }
          
          return (
            <Marker
              key={`infra-${index}`}
              position={[infrastructure.lat, infrastructure.lng]}
              icon={iconColor}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{infrastructure.name}</div>
                  <div>Type: {infrastructure.type}</div>
                  <div>Country: {infrastructure.country}</div>
                  <div>Importance: {infrastructure.importance}</div>
                  <div>Distance: {distanceFromImpact.toFixed(0)} km from impact</div>
                  {infrastructure.subtype && (
                    <div>Subtype: {infrastructure.subtype}</div>
                  )}
                  {damageLevel !== "intact" && (
                    <div className={`font-bold mt-2 ${
                      damageLevel === "destroyed" ? "text-black" :
                      damageLevel === "severe" ? "text-red-800" :
                      damageLevel === "damaged" ? "text-red-600" : "text-orange-600"
                    }`}>
                      STATUS: {damageLevel.toUpperCase()}
                    </div>
                  )}
                  {infrastructure.subtype === "nuclear" && damageLevel !== "intact" && (
                    <div className="text-red-800 font-bold">
                      ⚠️ NUCLEAR FACILITY COMPROMISED
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* COUNTRY-WISE POPULATION DENSITY VISUALIZATION */}
        <CountryPopulationDensity
          populationData={populationData}
          currentTimeline={currentTimeline}
          impactLocation={impactLocation}
          activeFilter={activeFilter}
        />

        {/* REAL CONTINUOUS GRADIENT POPULATION HEATMAP */}
        {activeFilter !== 'casualties' && (
          <PopulationHeatmap 
            populationData={populationData}
            currentTimeline={currentTimeline}
            impactLocation={impactLocation}
          />
        )}

        {/* NUCLEAR WINTER / ATMOSPHERIC DARKENING */}
        {currentTimeline && currentTimeIndex > 30 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `rgba(0, 0, 0, ${Math.min(0.6, (currentTimeIndex - 30) / 70)})`, // Gradually darken
              mixBlendMode: 'multiply'
            }}
          />
        )}

        {/* ENHANCED TEMPERATURE VISUALIZATION */}
        <TemperatureVisualization
          impactLocation={impactLocation}
          currentTimeline={currentTimeline}
          currentTimeIndex={currentTimeIndex}
          enhancedResults={enhancedResults}
          activeFilter={activeFilter}
        />

        {/* ENHANCED TSUNAMI VISUALIZATION */}
        <TsunamiVisualization
          impactLocation={impactLocation}
          currentTimeline={currentTimeline}
          currentTimeIndex={currentTimeIndex}
          enhancedResults={enhancedResults}
        />

        {/* FOREST FIRE VISUALIZATION */}
        {currentTimeline && currentTimeline.time > 7200 && ( // After 2 hours
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at ${impactLocation.lat}% ${impactLocation.lng + 180}%, 
                  rgba(239, 68, 68, 0.4) 0%, 
                  rgba(245, 158, 11, 0.3) 15%, 
                  transparent 25%
                )
              `,
              mixBlendMode: 'screen'
            }}
          />
        )}
      </MapContainer>

      {/* Simple instruction - only show if no simulation running */}
      {!simulationResults && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white rounded-lg p-3 shadow-lg z-50">
          <div className="text-sm text-center">
            Click map to set impact location, then run simulation
          </div>
        </div>
      )}
    </div>
  );
}
