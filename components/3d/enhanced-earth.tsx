"use client"

import { useRef, useMemo } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import { Sphere } from "@react-three/drei"
import { TextureLoader } from "three"
import * as THREE from "three"

interface EnhancedEarthProps {
  showClouds?: boolean
  showAtmosphere?: boolean
  rotationSpeed?: number
}

export default function EnhancedEarth({
  showClouds = true,
  showAtmosphere = true,
  rotationSpeed = 0.001,
}: EnhancedEarthProps) {
  const earthRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  // Load Earth textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    "/earth-surface-texture-blue-oceans-green-continents.jpg",
    "/earth-normal-map-for-3d-relief.jpg",
    "/earth-specular-map-for-ocean-reflections.jpg",
    "/earth-clouds-texture-white-on-transparent.jpg",
  ])

  // Atmosphere shader material
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        viewVector: { value: new THREE.Vector3() },
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
          intensity = pow(dot(normalize(viewVector), actual_normal), 6.0);
        }
      `,
      fragmentShader: `
        varying float intensity;
        void main() {
          vec3 glow = vec3(0.3, 0.6, 1.0) * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
  }, [])

  useFrame((state, delta) => {
    // Rotate Earth
    if (earthRef.current) {
      earthRef.current.rotation.y += rotationSpeed
    }

    // Rotate clouds slightly faster
    if (cloudsRef.current && showClouds) {
      cloudsRef.current.rotation.y += rotationSpeed * 1.2
    }

    // Update atmosphere
    if (atmosphereRef.current && showAtmosphere) {
      atmosphereMaterial.uniforms.time.value = state.clock.elapsedTime
      atmosphereMaterial.uniforms.viewVector.value = state.camera.position
    }
  })

  return (
    <group>
      {/* Main Earth */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={100}
          transparent={false}
        />
      </Sphere>

      {/* Clouds layer */}
      {showClouds && (
        <Sphere ref={cloudsRef} args={[2.01, 32, 32]}>
          <meshLambertMaterial map={cloudsMap} transparent opacity={0.4} depthWrite={false} />
        </Sphere>
      )}

      {/* Atmosphere glow */}
      {showAtmosphere && (
        <Sphere ref={atmosphereRef} args={[2.1, 32, 32]}>
          <primitive object={atmosphereMaterial} />
        </Sphere>
      )}
    </group>
  )
}
