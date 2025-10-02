"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ImpactMapProps {
  impactLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  craterRadius?: number; // in meters
  destructionZones?: {
    total: number; // km
    severe: number; // km
    moderate: number; // km
  };
  showAnimation?: boolean;
  tsunamiData?: {
    triggered: boolean;
    waveHeight: number;
    affectedCoastline: number;
  };
  blastData?: {
    fireballRadius: number; // km
    shockwaveRadius: number; // km
  };
}

export default function ImpactMap({
  impactLocation,
  onLocationSelect,
  craterRadius = 0,
  destructionZones,
  showAnimation = false,
  tsunamiData,
  blastData,
}: ImpactMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impactMarkerRef = useRef<L.CircleMarker | null>(null);
  const craterCircleRef = useRef<L.Circle | null>(null);
  const destructionCirclesRef = useRef<L.Circle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const [animationPhase, setAnimationPhase] = useState<'impact' | 'fireball' | 'shockwave' | 'complete'>('impact');

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create map with satellite imagery
    const map = L.map(containerRef.current, {
      center: [40.7128, -74.006], // Default to New York
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });

    // Add satellite/terrain tile layer for realistic geography
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19,
    }).addTo(map);

    // Add labels overlay for better readability
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap, &copy; CartoDB',
      maxZoom: 19,
      pane: 'shadowPane'
    }).addTo(map);

    // Add click handler for location selection
    map.on("click", (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect]);

  // Update impact location and visualizations
  useEffect(() => {
    if (!mapRef.current || !impactLocation) return;

    const map = mapRef.current;

    // Remove existing markers and circles
    if (impactMarkerRef.current) {
      impactMarkerRef.current.remove();
    }
    if (craterCircleRef.current) {
      craterCircleRef.current.remove();
    }
    destructionCirclesRef.current.forEach((circle) => circle.remove());
    destructionCirclesRef.current = [];

    // Center map on impact location
    map.setView([impactLocation.lat, impactLocation.lng], 8);

    // Add impact marker
    const marker = L.circleMarker([impactLocation.lat, impactLocation.lng], {
      radius: 8,
      fillColor: "#ff0000",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);

    marker.bindPopup("<b>Impact Location</b><br>Click to simulate impact");
    impactMarkerRef.current = marker;

    // Add crater circle if radius is provided (realistic brown/orange crater)
    if (craterRadius > 0) {
      const crater = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: craterRadius,
        fillColor: "#3d2817",
        color: "#8B4513",
        weight: 4,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map);

      // Add inner crater detail
      const innerCrater = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: craterRadius * 0.6,
        fillColor: "#1a0f08",
        color: "#5d3a1a",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      crater.bindPopup(`<b>Crater</b><br>Diameter: ${(craterRadius * 2 / 1000).toFixed(2)} km<br>Depth: ~${(craterRadius / 5).toFixed(0)}m`);
      craterCircleRef.current = crater;
    }

    // Add destruction zones with realistic gradients
    if (destructionZones) {
      // Fireball zone (innermost - white/blue hot)
      const fireballCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.total * 1000 * 0.3, // 30% of total destruction
        fillColor: "#e8f4ff",
        color: "#4da6ff",
        weight: 3,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);
      fireballCircle.bindPopup(`<b>Fireball Zone</b><br>Complete vaporization<br>Radius: ${(destructionZones.total * 0.3).toFixed(2)} km`);
      destructionCirclesRef.current.push(fireballCircle);

      // Total destruction zone (red/orange - 50% fatalities)
      const totalCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.total * 1000,
        fillColor: "#ff4500",
        color: "#ff0000",
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.4,
      }).addTo(map);
      totalCircle.bindPopup(`<b>50% Fatalities</b><br>Total Destruction<br>Radius: ${destructionZones.total.toFixed(2)} km`);
      destructionCirclesRef.current.push(totalCircle);

      // Severe destruction zone (orange/yellow - 3rd degree burns)
      const severeCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.severe * 1000,
        fillColor: "#ff8c00",
        color: "#ff6600",
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.3,
      }).addTo(map);
      severeCircle.bindPopup(`<b>3rd Degree Burns</b><br>Severe Destruction<br>Radius: ${destructionZones.severe.toFixed(2)} km`);
      destructionCirclesRef.current.push(severeCircle);

      // Moderate destruction zone (yellow - 2nd degree burns)
      const moderateCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.moderate * 1000,
        fillColor: "#ffd700",
        color: "#ffaa00",
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.2,
      }).addTo(map);
      moderateCircle.bindPopup(`<b>2nd Degree Burns</b><br>Moderate Damage<br>Radius: ${destructionZones.moderate.toFixed(2)} km`);
      destructionCirclesRef.current.push(moderateCircle);

      // Shockwave zone (light yellow - buildings collapse)
      const shockwaveCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.moderate * 1000 * 1.5,
        fillColor: "#ffffe0",
        color: "#ffdd88",
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.15,
      }).addTo(map);
      shockwaveCircle.bindPopup(`<b>Shockwave</b><br>Buildings Collapse<br>Radius: ${(destructionZones.moderate * 1.5).toFixed(2)} km`);
      destructionCirclesRef.current.push(shockwaveCircle);

      // Fit bounds to show all zones
      const bounds = shockwaveCircle.getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [impactLocation, craterRadius, destructionZones]);

  // Enhanced impact animation with realistic phases
  useEffect(() => {
    if (!showAnimation || !impactLocation || !mapRef.current) return;

    let frame = 0;
    const maxFrames = 120; // Longer animation
    
    const animate = () => {
      frame++;
      const progress = frame / maxFrames;
      
      if (frame <= maxFrames && impactMarkerRef.current) {
        // Phase 1: Impact flash (0-20%)
        if (progress < 0.2) {
          const flashIntensity = Math.sin((progress / 0.2) * Math.PI);
          impactMarkerRef.current.setStyle({
            radius: 12 + flashIntensity * 8,
            fillColor: `rgba(255, ${255 - flashIntensity * 100}, ${255 - flashIntensity * 200}, 1)`,
            fillOpacity: 1,
          });
          setAnimationPhase('impact');
        }
        // Phase 2: Fireball expansion (20-50%)
        else if (progress < 0.5) {
          const fireballProgress = (progress - 0.2) / 0.3;
          impactMarkerRef.current.setStyle({
            radius: 12 + fireballProgress * 20,
            fillColor: `rgba(255, ${100 + fireballProgress * 100}, 0, ${1 - fireballProgress * 0.3})`,
            fillOpacity: 0.9 - fireballProgress * 0.3,
          });
          setAnimationPhase('fireball');
        }
        // Phase 3: Shockwave expansion (50-100%)
        else {
          const shockwaveProgress = (progress - 0.5) / 0.5;
          impactMarkerRef.current.setStyle({
            radius: 32 + shockwaveProgress * 20,
            fillColor: `rgba(255, 200, 100, ${0.6 - shockwaveProgress * 0.5})`,
            fillOpacity: 0.6 - shockwaveProgress * 0.5,
          });
          setAnimationPhase('shockwave');
        }

        // Expand destruction circles progressively
        destructionCirclesRef.current.forEach((circle, index) => {
          const delay = index * 0.1;
          const circleProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
          
          if (circleProgress > 0) {
            circle.setStyle({
              fillOpacity: (0.6 - index * 0.1) * (1 - circleProgress * 0.3),
              opacity: 0.9 - circleProgress * 0.2,
            });
          }
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setAnimationPhase('complete');
        if (impactMarkerRef.current) {
          impactMarkerRef.current.setStyle({
            radius: 8,
            fillColor: '#ff0000',
            fillOpacity: 0.8,
          });
        }
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showAnimation, impactLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border-2 border-border" />
      
      {!impactLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="bg-background/90 p-6 rounded-lg border-2 border-border text-center">
            <p className="text-lg font-semibold mb-2">Click on the map to select impact location</p>
            <p className="text-sm text-muted-foreground">Choose where the asteroid will strike</p>
          </div>
        </div>
      )}

      {/* Enhanced Legend */}
      {destructionZones && (
        <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm p-4 rounded-lg border-2 border-white/20 shadow-2xl">
          <h3 className="font-bold mb-3 text-sm text-white">Impact Effects</h3>
          <div className="space-y-2 text-xs text-white/90">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-200/70 border-2 border-blue-400" />
              <span>Fireball - Vaporization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500/60 border-2 border-red-600" />
              <span>50% Fatalities ({destructionZones.total.toFixed(1)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/50 border-2 border-orange-600" />
              <span>3rd° Burns ({destructionZones.severe.toFixed(1)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500/40 border-2 border-yellow-600" />
              <span>2nd° Burns ({destructionZones.moderate.toFixed(1)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-200/30 border-2 border-yellow-400" />
              <span>Buildings Collapse</span>
            </div>
          </div>
          {animationPhase !== 'complete' && showAnimation && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-xs text-yellow-400 font-semibold animate-pulse">
                {animationPhase === 'impact' && '⚡ Impact...'}
                {animationPhase === 'fireball' && '🔥 Fireball expanding...'}
                {animationPhase === 'shockwave' && '💨 Shockwave propagating...'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tsunami Warning */}
      {tsunamiData?.triggered && (
        <div className="absolute top-4 left-4 bg-blue-500/90 text-white p-4 rounded-lg border-2 border-blue-700 shadow-lg animate-pulse">
          <h3 className="font-bold mb-1">⚠️ TSUNAMI WARNING</h3>
          <p className="text-sm">Wave Height: {tsunamiData.waveHeight.toFixed(1)}m</p>
          <p className="text-sm">Affected Coastline: {tsunamiData.affectedCoastline.toFixed(0)}km</p>
        </div>
      )}
    </div>
  );
}
