"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp, Clock, Target } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  achievements: number
  successfulDeflections: number
  averageTime: number // minutes
  country: string
  level: number
}

const globalLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    username: "AsteroidHunter",
    score: 125000,
    achievements: 24,
    successfulDeflections: 47,
    averageTime: 12.5,
    country: "USA",
    level: 15,
  },
  {
    rank: 2,
    username: "SpaceDefender",
    score: 118500,
    achievements: 22,
    successfulDeflections: 43,
    averageTime: 14.2,
    country: "Japan",
    level: 14,
  },
  {
    rank: 3,
    username: "PlanetGuardian",
    score: 112300,
    achievements: 21,
    successfulDeflections: 41,
    averageTime: 13.8,
    country: "Germany",
    level: 13,
  },
  {
    rank: 4,
    username: "CosmicSavior",
    score: 108900,
    achievements: 20,
    successfulDeflections: 39,
    averageTime: 15.1,
    country: "Canada",
    level: 13,
  },
  {
    rank: 5,
    username: "StellarProtector",
    score: 105600,
    achievements: 19,
    successfulDeflections: 38,
    averageTime: 16.3,
    country: "UK",
    level: 12,
  },
  {
    rank: 6,
    username: "You",
    score: 89200,
    achievements: 16,
    successfulDeflections: 31,
    averageTime: 18.7,
    country: "USA",
    level: 11,
  },
]

const weeklyLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    username: "NewRookie",
    score: 15600,
    achievements: 8,
    successfulDeflections: 12,
    averageTime: 22.1,
    country: "Brazil",
    level: 5,
  },
  {
    rank: 2,
    username: "QuickShot",
    score: 14200,
    achievements: 7,
    successfulDeflections: 11,
    averageTime: 19.8,
    country: "France",
    level: 4,
  },
  {
    rank: 3,
    username: "You",
    score: 12800,
    achievements: 6,
    successfulDeflections: 9,
    averageTime: 21.5,
    country: "USA",
    level: 4,
  },
]

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState("global")

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-600" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      USA: "🇺🇸",
      Japan: "🇯🇵",
      Germany: "🇩🇪",
      Canada: "🇨🇦",
      UK: "🇬🇧",
      Brazil: "🇧🇷",
      France: "🇫🇷",
    }
    return flags[country] || "🌍"
  }

  const currentLeaderboard = activeTab === "global" ? globalLeaderboard : weeklyLeaderboard

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Leaderboard</h2>
        <p className="text-blue-200">Compete with defenders worldwide</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Global Rankings</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {currentLeaderboard.slice(0, 3).map((entry, index) => (
              <Card key={entry.username} className={`text-center ${index === 0 ? "ring-2 ring-yellow-400" : ""}`}>
                <CardContent className="p-4">
                  <div className="mb-2">{getRankIcon(entry.rank)}</div>
                  <Avatar className="mx-auto mb-2">
                    <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-sm">{entry.username}</h3>
                  <div className="text-xs text-muted-foreground mb-2">
                    {getCountryFlag(entry.country)} Level {entry.level}
                  </div>
                  <div className="text-lg font-bold text-blue-600">{entry.score.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {activeTab === "global" ? "Global" : "Weekly"} Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentLeaderboard.map((entry) => (
                  <div
                    key={entry.username}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      entry.username === "You" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>

                      <Avatar>
                        <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{entry.username}</span>
                          {entry.username === "You" && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getCountryFlag(entry.country)} Level {entry.level}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-blue-600">{entry.score.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold">31</div>
                <div className="text-sm text-muted-foreground">Successful Deflections</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold">18.7</div>
                <div className="text-sm text-muted-foreground">Avg. Time (min)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold">16</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
