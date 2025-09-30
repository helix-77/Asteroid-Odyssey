"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

interface D3ImpactMapProps {
  impactLocation: { lat: number; lng: number; name: string };
  onLocationChange: (location: any) => void;
  simulationResults: any;
  enhancedResults: any;
  currentTimeline: any;
  currentTimeIndex: number;
  activeFilter: string;
  selectedRegion: string;
  populationData: any[];
  infrastructureData: any[];
}

// Country population density data (expanded)
const COUNTRY_POPULATION_DENSITY = {
  "United States of America": 36,
  "Canada": 4,
  "Mexico": 66,
  "Brazil": 25,
  "Argentina": 16,
  "United Kingdom": 281,
  "France": 119,
  "Germany": 240,
  "Italy": 206,
  "Spain": 94,
  "Russia": 9,
  "China": 153,
  "India": 464,
  "Japan": 347,
  "Australia": 3,
  "South Africa": 49,
  "Egypt": 103,
  "Nigeria": 226,
  "Kenya": 94,
  "Morocco": 83,
  "Indonesia": 151,
  "Thailand": 137,
  "Vietnam": 314,
  "Philippines": 368,
  "Bangladesh": 1265,
  "Pakistan": 287,
  "Iran": 52,
  "Turkey": 109,
  "Ukraine": 75,
  "Poland": 124,
  "Romania": 84,
  "Netherlands": 508,
  "Belgium": 383,
  "Switzerland": 219,
  "Austria": 109,
  "Sweden": 25,
  "Norway": 15,
  "Finland": 18,
  "Denmark": 137,
};

