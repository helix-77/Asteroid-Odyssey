"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Target,
  Globe,
  Satellite,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Rocket,
  Zap,
  Magnet,
  Sun,
  Eye,
  Activity,
} from "lucide-react";
import type { Asteroid } from "@/lib/types";
import asteroidData from "@/data/asteroids.json";
import deflectionData from "@/data/deflection_strategies.json";

interface DefenseCenterOverviewProps {
  selectedAsteroid: Asteroid | null;
  onAsteroidSelect: (asteroid: any) => void;
  deflectionResults: any;
}

interface ThreatStatus {
  level: "low" | "medium" | "high" | "critical";
  count: number;
  color: string;
}

interface SystemStatus {
  name: string;
  status: "online" | "standby" | "maintenance" | "offline";
  efficiency: number;
  lastUpdate: string;
}

export function DefenseCenterOverview({
  selectedAsteroid,
  onAsteroidSelect,
  deflectionResults,
}: DefenseCenterOverviewProps) {
  const [systemTime, setSystemTime] = useState(new Date());
  const [alertLevel, setAlertLevel] = useState<"green" | "yellow" | "orange" | "red">("green");

  // Update system time
  useEffect(() => {
    const interval = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate threat statistics
  const threatStats: ThreatStatus[] = [
    {
      level: "critical",
      count: asteroidData.asteroids.filter((a) => a.threat_level === "high" && a.impact_probability > 0.001).length,
      color: "bg-red-600",
    },
    {
      level: "high",
      count: asteroidData.asteroids.filter((a) => a.threat_level === "high").length,
      color: "bg-orange-600",
    },
    {
      level: "medium",
      count: asteroidData.asteroids.filter((a) => a.threat_level === "medium").length,
      color: "bg-yellow-600",
    },
    {
      level: "low",
      count: asteroidData.asteroids.filter((a) => a.threat_level === "low").length,
      color: "bg-green-600",
    },
  ];

  // System status
  const systemStatus: SystemStatus[] = [
    {
      name: "Early Warning Network",
      status: "online",
      efficiency: 98,
      lastUpdate: "12:34:56 UTC",
    },
    {
      name: "Tracking Systems",
      status: "online",
      efficiency: 95,
      lastUpdate: "12:34:52 UTC",
    },
    {
      name: "Mission Planning",
      status: "online",
      efficiency: 100,
      lastUpdate: "12:34:58 UTC",
    },
    {
      name: "Launch Systems",
      status: "standby",
      efficiency: 85,
      lastUpdate: "12:30:15 UTC",
    },
  ];

  // Calculate overall alert level
  useEffect(() => {
    const criticalThreats = threatStats[0].count;
    const highThreats = threatStats[1].count;
    
    if (criticalThreats > 0) setAlertLevel("red");
    else if (highThreats > 2) setAlertLevel("orange");
    else if (highThreats > 0) setAlertLevel("yellow");
    else setAlertLevel("green");
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "standby":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "offline":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case "red":
        return "bg-red-600";
      case "orange":
        return "bg-orange-600";
      case "yellow":
        return "bg-yellow-600";
      case "green":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  const priorityThreats = asteroidData.asteroids
    .filter((a) => a.threat_level !== "low")
    .sort((a, b) => b.impact_probability - a.impact_probability)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Command Center Header */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-2xl text-white">
                  Planetary Defense Command Center
                </CardTitle>
                <p className="text-slate-300">
                  Global asteroid threat monitoring and deflection coordination
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-mono text-lg">
                {systemTime.toUTCString().split(" ")[4]} UTC
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getAlertColor(alertLevel)} animate-pulse`}></div>
                <span className="text-slate-300 text-sm">
                  Alert Level: {alertLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Threat Overview */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-red-400" />
              Threat Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threatStats.map((threat) => (
                <div key={threat.level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${threat.color}`}></div>
                    <span className="text-white capitalize">{threat.level}</span>
                  </div>
                  <Badge variant="outline" className="text-white">
                    {threat.count}
                  </Badge>
                </div>
              ))}
              
              <div className="pt-3 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {asteroidData.asteroids.length}
                  </div>
                  <div className="text-sm text-slate-300">Total Tracked Objects</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.map((system) => (
                <div key={system.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(system.status)}
                      <span className="text-white text-sm">{system.name}</span>
                    </div>
                    <span className="text-xs text-slate-300">{system.efficiency}%</span>
                  </div>
                  <Progress value={system.efficiency} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Threats */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Priority Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {priorityThreats.map((asteroid) => (
                <button
                  key={asteroid.id}
                  onClick={() => onAsteroidSelect(asteroid)}
                  className={`w-full text-left p-2 rounded border transition-all ${
                    selectedAsteroid?.id === asteroid.id
                      ? "border-purple-400 bg-purple-500/20"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-white text-sm">
                      {asteroid.name}
                    </div>
                    <Badge
                      variant={asteroid.threat_level === "high" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {asteroid.threat_level}
                    </Badge>
                  </div>
                  <div className="text-xs text-purple-200">
                    {asteroid.size}m • P: {(asteroid.impact_probability * 100).toFixed(3)}%
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defense Capabilities */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-400" />
              Defense Arsenal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deflectionData.strategies.slice(0, 4).map((strategy) => {
                const getIcon = (id: string) => {
                  if (id.includes("kinetic")) return <Rocket className="h-4 w-4" />;
                  if (id.includes("nuclear")) return <Zap className="h-4 w-4" />;
                  if (id.includes("gravity")) return <Magnet className="h-4 w-4" />;
                  return <Sun className="h-4 w-4" />;
                };

                return (
                  <div key={strategy.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(strategy.id)}
                      <span className="text-white text-sm">{strategy.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-300">
                        TRL {strategy.technology_readiness}
                      </div>
                      <div className="text-xs text-slate-300">
                        {(strategy.success_rate * 100).toFixed(0)}% success
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Status (if active) */}
      {selectedAsteroid && deflectionResults && (
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-400/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Active Mission Analysis: {selectedAsteroid.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {deflectionResults.comparison?.[0]?.strategy?.name || "N/A"}
                </div>
                <div className="text-sm text-purple-200">Recommended Strategy</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {(deflectionResults.comparison?.[0]?.impactProbabilityReduction * 100).toFixed(1) || "0"}%
                </div>
                <div className="text-sm text-purple-200">Risk Reduction</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {deflectionResults.warningTime || 0}
                </div>
                <div className="text-sm text-purple-200">Years Warning Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {deflectionResults.comparison?.[0]?.missionSuccess ? "HIGH" : "MEDIUM"}
                </div>
                <div className="text-sm text-purple-200">Success Probability</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
          <Globe className="h-4 w-4 mr-2" />
          Global Monitoring
        </Button>
        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
          <Satellite className="h-4 w-4 mr-2" />
          Satellite Network
        </Button>
        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
          <Eye className="h-4 w-4 mr-2" />
          Mission Control
        </Button>
      </div>
    </div>
  );
}