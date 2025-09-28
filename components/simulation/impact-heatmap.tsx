"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw } from "lucide-react";
import impactLocationData from "@/data/impact_location.json";
import populationData from "@/data/population_density.json";
import infrastructureData from "@/data/infrastructure_locations.json";
// Import individual country files as needed
import type { Asteroid } from "@/lib/types";

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface ImpactHeatmapProps {
  selectedAsteroid: Asteroid | null;
  onSimulate: (results: any) => void;
}

interface ImpactZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  intensity: number;
  timestamp: number;
}

// Custom hook to handle map updates
function MapUpdater({
  impactZones,
  timeStep,
}: {
  impactZones: ImpactZone[];
  timeStep: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (impactZones.length > 0) {
      const bounds = L.latLngBounds(
        impactZones.map((zone) => [zone.lat, zone.lng])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [impactZones, map]);

  return null;
}

// Custom component for population density heatmap
function PopulationHeatmap() {
  const map = useMap();
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    // Generate heatmap data from population density
    const heatmapData: [number, number, number][] = [];

    populationData.population_density_data.forEach((region) => {
      region.coordinates.forEach((city) => {
        // Normalize density to 0-1 range for heatmap
        const intensity = Math.min(city.density / 50000, 1);
        heatmapData.push([city.lat, city.lng, intensity]);

        // Add surrounding points for better coverage
        const surroundingPoints = [
          [city.lat + 0.5, city.lng + 0.5, intensity * 0.8],
          [city.lat - 0.5, city.lng - 0.5, intensity * 0.8],
          [city.lat + 0.5, city.lng - 0.5, intensity * 0.8],
          [city.lat - 0.5, city.lng + 0.5, intensity * 0.8],
          [city.lat + 1, city.lng, intensity * 0.6],
          [city.lat - 1, city.lng, intensity * 0.6],
          [city.lat, city.lng + 1, intensity * 0.6],
          [city.lat, city.lng - 1, intensity * 0.6],
        ];

        surroundingPoints.forEach(([lat, lng, int]) => {
          heatmapData.push([lat, lng, int]);
        });
      });
    });

    // Create heatmap layer
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
    }

    heatmapRef.current = (L as any)
      .heatLayer(heatmapData, {
        radius: 80,
        blur: 50,
        maxZoom: 8,
        gradient: {
          0.0: "green",
          0.1: "lime",
          0.3: "yellow",
          0.5: "orange",
          0.7: "red",
          0.9: "darkred",
          1.0: "maroon",
        },
      })
      .addTo(map);

    return () => {
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current);
      }
    };
  }, [map]);

  return null;
}

