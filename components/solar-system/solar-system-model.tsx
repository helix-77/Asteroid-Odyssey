"use client";

import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  Filter,
  X,
  AlertTriangle,
  Shield,
  Target,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import neoData from "@/data/neo_sample.json";
import React from "react";

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
  [key: string]: any; // Allow additional properties
}

// Helper function to get size-based color
function getSizeBasedColor(diameter: number): string {
  if (diameter < 100) return "#22c55e"; // Small - Green
  if (diameter < 500) return "#eab308"; // Medium - Yellow
  if (diameter < 1000) return "#f97316"; // Large - Orange
  return "#ef4444"; // Massive - Red
}

// Helper function to generate orbital path points
function generateOrbitPath(
  center: [number, number, number],
  radius: number,
  eccentricity = 0.1
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Create elliptical orbit
    const r =
      (radius * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(angle));
    const x = center[0] + r * Math.cos(angle);
    const z = center[2] + r * Math.sin(angle);
    const y = center[1] + Math.sin(angle * 3) * 0.2; // Slight vertical variation

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

const OrbitPath = React.memo(function OrbitPath({
  center,
  radius,
  color = "#ffffff",
  opacity = 0.3,
  eccentricity = 0.1,
}: {
  center: [number, number, number];
  radius: number;
  color?: string;
  opacity?: number;
  eccentricity?: number;
}) {
  const points = useMemo(
    () => generateOrbitPath(center, radius, eccentricity),
    [center, radius, eccentricity]
  );

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
      dashed={false}
    />
  );
});

