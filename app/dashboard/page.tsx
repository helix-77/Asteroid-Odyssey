"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MissionControl from "@/components/dashboard/mission-control";
import { PhysicsCalculations } from "@/components/dashboard/physics-calculations";
import ErrorBoundary, {
  AsteroidDataErrorBoundary,
  PhysicsCalculationErrorBoundary,
} from "@/components/dashboard/error-boundary";
import { ArrowLeft, Settings, HelpCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";

// Dynamically import Earth3D with no SSR to avoid Three.js/Canvas errors
const Earth3D = dynamic(() => import("@/components/3d/earth-3d"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function Dashboard() {
  const [selectedAsteroid, setSelectedAsteroid] =
    useState<UnifiedAsteroidData | null>(null);
  const [simulationMode, setSimulationMode] = useState<
    "tracking" | "impact" | "deflection"
  >("tracking");
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Memoized callback for asteroid selection to ensure proper data flow
  const handleAsteroidSelect = useCallback(
    (asteroid: UnifiedAsteroidData | null) => {
      try {
        console.log("Dashboard: Asteroid selected:", asteroid?.name || "None");

        // Validate asteroid data if provided
        if (asteroid) {
          // Basic validation of required fields
          if (!asteroid.id || !asteroid.name) {
            console.warn(
              "Dashboard: Invalid asteroid data - missing required fields"
            );
            return;
          }

          // Log data completeness for debugging
          console.log("Dashboard: Asteroid data completeness:", {
            completeness: asteroid.dataCompleteness,
            estimatedFields: asteroid.estimatedFields,
            source: asteroid.source,
          });
        }

        setSelectedAsteroid(asteroid);
        setDashboardError(null); // Clear any previous errors
      } catch (error) {
        console.error("Dashboard: Error handling asteroid selection:", error);
        setDashboardError("Failed to select asteroid. Please try again.");
        // Don't update state if there's an error
      }
    },
    []
  );

  // Memoized callback for simulation mode changes
  const handleModeChange = useCallback(
    (mode: "tracking" | "impact" | "deflection") => {
      try {
        console.log("Dashboard: Simulation mode changed to:", mode);
        setSimulationMode(mode);
        setDashboardError(null); // Clear any previous errors
      } catch (error) {
        console.error("Dashboard: Error changing simulation mode:", error);
        setDashboardError(
          "Failed to change simulation mode. Please try again."
        );
      }
    },
    []
  );

  return (
    <div className="min-h-screen space-gradient">
      {/* Header Navigation */}
      <header className="border-b border-border/20 glass-morphism">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-border/40" />
              <h1 className="text-xl font-bold text-glow text-white">
                Mission Control
              </h1>
              <Badge
                variant="outline"
                className="animate-pulse border-white/30 text-white"
              >
                ACTIVE
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Mission Control (30%) */}
        <div className="w-[30%] border-r border-border/20 glass-morphism overflow-y-auto">
          <AsteroidDataErrorBoundary>
            <MissionControl
              selectedAsteroid={selectedAsteroid}
              onAsteroidSelect={handleAsteroidSelect}
              simulationMode={simulationMode}
              onModeChange={handleModeChange}
            />
          </AsteroidDataErrorBoundary>
        </div>

        {/* Center Panel - 3D Visualization (50%) */}
        <div className="flex-1 relative">
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error("3D Visualization Error:", {
                error: error.message,
                componentStack: errorInfo.componentStack,
                selectedAsteroid: selectedAsteroid?.name,
                simulationMode,
              });
            }}
          >
            <div className="absolute inset-0">
              <Earth3D
                selectedAsteroid={selectedAsteroid}
                simulationMode={simulationMode}
              />
            </div>
          </ErrorBoundary>

          {/* Overlay Controls */}
          <div className="absolute top-4 left-4 z-10">
            <Tabs
              value={simulationMode}
              onValueChange={(value) => handleModeChange(value as any)}
            >
              <TabsList className="glass-morphism">
                <TabsTrigger
                  value="tracking"
                  className="text-white data-[state=active]:text-black"
                >
                  Tracking
                </TabsTrigger>
                <TabsTrigger
                  value="impact"
                  className="text-white data-[state=active]:text-black"
                >
                  Impact
                </TabsTrigger>
                <TabsTrigger
                  value="deflection"
                  className="text-white data-[state=active]:text-black"
                >
                  Deflection
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Status Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="space-y-2">
              {dashboardError && (
                <Card className="glass-morphism p-3 bg-red-900/20 border-red-500/30">
                  <div className="flex items-center gap-2 text-red-300 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{dashboardError}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDashboardError(null)}
                      className="ml-auto h-6 w-6 p-0 text-red-300 hover:text-red-100"
                    >
                      ×
                    </Button>
                  </div>
                </Card>
              )}
              <Card className="glass-morphism p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          dashboardError ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></div>
                      <span className="text-white font-medium">
                        {dashboardError ? "System Error" : "System Online"}
                      </span>
                    </div>
                    <div className="text-gray-200">
                      Tracking:{" "}
                      {selectedAsteroid?.name || "No asteroid selected"}
                    </div>
                  </div>
                  <div className="text-gray-200">
                    Mode:{" "}
                    {simulationMode.charAt(0).toUpperCase() +
                      simulationMode.slice(1)}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Panel - Physics Calculations (25%) */}
        <div className="w-[25%] border-l border-border/20 glass-morphism overflow-y-auto p-4">
          <PhysicsCalculationErrorBoundary>
            <PhysicsCalculations selectedAsteroid={selectedAsteroid} />
          </PhysicsCalculationErrorBoundary>
        </div>
      </div>
    </div>
  );
}
