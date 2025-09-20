"use client"

import { useMemo } from "react"
import { Line } from "@react-three/drei"
import { Vector3 } from "three"
import { calculateOrbitPath } from "@/lib/calculations/orbital"
import type { OrbitalElements } from "@/lib/calculations/orbital"

interface OrbitPathProps {
  elements: OrbitalElements
  color?: string
  opacity?: number
  visible?: boolean
}

export default function OrbitPath({ elements, color = "#F97316", opacity = 0.6, visible = true }: OrbitPathProps) {
  const orbitPoints = useMemo(() => {
    if (!visible) return []

    const positions = calculateOrbitPath(elements, 365, 200)
    return positions.map((pos) => new Vector3(pos.x * 5, pos.y * 5, pos.z * 5)) // Scale for visibility
  }, [elements, visible])

  if (!visible || orbitPoints.length === 0) return null

  return <Line points={orbitPoints} color={color} lineWidth={2} transparent opacity={opacity} dashed={false} />
}
