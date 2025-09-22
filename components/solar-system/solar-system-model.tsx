"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Text } from "@react-three/drei";
import type * as THREE from "three";
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
  closest_approach_date: string;
  miss_distance_km: string;
  relative_velocity_km_s: string;
  orbiting_body: string;
}

function Planet({
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
}

function AsteroidPoint({
  asteroid,
  position,
  onClick,
  isSelected,
  scale = 1,
}: {
  asteroid: NEOData;
  position: [number, number, number];
  onClick: () => void;
  isSelected: boolean;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const hazardColor = asteroid.is_potentially_hazardous_asteroid
    ? "#ef4444"
    : "#22c55e";
  const size =
    Math.max(0.02, Math.min(0.1, asteroid.est_diameter_max_m / 10000)) * scale;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.02;

      // Glow effect for hazardous asteroids
      if (asteroid.is_potentially_hazardous_asteroid) {
        const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
        meshRef.current.scale.setScalar(size * (1 + intensity * 0.2));
      }
    }
  });

  return (
    <Sphere
      ref={meshRef}
      position={position}
      args={[size, 8, 8]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        color={hazardColor}
        emissive={hazardColor}
        emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
      />
    </Sphere>
  );
}

function SolarSystemScene({
  asteroids,
  onAsteroidClick,
  selectedAsteroid,
  cameraZoom,
}: {
  asteroids: NEOData[];
  onAsteroidClick: (asteroid: NEOData) => void;
  selectedAsteroid: NEOData | null;
  cameraZoom: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const asteroidPositions = asteroids.map((asteroid, index) => {
    const angle = (index / asteroids.length) * Math.PI * 2;
    const distance = 4 + Math.random() * 10;
    const height = (Math.random() - 0.5) * 3;
    return [Math.cos(angle) * distance, height, Math.sin(angle) * distance] as [
      number,
      number,
      number
    ];
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[15, 15, 15]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />

      <Planet position={[0, 0, 0]} radius={1.2} color="#1e40af" name="Earth" />

      <Planet position={[8, 0, 0]} radius={0.5} color="#dc2626" name="Mars" />
      <Planet position={[-6, 0, 3]} radius={0.7} color="#f59e0b" name="Venus" />

      {asteroids.map((asteroid, index) => (
        <group key={asteroid.neo_reference_id}>
          <AsteroidPoint
            asteroid={asteroid}
            position={asteroidPositions[index]}
            onClick={() => onAsteroidClick(asteroid)}
            isSelected={
              selectedAsteroid?.neo_reference_id === asteroid.neo_reference_id
            }
            scale={cameraZoom}
          />
        </group>
      ))}

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

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
                          {asteroid.relative_velocity_km_s} km/s
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
                          {asteroid.orbiting_body}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Closest Approach:</span>
                        <span className="text-white font-semibold">
                          {asteroid.closest_approach_date}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Miss Distance:</span>
                        <span className="text-white font-semibold">
                          {Math.round(
                            Number.parseFloat(asteroid.miss_distance_km) / 1000
                          ).toLocaleString()}{" "}
                          km
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
  const [selectedAsteroid, setSelectedAsteroid] = useState<NEOData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hazardLevel: "all",
    orbitingBody: "all",
    sizeRange: [0, 100000],
  });

  const filteredAsteroids = React.useMemo(() => {
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

  const hazardousCount = React.useMemo(
    () =>
      filteredAsteroids.filter((a) => a.is_potentially_hazardous_asteroid)
        .length,
    [filteredAsteroids]
  );

  return (
    <div className="min-h-screen relative overflow-hidden space-gradient">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-4 glass-morphism px-6 py-3 rounded-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search asteroids..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64 bg-black/20 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>

        <Button
          variant={filters.hazardLevel === "high" ? "destructive" : "outline"}
          size="sm"
          onClick={() =>
            setFilters({
              ...filters,
              hazardLevel: filters.hazardLevel === "high" ? "all" : "high",
            })
          }
        >
          High Risk
        </Button>

        <Button
          variant={filters.hazardLevel === "low" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters({
              ...filters,
              hazardLevel: filters.hazardLevel === "low" ? "all" : "low",
            })
          }
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          Low Risk
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-white border-white/30"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute right-0 top-0 h-full w-80 bg-black/40 backdrop-blur-md border-l border-white/10 p-6 space-y-6 z-20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                <h2 className="text-white font-semibold text-lg">
                  Advanced Filters
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-medium">ORBITING BODY</h3>
              <div className="grid grid-cols-3 gap-2">
                {["Earth", "Mars", "Venus"].map((body) => (
                  <Button
                    key={body}
                    variant={
                      filters.orbitingBody === body.toLowerCase()
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        orbitingBody:
                          filters.orbitingBody === body.toLowerCase()
                            ? "all"
                            : body.toLowerCase(),
                      })
                    }
                    className="text-xs"
                  >
                    {body}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-medium">SIZE RANGE (METERS)</h3>
              <div className="px-2">
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
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{filters.sizeRange[0]}m</span>
                  <span>{filters.sizeRange[1]}m</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                className="w-full text-white border-white/30 bg-transparent justify-start"
              >
                <Target className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full text-white border-white/30 bg-transparent justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                Simulation
              </Button>
              <Button
                variant="outline"
                className="w-full text-white border-white/30 bg-transparent justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Deflection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 8, 15], fov: 60 }}>
          <Suspense fallback={null}>
            <SolarSystemScene
              asteroids={filteredAsteroids}
              onAsteroidClick={setSelectedAsteroid}
              selectedAsteroid={selectedAsteroid}
              cameraZoom={1}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-6 left-6 flex gap-4 z-10">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism rounded-lg p-4 min-w-[120px]"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {filteredAsteroids.length}
            </div>
            <div className="text-sm text-gray-300">Objects Found</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass-morphism rounded-lg p-4 min-w-[120px]"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {hazardousCount}
            </div>
            <div className="text-sm text-gray-300">Hazardous</div>
          </div>
        </motion.div>
      </div>

      {/* Asteroid Popup */}
      {selectedAsteroid && (
        <AsteroidPopup
          asteroid={selectedAsteroid}
          onClose={() => setSelectedAsteroid(null)}
        />
      )}
    </div>
  );
}
