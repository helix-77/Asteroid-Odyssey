"use client";

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Asteroid } from '@/lib/types';
import type { TemporalEffects, CountryData, InfrastructurePoint } from '@/lib/calculations/impact/types';

interface MapVisualizationProps {
  selectedParameter: 'population' | 'habitability' | 'tsunami' | 'tectonic';
  impactLocation: { lat: number; lng: number } | null;
  timeStep: number;
  selectedRegion: string;
  asteroid: Asteroid | null;
  impactData: TemporalEffects | null;
  onMapClick: (lat: number, lng: number) => void;
  countries: CountryData[];
  infrastructure: InfrastructurePoint[];
}

export function MapVisualization({
  selectedParameter,
  impactLocation,
  timeStep,
  selectedRegion,
  asteroid,
  impactData,
  onMapClick,
  countries,
  infrastructure
}: MapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [zoom, setZoom] = useState(1);

  // Load world map data
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => {
        setWorldData(data);
      })
      .catch(err => console.error('Failed to load world map:', err));
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 900;
    const height = 550;

    svg.selectAll('*').remove();

    // Set up projection based on selected region
    let projection = d3.geoMercator();
    
    switch(selectedRegion) {
      case 'North America':
        projection = d3.geoMercator().center([-100, 50]).scale(400).translate([width/2, height/2]);
        break;
      case 'South America':
        projection = d3.geoMercator().center([-60, -15]).scale(400).translate([width/2, height/2]);
        break;
      case 'Europe':
        projection = d3.geoMercator().center([15, 52]).scale(600).translate([width/2, height/2]);
        break;
      case 'Asia':
        projection = d3.geoMercator().center([100, 35]).scale(400).translate([width/2, height/2]);
        break;
      case 'Africa':
        projection = d3.geoMercator().center([20, 0]).scale(400).translate([width/2, height/2]);
        break;
      case 'Australia':
        projection = d3.geoMercator().center([135, -25]).scale(600).translate([width/2, height/2]);
        break;
      default:
        projection = d3.geoMercator().scale(145).translate([width/2, height/2 + 20]);
    }

    const path = d3.geoPath().projection(projection);
    const geoFeatures = feature(worldData, worldData.objects.countries) as any;

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

    // Color scale based on parameter and time
    const getColorForCountry = (countryName: string) => {
      const countryData = countries.find(c => 
        c.name.toLowerCase().includes(countryName.toLowerCase()) ||
        countryName.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!countryData) return '#e0e0e0';

      let value = 0;
      let baseValue = 0;

      switch(selectedParameter) {
        case 'population':
          baseValue = Math.min(countryData.populationDensity / 500, 1);
          break;
        case 'habitability':
          baseValue = countryData.habitability / 100;
          break;
        case 'tsunami':
          baseValue = countryData.tsunamiRisk / 100;
          break;
        case 'tectonic':
          baseValue = countryData.tectonicRisk / 100;
          break;
      }

      // Apply impact effects if available
      if (impactData && impactLocation) {
        const regionalDamage = Array.from(impactData.regionalDamage?.values() || [])
          .find(r => r.countryName === countryData.name);

        if (regionalDamage) {
          if (selectedParameter === 'population') {
            value = Math.max(0, baseValue * (1 - regionalDamage.populationLossPercent / 100));
          } else if (selectedParameter === 'habitability') {
            value = Math.max(0, baseValue - regionalDamage.habitabilityChange / 100);
          } else {
            value = baseValue;
          }
        } else {
          value = baseValue;
        }
      } else {
        value = baseValue;
      }

      // Color scales
      switch(selectedParameter) {
        case 'population':
          return d3.interpolateYlOrRd(value);
        case 'habitability':
          return d3.interpolateRdYlGn(value);
        case 'tsunami':
          return d3.interpolateBlues(value);
        case 'tectonic':
          return d3.interpolateReds(value);
        default:
          return d3.interpolateGreys(value);
      }
    };

    // Draw countries
    g.selectAll('path')
      .data(geoFeatures.features)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('fill', (d: any) => getColorForCountry(d.properties?.name || ''))
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .style('transition', 'fill 0.5s ease')
      .style('cursor', 'crosshair')
      .on('click', function(event: any, d: any) {
        const [x, y] = d3.pointer(event);
        const coords = projection.invert?.([x, y]);
        if (coords) {
          onMapClick(coords[1], coords[0]);
        }
      });

    // Draw impact location marker (before impact)
    if (impactLocation && timeStep === 0) {
      const coords = projection([impactLocation.lng, impactLocation.lat]);
      if (coords) {
        g.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', 5)
          .attr('fill', 'red')
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('class', 'impact-marker');
      }
    }

    // Draw crater and blast effects (after impact starts)
    if (impactLocation && timeStep > 0 && impactData) {
      const coords = projection([impactLocation.lng, impactLocation.lat]);
      if (coords) {
        const craterGroup = g.append('g').attr('class', 'crater-group');
        
        // Calculate crater size based on impact data
        const craterDiameterKm = (impactData as any).craterDiameter ? (impactData as any).craterDiameter / 1000 : 10;
        const blastRadiusKm = (impactData as any).blastRadius ? (impactData as any).blastRadius / 1000 : 50;
        const thermalRadiusKm = (impactData as any).thermalRadius ? (impactData as any).thermalRadius / 1000 : 100;
        
        // Convert km to pixels (approximate)
        const kmToPixels = (km: number) => {
          const metersPerPixel = 156543.03392 * Math.cos(impactLocation.lat * Math.PI / 180) / Math.pow(2, Math.log2(projection.scale()));
          return (km * 1000) / metersPerPixel;
        };

        const craterRadius = kmToPixels(craterDiameterKm / 2);
        const blastRadius = kmToPixels(blastRadiusKm);
        const thermalRadius = kmToPixels(thermalRadiusKm);

        // Thermal radiation zone (expanding)
        const thermalExpansion = Math.min(1, timeStep / 10);
        craterGroup.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', thermalRadius * thermalExpansion)
          .attr('fill', 'rgba(255, 150, 0, 0.2)')
          .attr('stroke', 'rgba(255, 100, 0, 0.5)')
          .attr('stroke-width', 2)
          .style('transition', 'r 0.5s ease');

        // Blast zone (expanding)
        const blastExpansion = Math.min(1, timeStep / 5);
        craterGroup.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', blastRadius * blastExpansion)
          .attr('fill', 'rgba(255, 50, 0, 0.3)')
          .attr('stroke', 'rgba(255, 0, 0, 0.6)')
          .attr('stroke-width', 2)
          .style('transition', 'r 0.5s ease');

        // Crater (forms immediately, then expands slightly)
        const craterExpansion = Math.min(1, 0.5 + timeStep / 20);
        craterGroup.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', craterRadius * craterExpansion)
          .attr('fill', '#1a0a00')
          .attr('stroke', '#000')
          .attr('stroke-width', 2);
      }
    }

    // Draw infrastructure markers
    infrastructure.forEach(infra => {
      const coords = projection([infra.longitude, infra.latitude]);
      if (coords) {
        let damageLevel = 0;
        let operational = true;

        if (impactData && impactData.infrastructureDamage) {
          const damage = Array.from(impactData.infrastructureDamage.values())
            .find(d => d.facilityName === infra.name);
          if (damage) {
            damageLevel = damage.damageLevel;
            operational = damage.operational;
          }
        }

        const size = 3 + infra.importance * 1.5;
        const opacity = operational ? 1 : 0.3;

        let color = '#FFD700';
        switch(infra.type) {
          case 'military': color = '#FF0000'; break;
          case 'energy': color = '#FFA500'; break;
          case 'cultural': color = '#9370DB'; break;
          case 'civilian': color = '#00FF00'; break;
        }

        if (damageLevel > 0.8) color = '#000000';

        g.append('rect')
          .attr('x', coords[0] - size/2)
          .attr('y', coords[1] - size/2)
          .attr('width', size)
          .attr('height', size)
          .attr('fill', color)
          .attr('stroke', operational ? '#FFF' : '#666')
          .attr('stroke-width', 1)
          .attr('opacity', opacity);
      }
    });

  }, [worldData, selectedParameter, impactLocation, timeStep, selectedRegion, asteroid, impactData, countries, infrastructure, onMapClick]);

  return (
    <div className="relative bg-slate-100 rounded border border-slate-300 overflow-hidden">
      <svg
        ref={svgRef}
        width="900"
        height="550"
        className="w-full h-auto"
      />
      <style>{`
        .impact-marker {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
