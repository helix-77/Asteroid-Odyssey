"use client";

import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import EnhancedEarth from "./enhanced-earth";
import Asteroid from "./asteroid";
import OrbitPath from "./orbit-path";
import ImpactVisualization from "./impact-visualization";
import DeflectionTrajectory from "./deflection-trajectory";
import SceneControls from "./scene-controls";
import { calculateOrbitalState } from "@/lib/calculations/orbital";
import { Vector3 } from "three";
import asteroidData from "@/data/asteroids.json";
import impactData from "@/data/impact_scenarios.json";
import { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";

interface AdvancedEarth3DProps {
  selectedAsteroid: UnifiedAsteroidData | null;
  simulationMode: "tracking" | "impact" | "deflection";
  showOrbits?: boolean;
  showLabels?: boolean;
  timeScale?: number;
}

export default function AdvancedEarth3D({
  selectedAsteroid,
  simulationMode,
  showOrbits = true,
  showLabels = true,
  timeScale = 1,
}: AdvancedEarth3DProps) {
  const [asteroidPositions, setAsteroidPositions] = useState<
    Map<string, Vector3>
  >(new Map());
  const [impactPoint, setImpactPoint] = useState<Vector3 | null>(null);
  const [cameraMode, setCameraMode] = useState<
    "free" | "earth" | "asteroid" | "impact"
  >("earth");

  // Update asteroid positions based on orbital mechanics
  useEffect(() => {
    const updatePositions = () => {
      const currentJD =
        2460000 +
        ((Date.now() - Date.now()) / (1000 * 60 * 60 * 24)) * timeScale;
      const newPositions = new Map<string, Vector3>();

      asteroidData.asteroids.forEach((asteroid) => {
        const state = calculateOrbitalState(asteroid.orbit, currentJD);
        // Scale positions for 3D scene (Earth radius = 2 units)
        const position = new Vector3(
          state.position.x * 2,
          state.position.y * 2,
          state.position.z * 2
        );
        newPositions.set(asteroid.id, position);
      });

      setAsteroidPositions(newPositions);
    };

    updatePositions();
    const interval = setInterval(updatePositions, 1000 / timeScale); // Update based on time scale

    return () => clearInterval(interval);
  }, [timeScale]);

  // Set camera mode based on simulation mode
  useEffect(() => {
    switch (simulationMode) {
      case "tracking":
        setCameraMode(selectedAsteroid ? "asteroid" : "earth");
        break;
      case "impact":
        setCameraMode("impact");
        // Set impact point for selected asteroid
        if (selectedAsteroid) {
          const scenario = impactData.scenarios.find(
            (s) => s.asteroid_id === selectedAsteroid.id
          );
          if (scenario) {
            // Convert lat/lon to 3D position on Earth surface
            const lat = (scenario.location.lat * Math.PI) / 180;
            const lon = (scenario.location.lon * Math.PI) / 180;
            const earthRadius = 2;
            setImpactPoint(
              new Vector3(
                earthRadius * Math.cos(lat) * Math.cos(lon),
                earthRadius * Math.sin(lat),
                earthRadius * Math.cos(lat) * Math.sin(lon)
              )
            );
          }
        }
        break;
      case "deflection":
        setCameraMode("free");
        break;
      default:
        setCameraMode("earth");
    }
  }, [simulationMode, selectedAsteroid]);

  const selectedAsteroidData = asteroidData.asteroids.find(
    (a) => a.id === selectedAsteroid?.id
  );
  const selectedPosition = selectedAsteroid
    ? asteroidPositions.get(selectedAsteroid.id)
    : undefined;
  const selectedImpactScenario = impactData.scenarios.find(
    (s) => s.asteroid_id === selectedAsteroid?.id
  );

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight
            position={[-10, -10, -10]}
            intensity={0.5}
            color="#4A90E2"
          />

          {/* Environment */}
          <Stars
            radius={300}
            depth={60}
            count={20000}
            factor={7}
            saturation={0}
            fade={true}
          />
          <Environment preset="night" />

          {/* Enhanced Earth */}
          <EnhancedEarth
            showClouds={true}
            showAtmosphere={true}
            rotationSpeed={0.001 * timeScale}
          />

          {/* Asteroids */}
          {asteroidData.asteroids.map((asteroid) => {
            const position = asteroidPositions.get(asteroid.id);
            if (!position) return null;

            return (
              <group key={asteroid.id}>
                <Asteroid
                  id={asteroid.id}
                  name={asteroid.name}
                  position={[position.x, position.y, position.z]}
                  size={asteroid.size}
                  threatLevel={
                    asteroid.threat_level as "low" | "medium" | "high"
                  }
                  selected={selectedAsteroid?.id === asteroid.id}
                />

                {/* Orbital paths */}
                {showOrbits && (
                  <OrbitPath
                    elements={asteroid.orbit}
                    color={
                      asteroid.threat_level === "high" ? "#EF4444" : "#F97316"
                    }
                    opacity={selectedAsteroid?.id === asteroid.id ? 0.8 : 0.3}
                    visible={showOrbits}
                  />
                )}
              </group>
            );
          })}

          {/* Impact Visualization */}
          {simulationMode === "impact" &&
            impactPoint &&
            selectedImpactScenario && (
              <ImpactVisualization
                impactPoint={[impactPoint.x, impactPoint.y, impactPoint.z]}
                craterDiameter={
                  selectedImpactScenario.impact.crater.diameter / 1000
                } // Convert to km
                airblastRadius={
                  selectedImpactScenario.impact.effects.airblast_radius
                }
                thermalRadius={
                  selectedImpactScenario.impact.effects.thermal_radiation
                }
                active={true}
              />
            )}

          {/* Deflection Trajectory */}
          {simulationMode === "deflection" && selectedPosition && (
            <DeflectionTrajectory
              originalPath={[selectedPosition, new Vector3(0, 0, 0)]} // Simplified
              deflectedPath={[selectedPosition, new Vector3(1, 0, 1)]} // Simplified deflected path
              interceptPoint={selectedPosition.clone().multiplyScalar(0.7)}
              strategy="Kinetic Impactor"
              visible={true}
            />
          )}

          {/* Scene Controls */}
          <SceneControls
            autoRotate={simulationMode === "tracking" && !selectedAsteroid}
            focusTarget={selectedPosition}
            cameraMode={cameraMode}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
