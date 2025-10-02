import { Info } from 'lucide-react@0.487.0';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ImpactStatsProps {
  asteroid: {
    name: string;
    diameter: number;
    mass: number;
    velocity: number;
  };
  results: {
    kineticEnergy: number;
    megatonsTNT: number;
    craterDiameter: number;
    craterDepth: number;
    earthquakeMagnitude: number;
    casualties: number;
    economicDamage: number;
    habitableLandLost: number;
    climateChange: {
      temperatureChange: number;
      sunlightReduction: number;
      duration: number;
    };
    infrastructure: {
      military: number;
      civilian: number;
      cultural: number;
      energy: number;
    };
    accuracy: {
      craterSize: 'accurate' | 'estimated' | 'probabilistic';
      casualties: 'accurate' | 'estimated' | 'probabilistic';
      climate: 'accurate' | 'estimated' | 'probabilistic';
    };
  } | null;
  tsunamiGenerated: boolean;
}

export function ImpactStats({ asteroid, results, tsunamiGenerated }: ImpactStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case 'accurate': return 'bg-green-500';
      case 'estimated': return 'bg-yellow-500';
      case 'probabilistic': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccuracyLabel = (accuracy: string) => {
    switch (accuracy) {
      case 'accurate': return 'Accurate';
      case 'estimated': return 'Estimated';
      case 'probabilistic': return 'Probabilistic';
      default: return 'Unknown';
    }
  };

  const StatCard = ({ 
    label, 
    value, 
    unit = '', 
    tooltip,
    accuracy
  }: { 
    label: string; 
    value: string | number; 
    unit?: string;
    tooltip: string;
    accuracy?: 'accurate' | 'estimated' | 'probabilistic';
  }) => (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground text-sm">{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <Info className="h-3 w-3 text-muted-foreground" />
                {accuracy && (
                  <Badge variant="outline" className={`h-4 text-xs px-1 ${getAccuracyColor(accuracy)}`}>
                    {getAccuracyLabel(accuracy)}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-2xl font-semibold">
        {value}{unit}
      </div>
    </div>
  );

  return (
    <div className="w-80 h-full overflow-y-auto border-l border-border bg-background p-4 space-y-4">
      {/* Asteroid Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selected Asteroid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-semibold">{asteroid.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Diameter</div>
              <div className="font-medium">{asteroid.diameter}m</div>
            </div>
            <div>
              <div className="text-muted-foreground">Velocity</div>
              <div className="font-medium">{(asteroid.velocity / 1000).toFixed(1)} km/s</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!results && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground text-sm">
              Click on the map to simulate an impact
            </p>
          </CardContent>
        </Card>
      )}

      {results && (
        <>
          {/* Impact Energy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Impact Energy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatCard
                label="Energy Release"
                value={results.megatonsTNT.toFixed(2)}
                unit=" MT TNT"
                tooltip="Total kinetic energy converted to explosive force, measured in megatons of TNT equivalent. Based on the formula: KE = 0.5 × mass × velocity²"
                accuracy="accurate"
              />
              <div className="text-xs text-muted-foreground pt-2">
                = {(results.kineticEnergy / 1e15).toFixed(2)} × 10¹⁵ Joules
              </div>
            </CardContent>
          </Card>

          {/* Geological Destruction */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Geological Destruction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatCard
                label="Crater Diameter"
                value={results.craterDiameter.toFixed(2)}
                unit=" km"
                tooltip="Estimated crater size using Holsapple-Housen scaling laws. Accounts for asteroid size, velocity, density, and impact angle."
                accuracy={results.accuracy.craterSize}
              />
              <StatCard
                label="Crater Depth"
                value={results.craterDepth.toFixed(2)}
                unit=" km"
                tooltip="Typical crater depth is approximately 1/4 to 1/5 of the diameter for complex craters."
                accuracy={results.accuracy.craterSize}
              />
              <StatCard
                label="Earthquake Magnitude"
                value={results.earthquakeMagnitude.toFixed(1)}
                unit=""
                tooltip="Estimated Richter scale magnitude based on energy release. Calculated using: M = (2/3) × log₁₀(E) - 2.9"
                accuracy="estimated"
              />
            </CardContent>
          </Card>

          {/* Population Impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Population Casualties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatCard
                label="Estimated Deaths"
                value={formatNumber(results.casualties)}
                tooltip="Estimated fatalities based on population density and blast overpressure zones. 90% fatality in 20 psi zone, 50% in 10 psi zone, 15% in 5 psi zone."
                accuracy={results.accuracy.casualties}
              />
            </CardContent>
          </Card>

          {/* Infrastructure Damage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Infrastructure Destroyed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="Military"
                  value={results.infrastructure.military}
                  unit="%"
                  tooltip="Estimated damage to military installations within blast radius."
                  accuracy="estimated"
                />
                <StatCard
                  label="Civilian"
                  value={results.infrastructure.civilian}
                  unit="%"
                  tooltip="Estimated damage to civilian infrastructure including buildings, roads, and utilities."
                  accuracy="estimated"
                />
                <StatCard
                  label="Cultural"
                  value={results.infrastructure.cultural}
                  unit="%"
                  tooltip="Estimated damage to cultural sites and heritage locations."
                  accuracy="estimated"
                />
                <StatCard
                  label="Energy Grid"
                  value={results.infrastructure.energy}
                  unit="%"
                  tooltip="Estimated damage to power generation and distribution infrastructure."
                  accuracy="estimated"
                />
              </div>
            </CardContent>
          </Card>

          {/* Economic Impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Economic Damage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatCard
                label="Total Cost"
                value={results.economicDamage.toFixed(2)}
                unit=" Trillion USD"
                tooltip="Estimated economic damage including casualties (~$1M per person) and infrastructure destruction (~$10B per 1000 km²)."
                accuracy="estimated"
              />
              <StatCard
                label="Habitable Land Lost"
                value={results.habitableLandLost.toFixed(1)}
                unit="%"
                tooltip="Percentage of previously habitable land rendered uninhabitable or severely damaged."
                accuracy="probabilistic"
              />
            </CardContent>
          </Card>

          {/* Climate Effects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Climate Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatCard
                label="Temperature Change"
                value={results.climateChange.temperatureChange > 0 ? '+' : ''}
                unit={`${results.climateChange.temperatureChange.toFixed(1)}°C`}
                tooltip="Estimated global average temperature change due to dust and aerosols in atmosphere. Large impacts cause cooling (nuclear winter effect)."
                accuracy={results.accuracy.climate}
              />
              <StatCard
                label="Sunlight Reduction"
                value={results.climateChange.sunlightReduction.toFixed(1)}
                unit="%"
                tooltip="Estimated reduction in solar radiation reaching Earth's surface due to atmospheric dust and debris."
                accuracy={results.accuracy.climate}
              />
              <StatCard
                label="Duration"
                value={results.climateChange.duration.toFixed(1)}
                unit=" years"
                tooltip="Estimated duration of significant climate effects before atmosphere clears."
                accuracy={results.accuracy.climate}
              />
            </CardContent>
          </Card>

          {/* Natural Disasters */}
          {tsunamiGenerated && (
            <Card className="border-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Tsunami Generated
                  <Badge variant="destructive">High Risk</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Water impact detected. Massive tsunami waves will propagate across ocean basins, 
                  potentially affecting coastlines thousands of kilometers away.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}