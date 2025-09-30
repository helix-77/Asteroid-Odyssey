"use client"

import { useMemo, useRef } from "react"
import { Line, Text, Trail } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { Vector3, Mesh } from "three"

interface DeflectionTrajectoryProps {
  originalPath: Vector3[]
  deflectedPath: Vector3[]
  interceptPoint: Vector3
  strategy: string
  visible: boolean
}

export default function DeflectionTrajectory({
  originalPath,
  deflectedPath,
  interceptPoint,
  strategy,
  visible,
}: DeflectionTrajectoryProps) {
  const tRef = useRef(0)
  const originalMarkerRef = useRef<Mesh | null>(null)
  const deflectedMarkerRef = useRef<Mesh | null>(null)

  const trajectoryPoints = useMemo(() => {
    if (!visible) return { original: [], deflected: [] }

    return {
      original: originalPath,
      deflected: deflectedPath,
    }
  }, [originalPath, deflectedPath, visible])

  // Animate progress along the paths (0..1 loop)
  useFrame((_, delta) => {
    tRef.current = (tRef.current + delta * 0.05) % 1 // slow sweep

    if (trajectoryPoints.original.length > 1 && originalMarkerRef.current) {
      const p = sampleAlong(trajectoryPoints.original, tRef.current)
      if (p) originalMarkerRef.current.position.copy(p)
    }
    if (trajectoryPoints.deflected.length > 1 && deflectedMarkerRef.current) {
      const p = sampleAlong(trajectoryPoints.deflected, (tRef.current + 0.1) % 1)
      if (p) deflectedMarkerRef.current.position.copy(p)
    }
  })

  const sampleAlong = (points: Vector3[], t: number): Vector3 | null => {
    if (!points || points.length < 2) return null
    const total = points.length - 1
    const f = t * total
    const i = Math.min(Math.floor(f), total - 1)
    const frac = f - i
    const a = points[i]
    const b = points[i + 1]
    if (!a || !b) return points[points.length - 1]
    return a.clone().lerp(b, frac)
  }

  if (!visible) return null

  return (
    <group>
      {/* Original trajectory (red) */}
      <Line
        points={trajectoryPoints.original}
        color="#EF4444"
        lineWidth={4}
        transparent
        opacity={0.95}
      />

      {/* Deflected trajectory (green) */}
      <Line points={trajectoryPoints.deflected} color="#10B981" lineWidth={4} transparent opacity={0.95} />

      {/* Intercept point marker */}
      <group position={[interceptPoint.x, interceptPoint.y, interceptPoint.z] as any}>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.5} />
        </mesh>

        <Text position={[0, 0.15, 0]} fontSize={0.04} color="#8B5CF6" anchorX="center" anchorY="bottom">
          {strategy} Intercept
        </Text>

        {/* Halo ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.11, 32]} />
          <meshBasicMaterial color="#8B5CF6" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Animated markers moving along paths */}
      {trajectoryPoints.original.length > 1 && (
        <Trail width={1.5} color="#F87171" length={30} attenuation={(t: number) => t * t}>
          <mesh ref={originalMarkerRef as any}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#FCA5A5" emissive="#EF4444" emissiveIntensity={1.2} />
          </mesh>
        </Trail>
      )}
      {trajectoryPoints.deflected.length > 1 && (
        <Trail width={1.5} color="#34D399" length={30} attenuation={(t: number) => t * t}>
          <mesh ref={deflectedMarkerRef as any}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#86EFAC" emissive="#10B981" emissiveIntensity={1.2} />
          </mesh>
        </Trail>
      )}
    </group>
  )
}
