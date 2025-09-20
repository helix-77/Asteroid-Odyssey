"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface TimelineEvent {
  time: number // seconds after impact
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
}

interface ImpactTimelineProps {
  impactResults: any
  isPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
}

export function ImpactTimeline({ impactResults, isPlaying, onPlayStateChange }: ImpactTimelineProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [activeEvents, setActiveEvents] = useState<TimelineEvent[]>([])

  const timelineEvents: TimelineEvent[] = [
    { time: 0, title: "Impact", description: "Asteroid strikes Earth surface", severity: "critical" },
    { time: 0.1, title: "Fireball Formation", description: "Superheated plasma expands rapidly", severity: "critical" },
    { time: 1, title: "Shockwave", description: "Pressure wave propagates outward", severity: "high" },
    { time: 5, title: "Crater Formation", description: "Impact crater begins to form", severity: "high" },
    { time: 30, title: "Ejecta Blanket", description: "Debris rains down in surrounding area", severity: "high" },
    { time: 60, title: "Seismic Waves", description: "Earthquake waves travel through Earth", severity: "medium" },
    { time: 300, title: "Atmospheric Effects", description: "Dust and debris enter atmosphere", severity: "medium" },
    { time: 3600, title: "Regional Impact", description: "Effects spread to wider region", severity: "medium" },
    { time: 86400, title: "Global Effects", description: "Worldwide climate impact begins", severity: "low" },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1
          if (newTime > 86400) {
            onPlayStateChange(false)
            return 86400
          }
          return newTime
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, onPlayStateChange])

  useEffect(() => {
    const active = timelineEvents.filter((event) => event.time <= currentTime && currentTime < event.time + 60)
    setActiveEvents(active)
  }, [currentTime])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white"
      case "high":
        return "bg-orange-600 text-white"
      case "medium":
        return "bg-yellow-600 text-white"
      case "low":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const reset = () => {
    setCurrentTime(0)
    onPlayStateChange(false)
  }

  if (!impactResults) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Impact Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Run an impact simulation to see timeline</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Impact Timeline
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onPlayStateChange(!isPlaying)}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Time: {formatTime(currentTime)}</span>
            <span>Progress: {((currentTime / 86400) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(currentTime / 86400) * 100} className="w-full" />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {timelineEvents.map((event, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all ${
                activeEvents.includes(event)
                  ? "border-red-500 bg-red-50 scale-105"
                  : currentTime >= event.time
                    ? "border-gray-300 bg-gray-50 opacity-60"
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{event.title}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">T+{formatTime(event.time)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
