"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Ring } from "@react-three/drei"
import * as THREE from "three"

interface ImpactVisualizationProps {
  impactPoint: [number, number, number]
  craterDiameter: number // km
  airblastRadius: number // km
  thermalRadius: number // km
  active: boolean
}

export default function ImpactVisualization({
  impactPoint,
  craterDiameter,
  airblastRadius,
  thermalRadius,
  active,
}: ImpactVisualizationProps) {
  const explosionRef = useRef<THREE.Mesh>(null)
  const shockwaveRef = useRef<THREE.Mesh>(null)

  // Scale factors for visualization (Earth radius = 2 units in our 3D scene)
  const earthRadius = 2
  const scale = earthRadius / 6371 // Earth radius in km

  const scaledCrater = craterDiameter * scale * 100 // Exaggerate for visibility
  const scaledAirblast = airblastRadius * scale * 10
  const scaledThermal = thermalRadius * scale * 10

  useFrame((state) => {
    if (!active) return

    if (explosionRef.current) {
      // Pulsing explosion effect
      const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.3 + 0.7
      explosionRef.current.scale.setScalar(pulse)
    }

    if (shockwaveRef.current) {
      // Expanding shockwave
      const expansion = (Math.sin(state.clock.elapsedTime * 2) + 1) * 0.5
      shockwaveRef.current.scale.setScalar(1 + expansion * 2)
    }
  })

  if (!active) return null

  return (
    <group position={impactPoint}>
      {/* Crater (red) */}
      <Sphere args={[scaledCrater, 16, 16]}>
        <meshBasicMaterial color="#DC2626" transparent opacity={0.8} />
      </Sphere>

      {/* Thermal radiation zone (orange) */}
      <Ring args={[scaledCrater, scaledThermal, 32]}>
        <meshBasicMaterial color="#F97316" transparent opacity={0.4} side={THREE.DoubleSide} />
      </Ring>

      {/* Airblast zone (yellow) */}
      <Ring args={[scaledThermal, scaledAirblast, 32]}>
        <meshBasicMaterial color="#FCD34D" transparent opacity={0.3} side={THREE.DoubleSide} />
      </Ring>

      {/* Explosion effect */}
      <Sphere ref={explosionRef} args={[scaledCrater * 2, 16, 16]}>
        <meshBasicMaterial color="#FF4500" transparent opacity={0.6} emissive="#FF4500" emissiveIntensity={0.5} />
      </Sphere>

      {/* Expanding shockwave */}
      <Ring ref={shockwaveRef} args={[scaledAirblast * 0.8, scaledAirblast * 1.2, 32]}>
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} side={THREE.DoubleSide} />
      </Ring>
    </group>
  )
}