export default function D3ImpactMap({
  impactLocation,
  onLocationChange,
  simulationResults,
  enhancedResults,
  currentTimeline,
  currentTimeIndex,
  activeFilter,
  selectedRegion,
  populationData,
  infrastructureData,
}: D3ImpactMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load world map data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const data = await response.json();
        setWorldData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load world data:', error);
        setIsLoading(false);
      }
    };

    loadWorldData();
  }, []);

  // Get color based on population density
  const getPopulationDensityColor = (density: number): string => {
    if (density > 400) return '#8B0000'; // Dark red - very high
    if (density > 200) return '#DC143C'; // Red - high  
    if (density > 100) return '#FF6347'; // Orange-red - medium-high
    if (density > 50) return '#FFA500';  // Orange - medium
    if (density > 20) return '#FFD700';  // Gold - low-medium
    if (density > 5) return '#ADFF2F';   // Green-yellow - low
    return '#90EE90'; // Light green - very low
  };

  // Get infrastructure icon based on type
  const getInfrastructureIcon = (type: string): string => {
    switch (type) {
      case 'military': return '🏛️';
      case 'energy': return '⚡';
      case 'cultural': return '🏛️';
      case 'civilian': return '🏢';
      default: return '📍';
    }
  };

  // Get infrastructure color based on type
  const getInfrastructureColor = (type: string): string => {
    switch (type) {
      case 'military': return '#dc2626'; // red
      case 'energy': return '#ea580c'; // orange
      case 'cultural': return '#7c3aed'; // purple
      case 'civilian': return '#16a34a'; // green
      default: return '#6b7280'; // gray
    }
  };

  // Calculate distance between two points (simplified)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Render D3 map
  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 1000;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    // Set up projection
    const projection = d3.geoMercator()
      .scale(150)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Convert topojson to geojson
    const countries = feature(worldData, worldData.objects.countries).features;

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    // Draw countries
    svg.selectAll("path")
      .data(countries)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .attr("fill", (d: any) => {
        const countryName = d.properties.NAME;
        const density = COUNTRY_POPULATION_DENSITY[countryName as keyof typeof COUNTRY_POPULATION_DENSITY] || 20;
        
        let fillColor = getPopulationDensityColor(density);
        
        // Apply impact effects if simulation is running
        if (currentTimeline && activeFilter === 'casualties') {
          // Get country centroid for distance calculation
          const centroid = d3.geoPath().projection(projection).centroid(d);
          const [x, y] = projection.invert ? projection.invert(centroid) : [0, 0];
          
          if (x && y) {
            const distance = calculateDistance(impactLocation.lat, impactLocation.lng, y, x);
            const damageRadiusKm = currentTimeline.damageRadius / 1000;
            
            if (distance < damageRadiusKm) {
              fillColor = '#FF0000'; // Bright red for heavily affected
            } else if (distance < damageRadiusKm * 2) {
              fillColor = '#FF4500'; // Orange-red for moderately affected
            }
          }
        }
        
        return fillColor;
      })
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function(this: SVGPathElement, event: any, d: any) {
        const countryName = d.properties.NAME;
        const density = COUNTRY_POPULATION_DENSITY[countryName as keyof typeof COUNTRY_POPULATION_DENSITY] || 'Unknown';
        
        tooltip.style("visibility", "visible")
          .html(`
            <strong>${countryName}</strong><br/>
            Population Density: ${density} people/km²
            ${currentTimeline ? `<br/><strong>Impact Status:</strong> ${
              d3.geoPath().projection(projection).centroid(d) ? 'Calculating...' : 'Unknown'
            }` : ''}
          `);
        
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#000");
      })
      .on("mousemove", function(this: SVGPathElement, event: any) {
        tooltip.style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function(this: SVGPathElement) {
        tooltip.style("visibility", "hidden");
        d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#333");
      })
      .on("click", function(event: any, d: any) {
        const centroid = d3.geoPath().projection(projection).centroid(d);
        const [lng, lat] = projection.invert ? projection.invert(centroid) : [0, 0];
        
        if (lat && lng) {
          onLocationChange({
            lat,
            lng,
            name: d.properties.NAME,
            region: "Unknown",
            populationDensity: COUNTRY_POPULATION_DENSITY[d.properties.NAME as keyof typeof COUNTRY_POPULATION_DENSITY] || 50,
            totalPopulation: 1000000,
          });
        }
      });

    // Draw impact location
    if (impactLocation) {
      const [x, y] = projection([impactLocation.lng, impactLocation.lat]) || [0, 0];
      
      // Impact marker
      svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 8)
        .attr("fill", "#FF0000")
        .attr("stroke", "#FFF")
        .attr("stroke-width", 2)
        .style("cursor", "pointer");

      // Impact label
      svg.append("text")
        .attr("x", x)
        .attr("y", y - 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#000")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text("IMPACT");

      // Draw damage radius if simulation is running
      if (currentTimeline) {
        const damageRadiusKm = currentTimeline.damageRadius / 1000;
        const radiusPixels = damageRadiusKm / 111 * projection.scale() / 100; // Approximate conversion
        
        svg.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", radiusPixels)
          .attr("fill", "none")
          .attr("stroke", "#FF6B6B")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.7);
      }
    }

    // Draw infrastructure markers
    if (activeFilter === 'infrastructure' && infrastructureData.length > 0) {
      const infrastructurePoints = infrastructureData.flatMap(category => 
        category.locations?.map((location: any) => ({
          ...location,
          type: category.type,
        })) || []
      );

      infrastructurePoints.forEach((infra: any) => {
        const [x, y] = projection([infra.lng, infra.lat]) || [0, 0];
        
        if (x && y) {
          // Calculate damage if simulation is running
          let damageLevel = "intact";
          let iconColor = getInfrastructureColor(infra.type);
          
          if (currentTimeline) {
            const distance = calculateDistance(impactLocation.lat, impactLocation.lng, infra.lat, infra.lng);
            const damageRadiusKm = currentTimeline.damageRadius / 1000;
            
            if (distance <= damageRadiusKm) {
              const damageSeverity = Math.max(0, 1 - (distance / damageRadiusKm));
              
              if (damageSeverity > 0.8) {
                damageLevel = "destroyed";
                iconColor = "#000000";
              } else if (damageSeverity > 0.5) {
                damageLevel = "severe";
                iconColor = "#7f1d1d";
              } else if (damageSeverity > 0.2) {
                damageLevel = "damaged";
                iconColor = "#dc2626";
              }
            }
          }
          
          // Infrastructure marker
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", iconColor)
            .attr("stroke", "#FFF")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .on("mouseover", function(event: any) {
              tooltip.style("visibility", "visible")
                .html(`
                  <strong>${infra.name}</strong><br/>
                  Type: ${infra.type}<br/>
                  Country: ${infra.country}<br/>
                  ${damageLevel !== "intact" ? `<strong>Status: ${damageLevel.toUpperCase()}</strong>` : ''}
                `);
            })
            .on("mousemove", function(event: any) {
              tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
            });
        }
      });
    }

    // Cleanup tooltip on unmount
    return () => {
      d3.select(".d3-tooltip").remove();
    };

  }, [worldData, impactLocation, currentTimeline, activeFilter, infrastructureData, currentTimeIndex]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-lg font-semibold">Loading World Map...</div>
          <div className="text-sm text-muted-foreground">
            Initializing D3.js components
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Instructions */}
      {!simulationResults && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white rounded-lg p-3 shadow-lg z-50">
          <div className="text-sm text-center">
            Click on any country to set impact location, then run simulation
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm font-semibold mb-2">Population Density (people/km²)</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-red-800"></div>
            <span>&gt;400 (Very High)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-red-500"></div>
            <span>200-400 (High)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-orange-500"></div>
            <span>100-200 (Medium-High)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-yellow-500"></div>
            <span>50-100 (Medium)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-yellow-300"></div>
            <span>20-50 (Low-Medium)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-green-300"></div>
            <span>5-20 (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-green-200"></div>
            <span>&lt;5 (Very Low)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