// Custom component for country boundaries using real GeoJSON data
function CountryOverlay() {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const [countriesLoaded, setCountriesLoaded] = useState(false);

  // Color palette for countries
  const countryColors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#14B8A6",
    "#DC2626",
    "#7C3AED",
    "#059669",
    "#DB2777",
    "#0891B2",
    "#CA8A04",
    "#16A34A",
    "#EA580C",
    "#6366F1",
    "#F43F5E",
  ];

  // Helper to normalize country names to file names
  const toFileName = (countryName: string) =>
    countryName
      .toLowerCase()
      .replace(/[^a-z]+/g, "_")
      .replace(/^_+|_+$/g, "");

  useEffect(() => {
    const loadCountries = async () => {
      if (geoJsonRef.current) {
        map.removeLayer(geoJsonRef.current);
      }

      const allFeatures: any[] = [];

      try {
        // Fetch country code/name mapping to enumerate all countries
        const mappingRes = await fetch(
          `/data/world-geojson-develop/helper/countryCode.json`
        );
        const codeToName = (await mappingRes.json()) as Record<string, string>;

        const entries = Object.entries(codeToName);

        // Build list of fetches for all countries in parallel
        const fetches = entries.map(async ([code, name], index) => {
          // Preferred filename derived from country name
          const baseFile = toFileName(name);

          // Known alternate filenames for a few special cases
          const alternates: string[] = [];
          if (code === "US") alternates.push("usa", "united_states");
          if (code === "GB") alternates.push("united_kingdom", "uk");
          if (code === "KR") alternates.push("south_korea", "korea");
          if (code === "KP") alternates.push("north_korea");
          if (code === "CD")
            alternates.push("democratic_republic_of_the_congo");
          if (code === "CG") alternates.push("republic_of_the_congo", "congo");
          if (code === "CI") alternates.push("cote_d_ivoire");
          if (code === "TZ") alternates.push("tanzania_united_republic_of");
          if (code === "BO") alternates.push("bolivia_plurinational_state_of");
          if (code === "IR") alternates.push("iran_islamic_republic_of");
          if (code === "LA")
            alternates.push("lao_people_s_democratic_republic");
          if (code === "FM") alternates.push("micronesia_federated_states_of");
          if (code === "VE")
            alternates.push("venezuela_bolivarian_republic_of");

          const candidateFiles = [baseFile, ...alternates];

          for (const file of candidateFiles) {
            try {
              const url = `/data/world-geojson-develop/countries/${file}.json`;
              console.log(`Attempting to fetch: ${url}`);
              const res = await fetch(url);
              if (!res.ok) {
                console.warn(
                  `Failed to fetch ${url}: ${res.status} ${res.statusText}`
                );
                throw new Error(`${res.status}`);
              }
              const countryData = await res.json();
              console.log(
                `Successfully loaded ${name} (${code}) from ${file}.json`
              );

              // Assign deterministic color and readable name
              const color = countryColors[index % countryColors.length];
              countryData.features.forEach((feature: any) => {
                feature.properties.color = color;
                feature.properties.name = name;
                feature.properties.iso2 = code;
              });

              allFeatures.push(...countryData.features);
              return; // Loaded successfully; stop trying alternates
            } catch (error) {
              console.warn(`Failed to load ${file}.json for ${name}:`, error);
              // try next candidate
            }
          }

          console.warn(`Failed to load country GeoJSON for ${name} (${code})`);
        });

        await Promise.all(fetches);
      } catch (e) {
        console.warn("Failed to enumerate countries:", e);
      }

      console.log(`Loaded ${allFeatures.length} country features`);

      // Create GeoJSON layer with all countries
      const combinedGeoJSON = {
        type: "FeatureCollection" as const,
        features: allFeatures,
      };

      geoJsonRef.current = L.geoJSON(combinedGeoJSON, {
        style: (feature) => ({
          fillColor: feature?.properties.color || "#94A3B8",
          weight: 1,
          opacity: 1,
          color: "#111827",
          fillOpacity: 0.85, // solid-looking fills
        }),
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`
              <div>
                <h3 class="font-semibold">${feature.properties.name}</h3>
                <p class="text-sm text-gray-600">Country</p>
              </div>
            `);
          }
        },
      }).addTo(map);

      setCountriesLoaded(true);
    };

    loadCountries();

    return () => {
      if (geoJsonRef.current) {
        map.removeLayer(geoJsonRef.current);
      }
    };
  }, [map]);

  return null;
}

