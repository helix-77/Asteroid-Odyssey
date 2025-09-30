"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ImpactResults } from "@/lib/calculations/impact";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

interface ImpactMapProps {
  impactLocation: ImpactLocation;
  onLocationChange: (location: ImpactLocation) => void;
  simulationResults: ImpactResults | null;
  currentTimeline: TimelineState | null;
  activeFilter: string;
  selectedRegion: string;
  populationData: any[];
  infrastructureData: any[];
}

// Custom icons for different infrastructure types
const createCustomIcon = (color: string, type: string) => {
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
  military: createCustomIcon('#dc2626', 'military'), // red
  energy: createCustomIcon('#ea580c', 'energy'), // orange
  cultural: createCustomIcon('#7c3aed', 'cultural'), // purple
  civilian: createCustomIcon('#16a34a', 'civilian'), // green
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
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  </style>`,
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

export default function ImpactMap({
  impactLocation,
  onLocationChange,
  simulationResults,
  currentTimeline,
  activeFilter,
  selectedRegion,
  populationData,
  infrastructureData,
}: ImpactMapProps) {
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

  // Calculate damage intensity for visualization
  const getDamageIntensity = (distance: number): number => {
    if (!currentTimeline) return 0;
    
    const maxRadius = currentTimeline.damageRadius;
    if (distance > maxRadius) return 0;
    
    // Intensity decreases with distance
    return Math.max(0, 1 - (distance / maxRadius));
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

        {/* Crater visualization */}
        {simulationResults && currentTimeline && (
          <Circle
            center={[impactLocation.lat, impactLocation.lng]}
            radius={currentTimeline.craterRadius}
            pathOptions={{
              fillColor: "#7c2d12",
              fillOpacity: 0.8,
              color: "#451a03",
              weight: 2,
            }}
          />
        )}

        {/* Damage radius circles */}
        {simulationResults && currentTimeline && (
          <>
            {/* Primary damage zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={currentTimeline.damageRadius * 0.3}
              pathOptions={{
                fillColor: getCircleColor(activeFilter),
                fillOpacity: 0.4,
                color: getCircleColor(activeFilter),
                weight: 2,
              }}
            />
            
            {/* Secondary damage zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={currentTimeline.damageRadius * 0.6}
              pathOptions={{
                fillColor: getCircleColor(activeFilter),
                fillOpacity: 0.2,
                color: getCircleColor(activeFilter),
                weight: 1,
              }}
            />
            
            {/* Tertiary damage zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={currentTimeline.damageRadius}
              pathOptions={{
                fillColor: getCircleColor(activeFilter),
                fillOpacity: 0.1,
                color: getCircleColor(activeFilter),
                weight: 1,
                dashArray: "5, 5",
              }}
            />
          </>
        )}

        {/* Infrastructure markers */}
        {getInfrastructureMarkers().map((infrastructure, index) => (
          <Marker
            key={`infra-${index}`}
            position={[infrastructure.lat, infrastructure.lng]}
            icon={infrastructureIcons[infrastructure.type as keyof typeof infrastructureIcons]}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{infrastructure.name}</div>
                <div>Type: {infrastructure.type}</div>
                <div>Country: {infrastructure.country}</div>
                <div>Importance: {infrastructure.importance}</div>
                {infrastructure.subtype && (
                  <div>Subtype: {infrastructure.subtype}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Population markers */}
        {getPopulationMarkers().map((population, index) => (
          <Circle
            key={`pop-${index}`}
            center={[population.lat, population.lng]}
            radius={Math.sqrt(population.density) * 100} // Scale radius by density
            pathOptions={{
              fillColor: "#fbbf24",
              fillOpacity: 0.3,
              color: "#f59e0b",
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{population.name}</div>
                <div>Region: {population.region}</div>
                <div>Density: {population.density.toLocaleString()}/km²</div>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Filter legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Impact Site</span>
          </div>
          {activeFilter === "infrastructure" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span>Military</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                <span>Energy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span>Cultural</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span>Civilian</span>
              </div>
            </>
          )}
          {activeFilter === "casualties" && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Population Centers</span>
            </div>
          )}
          {simulationResults && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-800"></div>
                <span>Crater</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getCircleColor(activeFilter) }}></div>
                <span>Damage Zones</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click instruction */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="text-xs text-gray-600">
          Click on the map to set impact location
        </div>
      </div>
    </div>
  );
}
