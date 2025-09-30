"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Rocket, Target, AlertCircle } from "lucide-react";
import { calculateDeflection } from "@/lib/calculations/deflection";
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

    // Derive time to impact from close approach if available (years)
    const timeToImpactYears = (() => {
      const dateStr = selectedAsteroid?.close_approach?.date;
      if (!dateStr) return Math.max(launchWindow[0] + missionDuration[0], 3);
      const impactMs = new Date(dateStr).getTime() - Date.now();
      const years = impactMs / (365.25 * 24 * 3600 * 1000);
      return Math.max(years, 1);
    })();

    // Map UI strategy to calculation model (units in m/s, years)
    const calcStrategy = {
      id: selectedStrategy.id,
      name: selectedStrategy.name,
      deltaV: selectedStrategy.requirements.deltaV, // m/s
      leadTime: selectedStrategy.timeRequired, // years
      cost: selectedStrategy.cost, // M USD (kept consistent)
      successRate: selectedStrategy.effectiveness, // 0-1
      massRequired: selectedStrategy.requirements.mass || 1000,
    };

    // Build asteroid params for calculation
    const distanceToEarthAU = selectedAsteroid?.close_approach?.distance ?? 0.01;
    const asteroidParams = {
      mass: selectedAsteroid?.mass || 1e12, // kg
      velocity: (selectedAsteroid?.velocity || 10) * 1000, // m/s
      size: selectedAsteroid?.size || selectedAsteroid?.diameter || 100, // m
      distanceToEarth: distanceToEarthAU, // AU
      impactProbability: selectedAsteroid?.impact_probability || 0.001,
    };

    const deflection = calculateDeflection(
      calcStrategy as any,
      asteroidParams,
      timeToImpactYears,
      1e12
    );

    // Aggregate a user-facing mission plan
    const missions = numberOfMissions[0];
    const baseEff = selectedStrategy.effectiveness;
    const combinedEff = 1 - Math.pow(1 - baseEff, missions);
    const timeSlackBoost = launchWindow[0] >= calcStrategy.leadTime ? 0.05 : -0.05;
    const successProbability = Math.min(
      0.98,
      Math.max(0.02, combinedEff + timeSlackBoost)
    );

    const deltaVRequired = selectedStrategy.requirements.deltaV; // m/s
    const deltaVKmPerSec = deltaVRequired / 1000;

    // Approximate deflection distance from angular change and radius (arc length)
    const angleRad = (deflection.trajectoryChange * Math.PI) / 180;
    const arcLengthKm = angleRad * (distanceToEarthAU * 1.496e8); // AU to km

    const plan = {
      successProbability,
      totalCost: selectedStrategy.cost * missions, // millions USD
      totalTime: launchWindow[0] + missionDuration[0], // years
      deflectionDistance: Math.max(arcLengthKm, 0), // km
      deltaVRequired, // m/s
      deltaV: deltaVKmPerSec, // km/s for other consumers
      warningTime: timeToImpactYears, // years
      massRatio: (selectedStrategy.requirements.mass || 1000) / (selectedAsteroid?.mass || 1e12),
      energy: 0.5 * (selectedAsteroid?.mass || 1e12) * Math.pow(selectedAsteroid?.velocity ? selectedAsteroid.velocity * 1000 : 10000, 2), // J
      deflectionAngle: deflection.trajectoryChange, // degrees
      riskFactors: deflection.riskFactors,
      risks: deflection.riskFactors,
    };

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
      <Card className="h-full glass-morphism">
        <CardHeader>
          <CardTitle className="text-white">Mission Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-200 py-8">
            Select an asteroid and deflection strategy to plan mission
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Rocket className="h-5 w-5 text-blue-400" />
          Mission Planner
        </CardTitle>
        <p className="text-sm text-gray-200">
          Plan {selectedStrategy.name} mission for {selectedAsteroid.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Parameters */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white">
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
            <div className="text-xs text-gray-300 mt-1">
              Earlier launches have higher success rates but less preparation
              time
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white">
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
            <div className="text-xs text-gray-300 mt-1">
              Longer missions allow for more precise targeting and course
              corrections
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white">
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
            <div className="text-xs text-gray-300 mt-1">
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
            <div className="text-sm text-gray-200">
              Analyzing orbital mechanics...
            </div>
            <Progress value={75} className="w-full" />
          </div>
        )}

        {/* Mission Results */}
        {missionPlan && (
          <div className="space-y-4 border-t border-border/20 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">Mission Analysis</h4>
              <Badge
                className={getRiskLevel(missionPlan.successProbability).color}
              >
                {getRiskLevel(missionPlan.successProbability).level} RISK
              </Badge>
            </div>

            {/* Success Probability */}
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-white">Success Probability</span>
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
                <div className="text-sm text-gray-300">Total Cost</div>
                <div className="font-semibold text-white">
                  ${missionPlan.totalCost.toLocaleString()}M
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-300">Timeline</div>
                <div className="font-semibold text-white">
                  {missionPlan.totalTime} years
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-300">
                  Deflection Distance
                </div>
                <div className="font-semibold text-white">
                  {missionPlan.deflectionDistance.toLocaleString()} km
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-300">
                  Delta-V Required
                </div>
                <div className="font-semibold text-white">
                  {missionPlan.deltaVRequired.toFixed(2)} m/s
                </div>
              </div>
            </div>

            {/* Mission Timeline */}
            <div className="space-y-2">
              <h5 className="font-medium flex items-center gap-2 text-white">
                <Calendar className="h-4 w-4 text-blue-400" />
                Mission Timeline
              </h5>
              <div className="space-y-2 text-sm text-gray-200">
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
                <div className="flex justify-between font-medium text-white">
                  <span>Mission Complete</span>
                  <span>Year {launchWindow[0] + missionDuration[0]}</span>
                </div>
              </div>
            </div>

            {/* Risks and Considerations */}
            {missionPlan.risks && missionPlan.risks.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium flex items-center gap-2 text-white">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  Mission Risks
                </h5>
                <div className="space-y-1">
                  {missionPlan.risks
                    .slice(0, 3)
                    .map((risk: string, index: number) => (
                      <div
                        key={index}
                        className="text-sm text-orange-400 flex items-start gap-2"
                      >
                        <div className="w-1 h-1 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
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
