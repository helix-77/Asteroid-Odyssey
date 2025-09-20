"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, FileText, CheckCircle, Lock, Play } from "lucide-react"

interface LearningModule {
  id: string
  title: string
  description: string
  type: "article" | "video" | "interactive"
  duration: number // minutes
  difficulty: "beginner" | "intermediate" | "advanced"
  completed: boolean
  locked: boolean
  topics: string[]
  content: {
    sections: {
      title: string
      content: string
    }[]
  }
}

const learningModules: LearningModule[] = [
  {
    id: "asteroid-basics",
    title: "Asteroid Fundamentals",
    description: "Learn about asteroid composition, orbits, and classification systems",
    type: "article",
    duration: 15,
    difficulty: "beginner",
    completed: true,
    locked: false,
    topics: ["Composition", "Orbits", "Classification", "Discovery"],
    content: {
      sections: [
        {
          title: "What are Asteroids?",
          content:
            "Asteroids are rocky objects that orbit the Sun, primarily found in the asteroid belt between Mars and Jupiter. They are remnants from the early solar system formation.",
        },
        {
          title: "Asteroid Classification",
          content:
            "Asteroids are classified by composition: C-type (carbonaceous), S-type (silicaceous), and M-type (metallic). Each type has different properties affecting deflection strategies.",
        },
      ],
    },
  },
  {
    id: "impact-physics",
    title: "Impact Physics & Crater Formation",
    description: "Understand the physics behind asteroid impacts and crater formation",
    type: "interactive",
    duration: 25,
    difficulty: "intermediate",
    completed: true,
    locked: false,
    topics: ["Energy Release", "Crater Formation", "Blast Effects", "Seismic Waves"],
    content: {
      sections: [
        {
          title: "Impact Energy",
          content:
            "Impact energy depends on mass and velocity: E = ½mv². Even small asteroids can release tremendous energy due to their high velocities (20-70 km/s).",
        },
        {
          title: "Crater Scaling",
          content:
            "Crater diameter scales with impact energy. The relationship follows D ∝ E^0.25, meaning energy must increase 16x to double crater size.",
        },
      ],
    },
  },
  {
    id: "deflection-methods",
    title: "Deflection Technologies",
    description: "Explore different methods for deflecting potentially hazardous asteroids",
    type: "video",
    duration: 30,
    difficulty: "intermediate",
    completed: false,
    locked: false,
    topics: ["Kinetic Impact", "Nuclear Devices", "Gravity Tractors", "Solar Sails"],
    content: {
      sections: [
        {
          title: "Kinetic Impactors",
          content:
            "Direct impact missions that transfer momentum to change asteroid trajectory. NASA's DART mission successfully demonstrated this technique on Dimorphos.",
        },
        {
          title: "Nuclear Deflection",
          content:
            "Nuclear devices can provide massive energy for deflection, either through direct impact or standoff detonation to vaporize surface material.",
        },
      ],
    },
  },
  {
    id: "orbital-mechanics",
    title: "Orbital Mechanics & Trajectory Calculation",
    description: "Master the mathematics behind orbital mechanics and trajectory prediction",
    type: "interactive",
    duration: 45,
    difficulty: "advanced",
    completed: false,
    locked: false,
    topics: ["Kepler's Laws", "Orbital Elements", "Perturbations", "Mission Planning"],
    content: {
      sections: [
        {
          title: "Kepler's Laws",
          content:
            "The three laws governing planetary motion: elliptical orbits, equal areas in equal times, and the relationship between period and semi-major axis.",
        },
      ],
    },
  },
  {
    id: "planetary-defense",
    title: "Planetary Defense Systems",
    description: "Learn about global efforts to detect and defend against asteroid threats",
    type: "article",
    duration: 20,
    difficulty: "intermediate",
    completed: false,
    locked: true,
    topics: ["Detection Networks", "International Cooperation", "Response Protocols"],
    content: {
      sections: [
        {
          title: "Detection Networks",
          content:
            "Ground-based and space-based telescopes work together to discover and track potentially hazardous asteroids.",
        },
      ],
    },
  },
]

export function LearningCenter() {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null)
  const [currentSection, setCurrentSection] = useState(0)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "interactive":
        return <Play className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-600"
      case "intermediate":
        return "bg-yellow-600"
      case "advanced":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const completedCount = learningModules.filter((m) => m.completed).length
  const totalModules = learningModules.length

  if (selectedModule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedModule.title}</h2>
            <p className="text-blue-200">{selectedModule.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedModule(null)}>
            Back to Modules
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Module Content</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(selectedModule.difficulty)}>
                  {selectedModule.difficulty.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {getTypeIcon(selectedModule.type)}
                  <span className="ml-1">{selectedModule.duration} min</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {currentSection + 1}/{selectedModule.content.sections.length}
                </span>
              </div>
              <Progress value={((currentSection + 1) / selectedModule.content.sections.length) * 100} />
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{selectedModule.content.sections[currentSection].title}</h3>
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {selectedModule.content.sections[currentSection].content}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (currentSection < selectedModule.content.sections.length - 1) {
                    setCurrentSection(currentSection + 1)
                  } else {
                    // Mark as completed and return to modules
                    setSelectedModule(null)
                  }
                }}
              >
                {currentSection < selectedModule.content.sections.length - 1 ? "Next" : "Complete Module"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Learning Center</h2>
        <p className="text-blue-200">Master the science of planetary defense</p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalModules} completed
            </span>
          </div>
          <Progress value={(completedCount / totalModules) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Learning Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {learningModules.map((module) => (
          <Card key={module.id} className={`${module.locked ? "opacity-50" : ""}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(module.type)}
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {module.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {module.locked && <Lock className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{module.description}</p>

              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(module.difficulty)}>{module.difficulty.toUpperCase()}</Badge>
                <Badge variant="outline">{module.duration} min</Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Topics Covered:</h4>
                <div className="flex flex-wrap gap-1">
                  {module.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={() => setSelectedModule(module)} disabled={module.locked} className="w-full">
                {module.completed ? "Review Module" : module.locked ? "Locked" : "Start Learning"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
