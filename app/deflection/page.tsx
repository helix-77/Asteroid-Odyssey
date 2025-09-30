"use client";

import { useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategySelector } from "@/components/deflection/strategy-selector";
import { MissionPlanner } from "@/components/deflection/mission-planner";
import DeflectionTrajectory from "@/components/3d/deflection-trajectory";
import { DeflectionMap } from "@/components/deflection/deflection-map";
import { DefenseCenterOverview } from "@/components/deflection/defense-center-overview";
import { StrategyVisualizer } from "@/components/deflection/strategy-visualizer";
import { calculateOrbitPath } from "@/lib/calculations/orbital";
import { calculateDeflection } from "@/lib/calculations/deflection";
import { Vector3 } from "three";
import { Canvas } from "@react-three/fiber";
import SceneControls from "@/components/3d/scene-controls";
import SimpleSimulation from "@/components/deflection/simple-simulation";
import {
  Shield,
  Map,
  Target,
  Rocket,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import type { Asteroid, DeflectionStrategy } from "@/lib/types";
import asteroids from "@/data/asteroids.json";
import strategiesRaw from "@/data/deflection_strategies.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function DeflectionPage() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(
    null
  );
  const [selectedStrategy, setSelectedStrategy] =
    useState<DeflectionStrategy | null>(null);
  const [deflectionResults, setDeflectionResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewRisk, setOverviewRisk] = useState<string | undefined>(
    undefined
  );
  const [overviewSort, setOverviewSort] = useState("risk");
  const [simOriginalPath, setSimOriginalPath] = useState<Vector3[]>([]);
  const [simDeflectedPath, setSimDeflectedPath] = useState<Vector3[]>([]);
  const [simInterceptPoint, setSimInterceptPoint] = useState<Vector3 | null>(
    null
  );
  const [simIsRunning, setSimIsRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simCameraMode, setSimCameraMode] = useState<
    "free" | "earth" | "asteroid"
  >("free");

  const getStrategyType = (
    id: string
  ): "kinetic" | "nuclear" | "gravity" | "solar" => {
    if (id.includes("kinetic") || id.includes("impactor")) return "kinetic";
    if (id.includes("nuclear") || id.includes("pulse")) return "nuclear";
    if (id.includes("gravity") || id.includes("tractor")) return "gravity";
    if (id.includes("solar") || id.includes("sail") || id.includes("ion"))
      return "solar";
    return "kinetic";
  };

  const transformStrategy = (raw: any): DeflectionStrategy => ({
    id: raw.id,
    name: raw.name,
    type: getStrategyType(raw.id),
    description: raw.description,
    effectiveness: raw.success_rate || 0.5,
    cost: Math.round((raw.cost || 0) / 1000000),
    timeRequired: raw.lead_time || raw.mission_duration || 1,
    technicalReadiness: raw.technology_readiness || 5,
    risks: raw.disadvantages || [],
    requirements: {
      mass: raw.mass_required || 1000,
      power: 100,
      deltaV: (raw.delta_v || 0.001) * 1000,
    },
  });

  const allStrategies: DeflectionStrategy[] = (
    strategiesRaw as any
  ).strategies.map(transformStrategy);

  const filteredAsteroids = (asteroids as any).asteroids
    .filter((a: any) =>
      overviewRisk
        ? (a.hazard_level || a.threat_level || "").toLowerCase() ===
          overviewRisk
        : true
    )
    .filter((a: any) =>
      overviewSearch
        ? `${a.name} ${a.id} ${a.composition || ""}`
            .toLowerCase()
            .includes(overviewSearch.toLowerCase())
        : true
    )
    .sort((a: any, b: any) => {
      if (overviewSort === "risk") {
        const order: any = { high: 3, medium: 2, low: 1 };
        const aL = (a.hazard_level || a.threat_level || "low").toLowerCase();
        const bL = (b.hazard_level || b.threat_level || "low").toLowerCase();
        return (order[bL] || 0) - (order[aL] || 0);
      }
      if (overviewSort === "size") return (b.size || 0) - (a.size || 0);
      if (overviewSort === "speed")
        return (b.velocity || 0) - (a.velocity || 0);
      if (overviewSort === "approach") {
        const ad = new Date(a.close_approach?.date || 0).getTime();
        const bd = new Date(b.close_approach?.date || 0).getTime();
        return ad - bd;
      }
      return 0;
    });

  // Calculate threat statistics
  const threatStats = {
    total: asteroids.asteroids.length,
    high: asteroids.asteroids.filter(
      (a: any) => (a.hazard_level || a.threat_level) === "high"
    ).length,
    medium: asteroids.asteroids.filter(
      (a: any) => (a.hazard_level || a.threat_level) === "medium"
    ).length,
    low: asteroids.asteroids.filter(
      (a: any) => (a.hazard_level || a.threat_level) === "low"
    ).length,
  };

  const runSimulation = async () => {
    if (!selectedAsteroid || !selectedStrategy || !selectedAsteroid.orbit)
      return;
    setSimError(null);
    setSimIsRunning(true);

    try {
      // Compute base orbit path (AU -> scaled space)
      const positions = calculateOrbitPath(
        selectedAsteroid.orbit as any,
        365,
        200
      );
      const scaled = positions.length
        ? positions.map((p) => new Vector3(p.x * 5, p.y * 5, p.z * 5))
        : [new Vector3(-2, 0, 0), new Vector3(0, 0, 0), new Vector3(2, 0, 0)];

      if (!scaled.length) throw new Error("No orbit points computed");

      // Choose an intercept index late in the path
      const interceptIndex = Math.max(20, Math.floor(scaled.length * 0.65));
      const intercept = scaled[interceptIndex] || new Vector3(0, 0, 0);

      // Estimate deflection angle using physics helper
      const calcStrategy = {
        id: selectedStrategy.id,
        name: selectedStrategy.name,
        deltaV: selectedStrategy.requirements.deltaV,
        leadTime: selectedStrategy.timeRequired,
        cost: selectedStrategy.cost,
        successRate: selectedStrategy.effectiveness,
        massRequired: selectedStrategy.requirements.mass || 1000,
      } as any;
      const asteroidParams = {
        mass: selectedAsteroid.mass || 1e12,
        velocity: (selectedAsteroid.velocity || 10) * 1000,
        size: selectedAsteroid.size || selectedAsteroid.diameter || 100,
        distanceToEarth: selectedAsteroid.close_approach?.distance ?? 0.01,
        impactProbability: selectedAsteroid.impact_probability || 0.001,
      };
      const timeToImpactYears = (() => {
        const d = selectedAsteroid.close_approach?.date;
        if (!d) return 5;
        const ms = new Date(d).getTime() - Date.now();
        return Math.max(ms / (365.25 * 24 * 3600 * 1000), 1);
      })();
      const deflection = calculateDeflection(
        calcStrategy,
        asteroidParams,
        timeToImpactYears,
        1e12
      );

      // Build a deflected path by adding a small perpendicular offset after intercept
      const deflected = scaled.map((v, idx) => {
        if (idx < interceptIndex) return v.clone();
        const t =
          (idx - interceptIndex + 1) / (scaled.length - interceptIndex + 1);
        const angleDeg = deflection.trajectoryChange || 0.01;
        const offsetMag = 0.2 * angleDeg * t; // stronger visual separation
        const dir = v.clone().sub(intercept).normalize();
        const perp = new Vector3(-dir.y, dir.x, 0).normalize();
        return v.clone().add(perp.multiplyScalar(offsetMag));
      });

      setSimOriginalPath(scaled);
      setSimDeflectedPath(deflected);
      setSimInterceptPoint(intercept.clone());

      // Populate Simulation Results summary
      const missions = 1;
      const baseEff = selectedStrategy.effectiveness;
      const successProbability = Math.min(0.98, Math.max(0.02, baseEff));
      const plan = {
        successProbability,
        deltaV: selectedStrategy.requirements.deltaV / 1000, // km/s
        deltaVRequired: selectedStrategy.requirements.deltaV, // m/s
        warningTime: timeToImpactYears,
        massRatio:
          (selectedStrategy.requirements.mass || 1000) /
          (selectedAsteroid?.mass || 1e12),
        energy:
          0.5 *
          (selectedAsteroid?.mass || 1e12) *
          Math.pow((selectedAsteroid?.velocity || 10) * 1000, 2),
        deflectionAngle: deflection.trajectoryChange,
        riskFactors: deflection.riskFactors,
        totalCost: selectedStrategy.cost * missions,
        totalTime: selectedStrategy.timeRequired,
        deflectionDistance: 0, // optional for now in results card
      };
      setDeflectionResults(plan);
    } catch (err: any) {
      setSimError(err?.message || "Simulation failed");
    } finally {
      setSimIsRunning(false);
    }
  };

  const resetSimulation = () => {
    setSimOriginalPath([]);
    setSimDeflectedPath([]);
    setSimInterceptPoint(null);
    setSimError(null);
  };

  return (
    <div className="min-h-screen space-gradient">
      {/* Header Navigation */}
      <header className="border-b border-border/20 glass-morphism">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-glow text-white flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Planetary Defense Center
              </h1>
              <Badge
                variant="outline"
                className="animate-pulse border-white/30 text-white"
              >
                ACTIVE
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">
                  {threatStats.high}
                </div>
                <div className="text-xs text-gray-200">High Risk</div>
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {threatStats.medium}
                </div>
                <div className="text-xs text-gray-200">Medium Risk</div>
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {threatStats.low}
                </div>
                <div className="text-xs text-gray-200">Low Risk</div>
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {threatStats.total}
                </div>
                <div className="text-xs text-gray-200">Total</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-morphism grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 text-xs sm:text-sm text-white data-[state=active]:text-black"
            >
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="defense-map"
              className="flex items-center gap-2 text-xs sm:text-sm text-white data-[state=active]:text-black"
            >
              <Map className="h-4 w-4" />
              Defense Map
            </TabsTrigger>
            <TabsTrigger
              value="strategies"
              className="flex items-center gap-2 text-xs sm:text-sm text-white data-[state=active]:text-black"
            >
              <Target className="h-4 w-4" />
              Strategies
            </TabsTrigger>
            <TabsTrigger
              value="missions"
              className="flex items-center gap-2 text-xs sm:text-sm text-white data-[state=active]:text-black"
            >
              <Rocket className="h-4 w-4" />
              Missions
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="flex items-center gap-2 text-xs sm:text-sm text-white data-[state=active]:text-black"
            >
              <Zap className="h-4 w-4" />
              Simulation
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Priority Targets */}
                <Card className="lg:col-span-3 glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Priority Targets
                    </CardTitle>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        value={overviewSearch}
                        onChange={(e) => setOverviewSearch(e.target.value)}
                        placeholder="Search by name, id, composition"
                        className="glass-morphism text-white placeholder:text-gray-400"
                      />
                      <Select
                        value={overviewRisk}
                        onValueChange={(v) => setOverviewRisk(v || undefined)}
                      >
                        <SelectTrigger className="glass-morphism text-white">
                          <SelectValue placeholder="Filter by risk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High risk</SelectItem>
                          <SelectItem value="medium">Medium risk</SelectItem>
                          <SelectItem value="low">Low risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={overviewSort}
                        onValueChange={setOverviewSort}
                      >
                        <SelectTrigger className="glass-morphism text-white">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk">Sort: Risk level</SelectItem>
                          <SelectItem value="size">Sort: Size</SelectItem>
                          <SelectItem value="speed">Sort: Speed</SelectItem>
                          <SelectItem value="approach">
                            Sort: Next approach
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] sm:max-h-[600px] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {filteredAsteroids.map((asteroid: any) => (
                        <Card
                          key={asteroid.id}
                          className={`p-4 rounded-2x bg-secondary/40 cursor-pointer transition-all ${
                            selectedAsteroid?.id === asteroid.id
                              ? "border-blue-400 bg-blue-500/20"
                              : "border-border/20 hover:bg-gray-800/50"
                          }`}
                          onClick={() => setSelectedAsteroid(asteroid)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-white text-base sm:text-lg truncate">
                              {asteroid.name}
                            </h3>
                            <Badge
                              variant={
                                (asteroid.hazard_level ||
                                  asteroid.threat_level) === "high"
                                  ? "destructive"
                                  : (asteroid.hazard_level ||
                                      asteroid.threat_level) === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {asteroid.hazard_level ||
                                asteroid.threat_level ||
                                "unknown"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                            <div>
                              <span className="text-gray-300">Size:</span>
                              <span className="text-white ml-1">
                                {asteroid.size || "—"} m
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-300">Speed:</span>
                              <span className="text-white ml-1">
                                {(asteroid.velocity || 0).toFixed(1)} km/s
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Spotlight Card */}
                <Card className="lg:col-span-2 glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                      <Shield className="h-5 w-5 text-blue-400" />
                      Threat Spotlight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const spotlight =
                        selectedAsteroid ||
                        (asteroids as any).asteroids.find(
                          (a: any) =>
                            (a.hazard_level || a.threat_level) === "high"
                        ) ||
                        (asteroids as any).asteroids[0];
                      if (!spotlight)
                        return (
                          <div className="text-gray-200">
                            No asteroid selected
                          </div>
                        );
                      const warningDate = new Date(
                        spotlight.close_approach?.date || Date.now()
                      );
                      const yrs = Math.max(
                        (warningDate.getTime() - Date.now()) /
                          (365.25 * 24 * 3600 * 1000),
                        0
                      ).toFixed(1);
                      return (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-gray-200">
                                Selected Target
                              </div>
                              <div className="text-xl font-semibold text-white">
                                {spotlight.name}
                              </div>
                            </div>
                            <Badge
                              variant={
                                (spotlight.hazard_level ||
                                  spotlight.threat_level) === "high"
                                  ? "destructive"
                                  : (spotlight.hazard_level ||
                                      spotlight.threat_level) === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {spotlight.hazard_level ||
                                spotlight.threat_level ||
                                "unknown"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                            <div className="bg-slate-900/50 rounded p-2 border border-border/20">
                              <div className="text-gray-200">Size</div>
                              <div className="text-white font-medium">
                                {spotlight.size || "—"} m
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded p-2 border border-border/20">
                              <div className="text-gray-200">Speed</div>
                              <div className="text-white font-medium">
                                {(spotlight.velocity || 0).toFixed(1)} km/s
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded p-2 border border-border/20">
                              <div className="text-gray-200">Next Approach</div>
                              <div className="text-white font-medium">
                                {yrs} years
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded p-2 border border-border/20">
                              <div className="text-gray-200">Impact Prob.</div>
                              <div className="text-white font-medium">
                                {(
                                  (spotlight.impact_probability || 0) * 100
                                ).toFixed(2)}
                                %
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => setActiveTab("strategies")}
                            >
                              View Strategies
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-white hover:text-white"
                              onClick={() => setActiveTab("missions")}
                            >
                              Plan Mission
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-white hover:text-white"
                              onClick={() => setActiveTab("simulation")}
                            >
                              Run Simulation
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Defense Map Tab */}
          <TabsContent value="defense-map">
            <DeflectionMap
              selectedAsteroid={selectedAsteroid}
              selectedStrategy={selectedStrategy}
              deflectionResults={deflectionResults}
            />
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <StrategyVisualizer
                selectedAsteroid={selectedAsteroid}
                selectedStrategy={selectedStrategy}
                onStrategySelect={setSelectedStrategy}
                deflectionResults={deflectionResults}
              />

              <div className="space-y-6">
                {/* Asteroid Selection for Strategy Analysis */}
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-white text-lg sm:text-xl">
                      Select Asteroid
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[40vh] overflow-y-auto">
                    {asteroids.asteroids
                      .sort((a: any, b: any) => {
                        const hazardOrder = {
                          high: 3,
                          medium: 2,
                          low: 1,
                        } as any;
                        const aLevel =
                          a.hazard_level || a.threat_level || "low";
                        const bLevel =
                          b.hazard_level || b.threat_level || "low";
                        return hazardOrder[bLevel] - hazardOrder[aLevel];
                      })
                      .map((asteroid: any) => (
                        <div
                          key={asteroid.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedAsteroid?.id === asteroid.id
                              ? "border-blue-400 bg-blue-500/20"
                              : "border-border/20 hover:bg-slate-800/50"
                          }`}
                          onClick={() => setSelectedAsteroid(asteroid)}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white text-sm sm:text-base">
                              {asteroid.name}
                            </h4>
                            <Badge
                              variant={
                                (asteroid.hazard_level ||
                                  asteroid.threat_level) === "high"
                                  ? "destructive"
                                  : (asteroid.hazard_level ||
                                      asteroid.threat_level) === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {asteroid.hazard_level ||
                                asteroid.threat_level ||
                                "unknown"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] sm:text-xs text-gray-200">
                            <div>
                              <span>Size:</span>
                              <span className="text-white ml-1">
                                {asteroid.size || "Unknown"}m
                              </span>
                            </div>
                            <div>
                              <span>Speed:</span>
                              <span className="text-white ml-1">
                                {(
                                  asteroid.velocity ||
                                  asteroid.relative_velocity ||
                                  0
                                ).toFixed(1)}{" "}
                                km/s
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <StrategySelector
                  selectedAsteroid={selectedAsteroid}
                  onStrategySelect={setSelectedStrategy}
                  selectedStrategy={selectedStrategy}
                />

                {/* Placeholder for calculations */}
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-white text-lg sm:text-xl">
                      Strategy Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAsteroid && selectedStrategy ? (
                      <div className="text-center text-gray-200 py-4 text-sm sm:text-base">
                        Analysis for {selectedAsteroid.name} using{" "}
                        {selectedStrategy.name}
                      </div>
                    ) : (
                      <div className="text-center text-gray-200 py-4 text-sm sm:text-base">
                        Select an asteroid and strategy for analysis
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MissionPlanner
                selectedAsteroid={selectedAsteroid}
                selectedStrategy={selectedStrategy}
                onMissionPlan={(plan) => setDeflectionResults(plan)}
              />

              {/* Mission Timeline */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Mission Timeline
                  </CardTitle>
                  {/* Inline selectors for asteroid and strategy */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Select
                        value={selectedAsteroid?.id || undefined}
                        onValueChange={(val) => {
                          const a = (asteroids as any).asteroids.find(
                            (x: any) => x.id === val
                          );
                          setSelectedAsteroid(a || null);
                        }}
                      >
                        <SelectTrigger className="glass-morphism text-white">
                          <SelectValue placeholder="Select asteroid" />
                        </SelectTrigger>
                        <SelectContent>
                          {(asteroids as any).asteroids.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={selectedStrategy?.id || undefined}
                        onValueChange={(val) => {
                          const s =
                            allStrategies.find((x) => x.id === val) || null;
                          setSelectedStrategy(s);
                        }}
                      >
                        <SelectTrigger className="glass-morphism text-white">
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          {allStrategies.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedAsteroid && selectedStrategy && deflectionResults ? (
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-border/20">
                        <h4 className="text-white font-medium mb-2">
                          Critical Milestones
                        </h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-200">
                              Mission Authorization:
                            </span>
                            <span className="text-white">
                              T-{selectedStrategy.timeRequired} years
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">
                              Launch Window:
                            </span>
                            <span className="text-white">
                              T-{Math.max(1, selectedStrategy.timeRequired - 1)}{" "}
                              years
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">
                              Intercept Point:
                            </span>
                            <span className="text-white">
                              T-
                              {Math.max(
                                0.5,
                                selectedStrategy.timeRequired - 2
                              )}{" "}
                              years
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">
                              Impact Assessment:
                            </span>
                            <span className="text-white">T-0.1 years</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                        <h4 className="text-blue-400 font-medium mb-2">
                          Success Probability
                        </h4>
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {(selectedStrategy.effectiveness * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs sm:text-sm text-blue-200">
                          Based on current technology readiness level{" "}
                          {selectedStrategy.technicalReadiness}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-200 py-8 text-sm sm:text-base">
                      Select an asteroid and strategy to view mission timeline
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visualization */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-white text-lg sm:text-xl">
                    Trajectory Simulation
                  </CardTitle>
                  {/* Inline selectors and run button */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      value={selectedAsteroid?.id || undefined}
                      onValueChange={(val) => {
                        const a = (asteroids as any).asteroids.find(
                          (x: any) => x.id === val
                        );
                        setSelectedAsteroid(a || null);
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select asteroid" />
                      </SelectTrigger>
                      <SelectContent>
                        {(asteroids as any).asteroids.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedStrategy?.id || undefined}
                      onValueChange={(val) => {
                        const s =
                          allStrategies.find((x) => x.id === val) || null;
                        setSelectedStrategy(s);
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {allStrategies.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      className="w-full"
                      disabled={
                        !selectedAsteroid || !selectedStrategy || simIsRunning
                      }
                      onClick={runSimulation}
                    >
                      {simIsRunning ? "Running..." : "Run Simulation"}
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Button
                      variant="outline"
                      className="h-7 px-3 text-white hover:text-white"
                      onClick={resetSimulation}
                    >
                      Reset
                    </Button>
                    <Select
                      value={simCameraMode}
                      onValueChange={(v: any) => setSimCameraMode(v)}
                    >
                      <SelectTrigger className="glass-morphism text-white h-7 px-3 w-[160px]">
                        <SelectValue placeholder="Camera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Camera: Free</SelectItem>
                        <SelectItem value="earth">Camera: Earth</SelectItem>
                        <SelectItem value="asteroid">
                          Camera: Asteroid
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedStrategy && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-gray-200">
                      <div className="bg-slate-900/50 rounded px-2 py-1 flex items-center justify-between border border-border/20">
                        <span>ΔV</span>
                        <span className="text-white font-medium">
                          {(
                            selectedStrategy.requirements.deltaV / 1000
                          ).toFixed(3)}{" "}
                          km/s
                        </span>
                      </div>
                      <div className="bg-slate-900/50 rounded px-2 py-1 flex items-center justify-between border border-border/20">
                        <span>Lead Time</span>
                        <span className="text-white font-medium">
                          {selectedStrategy.timeRequired} yr
                        </span>
                      </div>
                      <div className="bg-slate-900/50 rounded px-2 py-1 flex items-center justify-between border border-border/20">
                        <span>Base Success</span>
                        <span className="text-white font-medium">
                          {(selectedStrategy.effectiveness * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {simError && (
                    <div className="mb-3 text-xs sm:text-sm text-red-300 bg-red-900/30 border border-red-700/40 rounded p-2">
                      {simError}
                    </div>
                  )}
                  {selectedAsteroid && selectedStrategy && simInterceptPoint ? (
                    <SimpleSimulation
                      asteroid={selectedAsteroid}
                      strategy={selectedStrategy}
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-center text-gray-200 text-sm sm:text-base">
                      Select an asteroid and strategy, then run the simulation
                    </div>
                  )}
                  {/* Legend */}
                  {selectedAsteroid &&
                    selectedStrategy &&
                    simInterceptPoint && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-6 h-0.5 bg-red-400" />
                          <span className="text-gray-200">Original</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-6 h-0.5 bg-green-400" />
                          <span className="text-gray-200">Deflected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                          <span className="text-gray-200">Intercept</span>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Simulation Results */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-white text-lg sm:text-xl">
                    Simulation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {deflectionResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-border/20">
                          <div className="text-xl sm:text-2xl font-bold text-green-400">
                            {deflectionResults.successProbability?.toFixed(1) ||
                              "85.2"}
                            %
                          </div>
                          <div className="text-sm text-gray-200">
                            Success Rate
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-border/20">
                          <div className="text-xl sm:text-2xl font-bold text-blue-400">
                            {deflectionResults.deltaV?.toFixed(3) || "0.003"}{" "}
                            km/s
                          </div>
                          <div className="text-sm text-gray-200">
                            Delta-V Required
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3 border border-border/20">
                        <h4 className="text-white font-medium mb-2">
                          Deflection Parameters
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-200">Warning Time:</span>
                            <span className="text-white">
                              {deflectionResults.warningTime || 10} years
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">Mass Ratio:</span>
                            <span className="text-white">
                              {deflectionResults.massRatio?.toFixed(4) ||
                                "0.0001"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">
                              Energy Required:
                            </span>
                            <span className="text-white">
                              {deflectionResults.energy?.toFixed(2) || "1.2e15"}{" "}
                              J
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">
                              Deflection Angle:
                            </span>
                            <span className="text-white">
                              {deflectionResults.deflectionAngle?.toFixed(6) ||
                                "0.000123"}
                              °
                            </span>
                          </div>
                        </div>
                      </div>

                      {deflectionResults.riskFactors && (
                        <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/20">
                          <h4 className="text-yellow-400 font-medium mb-2">
                            Risk Assessment
                          </h4>
                          <ul className="text-yellow-200 text-xs sm:text-sm list-disc list-inside">
                            {deflectionResults.riskFactors.map(
                              (risk: string, i: number) => (
                                <li key={i}>{risk}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-200 py-8 text-sm sm:text-base">
                      Run deflection calculations to view simulation results
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
