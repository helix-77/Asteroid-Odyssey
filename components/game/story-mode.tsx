"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, ChevronRight, Award, Clock } from "lucide-react"

interface StoryScenario {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "expert"
  estimatedTime: number // minutes
  objectives: string[]
  asteroid: string
  location: string
  timeLimit: number // years
  successCriteria: {
    deflectionSuccess: number
    casualtyLimit: number
    budgetLimit: number
  }
  rewards: {
    points: number
    achievements: string[]
  }
}

const storyScenarios: StoryScenario[] = [
  {
    id: "tutorial",
    title: "First Contact",
    description: "A small asteroid threatens a remote research station. Learn the basics of asteroid deflection.",
    difficulty: "beginner",
    estimatedTime: 15,
    objectives: [
      "Analyze the incoming asteroid",
      "Select an appropriate deflection strategy",
      "Execute the mission successfully",
    ],
    asteroid: "2023 DZ2",
    location: "Antarctic Research Station",
    timeLimit: 5,
    successCriteria: {
      deflectionSuccess: 0.7,
      casualtyLimit: 100,
      budgetLimit: 500,
    },
    rewards: {
      points: 1000,
      achievements: ["First Deflection", "Rookie Defender"],
    },
  },
  {
    id: "city-threat",
    title: "Urban Crisis",
    description: "A medium-sized asteroid is on collision course with New York City. Time is running out.",
    difficulty: "intermediate",
    estimatedTime: 30,
    objectives: [
      "Assess the threat to 8 million people",
      "Choose between multiple deflection options",
      "Coordinate international response",
      "Minimize casualties and economic damage",
    ],
    asteroid: "2024 FH5",
    location: "New York City",
    timeLimit: 3,
    successCriteria: {
      deflectionSuccess: 0.85,
      casualtyLimit: 10000,
      budgetLimit: 2000,
    },
    rewards: {
      points: 5000,
      achievements: ["City Savior", "Crisis Manager"],
    },
  },
  {
    id: "global-extinction",
    title: "Extinction Event",
    description: "A massive asteroid threatens all life on Earth. This is humanity's greatest challenge.",
    difficulty: "expert",
    estimatedTime: 60,
    objectives: [
      "Analyze the 10km diameter threat",
      "Coordinate global space agencies",
      "Deploy multiple deflection missions",
      "Prevent human extinction",
    ],
    asteroid: "2025 XK1",
    location: "Global Impact",
    timeLimit: 8,
    successCriteria: {
      deflectionSuccess: 0.95,
      casualtyLimit: 1000000,
      budgetLimit: 50000,
    },
    rewards: {
      points: 25000,
      achievements: ["Humanity's Savior", "Master Defender", "Legend"],
    },
  },
]

export function StoryMode() {
  const [selectedScenario, setSelectedScenario] = useState<StoryScenario | null>(null)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-600"
      case "intermediate":
        return "bg-yellow-600"
      case "expert":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const startScenario = (scenario: StoryScenario) => {
    setSelectedScenario(scenario)
    setCurrentProgress(0)
  }

  const isScenarioUnlocked = (scenario: StoryScenario, index: number) => {
    if (index === 0) return true
    return completedScenarios.includes(storyScenarios[index - 1].id)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Story Mode</h2>
        <p className="text-blue-200">Experience realistic asteroid threat scenarios</p>
      </div>

      {!selectedScenario ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyScenarios.map((scenario, index) => (
            <Card key={scenario.id} className={`${!isScenarioUnlocked(scenario, index) ? "opacity-50" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  <Badge className={getDifficultyColor(scenario.difficulty)}>{scenario.difficulty.toUpperCase()}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{scenario.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{scenario.estimatedTime} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4" />
                    <span>{scenario.rewards.points} points</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Objectives:</h4>
                  <ul className="text-xs space-y-1">
                    {scenario.objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => startScenario(scenario)}
                  disabled={!isScenarioUnlocked(scenario, index)}
                  className="w-full"
                >
                  {completedScenarios.includes(scenario.id) ? (
                    <>Replay Scenario</>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Mission
                    </>
                  )}
                </Button>

                {completedScenarios.includes(scenario.id) && (
                  <div className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Completed
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedScenario.title}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedScenario(null)}>
                Back to Scenarios
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Mission Briefing</h3>
              <p className="text-sm mb-4">{selectedScenario.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Target:</span> {selectedScenario.asteroid}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {selectedScenario.location}
                </div>
                <div>
                  <span className="font-medium">Time Limit:</span> {selectedScenario.timeLimit} years
                </div>
                <div>
                  <span className="font-medium">Budget:</span> ${selectedScenario.successCriteria.budgetLimit}M
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mission Progress</span>
                <span>{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="w-full" />
            </div>

            <div className="text-center">
              <Button size="lg" className="px-8">
                Continue Mission
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
