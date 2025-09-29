import { describe, it, expect, beforeAll } from "vitest";
import { performance } from "perf_hooks";

// Import all physics calculation modules
import {
  calculateKineticEnergy,
  calculateCraterDimensions,
  calculateBlastEffects,
} from "../impact";
import {
  calculateOrbitalPosition,
  propagateOrbit,
  calculateCloseApproach,
} from "../orbital";
import {
  calculateKineticImpactorEffectiveness,
  calculateNuclearDeflection,
  calculateGravityTractorEffect,
} from "../deflection";

// Import enhanced modules
import { CraterCalculator } from "../impact/crater";
import { BlastCalculator } from "../impact/blast";
import { KeplerSolver } from "../orbital/kepler";
import { EphemerisCalculator } from "../orbital/ephemeris";
import { KineticImpactorCalculator } from "../deflection/kinetic";

describe("Physics Calculations Performance Tests", () => {
  const PERFORMANCE_THRESHOLD_MS = 100; // Maximum allowed time for real-time calculations
  const BATCH_SIZE = 100; // Number of calculations to perform in batch tests

  // Test data for performance benchmarking
  const testAsteroid = {
    id: "test-asteroid",
    name: "Test Asteroid",
    diameter: { value: 1000, uncertainty: 100, unit: "m" },
    mass: { value: 1.3e12, uncertainty: 1e11, unit: "kg" },
    velocity: { value: 20000, uncertainty: 1000, unit: "m/s" },
    density: { value: 2700, uncertainty: 300, unit: "kg/m³" },
    orbitalElements: {
      semiMajorAxis: 1.5,
      eccentricity: 0.2,
      inclination: 5.0,
      longitudeOfAscendingNode: 45.0,
      argumentOfPeriapsis: 90.0,
      meanAnomaly: 180.0,
      epoch: 2460000.5,
    },
  };

  describe("Impact Physics Performance", () => {
    it("should calculate kinetic energy within performance threshold", () => {
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        calculateKineticEnergy(
          testAsteroid.mass.value,
          testAsteroid.velocity.value
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS / 10); // Should be much faster for simple calculations
    });

    it("should calculate crater dimensions within performance threshold", () => {
      const calculator = new CraterCalculator();
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        calculator.calculateCraterDimensions({
          impactorMass: testAsteroid.mass,
          impactorVelocity: {
            value: testAsteroid.velocity.value,
            uncertainty: 1000,
            unit: "m/s",
          },
          impactorDensity: testAsteroid.density,
          impactAngle: { value: 45, uncertainty: 5, unit: "degrees" },
          targetMaterial: "rock",
        });
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it("should calculate blast effects within performance threshold", () => {
      const calculator = new BlastCalculator();
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        calculator.calculateBlastEffects({
          energy: { value: 1e15, uncertainty: 1e14, unit: "J" },
          altitude: { value: 10000, uncertainty: 1000, unit: "m" },
          atmosphericDensity: { value: 1.225, uncertainty: 0.1, unit: "kg/m³" },
        });
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Orbital Mechanics Performance", () => {
    it("should solve Kepler equation within performance threshold", () => {
      const solver = new KeplerSolver();
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        solver.solveKeplerEquation(
          (testAsteroid.orbitalElements.meanAnomaly * Math.PI) / 180,
          testAsteroid.orbitalElements.eccentricity
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS / 10);
    });

    it("should calculate orbital positions within performance threshold", () => {
      const calculator = new EphemerisCalculator();
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        calculator.calculatePosition(
          testAsteroid.orbitalElements,
          2460000.5 + i
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it("should propagate orbits within performance threshold", () => {
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        propagateOrbit(testAsteroid.orbitalElements, 365.25); // One year propagation
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Deflection Strategy Performance", () => {
    it("should calculate kinetic impactor effectiveness within performance threshold", () => {
      const calculator = new KineticImpactorCalculator();
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        calculator.calculateMomentumTransfer({
          spacecraftMass: { value: 500, uncertainty: 50, unit: "kg" },
          impactVelocity: { value: 6000, uncertainty: 500, unit: "m/s" },
          targetMass: testAsteroid.mass,
          targetComposition: "rocky",
          impactAngle: { value: 0, uncertainty: 5, unit: "degrees" },
        });
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it("should calculate nuclear deflection within performance threshold", () => {
      const startTime = performance.now();

      for (let i = 0; i < BATCH_SIZE; i++) {
        calculateNuclearDeflection({
          asteroidMass: testAsteroid.mass.value,
          asteroidRadius: testAsteroid.diameter.value / 2,
          nuclearYield: 1e6, // 1 Mt
          standoffDistance: 100,
          warningTime: 365 * 10, // 10 years
        });
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / BATCH_SIZE;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Memory Usage Tests", () => {
    it("should not cause memory leaks during repeated calculations", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many calculations
      for (let i = 0; i < 1000; i++) {
        calculateKineticEnergy(
          testAsteroid.mass.value,
          testAsteroid.velocity.value
        );
        calculateOrbitalPosition(testAsteroid.orbitalElements, 2460000.5 + i);
        calculateKineticImpactorEffectiveness({
          spacecraftMass: 500,
          impactVelocity: 6000,
          asteroidMass: testAsteroid.mass.value,
          asteroidRadius: testAsteroid.diameter.value / 2,
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Numerical Stability Tests", () => {
    it("should handle extreme parameter values without crashing", () => {
      const extremeValues = [
        { mass: 1e20, velocity: 100000 }, // Very large asteroid, very fast
        { mass: 1e6, velocity: 1000 }, // Very small asteroid, slow
        { mass: 1e15, velocity: 50000 }, // Medium asteroid, very fast
      ];

      extremeValues.forEach(({ mass, velocity }) => {
        expect(() => {
          calculateKineticEnergy(mass, velocity);
        }).not.toThrow();
      });
    });

    it("should handle edge cases in orbital calculations", () => {
      const edgeCases = [
        { eccentricity: 0.0, meanAnomaly: 0 }, // Circular orbit
        { eccentricity: 0.99, meanAnomaly: 180 }, // Highly elliptical
        { eccentricity: 0.5, meanAnomaly: 360 }, // Full revolution
      ];

      const solver = new KeplerSolver();

      edgeCases.forEach(({ eccentricity, meanAnomaly }) => {
        expect(() => {
          solver.solveKeplerEquation(
            (meanAnomaly * Math.PI) / 180,
            eccentricity
          );
        }).not.toThrow();
      });
    });
  });

  describe("Concurrent Calculation Tests", () => {
    it("should handle multiple simultaneous calculations", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise((resolve) => {
            const result = calculateKineticEnergy(
              testAsteroid.mass.value * (1 + i * 0.1),
              testAsteroid.velocity.value * (1 + i * 0.05)
            );
            resolve(result);
          })
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });
  });
});
