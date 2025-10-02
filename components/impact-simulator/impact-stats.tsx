"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { type ImpactLocation } from "./types";

interface ImpactStatsProps {
  asteroid: any;
  impactLocation: ImpactLocation | null;
  impactResults: any;
  timeStep: number;
  animationProgress: number;
}

export function ImpactStats({
  asteroid,
  impactLocation,
  impactResults,
  timeStep,
  animationProgress,
}: ImpactStatsProps) {
  if (!impactLocation || !impactResults) {
    return (
      <div className="w-80 border-l border-border bg-card p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Asteroid Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">{asteroid.name}</h4>
              <p className="text-sm text-muted-foreground">
                {asteroid.composition}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Diameter</p>
                <p className="font-medium">{asteroid.size} m</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mass</p>
                <p className="font-medium">{formatMass(asteroid.mass)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Velocity</p>
                <p className="font-medium">{asteroid.velocity} km/s</p>
              </div>
              <div>
                <p className="text-muted-foreground">Threat Level</p>
                <Badge variant={getThreatVariant(asteroid.threat_level)}>
                  {asteroid.threat_level}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Click on the map to simulate an impact and see detailed statistics
          </p>
        </div>
      </div>
    );
  }

  // Calculate time-based effects
  const effectMultiplier = getEffectMultiplier(timeStep, animationProgress);

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Impact Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Impact Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">{asteroid.name}</h4>
              <p className="text-sm text-muted-foreground">
                {impactLocation.terrain === "water" ? "Ocean" : "Land"} impact
                at {impactLocation.lat.toFixed(2)}°,{" "}
                {impactLocation.lon.toFixed(2)}°
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <StatItem
                label="Kinetic Energy"
                value={impactResults.energyJ.value}
                unit="J"
                provenance={impactResults.energyJ}
                formatter={formatEnergy}
                testId="stat-Kinetic energy"
              />
              <StatItem
                label="TNT Equivalent"
                value={impactResults.megatonsTNT.value}
                unit="Mt"
                provenance={impactResults.megatonsTNT}
                formatter={formatMegatons}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Human Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatItem
              label="Population Casualties"
              value={impactResults.casualties.value * effectMultiplier}
              unit="people"
              provenance={impactResults.casualties}
              formatter={formatCasualties}
            />
            <StatItem
              label="Economic Damage"
              value={impactResults.economicDamageUSD.value * effectMultiplier}
              unit="USD"
              provenance={impactResults.economicDamageUSD}
              formatter={formatEconomic}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Habitable Land Lost</p>
                <p className="font-medium">
                  {Math.min(effectMultiplier * 15, 95).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Infrastructure</p>
                <p className="font-medium">
                  {Math.floor(effectMultiplier * 45)}% damaged
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Effects */}
        <Card>
          <CardHeader>
            <CardTitle>Physical Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatItem
              label="Crater Radius"
              value={impactResults.craterRadiusKm.value * effectMultiplier}
              unit="km"
              provenance={impactResults.craterRadiusKm}
              formatter={formatDistance}
              testId="stat-Crater radius"
            />
            <Separator />
            <div>
              <h5 className="font-medium mb-2">Blast Radii</h5>
              <div className="space-y-2 text-sm">
                <StatItem
                  label="Total Destruction (20 psi)"
                  value={
                    impactResults.blastRadiiKm.overpressure20psi.value *
                    effectMultiplier
                  }
                  unit="km"
                  provenance={impactResults.blastRadiiKm.overpressure20psi}
                  formatter={formatDistance}
                />
                <StatItem
                  label="Heavy Damage (10 psi)"
                  value={
                    impactResults.blastRadiiKm.overpressure10psi.value *
                    effectMultiplier
                  }
                  unit="km"
                  provenance={impactResults.blastRadiiKm.overpressure10psi}
                  formatter={formatDistance}
                />
                <StatItem
                  label="Moderate Damage (5 psi)"
                  value={
                    impactResults.blastRadiiKm.overpressure5psi.value *
                    effectMultiplier
                  }
                  unit="km"
                  provenance={impactResults.blastRadiiKm.overpressure5psi}
                  formatter={formatDistance}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Human Impact */}

        {/* Environmental Effects */}
        <Card>
          <CardHeader>
            <CardTitle>Environmental Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatItem
              label="Global Temperature Shift"
              value={impactResults.climate.tempChangeC.value * effectMultiplier}
              unit="°C"
              provenance={impactResults.climate.tempChangeC}
              formatter={formatTemperature}
            />
            <StatItem
              label="Sunlight Access"
              value={
                100 -
                impactResults.climate.habitabilityLossPct.value *
                  effectMultiplier
              }
              unit="%"
              provenance={impactResults.climate.habitabilityLossPct}
              formatter={formatPercentage}
            />
            <StatItem
              label="CO₂ Levels"
              value={
                420 +
                impactResults.climate.co2IncreasePpm.value * effectMultiplier
              }
              unit="ppm"
              provenance={impactResults.climate.co2IncreasePpm}
              formatter={formatCO2}
            />
          </CardContent>
        </Card>

        {/* Tsunami Effects (if water impact) */}
        {impactLocation.terrain === "water" && (
          <Card>
            <CardHeader>
              <CardTitle>Tsunami Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem
                label="Wave Height"
                value={
                  impactResults.tsunami.waveHeightM.value * effectMultiplier
                }
                unit="m"
                provenance={impactResults.tsunami.waveHeightM}
                formatter={formatDistance}
              />
              <StatItem
                label="Coastal Reach"
                value={Math.min(effectMultiplier * 25, 50)}
                unit="km inland"
                provenance={impactResults.tsunami.waveHeightM}
                formatter={formatDistance}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  unit: string;
  provenance: any;
  formatter: (value: number) => string;
  testId?: string;
}

function StatItem({
  label,
  value,
  unit,
  provenance,
  formatter,
  testId,
}: StatItemProps) {
  const confidenceIcon = getConfidenceIcon(provenance.confidence);
  const methodColor = getMethodColor(provenance.method);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help" data-testid={testId}>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">{label}</p>
              <div className="flex items-center gap-1">
                {confidenceIcon}
                <Badge variant="outline" className={`text-xs ${methodColor}`}>
                  {provenance.method}
                </Badge>
              </div>
            </div>
            <p className="font-medium">{formatter(value)}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Method: {provenance.method}</p>
            <p>Confidence: {provenance.confidence}</p>
            {provenance.source && (
              <p className="text-xs">{provenance.source}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getEffectMultiplier(
  timeStep: number,
  animationProgress: number
): number {
  switch (timeStep) {
    case 0:
      return 0; // Pre-impact
    case 1:
      return 0.5 + animationProgress * 0.5; // Impact: 50-100%
    case 2:
      return 0.8 + animationProgress * 0.2; // 1 day: 80-100%
    case 3:
      return 1.0; // 1 week: 100%
    case 4:
      return 1.0; // 1 year: 100%
    default:
      return 1.0;
  }
}

function getThreatVariant(level: string) {
  switch (level) {
    case "high":
      return "destructive" as const;
    case "medium":
      return "secondary" as const;
    case "low":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

function getConfidenceIcon(confidence: string) {
  switch (confidence) {
    case "high":
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case "medium":
      return <Info className="h-3 w-3 text-yellow-500" />;
    case "low":
      return <AlertTriangle className="h-3 w-3 text-red-500" />;
    default:
      return <Info className="h-3 w-3 text-gray-500" />;
  }
}

function getMethodColor(method: string): string {
  switch (method) {
    case "model":
      return "text-green-600";
    case "estimate":
      return "text-yellow-600";
    case "probabilistic":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function formatMass(mass: number): string {
  if (mass >= 1e15) return `${(mass / 1e15).toFixed(1)} Pt`;
  if (mass >= 1e12) return `${(mass / 1e12).toFixed(1)} Tt`;
  if (mass >= 1e9) return `${(mass / 1e9).toFixed(1)} Gt`;
  if (mass >= 1e6) return `${(mass / 1e6).toFixed(1)} Mt`;
  return `${mass.toExponential(2)} kg`;
}

function formatEnergy(energy: number): string {
  if (energy >= 1e18) return `${(energy / 1e18).toFixed(1)} EJ`;
  if (energy >= 1e15) return `${(energy / 1e15).toFixed(1)} PJ`;
  if (energy >= 1e12) return `${(energy / 1e12).toFixed(1)} TJ`;
  return `${energy.toExponential(2)} J`;
}

function formatMegatons(mt: number): string {
  if (mt >= 1000) return `${(mt / 1000).toFixed(1)} Gt`;
  if (mt >= 1) return `${mt.toFixed(1)} Mt`;
  if (mt >= 0.001) return `${(mt * 1000).toFixed(1)} kt`;
  return `${(mt * 1e6).toFixed(1)} t`;
}

function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)} Mm`;
  if (km >= 1) return `${km.toFixed(1)} km`;
  return `${(km * 1000).toFixed(0)} m`;
}

function formatCasualties(casualties: number): string {
  if (casualties >= 1e9) return `${(casualties / 1e9).toFixed(2)} B`;
  if (casualties >= 1e6) return `${(casualties / 1e6).toFixed(1)} M`;
  if (casualties >= 1e3) return `${(casualties / 1e3).toFixed(1)} K`;
  return casualties.toFixed(0);
}

function formatEconomic(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(1)} T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)} B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)} M`;
  return `$${usd.toFixed(0)}`;
}

function formatTemperature(temp: number): string {
  return `${temp > 0 ? "+" : ""}${temp.toFixed(1)}°C`;
}

function formatPercentage(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

function formatCO2(ppm: number): string {
  return `${ppm.toFixed(0)} ppm`;
}
