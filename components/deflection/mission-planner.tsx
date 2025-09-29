"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Rocket, Target, AlertCircle } from "lucide-react";
import { assessMissionSuccess } from "@/lib/calculations/deflection";
import type { DeflectionStrategy, Asteroid } from "@/lib/types";

interface MissionPlannerProps {
  selectedAsteroid: Asteroid | null;
  selectedStrategy: DeflectionStrategy | null;
  onMissionPlan: (plan: any) => void;
}

export function MissionPlanner({
  selectedAsteroid,
  selectedStrategy,
  onMissionPlan,
}: MissionPlannerProps) {
  const [launchWindow, setLaunchWindow] = useState([2]);
  const [missionDuration, setMissionDuration] = useState([3]);
  const [numberOfMissions, setNumberOfMissions] = useState([1]);
  const [missionPlan, setMissionPlan] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateMission = async () => {
    if (!selectedAsteroid || !selectedStrategy) return;

    setIsCalculating(true);

    // Simulate calculation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const plan = assessMissionSuccess(
      selectedStrategy,
      10, // lead time in years
      selectedAsteroid?.diameter || 500,
      selectedAsteroid?.mass || 1e12
    );

    setMissionPlan(plan);
    onMissionPlan(plan);
    setIsCalculating(false);
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 0.8) return "text-green-600";
    if (probability >= 0.6) return "text-yellow-600";
    if (probability >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 0.8) return { level: "LOW", color: "bg-green-600" };
    if (probability >= 0.6) return { level: "MEDIUM", color: "bg-yellow-600" };
    if (probability >= 0.4) return { level: "HIGH", color: "bg-orange-600" };
    return { level: "CRITICAL", color: "bg-red-600" };
  };

  if (!selectedAsteroid || !selectedStrategy) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Mission Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select an asteroid and deflection strategy to plan mission
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-blue-600" />
          Mission Planner
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Plan {selectedStrategy.name} mission for {selectedAsteroid.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Parameters */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Launch Window: {launchWindow[0]} years from now
            </label>
            <Slider
              value={launchWindow}
              onValueChange={setLaunchWindow}
              max={10}
              min={1}
              step={0.5}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Earlier launches have higher success rates but less preparation
              time
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Mission Duration: {missionDuration[0]} years
            </label>
            <Slider
              value={missionDuration}
              onValueChange={setMissionDuration}
              max={8}
              min={1}
              step={0.5}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Longer missions allow for more precise targeting and course
              corrections
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Number of Missions: {numberOfMissions[0]}
            </label>
            <Slider
              value={numberOfMissions}
              onValueChange={setNumberOfMissions}
              max={5}
              min={1}
              step={1}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Multiple missions increase success probability but multiply costs
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={calculateMission}
          disabled={isCalculating}
          className="w-full"
        >
          {isCalculating ? "Calculating Mission..." : "Calculate Mission Plan"}
        </Button>

        {/* Calculation Progress */}
        {isCalculating && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Analyzing orbital mechanics...
            </div>
            <Progress value={75} className="w-full" />
          </div>
        )}

        {/* Mission Results */}
        {missionPlan && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Mission Analysis</h4>
              <Badge
                className={getRiskLevel(missionPlan.successProbability).color}
              >
                {getRiskLevel(missionPlan.successProbability).level} RISK
              </Badge>
            </div>

            {/* Success Probability */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Success Probability</span>
              </div>
              <div
                className={`text-3xl font-bold ${getSuccessColor(
                  missionPlan.successProbability
                )}`}
              >
                {(missionPlan.successProbability * 100).toFixed(1)}%
              </div>
              <Progress
                value={missionPlan.successProbability * 100}
                className="mt-2"
              />
            </div>

            {/* Mission Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="font-semibold">
                  ${missionPlan.totalCost.toLocaleString()}M
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Timeline</div>
                <div className="font-semibold">
                  {missionPlan.totalTime} years
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Deflection Distance
                </div>
                <div className="font-semibold">
                  {missionPlan.deflectionDistance.toLocaleString()} km
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Delta-V Required
                </div>
                <div className="font-semibold">
                  {missionPlan.deltaVRequired.toFixed(2)} m/s
                </div>
              </div>
            </div>

            {/* Mission Timeline */}
            <div className="space-y-2">
              <h5 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mission Timeline
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mission Planning & Development</span>
                  <span>{launchWindow[0] - 1} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Launch Window</span>
                  <span>Year {launchWindow[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transit to Target</span>
                  <span>{missionDuration[0] - 0.5} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Deflection Operation</span>
                  <span>6 months</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Mission Complete</span>
                  <span>Year {launchWindow[0] + missionDuration[0]}</span>
                </div>
              </div>
            </div>

            {/* Risks and Considerations */}
            {missionPlan.risks && missionPlan.risks.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Mission Risks
                </h5>
                <div className="space-y-1">
                  {missionPlan.risks
                    .slice(0, 3)
                    .map((risk: string, index: number) => (
                      <div
                        key={index}
                        className="text-sm text-orange-600 flex items-start gap-2"
                      >
                        <div className="w-1 h-1 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                        {risk}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
