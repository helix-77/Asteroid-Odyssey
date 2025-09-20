"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Sphere, Stars } from "@react-three/drei"
import { TextureLoader } from "three"
import * as THREE from "three"

function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Load Earth textures
  const [colorMap, normalMap, specularMap] = useLoader(TextureLoader, [
    "/earth-surface-texture-blue-oceans-green-continents.jpg",
    "/earth-normal-map-for-3d-relief.jpg",
    "/earth-specular-map-for-ocean-reflections.jpg",
  ])

  // Rotate Earth
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
  })

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]} position={[0, 0, 0]}>
      <meshPhongMaterial map={colorMap} normalMap={normalMap} specularMap={specularMap} shininess={100} />
    </Sphere>
  )
}

function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float time;
        void main() {
          float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      atmosphereMaterial.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <Sphere ref={meshRef} args={[2.1, 64, 64]}>
      <primitive object={atmosphereMaterial} />
    </Sphere>
  )
}

export default function Earth() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4A90E2" />

        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade={true} />

        <EarthMesh />
        <Atmosphere />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={4}
          maxDistance={15}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
