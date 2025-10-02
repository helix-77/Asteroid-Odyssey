"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { type TargetType } from "@/lib/calculations";
import { type ImpactLocation } from "./types";

interface ImpactMapProps {
  impactLocation: ImpactLocation | null;
  impactResults: any;
  activeLayer: string;
  selectedRegion: string;
  timeStep: number;
  animationProgress: number;
  onMapClick: (lat: number, lon: number, terrain: TargetType) => void;
}

export function ImpactMap({
  impactLocation,
  impactResults,
  activeLayer,
  selectedRegion,
  timeStep,
  animationProgress,
  onMapClick,
}: ImpactMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Load world map data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => setWorldData(data))
      .catch((error) => console.error("Error loading map:", error));
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Render map
  useEffect(() => {
    if (!svgRef.current || !worldData) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous render
    svg.selectAll("*").remove();

    // Create projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Convert TopoJSON to GeoJSON
    const countries = topojson.feature(
      worldData,
      worldData.objects.countries
    ) as any;

    // Background (ocean)
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#a5d8ff");

    // Draw countries with layer-based coloring
    const getCountryFill = () => {
      switch (activeLayer) {
        case "population":
          return "#94d82d"; // Base green
        case "habitability":
          return "#82c91e";
        case "tsunami":
          return "#fab005";
        case "tectonic":
          return "#fd7e14";
        default:
          return "#94d82d";
      }
    };

    svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        // Add some variation for realism
        const variation = Math.random() * 0.1;
        return (
          d3.color(getCountryFill())?.darker(variation).toString() ||
          getCountryFill()
        );
      })
      .attr("stroke", "#2b8a3e")
      .attr("stroke-width", 0.5)
      .attr("class", "country");

    // Population density overlay (darker areas = higher density)
    if (activeLayer === "population") {
      // Major population centers (approximation)
      const populationCenters = [
        { name: "Tokyo", coords: [139.7, 35.7], population: 38 },
        { name: "Delhi", coords: [77.2, 28.6], population: 30 },
        { name: "Shanghai", coords: [121.5, 31.2], population: 27 },
        { name: "São Paulo", coords: [-46.6, -23.5], population: 22 },
        { name: "Mumbai", coords: [72.8, 19.1], population: 21 },
        { name: "Beijing", coords: [116.4, 39.9], population: 20 },
        { name: "Cairo", coords: [31.2, 30.0], population: 20 },
        { name: "Dhaka", coords: [90.4, 23.8], population: 19 },
        { name: "Mexico City", coords: [-99.1, 19.4], population: 21 },
        { name: "New York", coords: [-74.0, 40.7], population: 20 },
        { name: "Lagos", coords: [3.4, 6.5], population: 14 },
        { name: "London", coords: [-0.1, 51.5], population: 14 },
        { name: "Paris", coords: [2.3, 48.9], population: 11 },
        { name: "Istanbul", coords: [28.9, 41.0], population: 15 },
      ];

      populationCenters.forEach((city) => {
        const coords = projection(city.coords as [number, number]);
        if (coords) {
          svg
            .append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", Math.sqrt(city.population) * 3)
            .attr("fill", "rgba(59, 130, 246, 0.4)")
            .attr("stroke", "rgba(59, 130, 246, 0.6)")
            .attr("stroke-width", 1);
        }
      });
    }

    // Impact effects (only if impact location is set and animation has started)
    if (impactLocation && impactResults && animationProgress > 0) {
      const impactCoords = projection([impactLocation.lon, impactLocation.lat]);

      if (impactCoords) {
        const [cx, cy] = impactCoords;

        // Helper to convert km to screen pixels
        const kmToPixels = (km: number) => {
          // Approximate: at equator, 1 degree ≈ 111 km
          const degrees = km / 111;
          const point1 = projection([impactLocation.lon, impactLocation.lat]);
          const point2 = projection([
            impactLocation.lon + degrees,
            impactLocation.lat,
          ]);
          if (point1 && point2) {
            return Math.abs(point2[0] - point1[0]);
          }
          return 0;
        };

        // Get blast radii from results
        const blastRadii = {
          overpressure_20psi:
            impactResults.blastRadiiKm?.overpressure20psi?.value || 0,
          overpressure_10psi:
            impactResults.blastRadiiKm?.overpressure10psi?.value || 0,
          overpressure_5psi:
            impactResults.blastRadiiKm?.overpressure5psi?.value || 0,
          overpressure_1psi:
            impactResults.blastRadiiKm?.overpressure1psi?.value || 0,
        };

        // Seismic effects (grows throughout animation)
        if (animationProgress > 0.1) {
          const seismicR = kmToPixels(100 * animationProgress); // Simplified seismic radius
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", seismicR)
            .attr("fill", "none")
            .attr("stroke", "#ffd43b")
            .attr("stroke-width", 2)
            .attr("opacity", 0.3 * (1 - animationProgress * 0.5));
        }

        // Airblast radii (appear in stages)
        if (animationProgress > 0.2) {
          // 1 psi - Glass breakage (light blue)
          const r1psi = kmToPixels(
            blastRadii.overpressure_1psi * Math.min(animationProgress * 2, 1)
          );
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r1psi)
            .attr("fill", "rgba(173, 216, 230, 0.2)")
            .attr("stroke", "rgba(173, 216, 230, 0.5)")
            .attr("stroke-width", 2);

          // 5 psi - Moderate damage (yellow)
          if (animationProgress > 0.3) {
            const r5psi = kmToPixels(
              blastRadii.overpressure_5psi * Math.min(animationProgress * 2, 1)
            );
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r5psi)
              .attr("fill", "rgba(255, 193, 7, 0.3)")
              .attr("stroke", "rgba(255, 193, 7, 0.6)")
              .attr("stroke-width", 2);
          }

          // 10 psi - Heavy damage (orange)
          if (animationProgress > 0.4) {
            const r10psi = kmToPixels(
              blastRadii.overpressure_10psi * Math.min(animationProgress * 2, 1)
            );
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r10psi)
              .attr("fill", "rgba(255, 138, 0, 0.4)")
              .attr("stroke", "rgba(255, 138, 0, 0.7)")
              .attr("stroke-width", 2);
          }

          // 20 psi - Total destruction (red)
          if (animationProgress > 0.5) {
            const r20psi = kmToPixels(
              blastRadii.overpressure_20psi * Math.min(animationProgress * 2, 1)
            );
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r20psi)
              .attr("fill", "rgba(239, 68, 68, 0.5)")
              .attr("stroke", "rgba(239, 68, 68, 0.8)")
              .attr("stroke-width", 2);
          }
        }

        // Crater (appears early and stays)
        if (animationProgress > 0.15) {
          const craterR =
            kmToPixels((impactResults.craterRadiusKm?.value || 1) * 2) *
            Math.min(animationProgress * 5, 1); // Diameter

          // Crater outer ring
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", craterR)
            .attr("fill", "rgba(0, 0, 0, 0.7)")
            .attr("stroke", "rgba(0, 0, 0, 0.9)")
            .attr("stroke-width", 2);

          // Crater inner depression
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", craterR * 0.7)
            .attr("fill", "rgba(139, 69, 19, 0.6)");

          // Impact flash (early animation only)
          if (animationProgress < 0.3) {
            const flashOpacity = (0.3 - animationProgress) / 0.3;
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", craterR * 3)
              .attr("fill", `rgba(255, 255, 255, ${flashOpacity * 0.8})`)
              .attr("filter", "blur(10px)");
          }
        }

        // Asteroid incoming trajectory (only at start)
        if (animationProgress < 0.15) {
          const trajectoryProgress = animationProgress / 0.15;
          const startX = cx - 100;
          const startY = cy - 150;
          const asteroidX = startX + (cx - startX) * trajectoryProgress;
          const asteroidY = startY + (cy - startY) * trajectoryProgress;

          // Trail
          svg
            .append("line")
            .attr("x1", startX)
            .attr("y1", startY)
            .attr("x2", asteroidX)
            .attr("y2", asteroidY)
            .attr("stroke", "#ff6b35")
            .attr("stroke-width", 3)
            .attr("opacity", 0.6);

          // Asteroid
          svg
            .append("circle")
            .attr("cx", asteroidX)
            .attr("cy", asteroidY)
            .attr("r", 5)
            .attr("fill", "#ff6b35")
            .attr("filter", "url(#glow)");
        }

        // Tsunami waves (if water impact)
        if (impactLocation.terrain === "water" && animationProgress > 0.3) {
          const tsunamiR = kmToPixels(500 * animationProgress);
          for (let i = 0; i < 3; i++) {
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", tsunamiR - i * 30)
              .attr("fill", "none")
              .attr("stroke", "#0077be")
              .attr("stroke-width", 4)
              .attr("opacity", 0.5 - i * 0.15);
          }
        }

        // Impact point marker (permanent)
        svg
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 4)
          .attr("fill", "#ff0000")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2);
      }
    }

    // Add glow filter for effects
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
  }, [
    worldData,
    dimensions,
    impactLocation,
    impactResults,
    activeLayer,
    animationProgress,
  ]);

  // Handle click
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !worldData) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = dimensions;
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]);

    const coords = projection.invert?.([x, y]);
    if (coords) {
      const [lon, lat] = coords;

      // Determine if click is on land or water
      // Simple heuristic: check if click is on a country path
      const countries = topojson.feature(
        worldData,
        worldData.objects.countries
      ) as any;
      const path = d3.geoPath().projection(projection);

      let isLand = false;
      for (const feature of countries.features) {
        const pathString = path(feature as any);
        if (pathString) {
          // Use point-in-polygon test
          const ctx = document.createElement("canvas").getContext("2d");
          if (ctx) {
            const p2d = new Path2D(pathString);
            if (ctx.isPointInPath(p2d, x, y)) {
              isLand = true;
              break;
            }
          }
        }
      }

      onMapClick(lat, lon, isLand ? "land" : "water");
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-muted/20">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-crosshair"
        onClick={handleClick}
      />
    </div>
  );
}
