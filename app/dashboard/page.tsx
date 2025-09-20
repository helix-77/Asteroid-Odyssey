"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MissionControl from "@/components/dashboard/mission-control"
import DataDisplay from "@/components/dashboard/data-display"
import Earth3D from "@/components/3d/earth-3d"
import { ArrowLeft, Settings, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<string | null>(null)
  const [simulationMode, setSimulationMode] = useState<"tracking" | "impact" | "deflection">("tracking")

  return (
    <div className="min-h-screen space-gradient">
      {/* Header Navigation */}
      <header className="border-b border-border/20 glass-morphism">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-border/40" />
              <h1 className="text-xl font-bold text-glow text-white">Mission Control</h1>
              <Badge variant="outline" className="animate-pulse border-white/30 text-white">
                ACTIVE
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white hover:text-white">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-white">
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
          <MissionControl
            selectedAsteroid={selectedAsteroid}
            onAsteroidSelect={setSelectedAsteroid}
            simulationMode={simulationMode}
            onModeChange={setSimulationMode}
          />
        </div>

        {/* Center Panel - 3D Visualization (50%) */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <Earth3D selectedAsteroid={selectedAsteroid} simulationMode={simulationMode} />
          </div>

          {/* Overlay Controls */}
          <div className="absolute top-4 left-4 z-10">
            <Tabs value={simulationMode} onValueChange={(value) => setSimulationMode(value as any)}>
              <TabsList className="glass-morphism">
                <TabsTrigger value="tracking" className="text-white data-[state=active]:text-black">
                  Tracking
                </TabsTrigger>
                <TabsTrigger value="impact" className="text-white data-[state=active]:text-black">
                  Impact
                </TabsTrigger>
                <TabsTrigger value="deflection" className="text-white data-[state=active]:text-black">
                  Deflection
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Status Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Card className="glass-morphism p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">System Online</span>
                  </div>
                  <div className="text-gray-200">Tracking: {selectedAsteroid || "No asteroid selected"}</div>
                </div>
                <div className="text-gray-200">
                  Mode: {simulationMode.charAt(0).toUpperCase() + simulationMode.slice(1)}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Panel - Data Display (20%) */}
        <div className="w-[20%] border-l border-border/20 glass-morphism overflow-y-auto">
          <DataDisplay selectedAsteroid={selectedAsteroid} simulationMode={simulationMode} />
        </div>
      </div>
    </div>
  )
}
