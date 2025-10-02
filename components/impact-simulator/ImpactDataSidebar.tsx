"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Skull,
  Users,
  Home,
  Building2,
  Zap,
  Landmark,
  DollarSign,
  Thermometer,
  Cloud,
  Waves,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { ComprehensiveImpactResults } from "@/lib/calculations/comprehensive-impact";
import {
  formatLargeNumber,
  formatCurrency,
} from "@/lib/calculations/comprehensive-impact";

interface ImpactDataSidebarProps {
  results: ComprehensiveImpactResults;
}

export default function ImpactDataSidebar({ results }: ImpactDataSidebarProps) {
  const AccuracyBadge = ({ accuracy }: { accuracy: string }) => {
    const colors = {
      measured: "bg-green-500 border-green-600",
      calculated: "bg-blue-500 border-blue-600",
      estimated: "bg-yellow-500 border-yellow-600",
      probability: "bg-orange-500 border-orange-600",
    };

    const icons = {
      measured: "✓",
      calculated: "≈",
      estimated: "~",
      probability: "?",
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className={`text-xs ${
                colors[accuracy as keyof typeof colors]
              } text-white border-2 font-semibold`}
            >
              {icons[accuracy as keyof typeof icons]} {accuracy}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-semibold mb-1">Accuracy Level: {accuracy.toUpperCase()}</p>
            <p className="text-xs">
              {accuracy === "measured" && "✓ Based on direct measurements and observations"}
              {accuracy === "calculated" && "≈ Calculated using validated physics models"}
              {accuracy === "estimated" && "~ Estimated from available data and models"}
              {accuracy === "probability" && "? Probabilistic estimate based on scenarios"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Energy */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Impact Energy
            </h3>
            <AccuracyBadge accuracy={results.energy.accuracy} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">TNT Equivalent:</span>
              <span className="font-bold text-yellow-500">
                {formatLargeNumber(results.energy.tntEquivalent)} kilotons
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kinetic Energy:</span>
              <span className="font-semibold">
                {(results.energy.kineticEnergy / 1e15).toExponential(2)} PJ
              </span>
            </div>
          </div>
        </Card>

        {/* 1. Geological Destruction */}
        <Card className="p-4 border-red-500/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Geological Destruction
            </h3>
            <AccuracyBadge accuracy={results.geological.crater.accuracy} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Crater</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Diameter:</span>
                  <span className="font-semibold">
                    {(results.geological.crater.diameter / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Depth:</span>
                  <span className="font-semibold">
                    {results.geological.crater.depth.toFixed(0)} m
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Explosion Strength
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Richter Scale:</span>
                  <span className="font-bold text-red-500">
                    {results.geological.explosionStrength.richterScale.toFixed(
                      1
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Destruction Zones
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Destruction:</span>
                  <span className="font-semibold text-red-500">
                    {results.geological.impactRegion.totalDestructionRadius.toFixed(
                      1
                    )}{" "}
                    km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Severe Damage:</span>
                  <span className="font-semibold text-orange-500">
                    {results.geological.impactRegion.severeDestructionRadius.toFixed(
                      1
                    )}{" "}
                    km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Moderate Damage:</span>
                  <span className="font-semibold text-yellow-500">
                    {results.geological.impactRegion.moderateDestructionRadius.toFixed(
                      1
                    )}{" "}
                    km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Affected Area:</span>
                  <span className="font-semibold">
                    {formatLargeNumber(
                      results.geological.impactRegion.affectedArea
                    )}{" "}
                    km²
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Population Casualties */}
        <Card className="p-4 border-red-500/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-500" />
              Population Casualties
            </h3>
            <AccuracyBadge accuracy={results.casualties.immediate.accuracy} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Immediate (T+0)
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Deaths:</span>
                  <span className="font-bold text-red-500">
                    {formatLargeNumber(results.casualties.immediate.deaths)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Vaporized:</span>
                  <span>
                    {formatLargeNumber(results.casualties.immediate.vaporized)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Crushed:</span>
                  <span>
                    {formatLargeNumber(results.casualties.immediate.crushed)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Short-Term (24 Hours)
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Additional Deaths:</span>
                  <span className="font-semibold">
                    {formatLargeNumber(results.casualties.shortTerm.deaths)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Injuries:</span>
                  <span className="font-semibold text-orange-500">
                    {formatLargeNumber(results.casualties.shortTerm.injuries)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Long-Term
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Displaced:</span>
                  <span className="font-semibold text-yellow-500">
                    {formatLargeNumber(results.casualties.longTerm.displaced)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Refugees:</span>
                  <span className="font-semibold">
                    {formatLargeNumber(results.casualties.longTerm.refugees)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-red-500/10 p-2 rounded">
              <div className="text-xs text-muted-foreground mb-1">
                Total Estimated
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Deaths:</span>
                  <span className="font-bold text-red-500">
                    {formatLargeNumber(
                      results.casualties.total.estimatedDeaths
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Injured:</span>
                  <span className="font-bold text-orange-500">
                    {formatLargeNumber(
                      results.casualties.total.estimatedInjured
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Infrastructure Damage */}
        <Card className="p-4 border-orange-500/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              Infrastructure Damage
            </h3>
            <AccuracyBadge
              accuracy={results.infrastructure.civilian.accuracy}
            />
          </div>

          <div className="space-y-3">
            {/* Civilian */}
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Home className="h-3 w-3" /> Civilian
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Buildings Destroyed:</span>
                  <span className="font-semibold">
                    {formatLargeNumber(
                      results.infrastructure.civilian.buildingsDestroyed
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Homes Destroyed:</span>
                  <span className="font-semibold">
                    {formatLargeNumber(
                      results.infrastructure.civilian.homesDestroyed
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hospitals Damaged:</span>
                  <span className="font-semibold">
                    {results.infrastructure.civilian.hospitalsDamaged}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Energy */}
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Energy Infrastructure
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Power Plants Destroyed:</span>
                  <span className="font-semibold">
                    {results.infrastructure.energy.powerPlantsDestroyed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Grid Damage:</span>
                  <span className="font-semibold text-orange-500">
                    {results.infrastructure.energy.gridDamage.toFixed(1)}%
                  </span>
                </div>
                {results.infrastructure.energy.nuclearFalloutRisk > 0 && (
                  <div className="flex justify-between">
                    <span>Nuclear Fallout Risk:</span>
                    <span className="font-bold text-red-500">
                      {(
                        results.infrastructure.energy.nuclearFalloutRisk * 100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Economic */}
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Economic Impact
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Direct Damage:</span>
                  <span className="font-bold text-red-500">
                    {formatCurrency(
                      results.infrastructure.economic.directDamage
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Indirect Damage:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      results.infrastructure.economic.indirectDamage
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lost Production/Year:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      results.infrastructure.economic.lostProduction
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recovery Time:</span>
                  <span className="font-semibold">
                    {results.infrastructure.economic.recoveryTime.toFixed(0)}{" "}
                    years
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Survival */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Survival Challenges
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Food Production</span>
                    <span className="font-semibold">
                      {(
                        100 - results.infrastructure.survival.foodProductionLoss
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${
                          100 -
                          results.infrastructure.survival.foodProductionLoss
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Water Supply</span>
                    <span className="font-semibold">
                      {(
                        100 - results.infrastructure.survival.waterSupplyDamage
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${
                          100 -
                          results.infrastructure.survival.waterSupplyDamage
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Climate Damage */}
        <Card className="p-4 border-blue-500/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-500" />
              Climate Impact
            </h3>
            <AccuracyBadge accuracy={results.climate.temperature.accuracy} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Temperature Changes
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Immediate:</span>
                  <span className="font-semibold">
                    {results.climate.temperature.immediateChange > 0 ? "+" : ""}
                    {results.climate.temperature.immediateChange.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Short-Term (1 year):</span>
                  <span className="font-semibold text-blue-500">
                    {results.climate.temperature.shortTermChange.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Long-Term (10 years):</span>
                  <span className="font-semibold">
                    {results.climate.temperature.longTermChange.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Cloud className="h-3 w-3" /> Atmospheric Effects
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Dust Injection:</span>
                  <span className="font-semibold">
                    {results.climate.atmosphere.dustInjection.toFixed(2)} km³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sunlight Reduction:</span>
                  <span className="font-bold text-orange-500">
                    {results.climate.atmosphere.sunlightReduction.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">
                    {results.climate.atmosphere.duration} months
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Habitability Impact
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Area Lost:</span>
                  <span className="font-bold text-red-500">
                    {formatLargeNumber(results.climate.habitability.areaLost)}{" "}
                    km²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage Lost:</span>
                  <span className="font-semibold">
                    {results.climate.habitability.percentageLost.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Agriculture Impact:</span>
                  <span className="font-bold text-orange-500">
                    -{results.climate.habitability.agricultureImpact.toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>

            {results.climate.longTerm.extinctionRisk > 0.5 && (
              <>
                <Separator />
                <div className="bg-red-500/10 p-2 rounded border border-red-500/50">
                  <div className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> EXTINCTION-LEVEL EVENT
                  </div>
                  <div className="text-xs">
                    Extinction Risk:{" "}
                    {(results.climate.longTerm.extinctionRisk * 100).toFixed(0)}
                    %
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* 5. Natural Disasters */}
        <Card className="p-4 border-cyan-500/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Waves className="h-5 w-5 text-cyan-500" />
              Natural Disasters
            </h3>
          </div>

          <div className="space-y-3">
            {/* Tsunami */}
            {results.naturalDisasters.tsunami.triggered && (
              <>
                <div className="bg-blue-500/10 p-3 rounded border border-blue-500/50">
                  <div className="text-xs font-bold text-blue-500 mb-2 flex items-center gap-1">
                    <Waves className="h-4 w-4" /> TSUNAMI WARNING
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Wave Height:</span>
                      <span className="font-bold text-blue-500">
                        {results.naturalDisasters.tsunami.waveHeight.toFixed(1)}
                        m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Affected Coastline:</span>
                      <span className="font-semibold">
                        {results.naturalDisasters.tsunami.affectedCoastline.toFixed(
                          0
                        )}{" "}
                        km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inland Penetration:</span>
                      <span className="font-semibold">
                        {results.naturalDisasters.tsunami.inlandPenetration.toFixed(
                          1
                        )}{" "}
                        km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Casualties:</span>
                      <span className="font-bold text-red-500">
                        {formatLargeNumber(
                          results.naturalDisasters.tsunami.casualties
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Seismic */}
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Seismic Activity
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Earthquake Magnitude:</span>
                  <span className="font-bold text-orange-500">
                    {results.naturalDisasters.seismic.earthquakeMagnitude.toFixed(
                      1
                    )}{" "}
                    Richter
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Aftershocks:</span>
                  <span className="font-semibold">
                    {results.naturalDisasters.seismic.aftershocks}
                  </span>
                </div>
                {results.naturalDisasters.seismic.faultLineActivation && (
                  <div className="text-xs text-red-500 font-semibold">
                    ⚠️ Fault line activation detected
                  </div>
                )}
                {results.naturalDisasters.seismic.volcanicActivity && (
                  <div className="text-xs text-red-500 font-semibold">
                    ⚠️ Volcanic activity triggered
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Atmospheric */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Atmospheric Phenomena
              </div>
              <div className="space-y-1 text-sm">
                {results.naturalDisasters.atmospheric.hurricaneForceWinds && (
                  <div className="flex justify-between">
                    <span>Hurricane-Force Winds:</span>
                    <span className="font-semibold">
                      {results.naturalDisasters.atmospheric.windRadius.toFixed(
                        1
                      )}{" "}
                      km radius
                    </span>
                  </div>
                )}
                {results.naturalDisasters.atmospheric.fireStorms && (
                  <div className="flex justify-between">
                    <span>Fire Storms:</span>
                    <span className="font-semibold text-orange-500">
                      {results.naturalDisasters.atmospheric.fireStormRadius.toFixed(
                        1
                      )}{" "}
                      km radius
                    </span>
                  </div>
                )}
                {!results.naturalDisasters.atmospheric.hurricaneForceWinds &&
                  !results.naturalDisasters.atmospheric.fireStorms && (
                    <div className="text-xs text-muted-foreground">
                      No major atmospheric phenomena
                    </div>
                  )}
              </div>
            </div>
          </div>
        </Card>

        {/* Info Footer */}
        <Card className="p-3 bg-muted/50">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              All calculations are based on scientific models and available
              data. Actual impact effects may vary based on numerous factors
              including atmospheric conditions, terrain, and asteroid
              composition.
            </p>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
