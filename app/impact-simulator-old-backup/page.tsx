"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AsteroidSelector } from "@/components/impact-simulator/AsteroidSelector";
import { ImpactControls } from "@/components/impact-simulator/ImpactControls";
import { DataSidebar } from "@/components/impact-simulator/DataSidebar";
import { Timeline } from "@/components/impact-simulator/Timeline";
import { StatsOverlay } from "@/components/impact-simulator/StatsOverlay";
import type { Asteroid } from "@/lib/types";
import { ChevronRight, ChevronLeft } from "lucide-react";

// Dynamically import enhanced map to avoid SSR issues
const EnhancedImpactMap = dynamic(
  () => import("@/components/impact-simulator/EnhancedImpactMap"),
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
  const [showNavBar, setShowNavBar] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Convert currentTime (0-100) to years (-0.5 to 50)
  const timeYears = (currentTime / 100) * 50.5 - 0.5;

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
  
  // Handle scroll to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setShowNavBar(scrollTop < 50);
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

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
    <div className="min-h-screen bg-gray-100 light" style={{ colorScheme: 'light' }}>
      {/* Top Bar - Hideable */}
      <div 
        className={`h-16 bg-white shadow-sm border-b border-gray-200 px-4 flex items-center justify-end transition-transform duration-300 ${
          showNavBar ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <AsteroidSelector 
          onSelect={setSelectedAsteroid}
          selected={selectedAsteroid}
        />
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex h-screen overflow-auto"
        style={{ paddingTop: showNavBar ? '4rem' : '0' }}
      >
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
              <EnhancedImpactMap
                asteroid={selectedAsteroid}
                impactLocation={impactLocation}
                currentTime={currentTime}
                mapView={mapView}
                dataLayer={dataLayer}
                onMapClick={handleMapClick}
                onDataUpdate={setImpactData}
              />
            </div>
            
            {/* Stats Overlay */}
            <StatsOverlay data={impactData} timeYears={timeYears} />
            
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

        {/* Data Sidebar - Collapsible */}
        <div className="relative">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-white border border-gray-200 rounded-l-lg p-2 shadow-lg hover:bg-gray-50 z-10"
            style={{ color: '#000' }}
          >
            {sidebarCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          
          <div 
            className={`transition-all duration-300 ${
              sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
            }`}
          >
            <DataSidebar
              asteroid={selectedAsteroid}
              impactLocation={impactLocation}
              currentTime={currentTime}
              impactData={impactData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
