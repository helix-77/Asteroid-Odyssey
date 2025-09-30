"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Satellite,
  Target,
  Rocket,
  Zap,
  Magnet,
  Sun,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Asteroid, DeflectionStrategy } from "@/lib/types";

interface DeflectionMapProps {
  selectedAsteroid: Asteroid | null;
  selectedStrategy: DeflectionStrategy | null;
  deflectionResults: any;
}

interface DefenseAsset {
  id: string;
  name: string;
  type: "observatory" | "mission_control" | "launch_site" | "communication";
  lat: number;
  lng: number;
  status: "active" | "standby" | "maintenance";
  capabilities: string[];
}

const defenseAssets: DefenseAsset[] = [
  {
    id: "nasa-jpl",
    name: "NASA JPL",
    type: "mission_control",
    lat: 34.2,
    lng: -118.17,
    status: "active",
    capabilities: ["Mission Planning", "Trajectory Analysis", "Deep Space Communication"],
  },
  {
    id: "esa-esoc",
    name: "ESA ESOC",
    type: "mission_control",
    lat: 49.87,
    lng: 8.62,
    status: "active",
    capabilities: ["European Space Operations", "Asteroid Tracking", "Mission Control"],
  },
  {
    id: "arecibo",
    name: "Arecibo Observatory",
    type: "observatory",
    lat: 18.35,
    lng: -66.75,
    status: "maintenance",
    capabilities: ["Radar Tracking", "Near-Earth Object Detection"],
  },
  {
    id: "goldstone",
    name: "Goldstone Deep Space Communications Complex",
    type: "communication",
    lat: 35.23,
    lng: -116.89,
    status: "active",
    capabilities: ["Deep Space Communication", "Radar Tracking", "Spacecraft Control"],
  },
  {
    id: "cape-canaveral",
    name: "Kennedy Space Center",
    type: "launch_site",
    lat: 28.57,
    lng: -80.65,
    status: "active",
    capabilities: ["Heavy Lift Launch", "Planetary Defense Missions", "Crew Operations"],
  },
  {
    id: "baikonur",
    name: "Baikonur Cosmodrome",
    type: "launch_site",
    lat: 45.62,
    lng: 63.31,
    status: "active",
    capabilities: ["Heavy Lift Launch", "International Cooperation", "Soyuz Operations"],
  },
  {
    id: "kourou",
    name: "Guiana Space Centre",
    type: "launch_site",
    lat: 5.24,
    lng: -52.78,
    status: "active",
    capabilities: ["Ariane Launch", "Equatorial Orbit Access", "ESA Operations"],
  },
  {
    id: "catalina",
    name: "Catalina Sky Survey",
    type: "observatory",
    lat: 32.42,
    lng: -110.73,
    status: "active",
    capabilities: ["NEO Discovery", "Follow-up Observations", "Orbit Determination"],
  },
];

