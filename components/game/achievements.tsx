"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Target, Zap, Shield, Star, Lock } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  category: "deflection" | "simulation" | "education" | "special"
  icon: string
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked: boolean
  progress?: {
    current: number
    required: number
  }
  unlockedDate?: string
}

const achievements: Achievement[] = [
  {
    id: "first-deflection",
    title: "First Contact",
    description: "Successfully deflect your first asteroid",
    category: "deflection",
    icon: "🚀",
    points: 100,
    rarity: "common",
    unlocked: true,
    unlockedDate: "2024-01-15",
  },
  {
    id: "city-savior",
    title: "City Savior",
    description: "Prevent an asteroid impact on a major city",
    category: "deflection",
    icon: "🏙️",
    points: 500,
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-01-20",
  },
  {
    id: "perfect-mission",
    title: "Flawless Victory",
    description: "Complete a deflection mission with 100% success rate",
    category: "deflection",
    icon: "⭐",
    points: 1000,
    rarity: "epic",
    unlocked: false,
    progress: { current: 2, required: 1 },
  },
  {
    id: "extinction-preventer",
    title: "Humanity's Guardian",
    description: "Prevent a global extinction event",
    category: "deflection",
    icon: "🌍",
    points: 2500,
    rarity: "legendary",
    unlocked: false,
    progress: { current: 0, required: 1 },
  },
  {
    id: "simulation-master",
    title: "Impact Analyst",
    description: "Run 50 impact simulations",
    category: "simulation",
    icon: "📊",
    points: 300,
    rarity: "common",
    unlocked: false,
    progress: { current: 23, required: 50 },
  },
  {
    id: "educator",
    title: "Knowledge Seeker",
    description: "Complete all educational modules",
    category: "education",
    icon: "📚",
    points: 750,
    rarity: "rare",
    unlocked: false,
    progress: { current: 3, required: 8 },
  },
  {
    id: "speed-runner",
    title: "Lightning Fast",
    description: "Complete a scenario in under 5 minutes",
    category: "special",
    icon: "⚡",
    points: 400,
    rarity: "rare",
    unlocked: false,
  },
  {
    id: "budget-master",
    title: "Efficient Defender",
    description: "Complete a mission under budget",
    category: "deflection",
    icon: "💰",
    points: 200,
    rarity: "common",
    unlocked: true,
    unlockedDate: "2024-01-18",
  },
]

export function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-600"
      case "rare":
        return "bg-blue-600"
      case "epic":
        return "bg-purple-600"
      case "legendary":
        return "bg-yellow-600"
      default:
        return "bg-gray-600"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "deflection":
        return <Shield className="h-4 w-4" />
      case "simulation":
        return <Target className="h-4 w-4" />
      case "education":
        return <Star className="h-4 w-4" />
      case "special":
        return <Zap className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  const filteredAchievements =
    selectedCategory === "all" ? achievements : achievements.filter((a) => a.category === selectedCategory)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalPoints = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Achievements</h2>
        <p className="text-blue-200">Track your progress and unlock rewards</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{unlockedCount}</div>
            <div className="text-sm text-muted-foreground">Achievements Unlocked</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{((unlockedCount / achievements.length) * 100).toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deflection">Deflection</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <Card key={achievement.id} className={`${!achievement.unlocked ? "opacity-75" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {achievement.unlocked ? (
                        <div className="text-2xl">{achievement.icon}</div>
                      ) : (
                        <Lock className="h-6 w-6 text-gray-400" />
                      )}
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getRarityColor(achievement.rarity)}>{achievement.rarity.toUpperCase()}</Badge>
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(achievement.category)}
                        <span className="text-xs text-muted-foreground">{achievement.points} pts</span>
                      </div>
                    </div>
                  </div>

                  {achievement.progress && !achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {achievement.progress.current}/{achievement.progress.required}
                        </span>
                      </div>
                      <Progress
                        value={(achievement.progress.current / achievement.progress.required) * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  {achievement.unlocked && achievement.unlockedDate && (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
