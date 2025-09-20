"use client"

import { useState } from "react"
import { ImpactCalculator } from "@/components/simulation/impact-calculator"
import { ImpactTimeline } from "@/components/simulation/impact-timeline"
import { DamageAssessment } from "@/components/simulation/damage-assessment"
import { AdvancedEarth3D } from "@/components/3d/advanced-earth-3d"
import type { Asteroid } from "@/lib/types"
import asteroidData from "@/data/asteroids.json"

export default function SimulationPage() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null)
  const [impactResults, setImpactResults] = useState<any>(null)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [targetLocation, setTargetLocation] = useState({ lat: 40.7128, lng: -74.006, name: "New York City" })

  const handleAsteroidSelect = (asteroid: Asteroid) => {
    setSelectedAsteroid(asteroid)
    setImpactResults(null)
  }

  const handleSimulationResults = (results: any) => {
    setImpactResults(results)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Impact Simulation Center</h1>
          <p className="text-blue-200">Analyze potential asteroid impacts and their devastating effects on Earth</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Asteroid Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-white mb-3">Select Asteroid</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {asteroidData.asteroids.map((asteroid) => (
                  <button
                    key={asteroid.id}
                    onClick={() => handleAsteroidSelect(asteroid)}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selectedAsteroid?.id === asteroid.id
                        ? "border-blue-400 bg-blue-500/20"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-medium text-white">{asteroid.name}</div>
                    <div className="text-sm text-blue-200">
                      {asteroid.diameter}m • {asteroid.composition}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <ImpactCalculator selectedAsteroid={selectedAsteroid} onSimulate={handleSimulationResults} />
          </div>

          {/* 3D Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden" style={{ height: "600px" }}>
              <AdvancedEarth3D
                selectedAsteroid={selectedAsteroid}
                impactResults={impactResults}
                targetLocation={targetLocation}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImpactTimeline
            impactResults={impactResults}
            isPlaying={isTimelinePlaying}
            onPlayStateChange={setIsTimelinePlaying}
          />

          <DamageAssessment impactResults={impactResults} targetLocation={targetLocation} />
        </div>
      </div>
    </div>
  )
}
