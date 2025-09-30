"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ImpactResults } from "@/lib/calculations/impact";
import type { EnhancedImpactResults } from "@/lib/calculations/enhanced-impact-simulator";

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

  // Update map view when region changes
  useEffect(() => {
    if (mapRef.current && regionBounds[selectedRegion]) {
      const bounds = regionBounds[selectedRegion];
      mapRef.current.fitBounds(bounds);
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

        {/* ACTUAL WORKING CRATER VISUALIZATION */}
        {currentTimeline && (
          <Circle
            center={[impactLocation.lat, impactLocation.lng]}
            radius={currentTimeline.craterRadius}
            pathOptions={{
              fillColor: "#8B0000",
              fillOpacity: 0.9,
              color: "#FF0000",
              weight: 3,
            }}
          />
        )}

        {/* GLOBAL IMPACT ZONES THAT EXPAND OVER TIME */}
        {currentTimeline && (
          <>
            {/* Immediate devastation zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={Math.min(currentTimeline.damageRadius * 0.1, 500000)}
              pathOptions={{
                fillColor: "#7f1d1d",
                fillOpacity: 0.8,
                color: "#dc2626",
                weight: 3,
              }}
            />
            
            {/* Regional destruction zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={Math.min(currentTimeline.damageRadius * 0.4, 2000000)}
              pathOptions={{
                fillColor: getCircleColor(activeFilter),
                fillOpacity: 0.5,
                color: getCircleColor(activeFilter),
                weight: 2,
              }}
            />
            
            {/* Continental effects zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={Math.min(currentTimeline.damageRadius * 0.7, 5000000)}
              pathOptions={{
                fillColor: getCircleColor(activeFilter),
                fillOpacity: 0.3,
                color: getCircleColor(activeFilter),
                weight: 1,
              }}
            />
            
            {/* Global effects zone - can cover entire hemisphere */}
            {currentTimeline.damageRadius > 5000000 && (
              <Circle
                center={[impactLocation.lat, impactLocation.lng]}
                radius={currentTimeline.damageRadius}
                pathOptions={{
                  fillColor: activeFilter === "climate" ? "#1e40af" : getCircleColor(activeFilter),
                  fillOpacity: 0.15,
                  color: activeFilter === "climate" ? "#3b82f6" : getCircleColor(activeFilter),
                  weight: 1,
                  dashArray: "10, 5",
                }}
              />
            )}
          </>
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

        {/* GLOBAL POPULATION DENSITY VISUALIZATION */}
        {populationData.map((regionData, regionIndex) => 
          regionData.coordinates?.map((population: any, index: number) => {
            const distanceFromImpact = Math.sqrt(
              Math.pow((impactLocation.lat - population.lat) * 111, 2) + 
              Math.pow((impactLocation.lng - population.lng) * 111 * Math.cos(population.lat * Math.PI / 180), 2)
            );
            
            // Calculate impact effects based on timeline
            let impactSeverity = 0;
            let populationStatus = "normal";
            
            if (currentTimeline && distanceFromImpact <= (currentTimeline.damageRadius / 1000)) {
              impactSeverity = Math.max(0, 1 - (distanceFromImpact / (currentTimeline.damageRadius / 1000)));
              
              if (impactSeverity > 0.8) populationStatus = "destroyed";
              else if (impactSeverity > 0.5) populationStatus = "severe";
              else if (impactSeverity > 0.2) populationStatus = "moderate";
              else populationStatus = "affected";
            }
            
            // Color coding based on impact severity and filter
            let fillColor = "#fbbf24"; // Default yellow
            let opacity = 0.4;
            
            if (activeFilter === "casualties") {
              switch (populationStatus) {
                case "destroyed": fillColor = "#7f1d1d"; opacity = 0.9; break; // Dark red
                case "severe": fillColor = "#dc2626"; opacity = 0.8; break; // Red
                case "moderate": fillColor = "#ea580c"; opacity = 0.7; break; // Orange
                case "affected": fillColor = "#eab308"; opacity = 0.6; break; // Yellow
                default: fillColor = "#22c55e"; opacity = 0.3; break; // Green
              }
            } else if (activeFilter === "infrastructure") {
              // Show infrastructure damage
              fillColor = impactSeverity > 0.3 ? "#dc2626" : "#fbbf24";
              opacity = impactSeverity > 0.3 ? 0.8 : 0.3;
            } else if (activeFilter === "climate") {
              // Show climate effects (global)
              const globalEffect = currentTimeline ? Math.min(1, currentTimeline.damageRadius / 10000000) : 0;
              fillColor = globalEffect > 0.1 ? "#1e40af" : "#fbbf24";
              opacity = globalEffect > 0.1 ? 0.6 : 0.3;
            }
            
            return (
              <Circle
                key={`pop-${regionIndex}-${index}`}
                center={[population.lat, population.lng]}
                radius={Math.sqrt(population.density) * 30 + (impactSeverity * 50)}
                pathOptions={{
                  fillColor: fillColor,
                  fillOpacity: opacity,
                  color: populationStatus === "normal" ? "#f59e0b" : "#dc2626",
                  weight: populationStatus === "normal" ? 1 : 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{population.name}</div>
                    <div>Region: {regionData.region}</div>
                    <div>Population Density: {population.density.toLocaleString()}/km²</div>
                    <div>Distance from Impact: {distanceFromImpact.toFixed(0)} km</div>
                    {populationStatus !== "normal" && (
                      <>
                        <div className={`font-bold ${populationStatus === "destroyed" ? "text-red-800" : "text-orange-600"}`}>
                          Status: {populationStatus.toUpperCase()}
                        </div>
                        <div className="text-red-600">
                          Impact Severity: {(impactSeverity * 100).toFixed(0)}%
                        </div>
                        <div className="text-red-600">
                          Est. Casualties: {Math.round(population.density * 100 * impactSeverity).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Circle>
            );
          })
        )}
      </MapContainer>

      {/* GLOBAL IMPACT LEGEND */}
      {currentTimeline && (
        <div className="absolute bottom-4 left-4 bg-black/90 text-white rounded-lg p-3 shadow-lg max-w-xs">
          <div className="text-sm font-bold mb-2">Global Impact Zones</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-800"></div>
              <span>Crater (Permanent)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-700"></div>
              <span>Total Devastation (&lt;500km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCircleColor(activeFilter) }}></div>
              <span>Regional Destruction (&lt;2000km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: getCircleColor(activeFilter) }}></div>
              <span>Continental Effects (&lt;5000km)</span>
            </div>
            {currentTimeline.damageRadius > 5000000 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full opacity-30" style={{ backgroundColor: activeFilter === "climate" ? "#3b82f6" : getCircleColor(activeFilter) }}></div>
                <span>Global Effects</span>
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs">
              <div>Time: {formatTimeAfterImpact(currentTimeline.time)}</div>
              <div>Affected Radius: {(currentTimeline.damageRadius / 1000).toFixed(0)} km</div>
            </div>
          </div>
        </div>
      )}

      {/* Simple instruction */}
      {!currentTimeline && (
        <div className="absolute top-4 left-4 bg-black/80 text-white rounded-lg p-2 shadow-lg">
          <div className="text-sm">
            Click map to set impact location, then run simulation
          </div>
        </div>
      )}
    </div>
  );
}
