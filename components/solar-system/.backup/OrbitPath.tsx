"use client";

import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { OrbitPathProps } from "../types";

// Helper function to generate orbital path points
function generateOrbitPath(
  center: [number, number, number],
  radius: number,
  eccentricity = 0.1
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Create elliptical orbit
    const r =
      (radius * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(angle));
    const x = center[0] + r * Math.cos(angle);
    const z = center[2] + r * Math.sin(angle);
    const y = center[1] + Math.sin(angle * 3) * 0.2; // Slight vertical variation

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

const OrbitPath = React.memo(function OrbitPath({
  center,
  radius,
  color = "#ffffff",
  opacity = 0.3,
  eccentricity = 0.1,
}: OrbitPathProps) {
  const points = useMemo(
    () => generateOrbitPath(center, radius, eccentricity),
    [center, radius, eccentricity]
  );

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
    />
  );
});

export default OrbitPath;
