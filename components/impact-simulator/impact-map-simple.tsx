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

    // Create projection with AUTO-ZOOM ON IMPACT
    let projection: d3.GeoProjection;
    if (impactLocation && animationProgress >= 0.25) {
      // ZOOM IN when impact occurs (4x zoom - MUCH BIGGER!)
      const zoomScale = 4;
      const baseScale = width / 5.5;
      const zoomedScale = baseScale * zoomScale;

      // Center the zoom on the impact location
      const impactCoords = d3
        .geoNaturalEarth1()
        .scale(baseScale)
        .translate([width / 2, height / 2])([
        impactLocation.lon,
        impactLocation.lat,
      ]);

      if (impactCoords) {
        const [impactX, impactY] = impactCoords;
        projection = d3
          .geoNaturalEarth1()
          .scale(zoomedScale)
          .translate([
            width / 2 - (impactX - width / 2) * (zoomScale - 1),
            height / 2 - (impactY - height / 2) * (zoomScale - 1),
          ]);
      } else {
        projection = d3
          .geoNaturalEarth1()
          .scale(zoomedScale)
          .translate([width / 2, height / 2]);
      }
    } else {
      // Normal projection
      projection = d3
        .geoNaturalEarth1()
        .scale(width / 5.5)
        .translate([width / 2, height / 2]);
    }

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

    // Show pin marker immediately when impact location is set (before animation)
    if (impactLocation && !animationProgress) {
      const impactCoords = projection([impactLocation.lon, impactLocation.lat]);
      if (impactCoords) {
        const [cx, cy] = impactCoords;
        const markerGroup = svg.append("g");

        // Pointer/pin shape
        markerGroup
          .append("path")
          .attr(
            "d",
            `M ${cx} ${cy - 15} L ${cx - 8} ${cy - 5} L ${cx + 8} ${cy - 5} Z`
          )
          .attr("fill", "#ff0000")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2);

        // Pin circle
        markerGroup
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy - 10)
          .attr("r", 6)
          .attr("fill", "#ff0000")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2);

        // Pin dot
        markerGroup
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy - 10)
          .attr("r", 2)
          .attr("fill", "#ffffff");
      }
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

        // PHASE 1: Asteroid Approach (0 - 0.25) - EXTENDED FOR SLOWER MOVEMENT
        if (animationProgress < 0.25) {
          const trajectoryProgress = animationProgress / 0.25; // SLOWER: Extended from 0.15 to 0.25
          const angle = 45; // 45-degree impact angle
          const distance = 300; // BIGGER: Increased from 200 to 300
          const startX = cx - distance * Math.cos((angle * Math.PI) / 180);
          const startY = cy - distance * Math.sin((angle * Math.PI) / 180);
          const asteroidX = startX + (cx - startX) * trajectoryProgress;
          const asteroidY = startY + (cy - startY) * trajectoryProgress;

          // Atmospheric entry glow (intensifies as it approaches)
          const glowRadius = 25 + trajectoryProgress * 35; // BIGGER: Increased glow
          svg
            .append("circle")
            .attr("cx", asteroidX)
            .attr("cy", asteroidY)
            .attr("r", glowRadius)
            .attr("fill", `rgba(255, 140, 0, ${0.4 * trajectoryProgress})`)
            .attr("filter", "url(#glow)");

          // Plasma trail - ENHANCED
          for (let i = 0; i < 8; i++) {
            // More trail segments
            const trailProgress = Math.max(0, trajectoryProgress - i * 0.03);
            const trailX = startX + (cx - startX) * trailProgress;
            const trailY = startY + (cy - startY) * trailProgress;
            svg
              .append("circle")
              .attr("cx", trailX)
              .attr("cy", trailY)
              .attr("r", 12 - i * 1.2) // BIGGER trail segments
              .attr("fill", `rgba(255, 107, 53, ${0.7 - i * 0.08})`)
              .attr("filter", "url(#glow)");
          }

          // Main asteroid body - BIGGER
          svg
            .append("circle")
            .attr("cx", asteroidX)
            .attr("cy", asteroidY)
            .attr("r", 10 + trajectoryProgress * 8) // BIGGER asteroid
            .attr("fill", "#8B4513")
            .attr("stroke", "#ff6b35")
            .attr("stroke-width", 3);

          // Speed lines - ENHANCED
          svg
            .append("line")
            .attr("x1", startX)
            .attr("y1", startY)
            .attr("x2", asteroidX)
            .attr("y2", asteroidY)
            .attr("stroke", "#ff6b35")
            .attr("stroke-width", 4) // THICKER lines
            .attr("opacity", 0.6);
        }

        // PHASE 2: Impact Flash (0.25 - 0.35) - ADJUSTED TIMING
        if (animationProgress >= 0.25 && animationProgress < 0.35) {
          const flashProgress = (animationProgress - 0.25) / 0.1;
          const flashRadius = kmToPixels(100) * flashProgress; // BIGGER: Doubled flash radius

          // AUTO-ZOOM ON IMPACT - Zoom in when flash starts
          if (flashProgress < 0.1) {
            const zoomScale = 2.5; // 2.5x zoom
            const newScale = (width / 5.5) * zoomScale;
            const newProjection = d3
              .geoNaturalEarth1()
              .scale(newScale)
              .translate([
                width / 2 - (cx - width / 2) * (zoomScale - 1),
                height / 2 - (cy - height / 2) * (zoomScale - 1),
              ]);

            // Update projection for this frame
            projection = newProjection;
          }

          // Blinding white flash - ENHANCED
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", flashRadius)
            .attr("fill", `rgba(255, 255, 255, ${1 - flashProgress})`)
            .attr("filter", "url(#glow)");

          // Orange fireball core - BIGGER
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", flashRadius * 0.7)
            .attr("fill", `rgba(255, 140, 0, ${0.9 - flashProgress * 0.4})`)
            .attr("filter", "url(#glow)");

          // Red inner core - NEW
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", flashRadius * 0.4)
            .attr("fill", `rgba(255, 50, 0, ${0.8 - flashProgress * 0.3})`)
            .attr("filter", "url(#glow)");
        }

        // PHASE 3: Fireball Expansion (0.35 - 0.5) - ADJUSTED TIMING
        if (animationProgress >= 0.35 && animationProgress < 0.5) {
          const fireballProgress = (animationProgress - 0.35) / 0.15;
          const fireballRadius =
            kmToPixels((impactResults.craterRadiusKm?.value || 1) * 6) * // BIGGER: Doubled fireball size
            fireballProgress;

          // Outer fireball - ENHANCED
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", fireballRadius)
            .attr("fill", `rgba(255, 69, 0, ${0.7 - fireballProgress * 0.3})`)
            .attr("filter", "url(#glow)");

          // Middle ring
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", fireballRadius * 0.7)
            .attr("fill", `rgba(255, 140, 0, ${0.8 - fireballProgress * 0.4})`);

          // Inner core - BRIGHTER
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", fireballRadius * 0.4)
            .attr(
              "fill",
              `rgba(255, 255, 100, ${0.9 - fireballProgress * 0.4})`
            );
        }

        // PHASE 4: MASSIVE Blast Wave Expansion (0.4 - 0.9) - LIKE REFERENCE IMAGE
        if (animationProgress >= 0.4) {
          const blastProgress = Math.min((animationProgress - 0.4) / 0.5, 1);

          // Easing function for realistic shockwave
          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
          const easedProgress = easeOut(blastProgress);

          // MASSIVE SCALE MULTIPLIER - Make effects 3x bigger
          const scaleMultiplier = 3;

          // 2nd Degree Burns - Outermost (like reference image)
          const r2ndBurns =
            kmToPixels(blastRadii.overpressure_1psi * scaleMultiplier) *
            easedProgress;
          if (r2ndBurns > 0) {
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r2ndBurns)
              .attr("fill", "rgba(255, 200, 100, 0.3)") // Light orange like reference
              .attr("stroke", "rgba(255, 165, 0, 0.8)")
              .attr("stroke-width", 3);
          }

          // 3rd Degree Burns - Middle zone (like reference image)
          if (animationProgress > 0.45) {
            const r3rdBurns =
              kmToPixels(blastRadii.overpressure_5psi * scaleMultiplier) *
              easedProgress;
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r3rdBurns)
              .attr("fill", "rgba(255, 140, 0, 0.5)") // Orange like reference
              .attr("stroke", "rgba(255, 100, 0, 0.9)")
              .attr("stroke-width", 4);
          }

          // 50% Fatalities - Heavy damage (like reference image)
          if (animationProgress > 0.5) {
            const r50Fatalities =
              kmToPixels(blastRadii.overpressure_10psi * scaleMultiplier) *
              easedProgress;
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r50Fatalities)
              .attr("fill", "rgba(255, 69, 0, 0.6)") // Red-orange like reference
              .attr("stroke", "rgba(255, 0, 0, 0.9)")
              .attr("stroke-width", 5);
          }

          // TOTAL DESTRUCTION - Inner zone (like reference image)
          if (animationProgress > 0.55) {
            const rDestruction =
              kmToPixels(blastRadii.overpressure_20psi * scaleMultiplier) *
              easedProgress;
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", rDestruction)
              .attr("fill", "rgba(139, 0, 0, 0.8)") // Dark red like reference
              .attr("stroke", "rgba(200, 0, 0, 1)")
              .attr("stroke-width", 6);
          }

          // SCORCHING FIRE EFFECT - Center (like reference image)
          if (animationProgress > 0.6) {
            const fireRadius =
              kmToPixels((impactResults.craterRadiusKm?.value || 1) * 8) *
              easedProgress;

            // Multiple fire layers for realistic effect
            for (let i = 0; i < 5; i++) {
              const layerRadius = fireRadius * (1 - i * 0.15);
              const opacity = 0.8 - i * 0.15;
              const hue = 0 + i * 10; // Red to orange gradient

              svg
                .append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", layerRadius)
                .attr("fill", `hsla(${hue}, 100%, 50%, ${opacity})`)
                .attr("filter", "url(#glow)");
            }
          }

          // MASSIVE Shockwave ring (moving outward)
          if (blastProgress < 1) {
            const shockwaveR =
              kmToPixels(blastRadii.overpressure_1psi * scaleMultiplier) *
              easedProgress;
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", shockwaveR)
              .attr("fill", "none")
              .attr("stroke", "rgba(255, 255, 255, 0.9)")
              .attr("stroke-width", 6) // THICKER shockwave
              .attr("opacity", 1 - blastProgress);
          }

          // GROUND SCORCHING EFFECT - Permanent damage to terrain
          if (animationProgress > 0.7) {
            const scorchedRadius = kmToPixels(
              blastRadii.overpressure_5psi * scaleMultiplier * 0.8
            );

            // Create scorched earth pattern
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", scorchedRadius)
              .attr("fill", "rgba(50, 25, 0, 0.7)") // Dark brown scorched earth
              .attr("stroke", "rgba(100, 50, 0, 0.8)")
              .attr("stroke-width", 2);
          }

          // ANNOTATIONS WITH CALCULATIONS (like reference image)
          if (animationProgress > 0.6) {
            const annotations = [
              {
                radius:
                  kmToPixels(blastRadii.overpressure_1psi * scaleMultiplier) *
                  easedProgress,
                label: "2ND DEGREE BURNS",
                sublabel: `${(
                  blastRadii.overpressure_1psi * scaleMultiplier
                ).toFixed(1)} km radius`,
                position: "bottom-right",
              },
              {
                radius:
                  kmToPixels(blastRadii.overpressure_5psi * scaleMultiplier) *
                  easedProgress,
                label: "3RD DEGREE BURNS",
                sublabel: `${(
                  blastRadii.overpressure_5psi * scaleMultiplier
                ).toFixed(1)} km radius`,
                position: "bottom-left",
              },
              {
                radius:
                  kmToPixels(blastRadii.overpressure_10psi * scaleMultiplier) *
                  easedProgress,
                label: "50% FATALITIES",
                sublabel: `${(
                  blastRadii.overpressure_10psi * scaleMultiplier
                ).toFixed(1)} km radius`,
                position: "top-right",
              },
            ];

            annotations.forEach((annotation, index) => {
              if (annotation.radius > 20) {
                // Only show if radius is visible
                const angle = index * 120; // Spread annotations around
                const labelDistance = annotation.radius + 30;
                const labelX =
                  cx + labelDistance * Math.cos((angle * Math.PI) / 180);
                const labelY =
                  cy + labelDistance * Math.sin((angle * Math.PI) / 180);

                // Annotation line
                svg
                  .append("line")
                  .attr(
                    "x1",
                    cx + annotation.radius * Math.cos((angle * Math.PI) / 180)
                  )
                  .attr(
                    "y1",
                    cy + annotation.radius * Math.sin((angle * Math.PI) / 180)
                  )
                  .attr("x2", labelX - 60)
                  .attr("y2", labelY)
                  .attr("stroke", "rgba(255, 255, 255, 0.8)")
                  .attr("stroke-width", 2);

                // Annotation background
                svg
                  .append("rect")
                  .attr("x", labelX - 60)
                  .attr("y", labelY - 15)
                  .attr("width", 120)
                  .attr("height", 30)
                  .attr("fill", "rgba(0, 0, 0, 0.8)")
                  .attr("stroke", "rgba(255, 255, 255, 0.3)")
                  .attr("stroke-width", 1)
                  .attr("rx", 4);

                // Main label
                svg
                  .append("text")
                  .attr("x", labelX)
                  .attr("y", labelY - 2)
                  .attr("text-anchor", "middle")
                  .attr("fill", "white")
                  .attr("font-size", "11px")
                  .attr("font-weight", "bold")
                  .text(annotation.label);

                // Sublabel with distance
                svg
                  .append("text")
                  .attr("x", labelX)
                  .attr("y", labelY + 10)
                  .attr("text-anchor", "middle")
                  .attr("fill", "rgba(255, 255, 255, 0.8)")
                  .attr("font-size", "9px")
                  .text(annotation.sublabel);
              }
            });

            // IMPACT STATISTICS (top-left corner)
            if (animationProgress > 0.8) {
              const statsGroup = svg.append("g");

              // Stats background
              statsGroup
                .append("rect")
                .attr("x", 20)
                .attr("y", 20)
                .attr("width", 200)
                .attr("height", 120)
                .attr("fill", "rgba(0, 0, 0, 0.85)")
                .attr("stroke", "rgba(255, 255, 255, 0.3)")
                .attr("stroke-width", 1)
                .attr("rx", 6);

              // Title
              statsGroup
                .append("text")
                .attr("x", 30)
                .attr("y", 40)
                .attr("fill", "white")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text("IMPACT STATISTICS");

              // Energy
              statsGroup
                .append("text")
                .attr("x", 30)
                .attr("y", 58)
                .attr("fill", "rgba(255, 255, 255, 0.9)")
                .attr("font-size", "10px")
                .text(
                  `Energy: ${impactResults.megatonsTNT.value.toFixed(1)} Mt TNT`
                );

              // Crater
              statsGroup
                .append("text")
                .attr("x", 30)
                .attr("y", 74)
                .attr("fill", "rgba(255, 255, 255, 0.9)")
                .attr("font-size", "10px")
                .text(
                  `Crater: ${(impactResults.craterRadiusKm.value * 2).toFixed(
                    1
                  )} km diameter`
                );

              // Casualties
              const casualties = impactResults.casualties.value;
              const casualtyText =
                casualties > 1e6
                  ? `${(casualties / 1e6).toFixed(1)}M casualties`
                  : casualties > 1e3
                  ? `${(casualties / 1e3).toFixed(0)}K casualties`
                  : `${casualties.toFixed(0)} casualties`;

              statsGroup
                .append("text")
                .attr("x", 30)
                .attr("y", 90)
                .attr("fill", "rgba(255, 100, 100, 0.9)")
                .attr("font-size", "10px")
                .text(casualtyText);

              // Economic damage
              const damage = impactResults.economicDamageUSD.value;
              const damageText =
                damage > 1e12
                  ? `$${(damage / 1e12).toFixed(1)}T damage`
                  : damage > 1e9
                  ? `$${(damage / 1e9).toFixed(1)}B damage`
                  : `$${(damage / 1e6).toFixed(0)}M damage`;

              statsGroup
                .append("text")
                .attr("x", 30)
                .attr("y", 106)
                .attr("fill", "rgba(255, 200, 100, 0.9)")
                .attr("font-size", "10px")
                .text(damageText);

              // Terrain type
              statsGroup
                .append("text")
                .attr("x", 30)
                .attr("y", 122)
                .attr("fill", "rgba(200, 200, 200, 0.8)")
                .attr("font-size", "9px")
                .text(
                  `Target: ${
                    impactLocation.terrain === "water" ? "Ocean" : "Land"
                  }`
                );
            }
          }
        }

        // PHASE 5: MASSIVE Crater Formation (0.6 - 0.8)
        if (animationProgress >= 0.6) {
          const craterProgress = Math.min((animationProgress - 0.6) / 0.2, 1);
          const craterR =
            kmToPixels((impactResults.craterRadiusKm?.value || 1) * 4) * // BIGGER: Doubled crater size
            craterProgress;

          // MASSIVE Ejecta blanket
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", craterR * 3) // BIGGER ejecta spread
            .attr("fill", "rgba(139, 90, 43, 0.4)")
            .attr("opacity", craterProgress * 0.6);

          // Crater rim - ENHANCED
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", craterR)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "rgba(139, 69, 19, 1)")
            .attr("stroke-width", 5); // THICKER rim

          // Crater depression - DEEPER
          svg
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", craterR * 0.8)
            .attr("fill", "rgba(25, 12, 0, 0.95)"); // DARKER

          // MASSIVE Molten center
          if (craterProgress > 0.3) {
            svg
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", craterR * 0.5) // BIGGER molten area
              .attr("fill", `rgba(255, 50, 0, ${0.8 - (craterProgress - 0.3)})`)
              .attr("filter", "url(#glow)");
          }
        }

        // PHASE 6: MASSIVE Seismic Waves (0.7 - 1.0)
        if (animationProgress >= 0.7) {
          const seismicProgress = (animationProgress - 0.7) / 0.3;
          const seismicR = kmToPixels(600 * seismicProgress); // BIGGER: Doubled seismic range

          // Multiple MASSIVE seismic rings
          for (let i = 0; i < 5; i++) {
            // More rings
            const delay = i * 0.1;
            if (seismicProgress > delay) {
              const ringProgress = (seismicProgress - delay) / (1 - delay);
              svg
                .append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", seismicR * ringProgress)
                .attr("fill", "none")
                .attr("stroke", "#ffd43b")
                .attr("stroke-width", 4 - i * 0.5) // THICKER, varying width
                .attr("opacity", (1 - ringProgress) * 0.6);
            }
          }
        }

        // MASSIVE Tsunami waves (if water impact)
        if (impactLocation.terrain === "water" && animationProgress > 0.5) {
          const tsunamiProgress = (animationProgress - 0.5) / 0.5;
          const tsunamiR = kmToPixels(1200 * tsunamiProgress); // BIGGER: 50% larger tsunami

          for (let i = 0; i < 6; i++) {
            // More waves
            const delay = i * 0.08;
            if (tsunamiProgress > delay) {
              const waveProgress = (tsunamiProgress - delay) / (1 - delay);
              svg
                .append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", tsunamiR * waveProgress)
                .attr("fill", "none")
                .attr("stroke", "#0077be")
                .attr("stroke-width", 8 - i) // THICKER waves
                .attr("opacity", (1 - waveProgress) * (0.7 - i * 0.1));
            }
          }
        }

        // Impact point marker (always visible after impact starts)
        if (animationProgress >= 0.25) {
          // Adjusted timing
          const markerGroup = svg.append("g");

          // Pointer/pin shape - ENHANCED
          markerGroup
            .append("path")
            .attr(
              "d",
              `M ${cx} ${cy - 20} L ${cx - 10} ${cy - 6} L ${cx + 10} ${
                cy - 6
              } Z`
            )
            .attr("fill", "#ff0000")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 3); // THICKER outline

          // Pin circle - BIGGER
          markerGroup
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy - 13)
            .attr("r", 8) // BIGGER pin
            .attr("fill", "#ff0000")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 3);

          // Pin dot - BIGGER
          markerGroup
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy - 13)
            .attr("r", 3) // BIGGER dot
            .attr("fill", "#ffffff");
        }
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
