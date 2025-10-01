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
}

export default function ImpactMap({
  impactLocation,
  onLocationSelect,
  craterRadius = 0,
  destructionZones,
  showAnimation = false,
  tsunamiData,
}: ImpactMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impactMarkerRef = useRef<L.CircleMarker | null>(null);
  const craterCircleRef = useRef<L.Circle | null>(null);
  const destructionCirclesRef = useRef<L.Circle[]>([]);
  const animationFrameRef = useRef<number>(0);

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

    // Add OpenStreetMap tile layer (realistic geography)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
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

    // Add crater circle if radius is provided
    if (craterRadius > 0) {
      const crater = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: craterRadius,
        fillColor: "#000000",
        color: "#8B4513",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.7,
      }).addTo(map);

      crater.bindPopup(`<b>Crater</b><br>Diameter: ${(craterRadius * 2 / 1000).toFixed(2)} km`);
      craterCircleRef.current = crater;
    }

    // Add destruction zones
    if (destructionZones) {
      // Total destruction zone (red)
      const totalCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.total * 1000, // Convert km to meters
        fillColor: "#ff0000",
        color: "#ff0000",
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.3,
      }).addTo(map);
      totalCircle.bindPopup(`<b>Total Destruction</b><br>Radius: ${destructionZones.total.toFixed(2)} km`);
      destructionCirclesRef.current.push(totalCircle);

      // Severe destruction zone (orange)
      const severeCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.severe * 1000,
        fillColor: "#ff8800",
        color: "#ff8800",
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.2,
      }).addTo(map);
      severeCircle.bindPopup(`<b>Severe Destruction</b><br>Radius: ${destructionZones.severe.toFixed(2)} km`);
      destructionCirclesRef.current.push(severeCircle);

      // Moderate destruction zone (yellow)
      const moderateCircle = L.circle([impactLocation.lat, impactLocation.lng], {
        radius: destructionZones.moderate * 1000,
        fillColor: "#ffff00",
        color: "#ffff00",
        weight: 2,
        opacity: 0.4,
        fillOpacity: 0.15,
      }).addTo(map);
      moderateCircle.bindPopup(`<b>Moderate Destruction</b><br>Radius: ${destructionZones.moderate.toFixed(2)} km`);
      destructionCirclesRef.current.push(moderateCircle);

      // Fit bounds to show all zones
      const bounds = moderateCircle.getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [impactLocation, craterRadius, destructionZones]);

  // Impact animation
  useEffect(() => {
    if (!showAnimation || !impactLocation || !mapRef.current) return;

    let frame = 0;
    const maxFrames = 60;
    const animate = () => {
      frame++;
      
      if (frame <= maxFrames && impactMarkerRef.current) {
        // Pulsing effect
        const scale = 1 + Math.sin((frame / maxFrames) * Math.PI * 4) * 0.5;
        const opacity = 1 - (frame / maxFrames) * 0.3;
        
        impactMarkerRef.current.setStyle({
          radius: 8 * scale,
          fillOpacity: opacity,
        });

        // Expand destruction circles
        destructionCirclesRef.current.forEach((circle, index) => {
          const progress = Math.min(1, frame / (maxFrames * 0.8));
          circle.setStyle({
            fillOpacity: (0.3 - index * 0.05) * (1 - progress * 0.5),
          });
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Reset animation
        if (impactMarkerRef.current) {
          impactMarkerRef.current.setStyle({
            radius: 8,
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

      {/* Legend */}
      {destructionZones && (
        <div className="absolute bottom-4 right-4 bg-background/95 p-4 rounded-lg border-2 border-border shadow-lg">
          <h3 className="font-semibold mb-2 text-sm">Destruction Zones</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500/50 border border-red-500" />
              <span>Total Destruction ({destructionZones.total.toFixed(1)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500/50 border border-orange-500" />
              <span>Severe Damage ({destructionZones.severe.toFixed(1)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500/50 border border-yellow-500" />
              <span>Moderate Damage ({destructionZones.moderate.toFixed(1)} km)</span>
            </div>
          </div>
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
