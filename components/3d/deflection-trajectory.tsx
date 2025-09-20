"use client"

import { useMemo } from "react"
import { Line, Text } from "@react-three/drei"
import type { Vector3 } from "three"

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
  const trajectoryPoints = useMemo(() => {
    if (!visible) return { original: [], deflected: [] }

    return {
      original: originalPath,
      deflected: deflectedPath,
    }
  }, [originalPath, deflectedPath, visible])

  if (!visible) return null

  return (
    <group>
      {/* Original trajectory (red, dashed) */}
      <Line
        points={trajectoryPoints.original}
        color="#EF4444"
        lineWidth={3}
        transparent
        opacity={0.7}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />

      {/* Deflected trajectory (green) */}
      <Line points={trajectoryPoints.deflected} color="#10B981" lineWidth={3} transparent opacity={0.8} />

      {/* Intercept point marker */}
      <group position={interceptPoint}>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.5} />
        </mesh>

        <Text position={[0, 0.15, 0]} fontSize={0.04} color="#8B5CF6" anchorX="center" anchorY="bottom">
          {strategy} Intercept
        </Text>
      </group>
    </group>
  )
}
