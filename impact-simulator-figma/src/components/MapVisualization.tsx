import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

interface MapVisualizationProps {
  selectedParameter: 'population' | 'habitability' | 'tsunami' | 'tectonic';
  impactLocation: { lat: number; lon: number } | null;
  timeStep: number;
  selectedRegion: string;
  craterRadius: number;
  impactData: any;
}

export function MapVisualization({
  selectedParameter,
  impactLocation,
  timeStep,
  selectedRegion,
  craterRadius,
  impactData
}: MapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Load world map data from a CDN
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => {
        setWorldData(data);
      });
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 900;
    const height = 550;

    svg.selectAll('*').remove();

    // Set up projection based on selected region
    let projection = geoMercator();
    
    switch(selectedRegion) {
      case 'North America':
        projection = geoMercator().center([-100, 50]).scale(400).translate([width/2, height/2]);
        break;
      case 'South America':
        projection = geoMercator().center([-60, -15]).scale(400).translate([width/2, height/2]);
        break;
      case 'Europe':
        projection = geoMercator().center([15, 52]).scale(600).translate([width/2, height/2]);
        break;
      case 'Asia':
        projection = geoMercator().center([100, 35]).scale(400).translate([width/2, height/2]);
        break;
      case 'Africa':
        projection = geoMercator().center([20, 0]).scale(400).translate([width/2, height/2]);
        break;
      case 'Australia':
        projection = geoMercator().center([135, -25]).scale(600).translate([width/2, height/2]);
        break;
      default:
        projection = geoMercator().scale(145).translate([width/2, height/2 + 20]);
    }

    const path = geoPath().projection(projection);
    const countries = feature(worldData, worldData.objects.countries);

    // Create main group
    const g = svg.append('g');

    // Add zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior as any);

    // Color scale based on parameter
    const getColorScale = () => {
      switch(selectedParameter) {
        case 'population':
          return d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]);
        case 'habitability':
          return d3.scaleSequential(d3.interpolateGreens).domain([0, 1]);
        case 'tsunami':
          return d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);
        case 'tectonic':
          return d3.scaleSequential(d3.interpolateReds).domain([0, 1]);
        default:
          return d3.scaleSequential(d3.interpolateGreys).domain([0, 1]);
      }
    };

    const colorScale = getColorScale();

    // Draw countries
    g.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('fill', (d: any, i: number) => {
        // Apply time-based changes
        const baseValue = Math.random() * 0.3 + 0.5;
        const impactEffect = impactLocation ? Math.max(0, 1 - timeStep * 0.1) : 0;
        const value = Math.max(0, Math.min(1, baseValue - impactEffect * 0.5));
        return colorScale(value);
      })
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .style('transition', 'fill 0.5s ease');

    // Draw impact location marker (before impact)
    if (impactLocation && timeStep === 0) {
      const coords = projection([impactLocation.lon, impactLocation.lat]);
      if (coords) {
        g.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', 5)
          .attr('fill', 'red')
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('animation', 'pulse 2s infinite');
      }
    }

    // Draw crater (after impact starts)
    if (impactLocation && timeStep > 0 && craterRadius > 0) {
      const coords = projection([impactLocation.lon, impactLocation.lat]);
      if (coords) {
        // Create crater group
        const craterGroup = g.append('g').attr('class', 'crater-group');
        
        // Outer blast radius (expanding circle)
        const blastRadius = craterRadius * (1 + timeStep * 0.3);
        craterGroup.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', blastRadius)
          .attr('fill', 'rgba(255, 100, 0, 0.3)')
          .attr('stroke', 'rgba(255, 50, 0, 0.6)')
          .attr('stroke-width', 2)
          .style('transition', 'r 0.5s ease, opacity 0.5s ease')
          .style('opacity', Math.max(0.3, 1 - timeStep * 0.1));

        // Middle impact zone
        craterGroup.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', craterRadius * 0.6)
          .attr('fill', 'rgba(100, 50, 0, 0.8)')
          .attr('stroke', 'rgba(50, 25, 0, 1)')
          .attr('stroke-width', 1.5);

        // Inner crater with texture pattern
        const defs = svg.append('defs');
        const pattern = defs.append('pattern')
          .attr('id', 'crater-texture')
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('width', 10)
          .attr('height', 10);

        pattern.append('rect')
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', '#1a0a00');

        pattern.append('circle')
          .attr('cx', 2)
          .attr('cy', 2)
          .attr('r', 1)
          .attr('fill', '#3d2010');

        pattern.append('circle')
          .attr('cx', 7)
          .attr('cy', 7)
          .attr('r', 1.5)
          .attr('fill', '#2d1808');

        craterGroup.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', craterRadius * 0.4)
          .attr('fill', 'url(#crater-texture)')
          .attr('stroke', '#000')
          .attr('stroke-width', 2);

        // Add shockwave animation
        if (timeStep < 5) {
          craterGroup.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', craterRadius * (1 + timeStep * 0.8))
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255, 200, 0, 0.8)')
            .attr('stroke-width', 3)
            .style('opacity', Math.max(0, 1 - timeStep * 0.2));
        }
      }
    }

    // Draw tsunami waves (for coastal impact)
    if (impactLocation && timeStep > 0 && selectedParameter === 'tsunami') {
      const coords = projection([impactLocation.lon, impactLocation.lat]);
      if (coords) {
        for (let i = 0; i < 3; i++) {
          const waveRadius = craterRadius * (2 + timeStep * 0.5 + i * 30);
          g.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', waveRadius)
            .attr('fill', 'none')
            .attr('stroke', `rgba(0, 100, 255, ${0.6 - i * 0.2})`)
            .attr('stroke-width', 2)
            .style('opacity', Math.max(0, 0.8 - timeStep * 0.1 - i * 0.2));
        }
      }
    }

    // Draw infrastructure markers (sample)
    const infrastructureMarkers = [
      { lat: 40.7128, lon: -74.0060, type: 'energy', status: timeStep > 2 ? 'damaged' : 'operational' },
      { lat: 34.0522, lon: -118.2437, type: 'military', status: timeStep > 3 ? 'damaged' : 'operational' },
      { lat: 51.5074, lon: -0.1278, type: 'cultural', status: timeStep > 4 ? 'damaged' : 'operational' },
    ];

    infrastructureMarkers.forEach(marker => {
      const coords = projection([marker.lon, marker.lat]);
      if (coords) {
        g.append('rect')
          .attr('x', coords[0] - 3)
          .attr('y', coords[1] - 3)
          .attr('width', 6)
          .attr('height', 6)
          .attr('fill', marker.status === 'damaged' ? '#000' : '#FFD700')
          .attr('stroke', marker.status === 'damaged' ? '#333' : '#FF8C00')
          .attr('stroke-width', 1);
      }
    });

  }, [worldData, selectedParameter, impactLocation, timeStep, selectedRegion, craterRadius]);

  return (
    <div className="relative bg-slate-100 rounded border border-slate-300">
      <svg
        ref={svgRef}
        width="900"
        height="550"
        className="w-full h-auto"
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
