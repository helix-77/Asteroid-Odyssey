"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  Text,
  Line,
  Stars,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImpactCalculator } from "@/components/shared/impact-calculator";
import {
  Search,
  X,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  Zap,
  Target,
  Rocket,
  Shield,
  TrendingUp,
  Activity,
  MapPin,
  Calendar,
  Gauge,
  Flame,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import neoData from "@/data/neo_sample.json";
import React from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface NEOData {
  name: string;
  neo_reference_id: string;
  absolute_magnitude_h: number;
  is_potentially_hazardous_asteroid: boolean;
  est_diameter_min_m: number;
  est_diameter_max_m: number;
  closest_approach_date?: string | null;
  miss_distance_km?: string | null;
  relative_velocity_km_s?: string | null;
  orbiting_body?: string | null;
  [key: string]: any;
}

// ImpactCalculation interface removed - now using shared component

// ============================================================================
// PHYSICS CALCULATIONS - Now using shared impact calculator component
// ============================================================================
// Physics calculations moved to @/components/shared/impact-calculator
// and @/lib/calculations/impact for consistency across all pages

/**
 * Calculate orbital period using Kepler's Third Law
 * T² = (4π²/GM) * a³
 */
function calculateOrbitalPeriod(semiMajorAxisAU: number): number {
  const GM_sun = 1.32712440018e20; // m³/s² (Sun's gravitational parameter)
  const AU = 1.496e11; // meters
  const a = semiMajorAxisAU * AU;
  const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM_sun);
  return period / (365.25 * 24 * 3600); // Convert to years
}

// ============================================================================
// VISUAL HELPERS
// ============================================================================

function getSizeBasedColor(diameter: number): string {
  if (diameter < 100) return "#10b981"; // Small - Green
  if (diameter < 500) return "#f59e0b"; // Medium - Amber
  if (diameter < 1000) return "#f97316"; // Large - Orange
  return "#ef4444"; // Massive - Red
}

function getThreatLevel(asteroid: NEOData): {
  level: string;
  color: string;
  intensity: number;
} {
  const diameter = asteroid.est_diameter_max_m;
  const isPHA = asteroid.is_potentially_hazardous_asteroid;

  if (isPHA && diameter > 1000) {
    return { level: "CRITICAL", color: "#dc2626", intensity: 1.0 };
  } else if (isPHA || diameter > 500) {
    return { level: "HIGH", color: "#f97316", intensity: 0.8 };
  } else if (diameter > 100) {
    return { level: "MODERATE", color: "#f59e0b", intensity: 0.6 };
  }
  return { level: "LOW", color: "#10b981", intensity: 0.4 };
}

// ============================================================================
// 3D COMPONENTS
// ============================================================================

/**
 * Moon orbiting Earth
 */
const Moon = React.memo(function Moon() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Moon orbits Earth at ~384,400 km, scaled to 3 units in our scene
      const angle = state.clock.elapsedTime * 0.1; // Orbital speed
      const orbitRadius = 3;
      const x = orbitRadius * Math.cos(angle);
      const z = orbitRadius * Math.sin(angle);

      meshRef.current.position.set(x, 0.2, z);
      meshRef.current.rotation.y += 0.01; // Moon rotation
    }
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[0.27, 32, 32]}>
        <meshStandardMaterial color="#9ca3af" roughness={0.9} metalness={0.1} />
      </Sphere>

      {/* Moon orbit path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.005, 16, 100]} />
        <meshBasicMaterial color="#6b7280" transparent opacity={0.2} />
      </mesh>
    </group>
  );
});

/**
 * Enhanced Earth Globe with realistic textures and atmosphere
 */
const EarthGlobe = React.memo(function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05; // Slow Earth rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.06; // Slightly faster clouds
    }
    if (atmosphereRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 1;
      atmosphereRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer atmosphere glow */}
      <Sphere ref={atmosphereRef} args={[2.3, 64, 64]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Atmosphere layer */}
      <Sphere args={[2.1, 64, 64]}>
        <meshPhongMaterial
          color="#3b82f6"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          emissive="#1e40af"
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Cloud layer */}
      <Sphere ref={cloudsRef} args={[2.05, 64, 64]}>
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          emissive="#e0f2fe"
          emissiveIntensity={0.1}
        />
      </Sphere>

      {/* Main Earth sphere */}
      <Sphere ref={meshRef} args={[2, 128, 128]}>
        <meshPhongMaterial
          color="#1e40af"
          emissive="#1e3a8a"
          emissiveIntensity={0.3}
          shininess={25}
          specular="#60a5fa"
        />
      </Sphere>

      {/* Earth label */}
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        EARTH
      </Text>

      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.01, 16, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
      </mesh>
    </group>
  );
});

