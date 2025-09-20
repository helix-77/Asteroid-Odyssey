"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Target, Shield, Play, Save } from "lucide-react"

interface MissionControlProps {
  selectedAsteroid: string | null
  onAsteroidSelect: (asteroidId: string) => void
  simulationMode: "tracking" | "impact" | "deflection"
  onModeChange: (mode: "tracking" | "impact" | "deflection") => void
}

// Mock asteroid data
const asteroids = [
  { id: "2025-XX1", name: "Impactor-2025", threatLevel: "high", size: 150 },
  { id: "2025-AB2", name: "Bennu-II", threatLevel: "medium", size: 89 },
  { id: "2025-CD3", name: "Apophis-Minor", threatLevel: "low", size: 45 },
  { id: "2025-EF4", name: "Didymos-B", threatLevel: "high", size: 200 },
]

const deflectionStrategies = [
  { id: "kinetic", name: "Kinetic Impactor", cost: 500, successRate: 85 },
  { id: "gravity", name: "Gravity Tractor", cost: 800, successRate: 95 },
  { id: "nuclear", name: "Nuclear Pulse", cost: 1200, successRate: 90 },
]

export default function MissionControl({
  selectedAsteroid,
  onAsteroidSelect,
  simulationMode,
  onModeChange,
}: MissionControlProps) {
  const [impactParams, setImpactParams] = useState({
    size: [150],
    velocity: [15.5],
    angle: [45],
  })
  const [selectedStrategy, setSelectedStrategy] = useState<string>("")

  const getThreatColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "warning"
      case "low":
        return "success"
      default:
        return "secondary"
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Asteroid Selector */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            <span>Asteroid Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAsteroid || ""} onValueChange={onAsteroidSelect}>
            <SelectTrigger className="bg-black/30 border-white/20 text-white">
              <SelectValue placeholder="Select an asteroid to track" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              {asteroids.map((asteroid) => (
                <SelectItem key={asteroid.id} value={asteroid.id} className="text-white hover:bg-white/10">
                  <div className="flex items-center justify-between w-full">
                    <span>{asteroid.name}</span>
                    <Badge variant={getThreatColor(asteroid.threatLevel) as any} className="ml-2">
                      {asteroid.threatLevel}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAsteroid && (
            <div className="space-y-2 text-sm">
              {asteroids
                .filter((a) => a.id === selectedAsteroid)
                .map((asteroid) => (
                  <div key={asteroid.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Size:</span>
                      <span className="text-white font-semibold">{asteroid.size}m diameter</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Threat Level:</span>
                      <Badge variant={getThreatColor(asteroid.threatLevel) as any} size="sm">
                        {asteroid.threatLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Parameters (shown in impact mode) */}
      {simulationMode === "impact" && (
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Target className="h-5 w-5" />
              <span>Impact Parameters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Size (meters)</label>
              <Slider
                value={impactParams.size}
                onValueChange={(value) => setImpactParams((prev) => ({ ...prev, size: value }))}
                max={500}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-gray-200 text-right font-semibold">{impactParams.size[0]}m</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Velocity (km/s)</label>
              <Slider
                value={impactParams.velocity}
                onValueChange={(value) => setImpactParams((prev) => ({ ...prev, velocity: value }))}
                max={30}
                min={5}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-gray-200 text-right font-semibold">{impactParams.velocity[0]} km/s</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Impact Angle (degrees)</label>
              <Slider
                value={impactParams.angle}
                onValueChange={(value) => setImpactParams((prev) => ({ ...prev, angle: value }))}
                max={90}
                min={15}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-gray-200 text-right font-semibold">{impactParams.angle[0]}°</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deflection Strategy (shown in deflection mode) */}
      {simulationMode === "deflection" && (
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="h-5 w-5" />
              <span>Deflection Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger className="bg-black/30 border-white/20 text-white">
                <SelectValue placeholder="Choose deflection method" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {deflectionStrategies.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id} className="text-white hover:bg-white/10">
                    {strategy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStrategy && (
              <div className="space-y-2 text-sm">
                {deflectionStrategies
                  .filter((s) => s.id === selectedStrategy)
                  .map((strategy) => (
                    <div key={strategy.id} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Cost:</span>
                        <span className="text-white font-semibold">${strategy.cost}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Success Rate:</span>
                        <span className="text-white font-semibold">{strategy.successRate}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="bg-white/20" />

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button className="w-full animate-pulse-glow text-white font-semibold" disabled={!selectedAsteroid}>
          <Play className="h-4 w-4 mr-2" />
          {simulationMode === "impact"
            ? "Simulate Impact"
            : simulationMode === "deflection"
              ? "Test Deflection"
              : "Start Tracking"}
        </Button>

        <Button
          variant="outline"
          className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
          disabled={!selectedAsteroid}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Scenario
        </Button>
      </div>

      {/* Quick Stats */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm text-white">Mission Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">Scenarios Run:</span>
            <span className="text-white font-semibold">23</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Success Rate:</span>
            <span className="text-white font-semibold">89%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Level:</span>
            <span className="text-white font-semibold">12</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
