"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Asteroid } from "@/lib/types";
import { calculateEnhancedImpactEffects } from "@/lib/calculations/enhanced-impact-calculator";
import { TemporalEffectsCalculator } from "@/lib/calculations/impact/temporal-effects";
import type { CountryData, InfrastructurePoint } from "@/lib/calculations/impact/types";
import worldDataRaw from "@/data/world_data.json";
import infrastructureDataRaw from "@/data/enhanced_infrastructure.json";

interface EnhancedImpactMapProps {
  asteroid: Asteroid | null;
  impactLocation: { lat: number; lng: number } | null;
  currentTime: number; // 0-100 scale
  mapView: string;
  dataLayer: string;
  onMapClick: (lat: number, lng: number) => void;
  onDataUpdate: (data: any) => void;
}

const EnhancedImpactMap: React.FC<EnhancedImpactMapProps> = ({
  asteroid,
  impactLocation,
  currentTime,
  mapView,
  dataLayer,
  onMapClick,
  onDataUpdate,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [craterImage, setCraterImage] = useState<HTMLImageElement | null>(null);

  const worldData = worldDataRaw as { countries: CountryData[] };
  const infrastructureData = infrastructureDataRaw as { facilities: InfrastructurePoint[] };

  // Convert currentTime (0-100) to years (-0.5 to 50)
  const timeYears = (currentTime / 100) * 50.5 - 0.5;

  // Load crater image
  useEffect(() => {
    const img = new Image();
    img.src = "/crater.png";
    img.onload = () => setCraterImage(img);
  }, []);

  // Load map data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        setMapData({ world: data, countries: null });
      })
      .catch((error) => {
        console.error("Error loading map data:", error);
      });
  }, []);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : window.innerWidth - 320;
        const height = rect.height > 0 ? rect.height : window.innerHeight - 200;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    const timer1 = setTimeout(updateDimensions, 50);
    const timer2 = setTimeout(updateDimensions, 200);

    window.addEventListener("resize", updateDimensions);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Calculate impact effects and temporal changes
  const { impactEffects, temporalEffects } = useMemo(() => {
    if (!asteroid || !impactLocation) return { impactEffects: null, temporalEffects: null };

    const size = asteroid.size || asteroid.diameter || 100;
    const velocity = asteroid.velocity || 15;

    const effects = calculateEnhancedImpactEffects({
      asteroidDiameter: size,
      velocity: velocity,
      density: 3000,
      impactAngle: 45,
      targetType: "land",
      latitude: impactLocation.lat,
      longitude: impactLocation.lng,
    });

    const calculator = new TemporalEffectsCalculator(
      {
        asteroidDiameter: size,
        velocity: velocity,
        density: 3000,
        impactAngle: 45,
        targetType: "land",
        latitude: impactLocation.lat,
        longitude: impactLocation.lng,
      },
      effects,
      worldData.countries,
      infrastructureData.facilities
    );

    const temporal = calculator.calculateEffectsAtTime(timeYears);

    return { impactEffects: effects, temporalEffects: temporal };
  }, [asteroid, impactLocation, timeYears]);

  // Color scales
  const populationColorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, 1000]).interpolator(d3.interpolateYlOrRd);
  }, []);

  const habitabilityColorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, 100]).interpolator(d3.interpolateGreens);
  }, []);

  const tsunamiColorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, 100]).interpolator(d3.interpolateReds);
  }, []);

  const tectonicColorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, 100]).interpolator(d3.interpolateOranges);
  }, []);

  // Draw the map
  useEffect(() => {
    if (!svgRef.current || !mapData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create projection
    let projection = d3.geoNaturalEarth1();
    let scale = width / 6;
    let center: [number, number] = [0, 0];

    switch (mapView) {
      case "northAmerica":
        center = [-100, 45];
        scale = width / 3;
        break;
      case "southAmerica":
        center = [-60, -15];
        scale = width / 3;
        break;
      case "europe":
        center = [10, 50];
        scale = width / 2.5;
        break;
      case "asia":
        center = [85, 35];
        scale = width / 4;
        break;
      case "africa":
        center = [20, 0];
        scale = width / 3;
        break;
      case "oceania":
        center = [135, -25];
        scale = width / 3.5;
        break;
    }

    projection.scale(scale).center(center).translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Ocean background - LIGHT BLUE
    svg
      .insert("rect", ":first-child")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#a8d5e2"); // Light blue ocean

    const mapGroup = svg.append("g");

    // Add zoom
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

    svg.call(zoom as any);

    // Draw countries
    let countries;
    if (mapData.world.objects) {
      countries = feature(mapData.world, mapData.world.objects.countries);
    }

    if (countries && countries.features) {
      mapGroup
        .selectAll("path.country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
          const countryName = d.properties.name || d.properties.NAME;
          const countryInfo = worldData.countries.find(
            (c) => c.name === countryName || c.name.includes(countryName.split(" ")[0])
          );

          if (!countryInfo) return "#e0e0e0";

          // Apply temporal effects to data layers
          let value = 0;
          if (dataLayer === "population") {
            value = countryInfo.populationDensity;
            // Reduce population density based on damage
            if (temporalEffects && timeYears >= 0) {
              const damage = temporalEffects.regionalDamage.get(countryInfo.code);
              if (damage) {
                value = value * (1 - damage.populationLossPercent / 100);
              }
            }
            return populationColorScale(value);
          } else if (dataLayer === "habitability") {
            value = countryInfo.habitability;
            // Apply habitability changes
            if (temporalEffects && timeYears >= 0) {
              const damage = temporalEffects.regionalDamage.get(countryInfo.code);
              if (damage) {
                value = Math.max(0, value + damage.habitabilityChange);
              }
            }
            return habitabilityColorScale(value);
          } else if (dataLayer === "tsunami") {
            value = countryInfo.tsunamiRisk;
            return tsunamiColorScale(value);
          } else if (dataLayer === "tectonic") {
            value = countryInfo.tectonicRisk;
            return tectonicColorScale(value);
          }

          return "#e0e0e0";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("click", function (event, d) {
          const [x, y] = d3.pointer(event);
          const inverted = projection.invert!([x, y]);
          if (inverted) {
            const [lng, lat] = inverted;
            onMapClick(lat, lng);
          }
        });
    }

    // Draw infrastructure points
    if (dataLayer === "infrastructure" || impactLocation) {
      infrastructureData.facilities.forEach((facility) => {
        const coords = projection([facility.longitude, facility.latitude]);
        if (!coords) return;

        // Calculate damage state
        let damageLevel = 0;
        let operational = true;
        if (temporalEffects && timeYears >= 0) {
          const damage = temporalEffects.infrastructureDamage.get(facility.name);
          if (damage) {
            damageLevel = damage.damageLevel;
            operational = damage.operational;
          }
        }

        // Size based on importance (8px * importance)
        const baseSize = 8 * facility.importance;
        const size = operational ? baseSize : baseSize * 0.5;

        // Color based on type and damage
        const typeColors: Record<string, string> = {
          military: "#ff0000",
          energy: "#ff9900",
          cultural: "#9900ff",
          civilian: "#00ff00",
        };

        let color = typeColors[facility.type] || "#666";
        if (damageLevel > 80) {
          color = "#000000"; // Destroyed
        } else if (damageLevel > 50) {
          color = "#666666"; // Heavily damaged
        }

        mapGroup
          .append("circle")
          .attr("cx", coords[0])
          .attr("cy", coords[1])
          .attr("r", size)
          .attr("fill", color)
          .attr("opacity", operational ? 0.8 : 0.3)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);
      });
    }

    // Draw impact effects
    if (impactLocation && impactEffects) {
      const coords = projection([impactLocation.lng, impactLocation.lat]);

      if (coords) {
        // Draw expanding damage zones (blast, thermal)
        if (timeYears >= 0) {
          const maxBlastRadius = impactEffects.blastRadius / 1000; // km
          const maxThermalRadius = impactEffects.thermalRadius / 1000; // km

          // Expansion animation (0 to max over first 0.01 years ~ 3.65 days)
          const expansionProgress = Math.min(1, timeYears / 0.01);

          // Thermal radiation zone (orange)
          const thermalRadiusPixels = projection([
            impactLocation.lng + maxThermalRadius * expansionProgress / 111,
            impactLocation.lat
          ]);
          if (thermalRadiusPixels) {
            const thermalRadius = Math.abs(thermalRadiusPixels[0] - coords[0]);
            mapGroup
              .append("circle")
              .attr("cx", coords[0])
              .attr("cy", coords[1])
              .attr("r", thermalRadius)
              .attr("fill", "orange")
              .attr("opacity", 0.2)
              .attr("stroke", "orange")
              .attr("stroke-width", 2);
          }

          // Blast wave zone (red)
          const blastRadiusPixels = projection([
            impactLocation.lng + maxBlastRadius * expansionProgress / 111,
            impactLocation.lat
          ]);
          if (blastRadiusPixels) {
            const blastRadius = Math.abs(blastRadiusPixels[0] - coords[0]);
            mapGroup
              .append("circle")
              .attr("cx", coords[0])
              .attr("cy", coords[1])
              .attr("r", blastRadius)
              .attr("fill", "red")
              .attr("opacity", 0.3)
              .attr("stroke", "red")
              .attr("stroke-width", 2);
          }
        }

        // Draw crater (appears at impact and expands to max size)
        if (timeYears >= 0) {
          const maxCraterDiameter = impactEffects.craterDiameter; // meters
          const craterGrowthTime = 0.001; // Crater forms almost instantly (hours)
          const craterProgress = Math.min(1, timeYears / craterGrowthTime);

          const craterRadiusPixels = projection([
            impactLocation.lng + (maxCraterDiameter / 2000) * craterProgress / 111,
            impactLocation.lat
          ]);

          if (craterRadiusPixels && craterImage) {
            const craterRadius = Math.abs(craterRadiusPixels[0] - coords[0]);
            const craterSize = craterRadius * 2;

            // Use pattern to display crater.png
            const patternId = "crater-pattern";
            const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");

            defs.selectAll(`#${patternId}`).remove();

            const pattern = defs
              .append("pattern")
              .attr("id", patternId)
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 1)
              .attr("height", 1);

            pattern
              .append("image")
              .attr("href", "/crater.png")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", craterSize)
              .attr("height", craterSize)
              .attr("preserveAspectRatio", "xMidYMid slice");

            mapGroup
              .append("circle")
              .attr("cx", coords[0])
              .attr("cy", coords[1])
              .attr("r", craterRadius)
              .attr("fill", `url(#${patternId})`)
              .attr("opacity", 0.9);
          }
        }

        // Draw impact marker (before impact)
        if (timeYears < 0) {
          mapGroup
            .append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", 8)
            .attr("fill", "red")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("class", "pulse");
        }
      }
    }

    // Update data for overlay and sidebar
    if (temporalEffects) {
      onDataUpdate({
        casualties: temporalEffects.cumulativeCasualties,
        economicDamage: temporalEffects.economicImpact,
        craterSize: impactEffects?.craterDiameter || 0,
        affectedArea: impactEffects?.affectedArea || 0,
        temperature: 15 + temporalEffects.globalTemperature,
        co2Level: temporalEffects.co2Level,
        sunlightReduction: temporalEffects.atmosphericDust,
        habitability: temporalEffects.habitabilityIndex,
        agriculturalCapacity: temporalEffects.agriculturalCapacity,
        waterQuality: temporalEffects.waterQuality,
      });
    }
  }, [
    mapData,
    dimensions,
    mapView,
    dataLayer,
    impactLocation,
    timeYears,
    impactEffects,
    temporalEffects,
    craterImage,
  ]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ cursor: "crosshair", display: "block", minHeight: "500px" }}
    >
      <defs>
        <style>{`
          .pulse {
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </defs>
    </svg>
  );
};

export default EnhancedImpactMap;
