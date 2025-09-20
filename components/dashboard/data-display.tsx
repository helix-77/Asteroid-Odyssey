"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Users, Building, Zap, Clock } from "lucide-react"

interface DataDisplayProps {
  selectedAsteroid: string | null
  simulationMode: "tracking" | "impact" | "deflection"
}

// Mock impact data
const impactData = {
  energy: "2.5e15 J",
  tntEquivalent: "597 kt",
  craterDiameter: "1.85 km",
  craterDepth: "380 m",
  casualties: {
    immediate: 125000,
    injured: 450000,
    displaced: 2000000,
  },
  economicImpact: "$2.4T",
  affectedArea: "15,600 km²",
}

const trackingData = {
  velocity: "15.5 km/s",
  distance: "0.0031 AU",
  approachDate: "2025-09-15",
  probability: "0.23%",
  magnitude: "18.2",
  period: "2.1 years",
}

export default function DataDisplay({ selectedAsteroid, simulationMode }: DataDisplayProps) {
  if (!selectedAsteroid) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an asteroid to view data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Tracking Mode Data */}
      {simulationMode === "tracking" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Orbital Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Velocity:</span>
                <span className="font-mono">{trackingData.velocity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-mono">{trackingData.distance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approach:</span>
                <span className="font-mono">{trackingData.approachDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impact Prob:</span>
                <Badge variant="warning" className="text-xs">
                  {trackingData.probability}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Threat Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Risk Level</span>
                  <span>High</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Certainty</span>
                  <span>89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Impact Mode Data */}
      {simulationMode === "impact" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Impact Energy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energy:</span>
                <span className="font-mono">{impactData.energy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TNT Equiv:</span>
                <span className="font-mono">{impactData.tntEquivalent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crater Ø:</span>
                <span className="font-mono">{impactData.craterDiameter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depth:</span>
                <span className="font-mono">{impactData.craterDepth}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Casualties</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Immediate:</span>
                <span className="font-mono text-destructive">{impactData.casualties.immediate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Injured:</span>
                <span className="font-mono text-warning">{impactData.casualties.injured.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Displaced:</span>
                <span className="font-mono">{impactData.casualties.displaced.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Economic Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Damage:</span>
                <span className="font-mono text-destructive">{impactData.economicImpact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Affected Area:</span>
                <span className="font-mono">{impactData.affectedArea}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Deflection Mode Data */}
      {simulationMode === "deflection" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mission Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Launch Window:</span>
                  <span>2025-03-15</span>
                </div>
                <div className="flex justify-between">
                  <span>Intercept Date:</span>
                  <span>2025-08-20</span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Time:</span>
                  <span>10 years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Success Probability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Mission Success</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Deflection Eff.</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Separator />

      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tracking:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Calculations:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Processing</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last Update:</span>
            <span>2s ago</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
