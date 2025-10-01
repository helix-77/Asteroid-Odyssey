"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Asteroid } from "@/lib/types";
import { calculateImpactEffects } from "@/lib/calculations/impact-calculator";
import { BasicMap } from "./BasicMap";
import populationData from "@/data/population_density.json";
import infrastructureData from "@/data/critical_infrastructure.json";

interface ImpactMapProps {
  asteroid: Asteroid | null;
  impactLocation: { lat: number; lng: number } | null;
  currentTime: number;
  mapView: string;
  dataLayer: string;
  onMapClick: (lat: number, lng: number) => void;
  onDataUpdate: (data: any) => void;
}

const ImpactMap: React.FC<ImpactMapProps> = ({
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
  const [mapError, setMapError] = useState(false);

  // Load map data
  useEffect(() => {
    // Use CDN world data for immediate functionality
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(response => response.json())
      .then(data => {
        setMapData({ world: data, countries: null });
      })
      .catch(error => {
        console.error("Error loading map data:", error);
        setMapError(true);
      });
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Calculate impact effects
  const impactEffects = useMemo(() => {
    if (!asteroid || !impactLocation) return null;
    
    const size = asteroid.size || asteroid.diameter || 100;
    const velocity = asteroid.velocity || 15;
    
    return calculateImpactEffects({
      asteroidDiameter: size,
      velocity: velocity,
      density: 3000, // kg/m³ average for stony asteroids
      impactAngle: 45,
      targetType: "land",
    });
  }, [asteroid, impactLocation]);

  // Create population density color scale
  const populationColorScale = useMemo(() => {
    return d3.scaleSequential()
      .domain([0, 1000])
      .interpolator(d3.interpolateYlOrRd);
  }, []);

  // Create habitability color scale
  const habitabilityColorScale = useMemo(() => {
    return d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateGreens);
  }, []);

  // Draw the map
  useEffect(() => {
    if (!svgRef.current || !mapData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create projection based on view
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

    projection
      .scale(scale)
      .center(center)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create map group
    const mapGroup = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Draw ocean background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#e8f4f8");

    // Draw countries
    let countries;
    if (mapData.world.objects) {
      countries = feature(mapData.world, mapData.world.objects.countries);
    } else {
      countries = mapData.countries;
    }

    if (countries && countries.features) {
      mapGroup.selectAll("path.country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
          // Color based on data layer
          if (dataLayer === "population") {
            const countryName = d.properties.name || d.properties.NAME;
            const popData = populationData.find((p: any) => 
              p.Country === countryName
            );
            if (popData) {
              const density = typeof popData.Density === "string" 
                ? parseInt(popData.Density.replace(",", ""))
                : popData.Density;
              return populationColorScale(density);
            }
            return "#f0f0f0";
          } else if (dataLayer === "habitability") {
            // Dummy habitability data
            return habitabilityColorScale(70 + Math.random() * 30);
          } else if (dataLayer === "tsunami") {
            // Coastal areas more at risk
            const centroid = d3.geoCentroid(d);
            const distToCoast = Math.abs(centroid[1]); // Simple approximation
            return distToCoast < 30 ? "#ff6b6b" : "#ffd93d";
          } else if (dataLayer === "tectonic") {
            // Tectonic plate boundaries - simplified
            return "#f0f0f0";
          }
          return "#f0f0f0";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("click", function(event, d) {
          const [x, y] = d3.pointer(event);
          const inverted = projection.invert!([x, y]);
          if (inverted) {
            const [lng, lat] = inverted;
            onMapClick(lat, lng);
          }
        });
    }

    // Draw infrastructure points
    if (dataLayer === "infrastructure" && infrastructureData) {
      const infrastructure = infrastructureData.facilities || [];
      
      mapGroup.selectAll("circle.infrastructure")
        .data(infrastructure)
        .enter()
        .append("circle")
        .attr("class", "infrastructure")
        .attr("cx", (d: any) => {
          const coords = projection([d.longitude, d.latitude]);
          return coords ? coords[0] : 0;
        })
        .attr("cy", (d: any) => {
          const coords = projection([d.longitude, d.latitude]);
          return coords ? coords[1] : 0;
        })
        .attr("r", 3)
        .attr("fill", (d: any) => {
          const typeColors: any = {
            military: "#ff0000",
            energy: "#ff9900",
            cultural: "#9900ff",
            civilian: "#00ff00"
          };
          return typeColors[d.type] || "#666";
        })
        .attr("opacity", 0.7);
    }

    // Draw impact location and effects
    if (impactLocation && impactEffects) {
      const coords = projection([impactLocation.lng, impactLocation.lat]);
      
      if (coords) {
        // Calculate crater size based on time
        const maxCraterRadius = Math.min(50, impactEffects.craterDiameter / 1000);
        const craterRadius = (maxCraterRadius * Math.min(currentTime / 10, 1));

        // Draw expanding damage zones
        if (currentTime > 0) {
          // Thermal radiation zone
          const thermalRadius = (impactEffects.thermalRadius / 1000) * (currentTime / 100);
          mapGroup.append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", Math.min(thermalRadius, 200))
            .attr("fill", "orange")
            .attr("opacity", 0.2)
            .attr("stroke", "orange")
            .attr("stroke-width", 1);

          // Blast wave zone
          const blastRadius = (impactEffects.blastRadius / 1000) * (currentTime / 100);
          mapGroup.append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", Math.min(blastRadius * 0.5, 150))
            .attr("fill", "red")
            .attr("opacity", 0.3)
            .attr("stroke", "red")
            .attr("stroke-width", 1);
        }

        // Draw crater (appears after impact)
        if (currentTime > 5) {
          mapGroup.append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", craterRadius)
            .attr("fill", "#2c2c2c")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);
        }

        // Draw impact marker (before impact)
        if (currentTime <= 5) {
          mapGroup.append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", 5)
            .attr("fill", "red")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("class", "pulse");
        }
      }
    }

    // Update impact data for sidebar
    if (impactEffects && currentTime > 0) {
      const timeYears = currentTime; // Assuming 1 unit = 1 year
      const casualties = Math.floor(impactEffects.estimatedCasualties * (currentTime / 100));
      const economicDamage = (impactEffects.economicDamage || 1000000000) * (currentTime / 100);
      
      onDataUpdate({
        casualties,
        economicDamage,
        craterSize: impactEffects.craterDiameter,
        affectedArea: impactEffects.affectedArea || 1000,
        temperature: 15 - (currentTime / 10), // Global cooling effect
        co2Level: 410 + (currentTime * 0.5),
        sunlightReduction: Math.min(currentTime, 80),
      });
    }

  }, [mapData, dimensions, mapView, dataLayer, impactLocation, currentTime, impactEffects]);

  // Use BasicMap as fallback if D3 map fails
  if (mapError || !mapData) {
    return (
      <BasicMap
        onMapClick={onMapClick}
        impactLocation={impactLocation}
        currentTime={currentTime}
        asteroid={asteroid}
      />
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full block"
      style={{ cursor: "crosshair", minHeight: "400px" }}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="xMidYMid meet"
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

export default ImpactMap;
