"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StoryMode } from "@/components/game/story-mode"
import { Achievements } from "@/components/game/achievements"
import { Leaderboard } from "@/components/game/leaderboard"
import { LearningCenter } from "@/components/education/learning-center"

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900">
      <div className="container mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Asteroid Defense Academy</h1>
          <p className="text-indigo-200">Train, compete, and become Earth's ultimate defender</p>
        </div>

        <Tabs defaultValue="story" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="story">Story Mode</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="learning">Learning Center</TabsTrigger>
          </TabsList>

          <TabsContent value="story">
            <StoryMode />
          </TabsContent>

          <TabsContent value="achievements">
            <Achievements />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="learning">
            <LearningCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