/**
 * Asteroid with enhanced visuals and hover effects
 */
const Asteroid3D = React.memo(function Asteroid3D({
  asteroid,
  orbitRadius,
  orbitAngle,
  onClick,
  isSelected,
  orbitSpeed,
}: {
  asteroid: NEOData;
  orbitRadius: number;
  orbitAngle: number;
  onClick: () => void;
  isSelected: boolean;
  orbitSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line>(null);
  const [hovered, setHovered] = useState(false);
  const [trailPoints, setTrailPoints] = useState<THREE.Vector3[]>([]);

  const threat = useMemo(() => getThreatLevel(asteroid), [asteroid]);
  const color = useMemo(
    () => getSizeBasedColor(asteroid.est_diameter_max_m),
    [asteroid]
  );

  const size = useMemo(() => {
    const diameter = asteroid.est_diameter_max_m;
    return Math.max(0.03, Math.min(0.15, diameter / 8000));
  }, [asteroid]);

  // Orbital parameters
  const orbitParams = useMemo(
    () => ({
      speed: 0.02 + Math.random() * 0.03,
      offset: Math.random() * Math.PI * 2,
      eccentricity: 0.05 + Math.random() * 0.15,
      inclination: (Math.random() - 0.5) * 0.3,
    }),
    [asteroid.neo_reference_id]
  );

  useFrame((state) => {
    if (!meshRef.current) return;

    // Calculate orbital position
    const time =
      state.clock.elapsedTime * orbitParams.speed * orbitSpeed +
      orbitParams.offset;
    const angle = time;

    // Elliptical orbit with inclination
    const r =
      (orbitRadius * (1 - orbitParams.eccentricity)) /
      (1 + orbitParams.eccentricity * Math.cos(angle));
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle) * Math.sin(orbitParams.inclination);
    const z = r * Math.sin(angle) * Math.cos(orbitParams.inclination);

    meshRef.current.position.set(x, y, z);

    // Rotation
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.015;

    // Pulsing effect for hazardous asteroids
    if (asteroid.is_potentially_hazardous_asteroid) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.setScalar(size * pulse);
    } else {
      meshRef.current.scale.setScalar(size);
    }

    // Trail effect
    if (orbitSpeed > 0 && state.clock.elapsedTime % 0.1 < 0.016) {
      setTrailPoints((prev) => {
        const newPoints = [...prev, new THREE.Vector3(x, y, z)];
        return newPoints.slice(-30); // Keep last 30 points
      });
    }
  });

  return (
    <>
      {/* Asteroid mesh */}
      <Sphere
        ref={meshRef}
        args={[size, 16, 16]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 1.0 : threat.intensity}
          roughness={0.9}
          metalness={0.1}
        />
      </Sphere>

      {/* Glow effect when hovered or selected */}
      {(hovered || isSelected) && meshRef.current && (
        <Sphere position={meshRef.current.position} args={[size * 1.5, 16, 16]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </Sphere>
      )}

      {/* Label on hover */}
      {hovered && meshRef.current && (
        <Html position={meshRef.current.position} center>
          <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20 pointer-events-none">
            <p className="text-white text-xs font-semibold whitespace-nowrap">
              {asteroid.name}
            </p>
            <p className="text-gray-300 text-[10px]">
              {Math.round(asteroid.est_diameter_max_m)}m • {threat.level}
            </p>
          </div>
        </Html>
      )}
    </>
  );
});

