"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Text } from "@react-three/drei"
import * as THREE from "three"

interface AsteroidProps {
  id: string
  name: string
  position: [number, number, number]
  size: number
  threatLevel: "low" | "medium" | "high"
  selected?: boolean
  onClick?: () => void
}

export default function Asteroid({ id, name, position, size, threatLevel, selected = false, onClick }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Scale size for visibility (real asteroids would be invisible at this scale)
  const visualSize = Math.max(0.02, size / 5000)

  // Color based on threat level
  const color = useMemo(() => {
    switch (threatLevel) {
      case "high":
        return "#EF4444"
      case "medium":
        return "#F59E0B"
      case "low":
        return "#10B981"
      default:
        return "#6B7280"
    }
  }, [threatLevel])

  // Glow intensity based on selection and threat
  const glowIntensity = selected ? 0.5 : threatLevel === "high" ? 0.3 : 0.1

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.005
    }

    if (glowRef.current && selected) {
      // Pulsing glow for selected asteroid
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.4
      glowRef.current.scale.setScalar(1 + pulse)
    }
  })

  return (
    <group position={position} onClick={onClick}>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[visualSize * 1.5, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={glowIntensity} side={THREE.BackSide} />
      </Sphere>

      {/* Main asteroid */}
      <Sphere ref={meshRef} args={[visualSize, 16, 16]}>
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={selected ? 0.3 : 0.1}
        />
      </Sphere>

      {/* Label for selected or high-threat asteroids */}
      {(selected || threatLevel === "high") && (
        <Text position={[0, visualSize + 0.1, 0]} fontSize={0.05} color={color} anchorX="center" anchorY="bottom">
          {name}
        </Text>
      )}
    </group>
  )
}