export function DeflectionMap({
  selectedAsteroid,
  selectedStrategy,
  deflectionResults,
}: DeflectionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeAsset, setActiveAsset] = useState<DefenseAsset | null>(null);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [mapMode, setMapMode] = useState("defense");
  const [animationFrame, setAnimationFrame] = useState(0);

  // Animation for satellite orbits and asteroid trajectory
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case "kinetic":
        return <Rocket className="h-4 w-4" />;
      case "nuclear":
        return <Zap className="h-4 w-4" />;
      case "gravity":
        return <Magnet className="h-4 w-4" />;
      case "solar":
        return <Sun className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "observatory":
        return "🔭";
      case "mission_control":
        return "🏢";
      case "launch_site":
        return "🚀";
      case "communication":
        return "📡";
      default:
        return "📍";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "standby":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Convert lat/lng to screen coordinates (simplified Mercator-like projection)
  const projectToScreen = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            Global Defense Network
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssets(!showAssets)}
              className="text-white border-white/20"
            >
              {showAssets ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Assets
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrajectories(!showTrajectories)}
              className="text-white border-white/20"
            >
              {showTrajectories ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Trajectories
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={mapMode} onValueChange={setMapMode} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="defense">Defense Grid</TabsTrigger>
            <TabsTrigger value="strategy">Strategy View</TabsTrigger>
            <TabsTrigger value="mission">Mission Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="defense" className="mt-4">
            <div className="relative h-96 bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-white/20">
              {/* World Map Background (Simplified) */}
              <div className="absolute inset-0">
                {/* Continents (simplified shapes) */}
                <svg className="w-full h-full" viewBox="0 0 800 400">
                  {/* North America */}
                  <path
                    d="M 120 80 Q 160 60 200 80 L 180 140 Q 150 160 120 140 Z"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth="1"
                  />
                  {/* Europe */}
                  <path
                    d="M 380 60 Q 420 50 440 70 L 430 110 Q 400 120 380 100 Z"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth="1"
                  />
                  {/* Asia */}
                  <path
                    d="M 450 60 Q 520 40 580 70 L 570 130 Q 520 150 450 120 Z"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth="1"
                  />
                  {/* Africa */}
                  <path
                    d="M 360 120 Q 400 110 420 140 L 410 200 Q 380 220 360 190 Z"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth="1"
                  />
                  {/* South America */}
                  <path
                    d="M 200 160 Q 220 150 240 170 L 230 250 Q 210 270 200 240 Z"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth="1"
                  />
                  {/* Australia */}
                  <path
                    d="M 580 200 Q 620 190 640 210 L 630 240 Q 600 250 580 230 Z"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth="1"
                  />

                  {/* Grid lines */}
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.2)"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Defense Assets */}
              {showAssets &&
                defenseAssets.map((asset) => {
                  const pos = projectToScreen(asset.lat, asset.lng, 800, 400);
                  return (
                    <div
                      key={asset.id}
                      className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{
                        left: `${(pos.x / 800) * 100}%`,
                        top: `${(pos.y / 400) * 100}%`,
                      }}
                      onClick={() => setActiveAsset(asset)}
                    >
                      <div className="relative">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            asset.status
                          )} border-2 border-white shadow-lg`}
                        >
                          <div
                            className={`absolute inset-0 rounded-full ${getStatusColor(
                              asset.status
                            )} animate-ping opacity-75`}
                          ></div>
                        </div>
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                          {getAssetIcon(asset.type)}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Satellite Constellation */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 + animationFrame) % 360;
                const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
                const y = 50 + 25 * Math.sin((angle * Math.PI) / 180);
                return (
                  <div
                    key={`sat-${i}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                  >
                    <Satellite className="h-2 w-2 text-yellow-400 animate-pulse" />
                  </div>
                );
              })}

              {/* Asteroid Trajectory */}
              {selectedAsteroid && showTrajectories && (
                <div className="absolute inset-0 z-15">
                  <svg className="w-full h-full">
                    {/* Trajectory path */}
                    <path
                      d={`M ${800 + Math.cos((animationFrame * Math.PI) / 180) * 100} ${
                        100 + Math.sin((animationFrame * Math.PI) / 180) * 50
                      } Q 600 150 400 200`}
                      fill="none"
                      stroke="rgba(239, 68, 68, 0.6)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    {/* Asteroid position */}
                    <circle
                      cx={800 - (animationFrame * 2) % 600}
                      cy={100 + Math.sin((animationFrame * Math.PI) / 90) * 50}
                      r="4"
                      fill="#ef4444"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              )}

              {/* Asset Details Popup */}
              {activeAsset && (
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 max-w-xs z-30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm">
                      {activeAsset.name}
                    </h4>
                    <button
                      onClick={() => setActiveAsset(null)}
                      className="text-white/60 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs text-white/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${getStatusColor(activeAsset.status)} text-white`}
                      >
                        {activeAsset.status}
                      </Badge>
                      <span>{activeAsset.type.replace("_", " ")}</span>
                    </div>
                    <div className="text-white/60">
                      Capabilities:
                      <ul className="list-disc list-inside ml-2">
                        {activeAsset.capabilities.map((cap, i) => (
                          <li key={i}>{cap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="mt-4">
            <div className="relative h-96 bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-white/20">
              {selectedStrategy ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4">
                      {getStrategyIcon(selectedStrategy.type || "kinetic")}
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">
                      {selectedStrategy.name}
                    </h3>
                    <p className="text-white/80 text-sm max-w-md">
                      {selectedStrategy.description}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                      <div className="bg-white/10 rounded p-2">
                        <div className="text-white/60">Effectiveness</div>
                        <div className="text-white font-semibold">
                          {((selectedStrategy.effectiveness || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2">
                        <div className="text-white/60">Cost</div>
                        <div className="text-white font-semibold">
                          ${selectedStrategy.cost || 0}M
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2">
                        <div className="text-white/60">Time</div>
                        <div className="text-white font-semibold">
                          {selectedStrategy.timeRequired || 0}y
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  Select a deflection strategy to view details
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mission" className="mt-4">
            <div className="relative h-96 bg-gradient-to-br from-green-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-white/20">
              {deflectionResults ? (
                <div className="absolute inset-0 p-4">
                  <h3 className="text-white text-lg font-semibold mb-4">
                    Mission Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-white/10 rounded p-3">
                        <div className="text-white/60 text-sm">Best Strategy</div>
                        <div className="text-white font-semibold">
                          {deflectionResults.comparison?.[0]?.strategy?.name || "N/A"}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <div className="text-white/60 text-sm">Success Rate</div>
                        <div className="text-white font-semibold">
                          {deflectionResults.comparison?.[0]?.missionSuccess
                            ? "High"
                            : "Moderate"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/10 rounded p-3">
                        <div className="text-white/60 text-sm">Warning Time</div>
                        <div className="text-white font-semibold">
                          {deflectionResults.warningTime || 0} years
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <div className="text-white/60 text-sm">Risk Reduction</div>
                        <div className="text-white font-semibold">
                          {(
                            (deflectionResults.comparison?.[0]
                              ?.impactProbabilityReduction || 0) * 100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  Run deflection calculations to view mission plan
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}