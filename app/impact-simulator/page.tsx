"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AsteroidSelector } from "@/components/impact-simulator/AsteroidSelector";
import { ImpactControls } from "@/components/impact-simulator/ImpactControls";
import { DataSidebar } from "@/components/impact-simulator/DataSidebar";
import { Timeline } from "@/components/impact-simulator/Timeline";
import type { Asteroid } from "@/lib/types";

// Dynamically import map to avoid SSR issues
const ImpactMap = dynamic(
  () => import("@/components/impact-simulator/ImpactMap"),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" /> }
);

export default function ImpactSimulatorPage() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [impactLocation, setImpactLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(0); // 0-100 representing time progression
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapView, setMapView] = useState<"global" | "northAmerica" | "southAmerica" | "europe" | "asia" | "africa" | "oceania">("global");
  const [dataLayer, setDataLayer] = useState<"population" | "habitability" | "tsunami" | "tectonic" | "infrastructure">("population");
  const [impactData, setImpactData] = useState<any>(null);

  // Handle time progression
  useEffect(() => {
    if (!isPlaying || !impactLocation || !selectedAsteroid) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, impactLocation, selectedAsteroid]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!selectedAsteroid) {
      alert("Please select an asteroid first");
      return;
    }
    setImpactLocation({ lat, lng });
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleTimeChange = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = () => {
    if (!impactLocation || !selectedAsteroid) {
      alert("Please select an asteroid and impact location first");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="h-16 bg-white shadow-sm border-b border-gray-200 px-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Asteroid Impact Simulator</h1>
        <AsteroidSelector 
          onSelect={setSelectedAsteroid}
          selected={selectedAsteroid}
        />
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Controls Bar */}
          <ImpactControls
            mapView={mapView}
            onMapViewChange={setMapView}
            dataLayer={dataLayer}
            onDataLayerChange={setDataLayer}
          />

          {/* Map Container */}
          <div className="flex-1 relative bg-gray-200 overflow-hidden">
            <div className="w-full h-full">
              <ImpactMap
                asteroid={selectedAsteroid}
                impactLocation={impactLocation}
                currentTime={currentTime}
                mapView={mapView}
                dataLayer={dataLayer}
                onMapClick={handleMapClick}
                onDataUpdate={setImpactData}
              />
            </div>
            
            {/* Timeline - positioned over map at bottom */}
            <div className="absolute bottom-4 left-4 right-4">
              <Timeline
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTimeChange={handleTimeChange}
                onPlayPause={handlePlayPause}
                onReset={handleReset}
                disabled={!impactLocation || !selectedAsteroid}
              />
            </div>
          </div>
        </div>

        {/* Data Sidebar */}
        <DataSidebar
          asteroid={selectedAsteroid}
          impactLocation={impactLocation}
          currentTime={currentTime}
          impactData={impactData}
        />
      </div>
    </div>
  );
}
