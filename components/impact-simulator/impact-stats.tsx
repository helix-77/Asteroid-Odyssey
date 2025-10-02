"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info, AlertTriangle } from "lucide-react";
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
                <p className="font-medium capitalize">
                  {asteroid.threat_level}
                </p>
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
                value={impactResults.energyJ?.value || 0}
                unit="J"
                provenance={impactResults.energyJ || {}}
                formatter={formatEnergy}
                testId="stat-Kinetic energy"
              />
              <StatItem
                label="TNT Equivalent"
                value={impactResults.megatonsTNT?.value || 0}
                unit="Mt"
                provenance={impactResults.megatonsTNT || {}}
                formatter={formatMegatons}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="space-gradient">
          <CardHeader className="text-red-600">
            <CardTitle>Human Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatItem
              label="Population Casualties"
              value={(impactResults.casualties?.value || 0) * effectMultiplier}
              unit="people"
              provenance={impactResults.casualties || {}}
              formatter={formatCasualties}
            />
            <StatItem
              label="Economic Damage"
              value={
                (impactResults.economicDamageUSD?.value || 0) * effectMultiplier
              }
              unit="USD"
              provenance={impactResults.economicDamageUSD || {}}
              formatter={formatEconomic}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Habitable Land Lost</p>
                <p className="font-medium">
                  {Math.min(
                    (impactResults.climate?.habitabilityLossPct?.value || 0) *
                      effectMultiplier,
                    95
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Infrastructure</p>
                <p className="font-medium">
                  {Math.floor(
                    Math.min(
                      (impactResults.blastRadiiKm?.overpressure5psi?.value ||
                        0) *
                        effectMultiplier *
                        2,
                      100
                    )
                  )}
                  % damaged
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Effects */}
        <Card className="space-gradient">
          <CardHeader className="text-blue-600">
            <CardTitle>Physical Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatItem
              label="Crater Radius"
              value={
                (impactResults.craterRadiusKm?.value || 0) * effectMultiplier
              }
              unit="km"
              provenance={impactResults.craterRadiusKm || {}}
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
                    (impactResults.blastRadiiKm?.overpressure20psi?.value ||
                      0) * effectMultiplier
                  }
                  unit="km"
                  provenance={
                    impactResults.blastRadiiKm?.overpressure20psi || {}
                  }
                  formatter={formatDistance}
                />
                <StatItem
                  label="Heavy Damage (10 psi)"
                  value={
                    (impactResults.blastRadiiKm?.overpressure10psi?.value ||
                      0) * effectMultiplier
                  }
                  unit="km"
                  provenance={
                    impactResults.blastRadiiKm?.overpressure10psi || {}
                  }
                  formatter={formatDistance}
                />
                <StatItem
                  label="Moderate Damage (5 psi)"
                  value={
                    (impactResults.blastRadiiKm?.overpressure5psi?.value || 0) *
                    effectMultiplier
                  }
                  unit="km"
                  provenance={
                    impactResults.blastRadiiKm?.overpressure5psi || {}
                  }
                  formatter={formatDistance}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Effects */}
        <Card className="space-gradient">
          <CardHeader className="text-green-600">
            <CardTitle>Environmental Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatItem
              label="Global Temperature Shift"
              value={
                (impactResults.climate?.tempChangeC?.value || 0) *
                effectMultiplier
              }
              unit="°C"
              provenance={impactResults.climate?.tempChangeC || {}}
              formatter={formatTemperature}
            />
            <StatItem
              label="Sunlight Access"
              value={
                100 -
                (impactResults.climate?.habitabilityLossPct?.value || 0) *
                  effectMultiplier
              }
              unit="%"
              provenance={impactResults.climate?.habitabilityLossPct || {}}
              formatter={formatPercentage}
            />
            <StatItem
              label="CO₂ Levels"
              value={
                420 +
                (impactResults.climate?.co2IncreasePpm?.value || 0) *
                  effectMultiplier
              }
              unit="ppm"
              provenance={impactResults.climate?.co2IncreasePpm || {}}
              formatter={formatCO2}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Affected Area</p>
                <p className="font-medium">
                  {(
                    Math.PI *
                    Math.pow(
                      impactResults.blastRadiiKm?.overpressure1psi?.value || 0,
                      2
                    ) *
                    effectMultiplier
                  ).toFixed(0)}{" "}
                  km²
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Seismic Magnitude</p>
                <p className="font-medium">
                  {Math.max(
                    0,
                    Math.log10(
                      (impactResults.energyJ?.value || 1) * effectMultiplier
                    ) *
                      0.67 -
                      5.87
                  ).toFixed(1)}{" "}
                  Mw
                </p>
              </div>
            </div>
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
                  (impactResults.tsunami?.waveHeightM?.value || 0) *
                  effectMultiplier
                }
                unit="m"
                provenance={impactResults.tsunami?.waveHeightM || {}}
                formatter={formatDistance}
              />
              <StatItem
                label="Coastal Reach"
                value={Math.min(effectMultiplier * 25, 50)}
                unit="km inland"
                provenance={impactResults.tsunami?.waveHeightM || {}}
                formatter={formatDistance}
              />
            </CardContent>
          </Card>
        )}

        {/* FORMULA SUMMARY - Instead of confidence badges */}
        <Card className="space-gradient border border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">
              Calculation Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <p className="font-medium text-sm mb-1">Physics Formulas Used:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  • <strong>Kinetic Energy:</strong> KE = ½mv² (fundamental
                  physics)
                </p>
                <p>
                  • <strong>TNT Equivalent:</strong> 1 Mt = 4.184×10¹⁵ J
                </p>
                <p>
                  • <strong>Blast Radii:</strong> r ∝ yield^(1/3) (nuclear
                  scaling)
                </p>
                <p>
                  • <strong>Crater Size:</strong> Holsapple-Housen scaling laws
                </p>
                <p>
                  • <strong>Casualties:</strong> Zonal fatality rates ×
                  population density
                </p>
                <p>
                  • <strong>Climate:</strong> Soot/ejecta fraction models
                </p>
                {impactLocation.terrain === "water" && (
                  <p>
                    • <strong>Tsunami:</strong> Wave height ∝ energy^(1/4)
                  </p>
                )}
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="font-medium text-sm mb-1">Data Sources:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>• Nuclear weapons effects (Glasstone & Dolan 1977)</p>
                <p>• Impact crater scaling (Holsapple & Housen 2007)</p>
                <p>• Population casualty rates (empirical studies)</p>
                <p>• Economic damage models (VSL + infrastructure)</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
  // REMOVED: All confidence badges and method labels as requested
  return (
    <div data-testid={testId}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{formatter(value || 0)}</p>
    </div>
  );
}

function getEffectMultiplier(
  timeStep: number,
  animationProgress: number
): number {
  switch (timeStep) {
    case 0:
      return 1.0; // FIXED: Show full calculations even pre-impact
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

// REMOVED: getThreatVariant function as requested

// REMOVED: Confidence and method functions as requested

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
