"use client";

import React, { useRef } from "react";
import { Sphere, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AsteroidProps } from "../types";

// Helper function to get size-based color
function getSizeBasedColor(diameter: number): string {
  if (diameter < 100) return "#22c55e"; // Small - Green
  if (diameter < 500) return "#eab308"; // Medium - Yellow
  if (diameter < 1000) return "#f97316"; // Large - Orange
  return "#ef4444"; // Massive - Red
}

const AsteroidObject = React.memo(function AsteroidObject({
  data,
  position,
  scale = 1,
  onClick,
  isHighlighted = false,
}: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const avgDiameter = (data.est_diameter_min_m + data.est_diameter_max_m) / 2;
  const color = getSizeBasedColor(avgDiameter);

  // Simple rotation animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <Sphere ref={meshRef} args={[scale * 0.5, 16, 16]}>
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.3}
          emissive={isHighlighted ? color : "#000000"}
          emissiveIntensity={isHighlighted ? 0.5 : 0}
        />
      </Sphere>
      {isHighlighted && (
        <Text
          position={[0, scale * 0.8, 0]}
          fontSize={scale * 0.3}
          color={color}
          anchorY="bottom"
        >
          {data.name}
        </Text>
      )}
    </group>
  );
});

export default AsteroidObject;
