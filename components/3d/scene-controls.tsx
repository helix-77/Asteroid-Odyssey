"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

interface SceneControlsProps {
  autoRotate?: boolean
  focusTarget?: THREE.Vector3
  cameraMode: "free" | "earth" | "asteroid" | "impact"
}

export default function SceneControls({ autoRotate = false, focusTarget, cameraMode }: SceneControlsProps) {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!controlsRef.current) return

    // Smooth camera transitions based on mode
    switch (cameraMode) {
      case "earth":
        // Focus on Earth
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
        break
      case "asteroid":
        // Focus on selected asteroid
        if (focusTarget) {
          controlsRef.current.target.lerp(focusTarget, 0.05)
        }
        break
      case "impact":
        // Close-up view for impact visualization
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
        camera.position.lerp(new THREE.Vector3(3, 1, 3), 0.05)
        break
      default:
        // Free camera mode
        break
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2.5}
      maxDistance={20}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      dampingFactor={0.05}
      enableDamping={true}
    />
  )
}
