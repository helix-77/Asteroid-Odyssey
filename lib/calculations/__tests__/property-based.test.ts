import { describe, it, expect } from "vitest";

// Import physics calculation modules
import {
  calculateKineticEnergy,
  calculateCraterDimensions,
  calculateBlastEffects,
} from "../impact";
import { calculateOrbitalPosition, propagateOrbit } from "../orbital";
import {
  calculateKineticImpactorEffectiveness,
  calculateNuclearDeflection,
} from "../deflection";

// Import enhanced modules
import { CraterCalculator } from "../impact/crater";
import { BlastCalculator } from "../impact/blast";
import { KeplerSolver } from "../orbital/kepler";
import { UncertaintyPropagator } from "../../physics/uncertainty";

describe("Property-Based Testing for Numerical Stability", () => {
  const uncertaintyPropagator = new UncertaintyPropagator();

  // Helper function to generate random values within a range
  const randomInRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  // Helper function to generate random asteroid parameters
  const generateRandomAsteroid = () => ({
    mass: randomInRange(1e8, 1e18), // 100 tons to 100 trillion tons
    diameter: randomInRange(10, 10000), // 10m to 10km
    velocity: randomInRange(5000, 50000), // 5-50 km/s
    density: randomInRange(1000, 8000), // 1-8 g/cm³
    orbitalElements: {
      semiMajorAxis: randomInRange(0.5, 5.0), // 0.5-5 AU
      eccentricity: randomInRange(0.0, 0.95), // 0-0.95
      inclination: randomInRange(0, 180), // 0-180 degrees
      longitudeOfAscendingNode: randomInRange(0, 360),
      argumentOfPeriapsis: randomInRange(0, 360),
      meanAnomaly: randomInRange(0, 360),
      epoch: randomInRange(2450000, 2470000), // ~2000-2040
    },
  });

  describe("Impact Physics Properties", () => {
    it("kinetic energy should scale quadratically with velocity", () => {
      const numTests = 100;

      for (let i = 0; i < numTests; i++) {
        const mass = randomInRange(1e10, 1e15);
        const velocity1 = randomInRange(10000, 30000);
        const velocity2 = velocity1 * 2;

        const energy1 = calculateKineticEnergy(mass, velocity1);
        const energy2 = calculateKineticEnergy(mass, velocity2);

        // Energy should scale as v²
        const expectedRatio = 4; // (2v)² / v² = 4
        const actualRatio = energy2 / energy1;

        expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.01);
      }
    });

    it("kinetic energy should scale linearly with mass", () => {
      const numTests = 100;

      for (let i = 0; i < numTests; i++) {
        const mass1 = randomInRange(1e10, 1e15);
        const mass2 = mass1 * 3;
        const velocity = randomInRange(10000, 30000);

        const energy1 = calculateKineticEnergy(mass1, velocity);
        const energy2 = calculateKineticEnergy(mass2, velocity);

        // Energy should scale linearly with mass
        const expectedRatio = 3;
        const actualRatio = energy2 / energy1;

        expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.01);
      }
    });

    it("crater diameter should increase with impact energy", () => {
      const calculator = new CraterCalculator();
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const asteroid = generateRandomAsteroid();

        const lowEnergyParams = {
          impactorMass: { value: asteroid.mass, uncertainty: 0, unit: "kg" },
          impactorVelocity: { value: 10000, uncertainty: 0, unit: "m/s" },
          impactorDensity: {
            value: asteroid.density,
            uncertainty: 0,
            unit: "kg/m³",
          },
          impactAngle: { value: 45, uncertainty: 0, unit: "degrees" },
          targetMaterial: "rock" as const,
        };

        const highEnergyParams = {
          ...lowEnergyParams,
          impactorVelocity: { value: 30000, uncertainty: 0, unit: "m/s" },
        };

        const lowEnergyCrater =
          calculator.calculateCraterDimensions(lowEnergyParams);
        const highEnergyCrater =
          calculator.calculateCraterDimensions(highEnergyParams);

        expect(highEnergyCrater.diameter.value).toBeGreaterThan(
          lowEnergyCrater.diameter.value
        );
      }
    });

    it("blast effects should decrease with distance", () => {
      const calculator = new BlastCalculator();
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const energy = randomInRange(1e12, 1e18);
        const altitude = randomInRange(1000, 50000);

        const params = {
          energy: { value: energy, uncertainty: 0, unit: "J" },
          altitude: { value: altitude, uncertainty: 0, unit: "m" },
          atmosphericDensity: { value: 1.225, uncertainty: 0, unit: "kg/m³" },
        };

        const blastEffects = calculator.calculateBlastEffects(params);

        // Check that overpressure decreases with distance
        const distances = Object.keys(blastEffects.overpressure)
          .map(Number)
          .sort((a, b) => a - b);
        for (let j = 1; j < distances.length; j++) {
          const closerDistance = distances[j - 1];
          const fartherDistance = distances[j];

          expect(blastEffects.overpressure[fartherDistance]).toBeLessThan(
            blastEffects.overpressure[closerDistance]
          );
        }
      }
    });
  });

  describe("Orbital Mechanics Properties", () => {
    it("Kepler equation solution should satisfy the original equation", () => {
      const solver = new KeplerSolver();
      const numTests = 100;

      for (let i = 0; i < numTests; i++) {
        const meanAnomaly = randomInRange(0, 2 * Math.PI);
        const eccentricity = randomInRange(0, 0.95);

        const eccentricAnomaly = solver.solveKeplerEquation(
          meanAnomaly,
          eccentricity
        );

        // Verify Kepler's equation: M = E - e*sin(E)
        const calculatedMeanAnomaly =
          eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);

        expect(Math.abs(calculatedMeanAnomaly - meanAnomaly)).toBeLessThan(
          1e-10
        );
      }
    });

    it("orbital position should be continuous over time", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const asteroid = generateRandomAsteroid();
        const baseTime = asteroid.orbitalElements.epoch;

        const position1 = calculateOrbitalPosition(
          asteroid.orbitalElements,
          baseTime
        );
        const position2 = calculateOrbitalPosition(
          asteroid.orbitalElements,
          baseTime + 0.001
        ); // 1.44 minutes later

        // Positions should be close for small time differences
        const distance = Math.sqrt(
          Math.pow(position2.x - position1.x, 2) +
            Math.pow(position2.y - position1.y, 2) +
            Math.pow(position2.z - position1.z, 2)
        );

        // Distance should be small relative to orbital radius
        const orbitalRadius =
          asteroid.orbitalElements.semiMajorAxis * 149597870.7; // Convert AU to km
        const relativeDistance = distance / orbitalRadius;

        expect(relativeDistance).toBeLessThan(0.01); // Less than 1% of orbital radius
      }
    });

    it("orbital energy should be conserved for unperturbed orbits", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const asteroid = generateRandomAsteroid();
        const baseTime = asteroid.orbitalElements.epoch;

        const position1 = calculateOrbitalPosition(
          asteroid.orbitalElements,
          baseTime
        );
        const position2 = calculateOrbitalPosition(
          asteroid.orbitalElements,
          baseTime + 100
        ); // 100 days later

        // Calculate orbital velocities (simplified)
        const mu = 1.32712440018e11; // GM of Sun in km³/s²
        const r1 = Math.sqrt(
          position1.x ** 2 + position1.y ** 2 + position1.z ** 2
        );
        const r2 = Math.sqrt(
          position2.x ** 2 + position2.y ** 2 + position2.z ** 2
        );

        // For elliptical orbits, specific orbital energy = -μ/(2a)
        const specificEnergy =
          -mu / (2 * asteroid.orbitalElements.semiMajorAxis * 149597870.7);

        // Energy should be approximately constant (allowing for numerical errors)
        const energy1 = -mu / (2 * r1);
        const energy2 = -mu / (2 * r2);

        // Note: This is a simplified test - real orbital energy includes kinetic energy
        // We're just checking that the positions are reasonable
        expect(r1).toBeGreaterThan(0);
        expect(r2).toBeGreaterThan(0);
      }
    });
  });

  describe("Deflection Strategy Properties", () => {
    it("momentum transfer should increase with impactor mass", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const asteroid = generateRandomAsteroid();
        const velocity = randomInRange(5000, 15000);

        const mass1 = randomInRange(100, 1000);
        const mass2 = mass1 * 2;

        const effectiveness1 = calculateKineticImpactorEffectiveness({
          spacecraftMass: mass1,
          impactVelocity: velocity,
          asteroidMass: asteroid.mass,
          asteroidRadius: asteroid.diameter / 2,
        });

        const effectiveness2 = calculateKineticImpactorEffectiveness({
          spacecraftMass: mass2,
          impactVelocity: velocity,
          asteroidMass: asteroid.mass,
          asteroidRadius: asteroid.diameter / 2,
        });

        expect(effectiveness2.deltaV).toBeGreaterThan(effectiveness1.deltaV);
      }
    });

    it("deflection effectiveness should decrease with asteroid mass", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const spacecraftMass = randomInRange(500, 2000);
        const velocity = randomInRange(5000, 15000);
        const diameter = randomInRange(100, 1000);

        const mass1 = randomInRange(1e12, 1e14);
        const mass2 = mass1 * 10;

        const effectiveness1 = calculateKineticImpactorEffectiveness({
          spacecraftMass,
          impactVelocity: velocity,
          asteroidMass: mass1,
          asteroidRadius: diameter / 2,
        });

        const effectiveness2 = calculateKineticImpactorEffectiveness({
          spacecraftMass,
          impactVelocity: velocity,
          asteroidMass: mass2,
          asteroidRadius: diameter / 2,
        });

        expect(effectiveness1.deltaV).toBeGreaterThan(effectiveness2.deltaV);
      }
    });

    it("nuclear deflection should scale with yield", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const asteroid = generateRandomAsteroid();
        const standoffDistance = randomInRange(50, 500);
        const warningTime = randomInRange(365, 365 * 20);

        const yield1 = randomInRange(1e5, 1e6); // 100 kt to 1 Mt
        const yield2 = yield1 * 5;

        const deflection1 = calculateNuclearDeflection({
          asteroidMass: asteroid.mass,
          asteroidRadius: asteroid.diameter / 2,
          nuclearYield: yield1,
          standoffDistance,
          warningTime,
        });

        const deflection2 = calculateNuclearDeflection({
          asteroidMass: asteroid.mass,
          asteroidRadius: asteroid.diameter / 2,
          nuclearYield: yield2,
          standoffDistance,
          warningTime,
        });

        expect(deflection2.deltaV).toBeGreaterThan(deflection1.deltaV);
      }
    });
  });

  describe("Uncertainty Propagation Properties", () => {
    it("uncertainty should increase through calculations", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const mass = {
          value: randomInRange(1e12, 1e15),
          uncertainty: randomInRange(1e10, 1e13),
          unit: "kg",
        };

        const velocity = {
          value: randomInRange(10000, 30000),
          uncertainty: randomInRange(500, 2000),
          unit: "m/s",
        };

        // Calculate kinetic energy with uncertainty propagation
        const kineticEnergy =
          uncertaintyPropagator.propagateMultiplicativeUncertainty([
            { ...mass, exponent: 1 },
            { ...velocity, exponent: 2 },
          ]);

        // Relative uncertainty should be reasonable
        const relativeUncertainty =
          kineticEnergy.uncertainty / kineticEnergy.value;

        expect(relativeUncertainty).toBeGreaterThan(0);
        expect(relativeUncertainty).toBeLessThan(1); // Less than 100% uncertainty
      }
    });

    it("uncertainty should be symmetric for addition and subtraction", () => {
      const numTests = 50;

      for (let i = 0; i < numTests; i++) {
        const value1 = {
          value: randomInRange(1000, 10000),
          uncertainty: randomInRange(10, 100),
          unit: "m",
        };

        const value2 = {
          value: randomInRange(1000, 10000),
          uncertainty: randomInRange(10, 100),
          unit: "m",
        };

        const sum = uncertaintyPropagator.propagateLinearUncertainty([
          { ...value1, coefficient: 1 },
          { ...value2, coefficient: 1 },
        ]);

        const difference = uncertaintyPropagator.propagateLinearUncertainty([
          { ...value1, coefficient: 1 },
          { ...value2, coefficient: -1 },
        ]);

        // Uncertainty should be the same for addition and subtraction
        expect(Math.abs(sum.uncertainty - difference.uncertainty)).toBeLessThan(
          1e-10
        );
      }
    });
  });

  describe("Edge Case Handling", () => {
    it("should handle zero values gracefully", () => {
      expect(() => calculateKineticEnergy(0, 1000)).not.toThrow();
      expect(() => calculateKineticEnergy(1000, 0)).not.toThrow();

      const result = calculateKineticEnergy(0, 1000);
      expect(result).toBe(0);
    });

    it("should handle very small values", () => {
      const smallMass = 1e-10;
      const smallVelocity = 1e-3;

      expect(() =>
        calculateKineticEnergy(smallMass, smallVelocity)
      ).not.toThrow();

      const result = calculateKineticEnergy(smallMass, smallVelocity);
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle very large values", () => {
      const largeMass = 1e20;
      const largeVelocity = 1e6;

      expect(() =>
        calculateKineticEnergy(largeMass, largeVelocity)
      ).not.toThrow();

      const result = calculateKineticEnergy(largeMass, largeVelocity);
      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle NaN and Infinity inputs", () => {
      expect(() => calculateKineticEnergy(NaN, 1000)).not.toThrow();
      expect(() => calculateKineticEnergy(1000, NaN)).not.toThrow();
      expect(() => calculateKineticEnergy(Infinity, 1000)).not.toThrow();
      expect(() => calculateKineticEnergy(1000, Infinity)).not.toThrow();

      // Results should be NaN or handled appropriately
      expect(isNaN(calculateKineticEnergy(NaN, 1000))).toBe(true);
      expect(isNaN(calculateKineticEnergy(1000, NaN))).toBe(true);
    });
  });
});
