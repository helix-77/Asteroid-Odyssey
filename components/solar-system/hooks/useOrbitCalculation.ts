import { useMemo } from "react";
import * as THREE from "three";
import { NEOData } from "../types";

interface OrbitParams {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  scale?: number;
}

export function useOrbitCalculation(asteroid: NEOData, scale = 1) {
  return useMemo(() => {
    // In a real application, these would be calculated from actual orbital elements
    // For demo purposes, we're generating pseudo-random but consistent values
    const hash = hashCode(asteroid.neo_reference_id);

    const params: OrbitParams = {
      semiMajorAxis: (2 + (hash % 5)) * scale,
      eccentricity: 0.1 + (Math.abs(hash) % 100) / 200, // 0.1 to 0.6
      inclination: (Math.abs(hash) % 30) * (Math.PI / 180), // 0 to 30 degrees
      scale,
    };

    const points = calculateOrbitPoints(params);
    const currentPosition = calculateCurrentPosition(params, Date.now());

    return {
      orbitPoints: points,
      currentPosition,
      params,
    };
  }, [asteroid.neo_reference_id, scale]);
}

function calculateOrbitPoints({
  semiMajorAxis,
  eccentricity,
  inclination,
}: OrbitParams): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const r =
      (semiMajorAxis * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(angle));

    // Calculate position in orbital plane
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle) * Math.sin(inclination);
    const z = r * Math.sin(angle) * Math.cos(inclination);

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

function calculateCurrentPosition(
  params: OrbitParams,
  time: number
): THREE.Vector3 {
  // Calculate position based on time
  const angle = (time / 10000) % (Math.PI * 2); // Simplified time-based angle
  const r =
    (params.semiMajorAxis * (1 - params.eccentricity * params.eccentricity)) /
    (1 + params.eccentricity * Math.cos(angle));

  const x = r * Math.cos(angle);
  const y = r * Math.sin(angle) * Math.sin(params.inclination);
  const z = r * Math.sin(angle) * Math.cos(params.inclination);

  return new THREE.Vector3(x, y, z);
}

// Helper function to generate consistent hash from string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}
