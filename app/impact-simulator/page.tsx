"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as topojson from "topojson-client";
import {
  geoMercator,
  geoPath,
  zoom as d3Zoom,
  ZoomTransform,
  select,
  pointer,
  geoContains,
} from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import asteroidsData from "@/data/asteroids.json";
import populationOverlay from "@/data/population_overlay.json";
import habitability from "@/data/habitability.json";
import tsunamiRisk from "@/data/tsunami_risk.json";
import tectonic from "@/data/tectonic_activity.json";
import infrastructure from "@/data/infrastructure_locations.json";
import {
  computeImpactBundle,
  energyToMegatonsTNT,
  withProvenance,
  type TargetType,
} from "@/lib/calculations";

// Types
interface Asteroid {
  id: string;
  name: string;
  size: number; // meters (approx diameter)
  velocity: number; // km/s
  mass: number; // kg
  composition?: string;
}

type RegionKey =
  | "global"
  | "asia"
  | "europe"
  | "americas"
  | "africa"
  | "australia";

type LayerKey = "population" | "habitability" | "tsunami" | "tectonics";

// Simple region presets (center lon/lat and target scale multiplier)
const REGION_PRESETS: Record<
  RegionKey,
  { center: [number, number]; k: number }
> = {
  global: { center: [0, 20], k: 1 },
  americas: { center: [-80, 15], k: 1.9 },
  europe: { center: [10, 50], k: 3.0 },
  africa: { center: [20, 5], k: 2.2 },
  asia: { center: [90, 25], k: 2.0 },
  australia: { center: [135, -25], k: 3.0 },
};

// Utility: KM to px for Mercator: px = (km / R_earth) * scale
const EARTH_RADIUS_KM = 6371;
function kmToPx(km: number, scale: number) {
  return (km / EARTH_RADIUS_KM) * scale;
}

// World map data loaded at runtime from world-atlas (accurate 110m resolution)
// Using countries data for better geographic accuracy and land/water detection
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Enhanced color scales with better contrast and visibility
const scalePop = (v: number) => {
  if (v > 2000) return "#450a0a"; // Very dark red
  if (v > 1000) return "#7f1d1d"; // Dark red
  if (v > 500) return "#b91c1c"; // Red
  if (v > 200) return "#dc2626"; // Bright red
  if (v > 100) return "#ef4444"; // Light red
  if (v > 50) return "#f87171"; // Very light red
  return "#fecaca"; // Pale red
};

const scaleHabit = (v: number) => {
  if (v > 0.8) return "#052e16"; // Very dark green
  if (v > 0.6) return "#14532d"; // Dark green
  if (v > 0.4) return "#166534"; // Medium green
  if (v > 0.2) return "#16a34a"; // Bright green
  return "#bbf7d0"; // Light green
};

const scaleTsunami = (v: number) => {
  if (v > 0.8) return "#0c1844"; // Very dark blue
  if (v > 0.6) return "#1e3a8a"; // Dark blue
  if (v > 0.4) return "#1d4ed8"; // Medium blue
  if (v > 0.2) return "#3b82f6"; // Bright blue
  return "#bfdbfe"; // Light blue
};

const scaleTectonic = (v: number) => {
  if (v > 0.8) return "#451a03"; // Very dark orange
  if (v > 0.6) return "#7c2d12"; // Dark orange
  if (v > 0.4) return "#b45309"; // Medium orange
  if (v > 0.2) return "#f59e0b"; // Bright orange
  return "#fde68a"; // Light orange
};