export function ImpactHeatmap({
  selectedAsteroid,
  onSimulate,
}: ImpactHeatmapProps) {
  const [impactZones, setImpactZones] = useState<ImpactZone[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [maxTimeSteps] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [infraVisibility, setInfraVisibility] = useState({
    military: true,
    energy: true,
    cultural: true,
    civilian: true,
  });

  // Generate impact zones from impact location data
  const generateImpactZones = () => {
    if (!selectedAsteroid) return [];

    return impactLocationData.asteroid_impacts.map((impact, index) => {
      // Calculate impact intensity based on asteroid size and speed
      const baseRadius = impact.impact_radius_km * 1000; // Convert to meters
      const intensity = Math.min(
        (selectedAsteroid.size || selectedAsteroid.diameter) / 100,
        1
      ); // Normalize intensity

      return {
        id: `impact-${index}`,
        name: impact.name,
        lat: impact.impact_location.latitude,
        lng: impact.impact_location.longitude,
        radius: baseRadius,
        intensity,
        timestamp: index * 20, // Stagger impacts over time
      };
    });
  };

  // Start/stop timelapse
  const togglePlayback = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setTimeStep((prev) => {
          const next = prev + playbackSpeed[0];
          if (next >= maxTimeSteps) {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return maxTimeSteps;
          }
          return next;
        });
      }, 100);
    }
  };

  // Reset timelapse
  const resetTimelapse = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setTimeStep(0);
  };

  // Initialize impact zones when asteroid is selected
  useEffect(() => {
    if (selectedAsteroid) {
      const zones = generateImpactZones();
      setImpactZones(zones);
      setTimeStep(0);
    } else {
      // Show static impact zones from data even without asteroid selected
      const staticZones = impactLocationData.asteroid_impacts.map(
        (impact, index) => ({
          id: `static-impact-${index}`,
          name: impact.name,
          lat: impact.impact_location.latitude,
          lng: impact.impact_location.longitude,
          radius: impact.impact_radius_km * 1000,
          intensity: 0.5, // Default intensity
          timestamp: 0, // Show immediately
        })
      );
      setImpactZones(staticZones);
      setTimeStep(0);
    }
  }, [selectedAsteroid]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get circle color based on intensity and time
  const getCircleColor = (zone: ImpactZone) => {
    const timeProgress = Math.min(timeStep / maxTimeSteps, 1);
    const zoneProgress = Math.min((timeStep - zone.timestamp) / 50, 1);

    if (timeStep < zone.timestamp) return "transparent";

    const intensity = zone.intensity * zoneProgress;
    if (intensity > 0.8) return "#dc2626"; // red-600
    if (intensity > 0.6) return "#ea580c"; // orange-600
    if (intensity > 0.4) return "#d97706"; // amber-600
    if (intensity > 0.2) return "#ca8a04"; // yellow-600
    return "#65a30d"; // lime-600
  };

  // Get circle radius based on time progression
  const getCircleRadius = (zone: ImpactZone) => {
    const timeProgress = Math.min(timeStep / maxTimeSteps, 1);
    const zoneProgress = Math.min((timeStep - zone.timestamp) / 50, 1);

    if (timeStep < zone.timestamp) return 0;

    // Start small and grow to full size
    const growthFactor = Math.min(zoneProgress * 2, 1);
    return zone.radius * growthFactor;
  };

  // Get infrastructure icon based on type
  const getInfrastructureIcon = (type: string, subtype?: string) => {
    const color =
      {
        military: "#dc2626",
        energy: "#f59e0b",
        cultural: "#8b5cf6",
        civilian: "#059669",
      }[type] || "#6b7280";

    return L.divIcon({
      className: "custom-infrastructure-icon",
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

  // Get population density color
  const getPopulationColor = (density: number) => {
    if (density > 20000) return "#dc2626"; // red
    if (density > 10000) return "#ea580c"; // orange
    if (density > 5000) return "#d97706"; // amber
    if (density > 2000) return "#ca8a04"; // yellow
    if (density > 1000) return "#65a30d"; // lime
    return "#16a34a"; // green
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Impact Heatmap Controls
            {selectedAsteroid && (
              <Badge className="bg-red-600">{selectedAsteroid.name}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Impact zones from your data are always visible on the map. Select an
            asteroid to see dynamic timelapse effects.
          </div>

          {/* Layer Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "military", label: "Military", color: "#dc2626" },
                { key: "energy", label: "Energy", color: "#f59e0b" },
                { key: "cultural", label: "Cultural", color: "#8b5cf6" },
                { key: "civilian", label: "Civilian", color: "#059669" },
              ] as const
            ).map(({ key, label, color }) => (
              <label
                key={key}
                className="flex items-center space-x-2 text-sm cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={infraVisibility[key]}
                  onChange={(e) =>
                    setInfraVisibility((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />
                <span className="inline-flex items-center">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              </label>
            ))}
          </div>

          {selectedAsteroid ? (
            <>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={togglePlayback}
                  variant={isPlaying ? "destructive" : "default"}
                  size="sm"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={resetTimelapse} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Playback Speed: {playbackSpeed[0]}x
                </label>
                <Slider
                  value={playbackSpeed}
                  onValueChange={setPlaybackSpeed}
                  max={5}
                  min={0.5}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Time: {timeStep}/{maxTimeSteps}
                </label>
                <Progress
                  value={(timeStep / maxTimeSteps) * 100}
                  className="mt-2"
                />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p className="mb-2">Impact zones are visible on the map</p>
              <p className="text-xs">
                Select an asteroid to see dynamic timelapse effects
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: "600px", width: "100%" }}>
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={1}
              maxZoom={18}
              maxBounds={[
                [-85, -180],
                [85, 180],
              ]}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                noWrap={true}
              />

              <MapUpdater impactZones={impactZones} timeStep={timeStep} />

              {/* Country Boundaries Overlay */}
              <CountryOverlay />

              {/* Population Density Heatmap Overlay */}
              <PopulationHeatmap />

              {/* Infrastructure Markers */}
              {infrastructureData.infrastructure_locations.map((category) =>
                infraVisibility[category.type as keyof typeof infraVisibility]
                  ? category.locations.map((location, index) => (
                      <Marker
                        key={`infra-${category.type}-${index}`}
                        position={[location.lat, location.lng]}
                        icon={getInfrastructureIcon(
                          category.type,
                          (location as any).subtype
                        )}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-semibold">{location.name}</h3>
                            <p className="text-sm text-gray-600">
                              {category.type.charAt(0).toUpperCase() +
                                category.type.slice(1)}
                              {(location as any).subtype &&
                                ` • ${(location as any).subtype}`}
                            </p>
                            <p className="text-sm">{location.country}</p>
                            <Badge
                              variant={
                                location.importance === "critical"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {location.importance}
                            </Badge>
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  : null
              )}

              {/* Impact Zones */}
              {impactZones.map((zone) => (
                <div key={zone.id}>
                  {/* Impact Marker */}
                  <Marker
                    position={[zone.lat, zone.lng]}
                    icon={L.divIcon({
                      className: "impact-marker",
                      html: `<div style="
                        background-color: #dc2626;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
                        animation: pulse 2s infinite;
                      "></div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10],
                    })}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-semibold text-red-600">
                          {zone.name}
                        </h3>
                        <p>
                          Impact Radius: {(zone.radius / 1000).toFixed(1)} km
                        </p>
                        <p>Intensity: {(zone.intensity * 100).toFixed(0)}%</p>
                        <p>Timestamp: {zone.timestamp}s</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Impact Zone Circle */}
                  <Circle
                    center={[zone.lat, zone.lng]}
                    radius={getCircleRadius(zone)}
                    pathOptions={{
                      color: getCircleColor(zone),
                      fillColor: getCircleColor(zone),
                      fillOpacity: 0.3,
                      weight: 3,
                    }}
                  />

                  {/* Secondary Impact Ring */}
                  <Circle
                    center={[zone.lat, zone.lng]}
                    radius={getCircleRadius(zone) * 1.5}
                    pathOptions={{
                      color: getCircleColor(zone),
                      fillColor: "transparent",
                      fillOpacity: 0,
                      weight: 2,
                      dashArray: "10, 10",
                    }}
                  />
                </div>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Population Density Heatmap</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-maroon to-darkred rounded"></div>
                  <span>Very High (&gt; 40,000)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red to-darkred rounded"></div>
                  <span>High (20,000 - 40,000)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-orange to-red rounded"></div>
                  <span>Medium-High (10,000 - 20,000)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow to-orange rounded"></div>
                  <span>Medium (5,000 - 10,000)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-lime to-yellow rounded"></div>
                  <span>Low (1,000 - 5,000)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green to-lime rounded"></div>
                  <span>Very Low (&lt; 1,000)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Infrastructure</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <span>Military</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                  <span>Energy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                  <span>Cultural</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  <span>Civilian</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Impact Zones</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                  <span>Impact Point</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-red-600 rounded-full"></div>
                  <span>Impact Zone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-dashed border-red-600 rounded-full"></div>
                  <span>Secondary Ring</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Zones show impact radius from your data
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Countries</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 border border-gray-400 rounded"
                    style={{ backgroundColor: "#3B82F6", opacity: 0.3 }}
                  ></div>
                  <span>United States</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 border border-gray-400 rounded"
                    style={{ backgroundColor: "#EF4444", opacity: 0.3 }}
                  ></div>
                  <span>Canada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 border border-gray-400 rounded"
                    style={{ backgroundColor: "#10B981", opacity: 0.3 }}
                  ></div>
                  <span>Mexico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 border border-gray-400 rounded"
                    style={{ backgroundColor: "#F59E0B", opacity: 0.3 }}
                  ></div>
                  <span>Brazil</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Each country has a unique color
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