/**
 * Orbital path visualization
 */
const OrbitPath = React.memo(function OrbitPath({
  radius,
  color,
  eccentricity = 0.1,
  inclination = 0,
}: {
  radius: number;
  color: string;
  eccentricity?: number;
  inclination?: number;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r =
        (radius * (1 - eccentricity)) / (1 + eccentricity * Math.cos(angle));
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle) * Math.sin(inclination);
      const z = r * Math.sin(angle) * Math.cos(inclination);
      pts.push(new THREE.Vector3(x, y, z));
    }

    return pts;
  }, [radius, eccentricity, inclination]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.15}
    />
  );
});

/**
 * Particle field for space dust and stars
 */
const SpaceParticles = React.memo(function SpaceParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random spherical distribution
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Color variation (white to blue)
      const colorVariation = Math.random();
      colors[i * 3] = 0.8 + colorVariation * 0.2;
      colors[i * 3 + 1] = 0.8 + colorVariation * 0.2;
      colors[i * 3 + 2] = 1.0;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0001;
      particlesRef.current.rotation.x += 0.00005;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});

/**
 * Main 3D Scene
 */
const SolarSystemScene = React.memo(function SolarSystemScene({
  asteroids,
  onAsteroidClick,
  selectedAsteroid,
  orbitSpeed,
  showOrbitPaths,
}: {
  asteroids: NEOData[];
  onAsteroidClick: (asteroid: NEOData) => void;
  selectedAsteroid: NEOData | null;
  orbitSpeed: number;
  showOrbitPaths: boolean;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Group asteroids by distance
  const asteroidGroups = useMemo(() => {
    return asteroids.slice(0, 150).map((asteroid, index) => ({
      asteroid,
      radius: 4 + (index % 5) * 1.5 + Math.random() * 2,
      angle: (index / asteroids.length) * Math.PI * 2,
    }));
  }, [asteroids]);

  return (
    <>
      {/* Space particles */}
      <SpaceParticles />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#60a5fa" />
      <directionalLight position={[0, 5, 5]} intensity={0.8} color="#fbbf24" />

      {/* Earth at center */}
      <EarthGlobe />

      {/* Moon orbiting Earth */}
      <Moon />

      {/* Orbital paths */}
      {showOrbitPaths && (
        <>
          {[4, 5.5, 7, 8.5, 10, 11.5].map((radius, i) => (
            <OrbitPath
              key={`orbit-${i}`}
              radius={radius}
              color="#3b82f6"
              eccentricity={0.05 + i * 0.02}
              inclination={(i - 3) * 0.05}
            />
          ))}
        </>
      )}

      {/* Asteroids */}
      {asteroidGroups.map(({ asteroid, radius, angle }) => (
        <Asteroid3D
          key={asteroid.neo_reference_id}
          asteroid={asteroid}
          orbitRadius={radius}
          orbitAngle={angle}
          onClick={() => onAsteroidClick(asteroid)}
          isSelected={
            selectedAsteroid?.neo_reference_id === asteroid.neo_reference_id
          }
          orbitSpeed={orbitSpeed}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI * 0.9}
        minPolarAngle={Math.PI * 0.1}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={["#0a0a0f", 20, 80]} />
    </>
  );
});

// ============================================================================
// ENHANCED ASTEROID POPUP
// ============================================================================

function EnhancedAsteroidPopup({
  asteroid,
  onClose,
}: {
  asteroid: NEOData;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const threat = useMemo(() => getThreatLevel(asteroid), [asteroid]);

  const avgDiameter =
    (asteroid.est_diameter_min_m + asteroid.est_diameter_max_m) / 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative bg-slate-950/98 backdrop-blur-2xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-5 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">
                    {asteroid.name}
                  </h2>
                  {asteroid.is_potentially_hazardous_asteroid && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </motion.div>
                  )}
                </div>
                <p className="text-muted-foreground text-xs font-mono">
                  {asteroid.neo_reference_id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    threat.level === "CRITICAL" || threat.level === "HIGH"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {threat.level}
                </Badge>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview" className="text-sm">
                  <Activity className="h-3 w-3 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="impact" className="text-sm">
                  <Flame className="h-3 w-3 mr-1.5" />
                  Impact
                </TabsTrigger>
                <TabsTrigger value="defense" className="text-sm">
                  <Shield className="h-3 w-3 mr-1.5" />
                  Defense
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Physical Properties */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">
                        Physical Properties
                      </h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Diameter:</span>
                        <span className="font-semibold">
                          {Math.round(avgDiameter)} m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Range:</span>
                        <span className="font-medium">
                          {Math.round(asteroid.est_diameter_min_m)}-
                          {Math.round(asteroid.est_diameter_max_m)} m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Magnitude:
                        </span>
                        <span className="font-medium">
                          H = {asteroid.absolute_magnitude_h}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Est. Mass:
                        </span>
                        <span className="font-medium">
                          {(
                            ((4 / 3) *
                              Math.PI *
                              Math.pow(avgDiameter / 2, 3) *
                              2700) /
                            1e9
                          ).toFixed(2)}{" "}
                          × 10⁹ kg
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Orbital Data */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Orbital Data</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Orbiting:</span>
                        <span className="font-medium">
                          {asteroid.orbiting_body || "Sun"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Velocity:</span>
                        <span className="font-semibold">
                          {asteroid.relative_velocity_km_s
                            ? `${parseFloat(
                                asteroid.relative_velocity_km_s
                              ).toFixed(2)} km/s`
                            : "~20 km/s"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Approach:</span>
                        <span className="font-medium">
                          {asteroid.closest_approach_date || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Miss Dist:
                        </span>
                        <span className="font-medium">
                          {asteroid.miss_distance_km
                            ? `${(
                                parseFloat(asteroid.miss_distance_km) / 384400
                              ).toFixed(2)} LD`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quick Stats - Using shared impact calculator */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">
                    Impact Statistics
                  </h3>
                  <ImpactCalculator asteroid={asteroid} compact={true} showDataQuality={false} />
                </Card>
              </TabsContent>

              {/* Impact Analysis Tab - Using shared impact calculator */}
              <TabsContent value="impact" className="space-y-4">
                <ImpactCalculator asteroid={asteroid} showDataQuality={true} />
              </TabsContent>

              {/* Defense Options Tab */}
              <TabsContent value="defense" className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-purple-500/5 to-orange-500/5 border-primary/20">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-primary/10 border-2 border-primary/30">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">
                        Planetary Defense Center
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Access our comprehensive deflection strategy calculator with real-time simulations, 
                        accurate physics calculations, and mission planning tools.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-xs">
                      <div className="p-2 rounded-lg bg-background/50 border">
                        <Rocket className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="font-medium">5 Strategies</p>
                        <p className="text-muted-foreground">Kinetic, Nuclear, Gravity...</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border">
                        <Target className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                        <p className="font-medium">3D Simulation</p>
                        <p className="text-muted-foreground">Real trajectory modeling</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border">
                        <Activity className="h-4 w-4 text-cyan-500 mx-auto mb-1" />
                        <p className="font-medium">Physics Engine</p>
                        <p className="text-muted-foreground">Accurate calculations</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border">
                        <Zap className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                        <p className="font-medium">Mission Planning</p>
                        <p className="text-muted-foreground">Cost & timeline analysis</p>
                      </div>
                    </div>

                    <Link href="/deflection" className="w-full">
                      <Button 
                        className="w-full group relative overflow-hidden"
                        size="lg"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Launch Defense Center
                          <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>

                    <p className="text-xs text-muted-foreground">
                      Analyze deflection strategies for <strong>{asteroid.name}</strong>
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SolarSystemModel() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<NEOData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showControls, setShowControls] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [orbitSpeed, setOrbitSpeed] = useState(0.5);
  const [showOrbitPaths, setShowOrbitPaths] = useState(true);
  const [filterThreat, setFilterThreat] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<[number, number]>([0, 10000]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Filter asteroids
  const filteredAsteroids = useMemo(() => {
    return neoData.filter((asteroid) => {
      const matchesSearch =
        asteroid.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false;
      const matchesThreat =
        filterThreat === "all" ||
        (filterThreat === "high" &&
          asteroid.is_potentially_hazardous_asteroid) ||
        (filterThreat === "low" && !asteroid.is_potentially_hazardous_asteroid);
      const matchesSize =
        asteroid.est_diameter_max_m >= sizeFilter[0] &&
        asteroid.est_diameter_max_m <= sizeFilter[1];
      return matchesSearch && matchesThreat && matchesSize;
    });
  }, [searchTerm, filterThreat, sizeFilter]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return neoData
      .filter((asteroid) =>
        asteroid.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 8);
  }, [searchTerm]);

  const stats = useMemo(
    () => ({
      total: filteredAsteroids.length,
      hazardous: filteredAsteroids.filter(
        (a) => a.is_potentially_hazardous_asteroid
      ).length,
      avgSize:
        filteredAsteroids.reduce((sum, a) => sum + a.est_diameter_max_m, 0) /
        filteredAsteroids.length,
    }),
    [filteredAsteroids]
  );

  const handleAsteroidClick = useCallback((asteroid: NEOData) => {
    setSelectedAsteroid(asteroid);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedAsteroid(null);
  }, []);

  const handleSelectSuggestion = useCallback((asteroid: NEOData) => {
    setSearchTerm(asteroid.name);
    setShowSearchSuggestions(false);
    setSelectedAsteroid(asteroid);
  }, []);

  // Click outside to close controls
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showControls &&
        controlsRef.current &&
        !controlsRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-controls-button]")) {
          setShowControls(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showControls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          setOrbitSpeed((current) => (current === 0 ? 0.5 : 0));
          break;
        case "1":
          setOrbitSpeed(0.5);
          break;
        case "2":
          setOrbitSpeed(1);
          break;
        case "3":
          setOrbitSpeed(2);
          break;
        case "o":
          setShowOrbitPaths((current) => !current);
          break;
        case "c":
          setShowControls((current) => !current);
          break;
        case "?":
          setShowHelp((current) => !current);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 8, 20], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <SolarSystemScene
            asteroids={filteredAsteroids}
            onAsteroidClick={handleAsteroidClick}
            selectedAsteroid={selectedAsteroid}
            orbitSpeed={orbitSpeed}
            showOrbitPaths={showOrbitPaths}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Top Center Search Bar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 pointer-events-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Search asteroids by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchSuggestions(e.target.value.length >= 2);
              }}
              onFocus={() => setShowSearchSuggestions(searchTerm.length >= 2)}
              className="pl-10 pr-4 py-4 bg-black/70 backdrop-blur-xl border-white/30 text-white placeholder:text-gray-500 rounded-2xl text-base"
            />

            {/* Search Suggestions */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 w-full bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl"
              >
                {searchSuggestions.map((asteroid) => {
                  const threat = getThreatLevel(asteroid);
                  return (
                    <button
                      key={asteroid.neo_reference_id}
                      onClick={() => handleSelectSuggestion(asteroid)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {asteroid.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.round(asteroid.est_diameter_max_m)}m •{" "}
                            {threat.level} Risk
                          </p>
                        </div>
                        {asteroid.is_potentially_hazardous_asteroid && (
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 pointer-events-auto">
          <div className="flex items-center gap-3">
            {/* Speed Control */}
            <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3">
              {orbitSpeed === 0 ? (
                <Pause className="h-4 w-4 text-gray-400" />
              ) : (
                <Play className="h-4 w-4 text-green-400" />
              )}
              <span className="text-white text-sm font-medium">
                {orbitSpeed === 0
                  ? "PAUSED"
                  : `${orbitSpeed.toFixed(1)}× SPEED`}
              </span>
            </div>

            <Button
              onClick={() => setShowControls(!showControls)}
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-white"
              data-controls-button
            >
              <Settings className="h-5 w-5 mr-2" />
              Controls
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              ref={controlsRef}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute right-6 top-32 w-80 pointer-events-auto"
            >
              <Card className="p-6 bg-black/80 backdrop-blur-2xl border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Controls</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Orbit Speed */}
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Orbit Speed: {orbitSpeed.toFixed(1)}×
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={orbitSpeed}
                      onChange={(e) =>
                        setOrbitSpeed(parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Show Orbit Paths */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">
                      Show Orbit Paths
                    </label>
                    <input
                      type="checkbox"
                      checked={showOrbitPaths}
                      onChange={(e) => setShowOrbitPaths(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </div>

                  {/* Filter by Threat */}
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Filter by Threat
                    </label>
                    <select
                      value={filterThreat}
                      onChange={(e) => setFilterThreat(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="all">All Asteroids</option>
                      <option value="high">Hazardous Only</option>
                      <option value="low">Non-Hazardous Only</option>
                    </select>
                  </div>

                  {/* Size Filter */}
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Size Range: {sizeFilter[0]}m - {sizeFilter[1]}m
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={sizeFilter[1]}
                        onChange={(e) =>
                          setSizeFilter([
                            sizeFilter[0],
                            parseInt(e.target.value),
                          ])
                        }
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSizeFilter([0, 100])}
                          className="flex-1 text-xs"
                        >
                          Small
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSizeFilter([100, 1000])}
                          className="flex-1 text-xs"
                        >
                          Medium
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSizeFilter([1000, 10000])}
                          className="flex-1 text-xs"
                        >
                          Large
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Button */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="absolute bottom-6 right-6 w-12 h-12 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-xl border border-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-xl pointer-events-auto transition-all hover:scale-110"
        >
          ?
        </button>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-20 right-6 w-96 pointer-events-auto"
            >
              <Card className="p-6 bg-black/90 backdrop-blur-2xl border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Keyboard Shortcuts
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Pause/Play</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      Space
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Speed 0.5×</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      1
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Speed 1×</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      2
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Speed 2×</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      3
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Toggle Orbits</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      O
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Toggle Controls</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      C
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Show Help</span>
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">
                      ?
                    </kbd>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-bold text-blue-400 mb-2">
                    Data Accuracy
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-white">Asteroid Data:</strong> Real
                    NEO data from NASA's database with actual sizes, velocities,
                    and approach dates.
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    <strong className="text-white">Orbital Mechanics:</strong>{" "}
                    Simplified Keplerian orbits for visualization. Real
                    asteroids follow complex perturbed trajectories affected by
                    multiple gravitational bodies.
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    <strong className="text-white">Impact Calculations:</strong>{" "}
                    Based on peer-reviewed scaling laws (Collins et al., 2005)
                    but simplified for educational purposes.
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    <strong className="text-white">Visualization:</strong>{" "}
                    Orbital speeds and distances are scaled for better viewing.
                    Not to actual scale.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* <div className="relative z-10 pointer-events-none"> */}
      {/* Left Stats Panel */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-auto space-y-4 ">
        <div className="bg-black/60 backdrop-blur-xl px-5 py-4 rounded-xl border border-blue-500/30 flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-1">Tracked</p>
          <p className="text-sm font-bold text-blue-400">{stats.total}</p>
        </div>
        <div className="bg-black/60 backdrop-blur-xl px-5 py-4 rounded-xl border border-red-500/30 flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-1">Hazardous</p>
          <p className="text-sm font-bold text-red-400">{stats.hazardous}</p>
        </div>
        <div className="bg-black/60 backdrop-blur-xl px-5 py-4 rounded-xl border border-green-500/30 flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-1">Avg Size</p>
          <p className="text-sm font-bold text-green-400">
            {Math.round(stats.avgSize)}m
          </p>
        </div>
      </div>

      {/* Asteroid Popup */}
      {selectedAsteroid && (
        <EnhancedAsteroidPopup
          asteroid={selectedAsteroid}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
}