const Planet = React.memo(function Planet({
  position,
  radius,
  color,
  name,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  name: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[radius, 32, 32]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
});

const AsteroidPoint = React.memo(function AsteroidPoint({
  asteroid,
  basePosition,
  orbitRadius,
  onClick,
  isSelected,
  scale = 1,
  orbitSpeedMultiplier = 1,
}: {
  asteroid: NEOData;
  basePosition: [number, number, number];
  orbitRadius: number;
  onClick: () => void;
  isSelected: boolean;
  scale?: number;
  orbitSpeedMultiplier?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Use size-based coloring instead of just hazard level
  const sizeColor = useMemo(
    () => getSizeBasedColor(asteroid.est_diameter_max_m),
    [asteroid.est_diameter_max_m]
  );
  const hazardGlow = asteroid.is_potentially_hazardous_asteroid;

  const size = useMemo(
    () =>
      Math.max(0.02, Math.min(0.1, asteroid.est_diameter_max_m / 10000)) *
      scale,
    [asteroid.est_diameter_max_m, scale]
  );

  // Orbital animation parameters (memoized for performance)
  const orbitParams = useMemo(
    () => ({
      speed: 0.01 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
      eccentricity: 0.1 + Math.random() * 0.3,
    }),
    [asteroid.neo_reference_id]
  );

  useFrame((state) => {
    if (meshRef.current) {
      // Orbital motion with speed multiplier
      const time =
        state.clock.elapsedTime * orbitParams.speed * orbitSpeedMultiplier +
        orbitParams.offset;
      const angle = time * 0.1; // Orbital angle

      // Calculate elliptical orbit position
      const r =
        (orbitRadius *
          (1 - orbitParams.eccentricity * orbitParams.eccentricity)) /
        (1 + orbitParams.eccentricity * Math.cos(angle));
      const x = basePosition[0] + r * Math.cos(angle);
      const z = basePosition[2] + r * Math.sin(angle);
      const y = basePosition[1] + Math.sin(angle * 3) * 0.2; // Slight vertical oscillation

      meshRef.current.position.set(x, y, z);

      // Rotation with speed multiplier
      meshRef.current.rotation.x += 0.02 * orbitSpeedMultiplier;
      meshRef.current.rotation.y += 0.02 * orbitSpeedMultiplier;

      // Hazardous asteroid pulsing effect
      if (hazardGlow) {
        const intensity = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
        meshRef.current.scale.setScalar(size * (1 + intensity * 0.3));
      } else {
        meshRef.current.scale.setScalar(size);
      }
    }
  });

  const handlePointerOver = useMemo(() => () => setHovered(true), []);
  const handlePointerOut = useMemo(() => () => setHovered(false), []);

  return (
    <Sphere
      ref={meshRef}
      position={basePosition}
      args={[size, 8, 8]}
      onClick={onClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <meshStandardMaterial
        color={sizeColor}
        emissive={sizeColor}
        emissiveIntensity={hovered || isSelected ? 0.6 : hazardGlow ? 0.4 : 0.2}
        transparent={hazardGlow}
        opacity={hazardGlow ? 0.9 : 1.0}
      />
    </Sphere>
  );
});

const SolarSystemScene = React.memo(function SolarSystemScene({
  asteroids,
  onAsteroidClick,
  selectedAsteroid,
  cameraZoom,
  orbitSpeed,
  showOrbitPaths,
}: {
  asteroids: NEOData[];
  onAsteroidClick: (asteroid: NEOData) => void;
  selectedAsteroid: NEOData | null;
  cameraZoom: number;
  orbitSpeed: number;
  showOrbitPaths: boolean;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 12, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Group asteroids by orbiting body with performance optimization
  const asteroidGroups = useMemo(() => {
    const groups: {
      [key: string]: {
        asteroids: NEOData[];
        center: [number, number, number];
        radius: number;
      }[];
    } = {
      earth: [],
      mars: [],
      venus: [],
      other: [],
    };

    // Limit asteroids for performance - show only first 200 for smooth animation
    const limitedAsteroids = asteroids.slice(0, 200);

    limitedAsteroids.forEach((asteroid, index) => {
      const orbitingBody = asteroid.orbiting_body?.toLowerCase() || "other";
      const distance = 4 + (index % 3) * 2 + Math.random() * 3;
      const center: [number, number, number] =
        orbitingBody === "mars"
          ? [8, 0, 0]
          : orbitingBody === "venus"
          ? [-6, 0, 3]
          : [0, 0, 0]; // Earth is default

      const groupKey =
        orbitingBody === "earth" ||
        orbitingBody === "mars" ||
        orbitingBody === "venus"
          ? orbitingBody
          : "other";
      groups[groupKey].push({
        asteroids: [asteroid],
        center,
        radius: distance,
      });
    });

    return groups;
  }, [asteroids]);

  // Memoized lighting setup
  const lighting = useMemo(
    () => (
      <>
        <ambientLight intensity={0.3} />
        <pointLight position={[15, 15, 15]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} />
        <pointLight position={[0, -15, 0]} intensity={0.5} color="#4f46e5" />
      </>
    ),
    []
  );

  // Memoized planets
  const planets = useMemo(
    () => (
      <>
        <Planet
          position={[0, 0, 0]}
          radius={1.2}
          color="#1e40af"
          name="Earth"
        />
        <Planet position={[8, 0, 0]} radius={0.5} color="#dc2626" name="Mars" />
        <Planet
          position={[-6, 0, 3]}
          radius={0.7}
          color="#f59e0b"
          name="Venus"
        />
      </>
    ),
    []
  );

  return (
    <>
      {lighting}
      {planets}

      {/* Orbital Paths - conditionally rendered */}
      {showOrbitPaths &&
        Object.entries(asteroidGroups).map(([bodyName, groups]) =>
          groups.map((group, groupIndex) => (
            <OrbitPath
              key={`${bodyName}-orbit-${groupIndex}`}
              center={group.center}
              radius={group.radius}
              color={
                bodyName === "earth"
                  ? "#1e40af"
                  : bodyName === "mars"
                  ? "#dc2626"
                  : "#f59e0b"
              }
              opacity={0.2}
              eccentricity={0.1 + Math.random() * 0.2}
            />
          ))
        )}

      {/* Asteroids */}
      {Object.entries(asteroidGroups).map(([bodyName, groups]) =>
        groups.map((group, groupIndex) =>
          group.asteroids.map((asteroid, asteroidIndex) => (
            <AsteroidPoint
              key={asteroid.neo_reference_id}
              asteroid={asteroid}
              basePosition={group.center}
              orbitRadius={group.radius}
              onClick={() => onAsteroidClick(asteroid)}
              isSelected={
                selectedAsteroid?.neo_reference_id === asteroid.neo_reference_id
              }
              scale={cameraZoom}
              orbitSpeedMultiplier={orbitSpeed}
            />
          ))
        )
      )}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
        maxDistance={100}
        minDistance={0.5}
        maxPolarAngle={Math.PI * 0.9}
        minPolarAngle={Math.PI * 0.1}
      />
    </>
  );
});

function AsteroidPopup({
  asteroid,
  onClose,
}: {
  asteroid: NEOData;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("info");

  const hazardLevel = asteroid.is_potentially_hazardous_asteroid
    ? "HIGH"
    : "LOW";
  const hazardColor = asteroid.is_potentially_hazardous_asteroid
    ? "destructive"
    : "success";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-morphism rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {asteroid.name}
                </h2>
                <p className="text-gray-300">ID: {asteroid.neo_reference_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hazardColor as any}>{hazardLevel} RISK</Badge>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                <TabsTrigger value="cutscene">Cutscene</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 glass-morphism">
                    <h3 className="font-semibold text-white mb-2">
                      Physical Properties
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Diameter:</span>
                        <span className="text-white font-semibold">
                          {Math.round(asteroid.est_diameter_min_m)}-
                          {Math.round(asteroid.est_diameter_max_m)}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Magnitude:</span>
                        <span className="text-white font-semibold">
                          {asteroid.absolute_magnitude_h}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Velocity:</span>
                        <span className="text-white font-semibold">
                          {asteroid.relative_velocity_km_s || "N/A"}{" "}
                          {asteroid.relative_velocity_km_s ? "km/s" : ""}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 glass-morphism">
                    <h3 className="font-semibold text-white mb-2">
                      Orbital Data
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Orbiting:</span>
                        <span className="text-white font-semibold">
                          {asteroid.orbiting_body || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Closest Approach:</span>
                        <span className="text-white font-semibold">
                          {asteroid.closest_approach_date || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Miss Distance:</span>
                        <span className="text-white font-semibold">
                          {asteroid.miss_distance_km
                            ? Math.round(
                                Number.parseFloat(asteroid.miss_distance_km) /
                                  1000
                              ).toLocaleString()
                            : "N/A"}{" "}
                          {asteroid.miss_distance_km ? "km" : ""}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="impact">
                    <AccordionTrigger className="text-white">
                      Impact Scenarios
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300">
                      <div className="space-y-2">
                        <p>
                          Potential impact energy: ~
                          {Math.round(asteroid.est_diameter_max_m / 100)}{" "}
                          megatons TNT
                        </p>
                        <p>
                          Crater diameter: ~
                          {Math.round(
                            (asteroid.est_diameter_max_m * 20) / 1000
                          )}{" "}
                          km
                        </p>
                        <p>
                          Blast radius: ~
                          {Math.round(
                            (asteroid.est_diameter_max_m * 50) / 1000
                          )}{" "}
                          km
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="mitigation">
                    <AccordionTrigger className="text-white">
                      Mitigation Strategies
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300">
                      <div className="space-y-2">
                        <p>• Kinetic Impactor: 85% success probability</p>
                        <p>• Nuclear Device: 95% success probability</p>
                        <p>• Gravity Tractor: 60% success probability</p>
                        <p>• Solar Sail: 40% success probability</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="heatmap" className="mt-4">
                <div className="h-64 bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-lg flex items-center justify-center">
                  <p className="text-white">Risk Heatmap Visualization</p>
                </div>
              </TabsContent>

              <TabsContent value="cutscene" className="mt-4">
                <div className="h-64 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg flex items-center justify-center">
                  <p className="text-white">Cinematic Orbit Replay</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function SolarSystemModel() {
  const router = useRouter();
  const [selectedAsteroid, setSelectedAsteroid] = useState<NEOData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [orbitSpeed, setOrbitSpeed] = useState(0.3); // New: orbital speed multiplier (slowed down from 1 to 0.3)
  const [showOrbitPaths, setShowOrbitPaths] = useState(true); // New: toggle orbit paths
  const [filters, setFilters] = useState({
    hazardLevel: "all",
    orbitingBody: "all",
    sizeRange: [0, 100000],
  });

  const filteredAsteroids = useMemo(() => {
    return neoData.filter((asteroid) => {
      const matchesSearch =
        asteroid.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false;
      const matchesHazard =
        filters.hazardLevel === "all" ||
        (filters.hazardLevel === "high" &&
          asteroid.is_potentially_hazardous_asteroid) ||
        (filters.hazardLevel === "low" &&
          !asteroid.is_potentially_hazardous_asteroid);
      const matchesOrbit =
        filters.orbitingBody === "all" ||
        asteroid.orbiting_body?.toLowerCase() ===
          filters.orbitingBody.toLowerCase();
      const matchesSize =
        asteroid.est_diameter_max_m >= filters.sizeRange[0] &&
        asteroid.est_diameter_max_m <= filters.sizeRange[1];

      return matchesSearch && matchesHazard && matchesOrbit && matchesSize;
    });
  }, [searchTerm, filters]);

  const hazardousCount = useMemo(
    () =>
      filteredAsteroids.filter((a) => a.is_potentially_hazardous_asteroid)
        .length,
    [filteredAsteroids]
  );

  // Memoized callbacks for better performance
  const handleAsteroidClick = useMemo(
    () => (asteroid: NEOData) => {
      setSelectedAsteroid(asteroid);
    },
    []
  );

  const handleClosePopup = useMemo(
    () => () => {
      setSelectedAsteroid(null);
    },
    []
  );

  const handleSearchChange = useMemo(
    () => (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  // Keyboard shortcuts for quick control
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't trigger when typing in input fields

      switch (e.key.toLowerCase()) {
        case " ": // Spacebar to pause/play
          e.preventDefault();
          setOrbitSpeed((current) => (current === 0 ? 1 : 0));
          break;
        case "1":
          setOrbitSpeed(1);
          break;
        case "2":
          setOrbitSpeed(2);
          break;
        case "3":
          setOrbitSpeed(3);
          break;
        case "o":
          setShowOrbitPaths((current) => !current);
          break;
        case "c":
          setShowFilters((current) => !current);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden space-gradient">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {/* Animation status indicator */}
        <div className="flex items-center gap-2 glass-morphism px-3 py-2 rounded-lg">
          {orbitSpeed === 0 ? (
            <Pause className="h-4 w-4 text-gray-400" />
          ) : (
            <Play className="h-4 w-4 text-green-400" />
          )}
          <span className="text-white text-sm font-medium">
            {orbitSpeed === 0 ? "PAUSED" : `${orbitSpeed}x SPEED`}
          </span>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowFilters(!showFilters)}
          className="text-white border-white/30 bg-black/20 backdrop-blur-sm hover:bg-black/30 px-6 py-3"
        >
          <Settings className="h-5 w-5 mr-2" />
          Controls
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute right-0 top-0 h-full w-96 bg-black/60 backdrop-blur-xl border-l border-white/20 p-6 space-y-6 z-20 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Settings className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-xl">
                    Mission Control
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Search & Filter Asteroids
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-400" />
                <h3 className="text-white font-medium">SEARCH</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by asteroid name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30"
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-gray-400">
                  Found {filteredAsteroids.length} matching asteroids
                </p>
              )}
            </div>

            {/* Risk Level Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h3 className="text-white font-medium">THREAT LEVEL</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={
                    filters.hazardLevel === "all" ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      hazardLevel: "all",
                    })
                  }
                  className="justify-start border-white/30"
                  // className="w-full text-white border-white/30 bg-transparent justify-start"
                >
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-3"></div>
                  All Asteroids ({neoData.length})
                </Button>
                <Button
                  variant={
                    filters.hazardLevel === "high" ? "destructive" : "outline"
                  }
                  // variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      hazardLevel:
                        filters.hazardLevel === "high" ? "all" : "high",
                    })
                  }
                  // className="justify-start border-white/30"
                  className="w-full text-white border-white/30 bg-transparent justify-start"
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  High Risk (
                  {
                    neoData.filter((a) => a.is_potentially_hazardous_asteroid)
                      .length
                  }
                  )
                </Button>
                <Button
                  variant={
                    filters.hazardLevel === "low" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      hazardLevel:
                        filters.hazardLevel === "low" ? "all" : "low",
                    })
                  }
                  className="justify-start text-white border-white/30 bg-green-600/20 hover:bg-green-600/30"
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  Low Risk (
                  {
                    neoData.filter((a) => !a.is_potentially_hazardous_asteroid)
                      .length
                  }
                  )
                </Button>
              </div>
            </div>

            {/* Orbiting Body Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                <h3 className="text-white font-medium">ORBITING BODY</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={
                    filters.orbitingBody === "all" ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      orbitingBody: "all",
                    })
                  }
                  className={`justify-start transition-all duration-200 ${
                    filters.orbitingBody === "all"
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      : "text-white/80 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/5"
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-3"></div>
                  All Bodies
                  <span className="ml-auto text-xs opacity-70">
                    ({neoData.length})
                  </span>
                </Button>
                {["Earth", "Mars", "Venus"].map((body) => {
                  const isSelected =
                    filters.orbitingBody === body.toLowerCase();
                  const count = neoData.filter(
                    (a) => a.orbiting_body?.toLowerCase() === body.toLowerCase()
                  ).length;

                  return (
                    <Button
                      key={body}
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          orbitingBody: isSelected ? "all" : body.toLowerCase(),
                        })
                      }
                      className={`justify-start transition-all duration-200 ${
                        isSelected
                          ? `${
                              body === "Earth"
                                ? "bg-blue-600 hover:bg-blue-700 border-blue-600"
                                : body === "Mars"
                                ? "bg-red-600 hover:bg-red-700 border-red-600"
                                : "bg-orange-600 hover:bg-orange-700 border-orange-600"
                            } text-white`
                          : "text-white/80 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/5"
                      }`}
                      disabled={count === 0}
                    >
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          body === "Earth"
                            ? "bg-blue-500"
                            : body === "Mars"
                            ? "bg-red-500"
                            : "bg-orange-500"
                        } ${isSelected ? "ring-2 ring-white/30" : ""}`}
                      ></div>
                      {body}
                      <span className="ml-auto text-xs opacity-70">
                        ({count})
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Size Range Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-purple-400" />
                <h3 className="text-white font-medium">SIZE RANGE</h3>
              </div>
              <div className="px-2 space-y-4">
                <Slider
                  value={filters.sizeRange}
                  onValueChange={(value) =>
                    setFilters({ ...filters, sizeRange: value })
                  }
                  max={100000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{filters.sizeRange[0].toLocaleString()}m</span>
                  <span>{filters.sizeRange[1].toLocaleString()}m</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-green-500/20 rounded border border-green-500/30">
                    <div className="text-green-400 font-medium">
                      Small (&lt;100m)
                    </div>
                    <div className="text-gray-300">
                      {neoData.filter((a) => a.est_diameter_max_m < 100).length}{" "}
                      objects
                    </div>
                  </div>
                  <div className="p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                    <div className="text-yellow-400 font-medium">
                      Medium (100-500m)
                    </div>
                    <div className="text-gray-300">
                      {
                        neoData.filter(
                          (a) =>
                            a.est_diameter_max_m >= 100 &&
                            a.est_diameter_max_m < 500
                        ).length
                      }{" "}
                      objects
                    </div>
                  </div>
                  <div className="p-2 bg-orange-500/20 rounded border border-orange-500/30">
                    <div className="text-orange-400 font-medium">
                      Large (500-1000m)
                    </div>
                    <div className="text-gray-300">
                      {
                        neoData.filter(
                          (a) =>
                            a.est_diameter_max_m >= 500 &&
                            a.est_diameter_max_m < 1000
                        ).length
                      }{" "}
                      objects
                    </div>
                  </div>
                  <div className="p-2 bg-red-500/20 rounded border border-red-500/30">
                    <div className="text-red-400 font-medium">
                      Massive (&gt;1000m)
                    </div>
                    <div className="text-gray-300">
                      {
                        neoData.filter((a) => a.est_diameter_max_m >= 1000)
                          .length
                      }{" "}
                      objects
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animation & View Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-cyan-400" />
                <h3 className="text-white font-medium">ANIMATION & VIEW</h3>
              </div>

              {/* Orbital Speed Control */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-300">Orbital Speed</label>
                  <span className="text-xs text-gray-400">
                    {orbitSpeed.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={[orbitSpeed]}
                  onValueChange={(value) => setOrbitSpeed(value[0])}
                  max={5}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Paused</span>
                  <span>5x Speed</span>
                </div>
              </div>

              {/* Orbit Path Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">
                  Show Orbit Paths
                </label>
                <Button
                  variant={showOrbitPaths ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowOrbitPaths(!showOrbitPaths)}
                  className="text-xs"
                >
                  {showOrbitPaths ? "ON" : "OFF"}
                </Button>
              </div>

              {/* Quick Speed Presets */}
              <div className="grid grid-cols-4 gap-1">
                {[0, 0.5, 1, 2].map((speed) => (
                  <Button
                    key={speed}
                    variant={orbitSpeed === speed ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setOrbitSpeed(speed)}
                    className="text-xs"
                  >
                    {speed === 0 ? "⏸" : `${speed}x`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-4 border-t border-white/20">
              <h3 className="text-white font-medium">QUICK ACTIONS</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      hazardLevel: "all",
                      orbitingBody: "all",
                      sizeRange: [0, 100000],
                    });
                    setOrbitSpeed(1);
                    setShowOrbitPaths(true);
                  }}
                  className="w-full text-white border-white/30 bg-transparent justify-start"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset All Controls
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-white border-white/30 bg-transparent justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Simulation
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-white border-white/30 bg-transparent justify-start"
                  onClick={() => router.push("/deflection")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Deflection Strategies
                </Button>
              </div>
            </div>

            {/* Current Results Summary */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-white font-medium mb-2">Current Results</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Asteroids:</span>
                  <span className="text-white font-semibold">
                    {filteredAsteroids.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">High Risk:</span>
                  <span className="text-red-400 font-semibold">
                    {hazardousCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Low Risk:</span>
                  <span className="text-green-400 font-semibold">
                    {filteredAsteroids.length - hazardousCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Keyboard Shortcuts
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">Space</span>
                  <span className="text-white">Pause/Play</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">1, 2, 3</span>
                  <span className="text-white">Speed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">O</span>
                  <span className="text-white">Toggle Orbits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">C</span>
                  <span className="text-white">Toggle Panel</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 8, 15], fov: 60 }}>
          <Suspense fallback={null}>
            <SolarSystemScene
              asteroids={filteredAsteroids}
              onAsteroidClick={handleAsteroidClick}
              selectedAsteroid={selectedAsteroid}
              cameraZoom={1}
              orbitSpeed={orbitSpeed}
              showOrbitPaths={showOrbitPaths}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-6 left-6 flex gap-4 z-10">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism rounded-lg p-4 min-w-[140px] cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => setShowFilters(true)}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {filteredAsteroids.length}
            </div>
            <div className="text-sm text-gray-300">Objects Visible</div>
            <div className="text-xs text-gray-400 mt-1">
              of {neoData.length} total
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass-morphism rounded-lg p-4 min-w-[140px] cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => {
            setFilters({ ...filters, hazardLevel: "high" });
            setShowFilters(true);
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {hazardousCount}
            </div>
            <div className="text-sm text-gray-300">High Risk</div>
            <div className="text-xs text-gray-400 mt-1">
              {((hazardousCount / filteredAsteroids.length) * 100).toFixed(1)}%
              of visible
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="glass-morphism rounded-lg p-4 min-w-[140px] cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => {
            setFilters({ ...filters, hazardLevel: "low" });
            setShowFilters(true);
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {filteredAsteroids.length - hazardousCount}
            </div>
            <div className="text-sm text-gray-300">Low Risk</div>
            <div className="text-xs text-gray-400 mt-1">Safe trajectories</div>
          </div>
        </motion.div>
      </div>

      {/* Asteroid Popup */}
      {selectedAsteroid && (
        <AsteroidPopup asteroid={selectedAsteroid} onClose={handleClosePopup} />
      )}
    </div>
  );
}