// Main Page
export default function ImpactSimulatorPage() {
  const [worldData, setWorldData] = useState<any | null>(null);
  const [countries, setCountries] = useState<any | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<RegionKey>("global");
  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string>(
    (asteroidsData as any).asteroids?.[0]?.id || ""
  );
  const selectedAsteroid: Asteroid | undefined = useMemo(
    () =>
      (asteroidsData as any).asteroids?.find(
        (a: any) => a.id === selectedAsteroidId
      ),
    [selectedAsteroidId]
  );

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    population: false,
    habitability: false,
    tsunami: false,
    tectonics: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState<number>(0); // 0..4
  const [speed, setSpeed] = useState<number>(1); // playback speed multiplier
  const [timePhase, setTimePhase] = useState<string>("pre-impact"); // pre-impact, impact, immediate, short-term, long-term
  const [impactPoint, setImpactPoint] = useState<{
    lon: number;
    lat: number;
    target: TargetType;
  } | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const projection = useMemo(() => geoMercator(), []);
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  // Load world map data at runtime
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(WORLD_URL);
        const topo = await res.json();
        const countriesFeature = topojson.feature(topo, topo.objects.countries as any) as any;
        const landFeature = topojson.feature(topo, topo.objects.land as any) as any;
        if (mounted) {
          setWorldData(topo);
          setCountries(countriesFeature);
        }
      } catch (e) {
        console.error("Failed to load world map data:", e);
        // leave data null; map still interactive
      } finally {
        if (mounted) setMapReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Setup projection on size/region
  const setupProjection = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // JSDOM/layout fallback for tests
    const width = rect.width || 1024;
    const height = rect.height || 600;
    const preset = REGION_PRESETS[region];
    const scale =
      Math.min(width / (2 * Math.PI), height / Math.PI) * 200 * preset.k;
    projection
      .scale(scale)
      .center(preset.center)
      .translate([width / 2, height / 2]);
  }, [projection, region]);

  useEffect(() => {
    setupProjection();
  }, [setupProjection]);

  // D3 zoom setup
  useEffect(() => {
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    if (!svg.node() || !g.node()) return;
    const preset = REGION_PRESETS[region];

    const zoomed = (event: any) => {
      const t: ZoomTransform = event.transform;
      g.attr("transform", t.toString());
    };

    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.7 * preset.k, 8 * preset.k])
      .on("zoom", zoomed as any);

    svg.call(zoom as any);
    return () => {
      svg.on("zoom", null);
    };
  }, [region]);

  // Keyboard accessibility: Space toggle, Left/Right step, R reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowRight") {
        setTimeStep((t) => Math.min(4, t + 1));
      } else if (e.key === "ArrowLeft") {
        setTimeStep((t) => Math.max(0, t - 1));
      } else if (e.key.toLowerCase() === "r") {
        setIsPlaying(false);
        setTimeStep(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handle map click to set impact
  const handleMapClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      if (!svgRef.current) return;
      const el = svgRef.current;
      const p = pointer(e, el);
      const inverted = projection.invert?.(p as [number, number]);
      if (!inverted) return;
      // Decide target type as water/land via simple point-in-polygon test on country features
      const [lon, lat] = inverted;
      const isOnLand = countries
        ? (countries.features as any[]).some((f: any) => geoContains(f, [lon, lat]))
        : true;
      const target: TargetType = isOnLand ? "land" : "water";
      setImpactPoint({ lon, lat, target });
      setTimeStep(0);
      setIsPlaying(false);
      setResults(null);
    },
    [projection, pathGen, countries]
  );

  // Compute at timeStep changes
  useEffect(() => {
    if (!impactPoint || !selectedAsteroid) return;
    // Select a coarse average population per km2 based on region (fallback to country dataset average)
    const avgPop = 300; // coarse default; replace with intersected grid in future
    const velocityMps = selectedAsteroid.velocity * 1000; // km/s -> m/s
    const bundle = computeImpactBundle({
      massKg: selectedAsteroid.mass,
      velocityMps,
      target: impactPoint.target,
      avgPopPerKm2: avgPop,
      shelterFactor: 0.15,
      localWaterDepthM: impactPoint.target === "water" ? 4000 : 0,
      ejectaMassTons: 1e9,
      sootFraction: 0.05,
    });

    // Time step staging with realistic progression (0..4)
    const t = timeStep;
    const timePhases = ["pre-impact", "impact", "immediate", "short-term", "long-term"];
    const currentPhase = timePhases[t] || "pre-impact";
    setTimePhase(currentPhase);
    
    // Progressive multipliers for different effects
    const impactStage = [0, 1.0, 1.0, 1.0, 1.0][t] ?? 0; // Instant impact
    const blastStage = [0, 0.3, 1.0, 1.0, 1.0][t] ?? 0; // Blast expands quickly
    const casualtyStage = [0, 0.1, 0.6, 0.9, 1.0][t] ?? 0; // Casualties accumulate over time
    const economicStage = [0, 0.05, 0.3, 0.7, 1.0][t] ?? 0; // Economic damage grows over time
    const climateStage = [0, 0, 0.1, 0.5, 1.0][t] ?? 0; // Climate effects are delayed

    const staged = {
      energyJ: bundle.energyJ,
      megatonsTNT: bundle.megatonsTNT,
      craterRadiusKm: withProvenance(
        bundle.craterRadiusKm.value * impactStage,
        "km",
        bundle.craterRadiusKm
      ),
      blastRadiiKm: {
        overpressure20psi: withProvenance(
          bundle.blastRadiiKm.overpressure20psi.value * blastStage,
          "km"
        ),
        overpressure10psi: withProvenance(
          bundle.blastRadiiKm.overpressure10psi.value * blastStage,
          "km"
        ),
        overpressure5psi: withProvenance(
          bundle.blastRadiiKm.overpressure5psi.value * blastStage,
          "km"
        ),
        overpressure1psi: withProvenance(
          bundle.blastRadiiKm.overpressure1psi.value * blastStage,
          "km"
        ),
      },
      casualties: withProvenance(
        bundle.casualties.value * casualtyStage,
        "persons",
        bundle.casualties
      ),
      economicDamageUSD: withProvenance(
        bundle.economicDamageUSD.value * economicStage,
        "USD",
        bundle.economicDamageUSD
      ),
      tsunami: {
        ...bundle.tsunami,
        waveHeightM: bundle.tsunami?.waveHeightM ? withProvenance(
          bundle.tsunami.waveHeightM.value * blastStage,
          "m",
          bundle.tsunami.waveHeightM
        ) : undefined
      },
      climate: {
        ...bundle.climate,
        tempChangeC: bundle.climate?.tempChangeC ? withProvenance(
          bundle.climate.tempChangeC.value * climateStage,
          "°C",
          bundle.climate.tempChangeC
        ) : undefined,
        co2IncreasePpm: bundle.climate?.co2IncreasePpm ? withProvenance(
          bundle.climate.co2IncreasePpm.value * climateStage,
          "ppm",
          bundle.climate.co2IncreasePpm
        ) : undefined
      },
      timePhase: currentPhase,
    };

    // Infrastructure breakdown within 5 psi radius
    const r5km = bundle.blastRadiiKm.overpressure5psi.value;
    const distKm = (
      a: { lon: number; lat: number },
      b: { lon: number; lat: number }
    ) => {
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
    };
    const center = { lon: impactPoint.lon, lat: impactPoint.lat };
    const breakdown: Record<string, number> = {
      military: 0,
      civilian: 0,
      cultural: 0,
      energy: 0,
    };
    try {
      for (const group of (infrastructure as any).infrastructure_locations ||
        []) {
        const type = group.type as string;
        for (const loc of group.locations as any[]) {
          const d = distKm(center, { lon: loc.lng, lat: loc.lat });
          if (d <= r5km) breakdown[type] = (breakdown[type] || 0) + 1;
        }
      }
    } catch {}

    setResults({ ...staged, infraBreakdown: breakdown });
  }, [timeStep, impactPoint, selectedAsteroid]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const delay = Math.max(150, Math.round(900 / Math.max(0.25, speed)));
    const id = setInterval(() => {
      setTimeStep((p) => {
        if (p >= 4) {
          setIsPlaying(false);
          return 4;
        }
        return p + 1;
      });
    }, delay);
    return () => clearInterval(id);
  }, [isPlaying, speed]);

  // Derived meteor path (entry from top-left towards impact)
  const meteorPath = useMemo(() => {
    if (!impactPoint) return null;
    const start = projection([-160, 75]);
    const end = projection([impactPoint.lon, impactPoint.lat]);
    if (!start || !end) return null;
    return `M ${start[0]},${start[1]} Q ${(start[0] + end[0]) / 2},${
      start[1] - 150
    } ${end[0]},${end[1]}`;
  }, [impactPoint, projection]);

  // Sidebar cards using shadcn Card component
  function StatCard({
    title,
    value,
    unit,
    method,
    confidence,
  }: {
    title: string;
    value: number | string;
    unit?: string;
    method?: string;
    confidence?: string;
  }) {
    return (
      <Card className="glass-morphism border-border/50" role="group" aria-label={title}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
            {method && confidence && (
              <Badge variant="secondary" className="text-xs">
                {confidence}
              </Badge>
            )}
          </div>
          <div
            className="text-foreground text-2xl font-bold"
            data-testid={`stat-${title}`}
          >
            {typeof value === "number" ? formatNumber(value) : value}
            {unit && (
              <span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>
            )}
          </div>
          {method && (
            <p className="text-xs text-muted-foreground mt-1">{method}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  function formatNumber(n: number) {
    if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "k";
    return n.toFixed(2);
  }

  // Controls using shadcn components
  const [debug, setDebug] = useState(false);
  const Controls = () => (
    <div className="flex flex-col gap-4 w-full">
      {/* Row 1: Region and Asteroid selectors */}
      <div className="flex gap-6 items-center flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground font-medium whitespace-nowrap">
            Region
          </label>
          <Select value={region} onValueChange={(value) => setRegion(value as RegionKey)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="americas">Americas</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="africa">Africa</SelectItem>
              <SelectItem value="asia">Asia</SelectItem>
              <SelectItem value="australia">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground font-medium whitespace-nowrap">
            Asteroid
          </label>
          <Select value={selectedAsteroidId} onValueChange={setSelectedAsteroidId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(asteroidsData as any).asteroids?.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Layer toggles and buttons */}
      <div className="flex gap-4 items-center flex-wrap">
        <Tabs value="layers" className="w-auto">
          <TabsList className="grid w-full grid-cols-4">
            {(["population", "habitability", "tsunami", "tectonics"] as LayerKey[]).map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className={`capitalize text-xs ${layers[k] ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => setLayers((s) => ({ ...s, [k]: !s[k] }))}
              >
                {k}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLegend((s) => !s)}
            aria-label="Toggle legend"
          >
            Legend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssumptions(true)}
            aria-label="Show assumptions"
          >
            Accuracy
          </Button>
          <Button
            variant={debug ? "default" : "outline"}
            size="sm"
            onClick={() => setDebug(!debug)}
            aria-label="Toggle debug geometry"
          >
            Debug
          </Button>
        </div>
      </div>
    </div>
  );

  // Timeline Controls using shadcn components
  const Timeline = () => (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1">
        <Button
          variant={isPlaying ? "default" : "outline"}
          size="sm"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label="Play or pause"
        >
          {isPlaying ? "⏸" : "▶"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTimeStep((t) => Math.max(0, t - 1))}
          aria-label="Step back"
        >
          ◀
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTimeStep((t) => Math.min(4, t + 1))}
          aria-label="Step forward"
        >
          ▶
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsPlaying(false);
            setTimeStep(0);
          }}
          aria-label="Reset timeline"
        >
          Reset
        </Button>
      </div>
      
      <div className="flex items-center gap-2 flex-1">
        <Slider
          value={[timeStep]}
          onValueChange={(value) => setTimeStep(value[0])}
          max={4}
          min={0}
          step={1}
          className="w-32"
          aria-label="Scrub timeline"
        />
        <Badge variant="outline" className="text-xs">
          t{timeStep}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Speed</label>
        <Select value={String(speed)} onValueChange={(value) => setSpeed(parseFloat(value))}>
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5×</SelectItem>
            <SelectItem value="1">1×</SelectItem>
            <SelectItem value="2">2×</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render overlay cells: draw simple circles
  const OverlayCells = ({ keyName }: { keyName: LayerKey }) => {
    const dataset =
      keyName === "population"
        ? (populationOverlay as any).cells
        : keyName === "habitability"
        ? (habitability as any).cells
        : keyName === "tsunami"
        ? (tsunamiRisk as any).cells
        : keyName === "tectonics"
        ? (tectonic as any).cells
        : null;
    if (!dataset) return null;
    return (
      <g aria-label={`${keyName}-overlay`} data-testid={`overlay-${keyName}`}>
        {dataset.slice(0, 500).map((c: any, idx: number) => {
          const p = projection([c.lon, c.lat]);
          if (!p) return null;
          const r = Math.max(2, (c.sizeDeg || 2) * (projection.scale() / 200));
          const fill =
            keyName === "population"
              ? scalePop(c.value)
              : keyName === "habitability"
              ? scaleHabit(c.value)
              : keyName === "tsunami"
              ? scaleTsunami(c.value)
              : scaleTectonic(c.value);
          const label =
            keyName === "population"
              ? `Population density: ${c.value} ppl/km² (estimate)`
              : keyName === "habitability"
              ? `Habitability index: ${c.value} (probabilistic)`
              : keyName === "tsunami"
              ? `Tsunami risk: ${c.value} (estimate)`
              : `Tectonic activity: ${c.value} (estimate)`;
          return (
            <circle
              key={idx}
              cx={p[0]}
              cy={p[1]}
              r={r}
              fill={fill}
              fillOpacity={0.6}
              stroke="hsl(var(--background))"
              strokeWidth={0.5}
              strokeOpacity={0.8}
            >
              <title>{label}</title>
            </circle>
          );
        })}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background space-gradient">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground text-glow">
                🌌 Asteroid Impact Simulator
              </h1>
              <p className="text-sm text-muted-foreground">
                Single-asteroid simulation with labeled scientific provenance
              </p>
            </div>
          </div>
          <Controls />
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 grid grid-cols-12 gap-1 overflow-hidden p-1">
        {/* Map */}
        <Card className="col-span-8 relative min-w-0 glass-morphism border-border/50" ref={containerRef}>
          <CardContent className="p-0 h-full">
            <svg
              ref={svgRef}
              className="w-full h-full rounded-lg"
              role="img"
              aria-label="Impact map"
              onClick={handleMapClick}
            >
              {/* Gradient definitions */}
              <defs>
                <radialGradient id="craterGradient" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#1f2937" stopOpacity="1" />
                  <stop offset="50%" stopColor="#374151" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#111827" stopOpacity="0.9" />
                </radialGradient>
                <radialGradient id="blastGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="70%" stopColor="#dc2626" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.05" />
                </radialGradient>
                <linearGradient id="meteorTrail" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="plasmaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              
            <g ref={gRef}>
              {/* Ocean background */}
              <rect 
                x={0} 
                y={0} 
                width="100%" 
                height="100%" 
                fill="#1e40af" 
                opacity={0.3}
              />
              
              {/* Countries */}
              {countries ? (
                <g>
                  {(countries.features as any[]).map((feature: any, i: number) => (
                    <path
                      key={i}
                      d={pathGen(feature) as string}
                      fill="hsl(var(--muted))"
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                      opacity={0.9}
                    />
                  ))}
                </g>
              ) : (
                <rect x={0} y={0} width="100%" height="100%" fill="hsl(var(--muted))" />
              )}

              {/* Overlays */}
              {layers.population && <OverlayCells keyName="population" />}
              {layers.habitability && <OverlayCells keyName="habitability" />}
              {layers.tsunami && <OverlayCells keyName="tsunami" />}
              {layers.tectonics && <OverlayCells keyName="tectonics" />}

              {/* Meteor and impact visuals */}
              {impactPoint && (
                <>
                  {/* Enhanced meteor approach with realistic effects */}
                  {meteorPath && (
                    <>
                      {/* Atmospheric entry trail */}
                      <motion.path
                        d={meteorPath}
                        stroke="url(#meteorTrail)"
                        strokeWidth={4}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: isPlaying || timeStep > 0 ? 1 : 0,
                          opacity: isPlaying || timeStep > 0 ? 0.8 : 0,
                        }}
                        transition={{ duration: 2.0, ease: "easeInOut" }}
                        fill="none"
                      />
                      
                      {/* Meteor body with realistic scaling based on asteroid size */}
                      <motion.g
                        style={{ offsetPath: `path('${meteorPath}')` as any }}
                        animate={{
                          offsetDistance: isPlaying || timeStep > 0 ? "100%" : "0%",
                        }}
                        transition={{ duration: 2.0, ease: "easeInOut" }}
                      >
                        <g transform="translate(-8,-8)">
                          {/* Main asteroid body */}
                          <motion.circle
                            cx={8}
                            cy={8}
                            r={Math.max(3, Math.min(12, (selectedAsteroid?.size || 100) / 50))}
                            fill="#4c1d95"
                            stroke="#7c3aed"
                            strokeWidth={1}
                            animate={{ 
                              scale: [1, 1.1, 1],
                              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                            }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                          />
                          
                          {/* Atmospheric heating glow */}
                          <motion.circle
                            cx={8}
                            cy={8}
                            r={Math.max(6, Math.min(20, (selectedAsteroid?.size || 100) / 30))}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeOpacity={0.6}
                            animate={{ 
                              r: [6, 12, 6],
                              strokeOpacity: [0.3, 0.8, 0.3]
                            }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                          />
                          
                          {/* Plasma trail */}
                          <motion.path
                            d="M0,8 Q-15,4 -30,6 Q-25,8 -35,10 Q-20,12 -25,14 Q-15,10 0,8"
                            fill="url(#plasmaGradient)"
                            animate={{ 
                              opacity: [0.4, 0.9, 0.4],
                              scaleX: [0.8, 1.2, 0.8]
                            }}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                          />
                        </g>
                      </motion.g>
                    </>
                  )}

                  {/* Shockwave + crater */}
                  {(() => {
                    const impactPx = projection([
                      impactPoint.lon,
                      impactPoint.lat,
                    ]);
                    if (!impactPx || !results) return null;
                    const scale = projection.scale();
                    const craterPx = kmToPx(
                      results.craterRadiusKm.value,
                      scale
                    );
                    const r5 = kmToPx(
                      results.blastRadiiKm.overpressure5psi.value,
                      scale
                    );
                    const r1 = kmToPx(
                      results.blastRadiiKm.overpressure1psi.value,
                      scale
                    );
                    return (
                      <g>
                        {/* Coastline glow when tsunami present */}
                        {countries &&
                          layers.tsunami &&
                          results.tsunami?.waveHeightM?.value > 0 && (
                            <g>
                              {(countries.features as any[]).map((feature: any, i: number) => (
                                <motion.path
                                  key={i}
                                  d={pathGen(feature) as string}
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth={2}
                                  strokeOpacity={0.0}
                                  animate={{ strokeOpacity: [0.0, 0.8, 0.2] }}
                                  transition={{ duration: 1.6, repeat: Infinity }}
                                />
                              ))}
                            </g>
                          )}
                        {/* Shockwave circle */}
                        <motion.circle
                          cx={impactPx[0]}
                          cy={impactPx[1]}
                          r={0}
                          stroke="#f59e0b"
                          strokeOpacity={0.8}
                          strokeWidth={2}
                          fill="none"
                          animate={{
                            r: isPlaying ? r1 : timeStep >= 2 ? r1 : 0,
                          }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                        {/* Blast radius with gradient */}
                        <motion.circle
                          cx={impactPx[0]}
                          cy={impactPx[1]}
                          r={0}
                          fill="url(#blastGradient)"
                          animate={{
                            r: isPlaying ? r5 : timeStep >= 1 ? r5 : 0,
                          }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />
                        {/* Crater with realistic appearance */}
                        <motion.g
                          animate={{
                            opacity: isPlaying || timeStep >= 1 ? 1 : 0,
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                          {/* Crater rim (elevated edge) */}
                          <motion.circle
                            cx={impactPx[0]}
                            cy={impactPx[1]}
                            r={0}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            strokeOpacity={0.6}
                            animate={{
                              r: isPlaying
                                ? craterPx * 1.2
                                : timeStep >= 1
                                ? craterPx * 1.2
                                : 0,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                          {/* Crater depression */}
                          <motion.circle
                            cx={impactPx[0]}
                            cy={impactPx[1]}
                            r={0}
                            fill="url(#craterGradient)"
                            fillOpacity={0.9}
                            data-testid="crater"
                            aria-label="Impact crater"
                            animate={{
                              r: isPlaying
                                ? craterPx
                                : timeStep >= 1
                                ? craterPx
                                : 0,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                          {/* Central peak (for larger craters) */}
                          {craterPx > 10 && (
                            <motion.circle
                              cx={impactPx[0]}
                              cy={impactPx[1]}
                              r={0}
                              fill="#6b7280"
                              fillOpacity={0.7}
                              animate={{
                                r: isPlaying
                                  ? craterPx * 0.15
                                  : timeStep >= 1
                                  ? craterPx * 0.15
                                  : 0,
                              }}
                              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            />
                          )}
                        </motion.g>
                        {/* Debug geometry outlines */}
                        {debug && (
                          <g>
                            <circle
                              cx={impactPx[0]}
                              cy={impactPx[1]}
                              r={craterPx}
                              fill="none"
                              stroke="#111827"
                              strokeDasharray="4 4"
                            />
                            <circle
                              cx={impactPx[0]}
                              cy={impactPx[1]}
                              r={r5}
                              fill="none"
                              stroke="#ef4444"
                              strokeDasharray="4 4"
                            />
                            <circle
                              cx={impactPx[0]}
                              cy={impactPx[1]}
                              r={r1}
                              fill="none"
                              stroke="#f59e0b"
                              strokeDasharray="4 4"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </>
              )}
            </g>
          </svg>

          {/* Click hint */}
          <AnimatePresence>
            {!impactPoint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <Card className="glass-morphism border-border/50 animate-pulse-glow">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm font-medium text-foreground mb-1">
                      🎯 Select Impact Location
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click anywhere on the map to simulate an asteroid impact
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating legend */}
          <AnimatePresence>
            {showLegend && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-4 bottom-4"
              >
                <Card className="glass-morphism border-border/50 w-64">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Map Legend</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-gradient-to-r from-red-100 to-red-900 rounded"></div>
                      <span className="text-muted-foreground">Population density</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-100 to-green-900 rounded"></div>
                      <span className="text-muted-foreground">Habitability index</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-100 to-blue-900 rounded"></div>
                      <span className="text-muted-foreground">Tsunami risk</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-gradient-to-r from-orange-100 to-orange-900 rounded"></div>
                      <span className="text-muted-foreground">Tectonic activity</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <Card className="col-span-4 glass-morphism border-border/50">
          <CardContent className="p-4 overflow-auto h-full">
          <div className="grid gap-2">
            <StatCard
              title="Kinetic energy"
              value={results?.energyJ?.value ?? 0}
              unit="J"
              method={results?.energyJ?.method}
              confidence={results?.energyJ?.confidence}
            />
            <StatCard
              title="Yield"
              value={results?.megatonsTNT?.value ?? 0}
              unit="Mt TNT"
              method={results?.megatonsTNT?.method}
              confidence={results?.megatonsTNT?.confidence}
            />
            <StatCard
              title="Crater radius"
              value={results?.craterRadiusKm?.value ?? 0}
              unit="km"
              method={results?.craterRadiusKm?.method}
              confidence={results?.craterRadiusKm?.confidence}
            />
            <StatCard
              title="Casualties"
              value={results?.casualties?.value ?? 0}
              unit="people"
              method={results?.casualties?.method}
              confidence={results?.casualties?.confidence}
            />
            <StatCard
              title="Economic damage"
              value={results?.economicDamageUSD?.value ?? 0}
              unit="$"
              method={results?.economicDamageUSD?.method}
              confidence={results?.economicDamageUSD?.confidence}
            />
            <StatCard
              title="Sunlight access"
              value={Math.max(
                0,
                100 + (results?.climate?.tempChangeC?.value ?? 0) * 5
              )}
              unit="%"
              method={"probabilistic"}
              confidence={"low"}
            />
            <StatCard
              title="CO₂ levels"
              value={400 + (results?.climate?.co2IncreasePpm?.value ?? 0)}
              unit="ppm"
              method={"probabilistic"}
              confidence={"low"}
            />
            {/* Infrastructure breakdown */}
            <Card className="glass-morphism border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Infrastructure breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex justify-between">
                    <span>Military:</span>
                    <Badge variant="outline">{results?.infraBreakdown?.military ?? 0}</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Civilian:</span>
                    <Badge variant="outline">{results?.infraBreakdown?.civilian ?? 0}</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Cultural:</span>
                    <Badge variant="outline">{results?.infraBreakdown?.cultural ?? 0}</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Energy:</span>
                    <Badge variant="outline">{results?.infraBreakdown?.energy ?? 0}</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <div className="text-sm font-medium text-foreground mb-3">Timeline Controls</div>
            <Timeline />
          </div>
          <div className="mt-4 space-y-2">
            <div className="text-xs text-muted-foreground">
              <strong>Current Phase:</strong> {timePhase.replace('-', ' ').toUpperCase()}
            </div>
            <div className="text-xs text-muted-foreground">
              Timeline: t0 pre-impact • t1 impact • t2 immediate (+1 hour) • t3 short-term (+1 week) • t4 long-term (+1 year)
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Assumptions modal */}
      <AnimatePresence>
        {showAssumptions && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssumptions(false)}
          >
            <Card
              className="max-w-lg w-full glass-morphism"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle className="text-lg">Accuracy & Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Energy: exact physics (KE = ½ m v²).</li>
                  <li>
                    Crater/blast: empirical scaling (estimate), assumes 45° impact
                    angle.
                  </li>
                  <li>
                    Casualties/economics: probabilistic and highly uncertain.
                  </li>
                  <li>
                    Tsunami/climate: indicative only; requires bathymetry and
                    climate models for rigor.
                  </li>
                  <li>
                    Overlays are low-res stubs; replace with WorldPop/NOAA/USGS
                    for production.
                  </li>
                </ul>
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <strong>Sources:</strong> Collins et al. 2005; Holsapple & Housen 2007; Glasstone
                  & Dolan 1977; Robock et al. 2007.
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssumptions(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
